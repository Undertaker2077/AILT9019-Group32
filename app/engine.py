import datetime as dt
import hashlib
import json
import re
import threading
import unicodedata
import uuid
from pathlib import Path
from . import config, documents, model, store

WORKFLOW_LOCK = threading.Lock()


def norm(value):
    return ' '.join(unicodedata.normalize('NFKC', str(value)).split())


def validated_tasks(result, units):
    if not isinstance(result, dict) or not isinstance(result.get('tasks'), list) or len(result['tasks']) > 30:
        raise ValueError('Model JSON requires a tasks array of at most 30 tasks.')
    sources = {u['locator']: norm(u['text']) for u in units}
    output, rejected = [], []
    for raw in result['tasks']:
        try:
            if not isinstance(raw, dict):
                raise ValueError('Task must be an object.')
            title = raw.get('title')
            key = raw.get('task_key')
            if not isinstance(title, str) or not title.strip() or len(title) > 300:
                raise ValueError('Invalid task title.')
            if not isinstance(key, str) or not key.strip() or len(key) > 120:
                raise ValueError('A stable task identifier is required.')
            evidence = raw.get('evidence')
            if not isinstance(evidence, list) or len(evidence) > 30:
                raise ValueError('Evidence must be an array of at most 30 quotations.')
            verified = []
            for ev in evidence:
                if (not isinstance(ev, dict) or ev.get('field') not in ('task','deadline','requirements')
                    or not isinstance(ev.get('quote'), str) or not 4 <= len(ev['quote']) <= 3000 or not norm(ev['quote'])
                    or norm(ev['quote']) not in sources.get(ev.get('locator'), '')):
                    raise ValueError('A model quotation/locator does not match the extracted source.')
                verified.append({k: ev[k] for k in ('locator','quote','field')})
            if not any(e['field'] == 'task' for e in verified):
                raise ValueError('Task lacks a verified task quotation.')
            task_quotes = [norm(e['quote']).casefold() for e in verified if e['field']=='task']
            if not any(norm(title).casefold() in quote for quote in task_quotes):
                raise ValueError('Task title is not supported by its task quotation.')
            if not any(norm(key).casefold() in source.casefold() for source in sources.values()):
                raise ValueError('Task identifier does not occur in the extracted source.')
            warnings = []
            date, time = raw.get('date', ''), raw.get('time', '')
            if not isinstance(date, str) or not isinstance(time, str):
                raise ValueError('Date and time must be strings, using empty strings for unknown values.')
            date_text = norm(' '.join(e['quote'] for e in verified if e['field']=='deadline'))
            if date:
                try:
                    if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', date):
                        raise ValueError()
                    day = dt.date.fromisoformat(date)
                    months = ['January','February','March','April','May','June','July','August','September','October','November','December']
                    month = months[day.month-1]
                    candidates = [date, f'{day.day} {month} {day.year}', f'{month} {day.day}, {day.year}',
                                  f'{day.day} {month[:3]} {day.year}', f'{month[:3]} {day.day}, {day.year}',
                                  f'{day.year}年{day.month}月{day.day}日']
                    if not any(x.lower() in date_text.lower() for x in candidates):
                        raise ValueError()
                except ValueError:
                    warnings.append('Unsupported/invalid date was cleared. Review the original text; no year is inferred.')
                    date, time = '', ''
            if time:
                try:
                    if not date or not re.fullmatch(r'\d{2}:\d{2}', time):
                        raise ValueError()
                    clock = dt.time.fromisoformat(time)
                    twelve = f'{clock.hour % 12 or 12}:{clock.minute:02d} {"AM" if clock.hour < 12 else "PM"}'
                    if time not in date_text and twelve.lower() not in date_text.lower():
                        raise ValueError()
                except ValueError:
                    warnings.append('Unsupported time was cleared; no default time is added.')
                    time = ''
            requirements = raw.get('requirements', [])
            if not isinstance(requirements, list) or len(requirements)>20 or any(not isinstance(x,str) or len(x)>1000 for x in requirements):
                raise ValueError('Requirements must be an array of short strings.')
            if requirements and not any(e['field']=='requirements' for e in verified):
                warnings.append('Requirements without a supporting quotation were cleared.')
                requirements = []
            elif requirements:
                requirement_quotes = [norm(e['quote']).casefold() for e in verified if e['field']=='requirements']
                supported = [x for x in requirements if norm(x) and
                             any(norm(x).casefold() in quote for quote in requirement_quotes)]
                if len(supported) != len(requirements):
                    warnings.append('Each unsupported requirement was cleared; review the source quotations.')
                requirements = supported
            if type(raw.get('tentative', False)) is not bool:
                raise ValueError('Tentative must be a boolean.')
            output.append(dict(title=title.strip(), task_key=norm(key).casefold(), date=date, time=time,
                               tentative=bool(raw.get('tentative', False)), requirements=requirements,
                               evidence=verified, warnings=warnings))
        except (ValueError, TypeError) as e:
            rejected.append(str(e))
    return output, rejected


def preview(data):
    if not WORKFLOW_LOCK.acquire(blocking=False):
        raise store.Conflict('Another extraction is running. Wait for it to finish.')
    try:
        return _preview(data)
    finally:
        WORKFLOW_LOCK.release()


def _preview(data):
    cid = int(data.get('course_id', 0))
    with store.connection() as c:
        course = c.execute('SELECT * FROM courses WHERE id=?', (cid,)).fetchone()
        if not course:
            raise ValueError('Select a course first.')
        if data.get('files'):
            files = documents.uploads(data['files'])
        elif course['folder']:
            files = documents.folder_files(course['folder'])
        else:
            raise ValueError('Choose documents or associate a local course folder.')
        docs, errors = [], []
        seen = set()
        for name, raw in files:
            try:
                doc = documents.extract(name, raw)
                doc['duplicate_in_selection'] = doc['sha256'] in seen
                doc['previously_processed'] = bool(c.execute('SELECT 1 FROM documents WHERE course_id=? AND sha256=?', (cid, doc['sha256'])).fetchone())
                seen.add(doc['sha256'])
                docs.append(doc)
            except Exception as e:
                errors.append(dict(filename=name, error=str(e)[:300] if isinstance(e, (ValueError, UnicodeError, ImportError)) else 'Unreadable document. Check its format and parser installation.'))
        scan_id = uuid.uuid4().hex
        c.execute('DELETE FROM scans WHERE course_id=?', (cid,))
        c.execute('INSERT INTO scans(id,course_id,snapshot) VALUES(?,?,?)', (scan_id, cid, json.dumps(docs, ensure_ascii=False)))
        return dict(scan_id=scan_id, course_id=cid, documents=docs, errors=errors,
                    notice='Preview only: no model call and no calendar writes. Select files and explicitly confirm processing.')


def replay(doc):
    fixture = json.loads((config.ROOT/'examples'/'replay.json').read_text(encoding='utf-8'))
    if doc['sha256'] not in fixture:
        raise ValueError('Replay supports only the bundled, unchanged synthetic fixtures. Use live API for other documents.')
    return fixture[doc['sha256']]


def process(data):
    if not WORKFLOW_LOCK.acquire(blocking=False):
        raise store.Conflict('Another extraction is running. Wait for it to finish.')
    try:
        return _process(data)
    finally:
        WORKFLOW_LOCK.release()


def save_settings(data):
    if not WORKFLOW_LOCK.acquire(blocking=False):
        raise store.Conflict('Another extraction is running. Wait for it to finish.')
    try:
        return config.save(data)
    finally:
        WORKFLOW_LOCK.release()


def mutate(table, ident, method, data):
    if table != 'courses' or method != 'DELETE':
        return store.mutate(table, ident, method, data)
    if not WORKFLOW_LOCK.acquire(blocking=False):
        raise store.Conflict('Another extraction is running. Wait for it to finish.')
    try:
        return store.mutate(table, ident, method, data)
    finally:
        WORKFLOW_LOCK.release()


def _process(data):
    mode = data.get('mode')
    if mode not in ('live', 'replay'):
        raise ValueError('Select live API or explicitly labelled fixture replay.')
    settings = config.load() if mode == 'live' else None
    if mode == 'live' and data.get('provider') != {k:settings[k] for k in ('base_url','model')}:
        raise ValueError('Provider settings changed. Refresh the preview destination and confirm it again.')
    with store.connection() as c:
        scan = c.execute('SELECT * FROM scans WHERE id=?', (str(data.get('scan_id', '')),)).fetchone()
    if not scan:
        raise ValueError('Preview these files first.')
    selection = data.get('hashes')
    if not isinstance(selection, list) or not 0 < len(selection) <= 10:
        raise ValueError('Select 1–10 document hashes.')
    docs = {d['sha256']: d for d in json.loads(scan['snapshot'])}
    if any(x not in docs for x in selection):
        raise ValueError('Selection is not part of this preview.')
    if mode == 'live':
        provider = {k:settings[k] for k in ('base_url','model')}
        expected_consent = dict(confirmed=True, scan_id=scan['id'], hashes=list(dict.fromkeys(selection)), provider=provider)
        if data.get('consent') != expected_consent:
            raise ValueError('Confirm transmission for the current preview and provider before any model call.')
    results = []
    for sha in dict.fromkeys(selection):
        doc = docs[sha]
        with store.connection() as c:
            existing = c.execute('SELECT id FROM documents WHERE course_id=? AND sha256=? AND mode=? ORDER BY id DESC LIMIT 1',
                                 (scan['course_id'], sha, mode)).fetchone()
        if existing and not data.get('force'):
            results.append(dict(filename=doc['filename'], status='unchanged', document_id=existing['id']))
            continue
        try:
            response = replay(doc) if mode == 'replay' else model.complete(doc['units'], settings=settings)
            tasks, rejected = validated_tasks(response, doc['units'])
            if response['tasks'] and not tasks:
                raise ValueError('All model tasks failed evidence/schema validation: '+'; '.join(rejected[:3]))
            with store.connection() as c:
                c.execute('BEGIN IMMEDIATE')
                did = c.execute('INSERT INTO documents(course_id,filename,sha256,mode,model) VALUES(?,?,?,?,?)',
                                (scan['course_id'],doc['filename'],sha,mode,'stored-fixture' if mode=='replay' else settings['model'])).lastrowid
                for task in tasks:
                    target = c.execute('SELECT * FROM tasks WHERE course_id=? AND task_key=?', (scan['course_id'],task['task_key'])).fetchone()
                    c.execute('INSERT INTO proposals(document_id,course_id,payload,target_id,target_version) VALUES(?,?,?,?,?)',
                              (did,scan['course_id'],json.dumps(task,ensure_ascii=False),target['id'] if target else None,target['version'] if target else None))
            results.append(dict(filename=doc['filename'],status='proposed',document_id=did,tasks=len(tasks),validation_rejections=rejected))
        except (ValueError, OSError) as e:
            results.append(dict(filename=doc['filename'],status='failed',error=str(e)[:500]))
    return dict(mode=mode, results=results, calendar_changed=False)


def proposals():
    with store.connection() as c:
        rows = c.execute('SELECT p.*,d.filename,d.sha256,d.mode,d.model FROM proposals p JOIN documents d ON d.id=p.document_id ORDER BY p.id DESC').fetchall()
        tasks = [dict(r) for r in c.execute('SELECT * FROM tasks')]
    output = []
    for r in rows:
        p = dict(r)
        p['payload'] = json.loads(p['payload'])
        p['current_task'] = next((t for t in tasks if t['id']==p['target_id']), None)
        key, cid = p['payload']['task_key'], p['course_id']
        similar = [t for t in tasks if t['course_id']==cid and norm(t['title']).casefold()==norm(p['payload']['title']).casefold() and t['id']!=p['target_id']]
        p['possible_matches'] = similar
        alternatives = [json.loads(x['payload']) for x in rows if x['status']=='pending' and x['course_id']==cid and json.loads(x['payload'])['task_key']==key]
        deadlines = {(x['date'],x['time']) for x in alternatives if x['date']}
        if p['current_task'] and p['current_task']['date']:
            deadlines.add((p['current_task']['date'],p['current_task']['time']))
        p['conflict'] = len(deadlines)>1
        p['stale'] = bool(p['current_task'] and p['current_task']['version']!=p['target_version'])
        output.append(p)
    return output


def decide(pid, data):
    decision = data.get('decision')
    if decision not in ('accept','reject'):
        raise ValueError('Choose accept or reject.')
    with store.connection() as c:
        c.execute('BEGIN IMMEDIATE')
        row = c.execute('SELECT p.*,d.filename,d.mode,d.sha256 FROM proposals p JOIN documents d ON p.document_id=d.id WHERE p.id=?', (pid,)).fetchone()
        if not row:
            raise ValueError('Proposal not found.')
        if row['status'] != 'pending':
            return dict(status=row['status'], task_id=row['result_task_id'], recovered=True)
        if decision == 'reject':
            c.execute("UPDATE proposals SET status='rejected' WHERE id=?", (pid,))
            return dict(status='rejected')
        payload = json.loads(row['payload'])
        target_id = data.get('target_id') or row['target_id']
        old = c.execute('SELECT * FROM tasks WHERE id=?', (int(target_id),)).fetchone() if target_id else None
        if target_id and (not old or old['course_id']!=row['course_id']):
            raise ValueError('Update target must be an existing task in the same course.')
        expected = row['target_version'] if target_id == row['target_id'] else data.get('expected_version')
        if old and (old['version']!=expected or data.get('expected_version')!=old['version']):
            raise store.Conflict('Saved task changed after extraction. Nothing was overwritten. Reject and re-analyse, or manually reconcile it.')
        if not old and c.execute('SELECT 1 FROM tasks WHERE course_id=? AND task_key=?', (row['course_id'],payload['task_key'])).fetchone():
            raise store.Conflict('This task was already created by another proposal. Refresh and choose it as the update target.')
        if not old and any(norm(t['title']).casefold()==norm(payload['title']).casefold()
                           for t in c.execute('SELECT title FROM tasks WHERE course_id=?', (row['course_id'],))) and data.get('match_ack') is not True:
            raise ValueError('A same-title task exists. Review the possible duplicate before creating a separate task.')
        related = [json.loads(x['payload']) for x in c.execute("SELECT payload FROM proposals WHERE course_id=? AND status='pending'", (row['course_id'],))]
        deadlines = {(x['date'],x['time']) for x in related if x['task_key']==payload['task_key'] and x['date']}
        if old and old['date']:
            deadlines.add((old['date'],old['time']))
        if len(deadlines)>1 and data.get('conflict_ack') is not True:
            raise ValueError('Conflicting deadlines require explicit acknowledgement after checking both sources.')
        edits = data.get('patch', {})
        if not isinstance(edits, dict) or set(edits)-{'title','date','time','tentative'}:
            raise ValueError('Only title/date/time/tentative can be edited in this review.')
        combined = {**dict(old or {}), **{k:payload[k] for k in ['title','date','time','tentative']}, **edits, 'course_id':row['course_id']}
        notes = '\n'.join([f"[{row['mode'].upper()} source: {row['filename']}; task {payload['task_key']}; SHA-256 {row['sha256']}]",
                           'Requirements: '+'; '.join(payload['requirements'])]+[e['locator']+': '+e['quote'] for e in payload['evidence']])
        combined['notes'] = (old['notes']+'\n\n' if old and old['notes'] else '')+notes
        fields = store.valid_task(combined, c)
        if old:
            c.execute(f"UPDATE tasks SET {','.join(k+'=?' for k in fields)},version=version+1,updated_at=CURRENT_TIMESTAMP WHERE id=?", (*fields.values(),old['id']))
            tid = old['id']
        else:
            fields['task_key'] = payload['task_key']
            tid = c.execute(f"INSERT INTO tasks({','.join(fields)}) VALUES({','.join('?' for _ in fields)})", tuple(fields.values())).lastrowid
        after = dict(c.execute('SELECT * FROM tasks WHERE id=?', (tid,)).fetchone())
        c.execute("UPDATE proposals SET status='accepted', result_task_id=? WHERE id=?", (tid,pid))
        c.execute('INSERT INTO history(task_id,proposal_id,action,before_json,after_json) VALUES(?,?,?,?,?)',
                  (tid,pid,'accepted-'+row['mode'],json.dumps(dict(old)) if old else None,json.dumps(after)))
        return dict(status='accepted',task_id=tid,task=after)
