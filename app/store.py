import datetime as dt
from contextlib import contextmanager
import json
import os
import re
import sqlite3
from pathlib import Path
from .config import ROOT


class Conflict(ValueError):
    pass


@contextmanager
def connection():
    p = Path(os.environ.get('STUDY_CALENDAR_DB', ROOT / 'data' / 'study.sqlite3'))
    p.parent.mkdir(parents=True, exist_ok=True)
    c = sqlite3.connect(p, timeout=15)
    c.row_factory = sqlite3.Row
    c.execute('PRAGMA foreign_keys=ON')
    try:
        with c:
            yield c
    finally:
        c.close()


def initialize():
    with connection() as c:
        c.executescript('''
        CREATE TABLE IF NOT EXISTS courses(id INTEGER PRIMARY KEY, name TEXT NOT NULL, color TEXT NOT NULL, folder TEXT NOT NULL DEFAULT '');
        CREATE TABLE IF NOT EXISTS tasks(id INTEGER PRIMARY KEY, course_id INTEGER NOT NULL REFERENCES courses(id),
          title TEXT NOT NULL, date TEXT NOT NULL DEFAULT '', time TEXT NOT NULL DEFAULT '', tentative INTEGER NOT NULL DEFAULT 0,
          progress INTEGER NOT NULL DEFAULT 0, weight TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '',
          task_key TEXT, version INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(course_id, task_key));
        CREATE TABLE IF NOT EXISTS scans(id TEXT PRIMARY KEY, course_id INTEGER NOT NULL REFERENCES courses(id),
          snapshot TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS documents(id INTEGER PRIMARY KEY, course_id INTEGER NOT NULL REFERENCES courses(id),
          filename TEXT NOT NULL, sha256 TEXT NOT NULL, mode TEXT NOT NULL, model TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS proposals(id INTEGER PRIMARY KEY, document_id INTEGER NOT NULL REFERENCES documents(id),
          course_id INTEGER NOT NULL REFERENCES courses(id), payload TEXT NOT NULL, target_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
          target_version INTEGER, status TEXT NOT NULL DEFAULT 'pending', result_task_id INTEGER,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS history(id INTEGER PRIMARY KEY, task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
          proposal_id INTEGER REFERENCES proposals(id), action TEXT NOT NULL, before_json TEXT, after_json TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
        DELETE FROM scans WHERE rowid NOT IN (SELECT MAX(rowid) FROM scans GROUP BY course_id);
        CREATE UNIQUE INDEX IF NOT EXISTS scans_one_per_course ON scans(course_id);
        ''')


def valid_task(data, c):
    title = str(data.get('title', '')).strip()
    if not title or len(title) > 300:
        raise ValueError('请填写任务名称（不超过300字）。')
    cid = int(data.get('course_id', 0))
    if not c.execute('SELECT 1 FROM courses WHERE id=?', (cid,)).fetchone():
        raise ValueError('Select a valid course.')
    date, time = str(data.get('date', '')), str(data.get('time', ''))
    if date:
        if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', date):
            raise ValueError('Date must be YYYY-MM-DD.')
        dt.date.fromisoformat(date)
    if time:
        if not date or not re.fullmatch(r'\d{2}:\d{2}', time):
            raise ValueError('请先选择日期，再填写时间。')
        dt.time.fromisoformat(time)
    progress = data.get('progress', 0)
    if type(progress) is not int or not 0 <= progress <= 100:
        raise ValueError('Progress must be an integer from 0 to 100.')
    notes, weight = str(data.get('notes', '')), str(data.get('weight', ''))
    if len(notes) > 20000 or len(weight) > 500:
        raise ValueError('Notes or weight are too long.')
    return dict(course_id=cid, title=title, date=date, time=time, tentative=int(bool(data.get('tentative'))),
                progress=progress, weight=weight, notes=notes)


def course_data(data):
    name, color = str(data.get('name', '')).strip(), str(data.get('color', ''))
    if not name or len(name) > 80 or not re.fullmatch(r'#[0-9a-fA-F]{6}', color):
        raise ValueError('Course requires a name and a #RRGGBB color.')
    return dict(name=name, color=color)


def state():
    with connection() as c:
        courses = []
        for r in c.execute('SELECT * FROM courses ORDER BY id'):
            x = dict(r)
            x['folder_available'] = bool(x['folder'] and Path(x['folder']).is_dir())
            courses.append(x)
        return dict(app='ai-study-calendar', courses=courses,
                    tasks=[dict(r) for r in c.execute('SELECT * FROM tasks ORDER BY id')], timezone='Asia/Hong_Kong')


def mutate(table, ident, method, data):
    if table not in ('courses', 'tasks'):
        raise ValueError('Unknown table.')
    with connection() as c:
        c.execute('BEGIN IMMEDIATE')
        old = c.execute(f'SELECT * FROM {table} WHERE id=?', (ident,)).fetchone() if ident else None
        if method != 'POST' and not old:
            raise ValueError('Record not found.')
        if table == 'tasks' and method != 'POST' and data.get('expected_version') != old['version']:
            raise Conflict('This task changed. Close the editor, refresh, and review the latest version.')
        if method == 'DELETE':
            if table == 'courses':
                c.execute('DELETE FROM scans WHERE course_id=?', (ident,))
            if table == 'courses' and any(c.execute(f'SELECT 1 FROM {t} WHERE course_id=? LIMIT 1', (ident,)).fetchone()
                                         for t in ('tasks', 'documents')):
                raise ValueError('此课程已有任务或来源历史记录；请保留它，或使用全新的测试数据库。')
            if table == 'tasks':
                c.execute('INSERT INTO history(task_id,action,before_json) VALUES(?,?,?)',
                          (ident, 'manual-delete', json.dumps(dict(old))))
            c.execute(f'DELETE FROM {table} WHERE id=?', (ident,))
            return dict(deleted=ident)
        fields = valid_task(data, c) if table == 'tasks' else course_data(data)
        if method == 'POST':
            q = f"INSERT INTO {table}({','.join(fields)}) VALUES({','.join('?' for _ in fields)})"
            ident = c.execute(q, tuple(fields.values())).lastrowid
        else:
            extra = ',version=version+1,updated_at=CURRENT_TIMESTAMP' if table == 'tasks' else ''
            c.execute(f"UPDATE {table} SET {','.join(k+'=?' for k in fields)}{extra} WHERE id=?", (*fields.values(), ident))
        result = dict(c.execute(f'SELECT * FROM {table} WHERE id=?', (ident,)).fetchone())
        if table == 'tasks':
            c.execute('INSERT INTO history(task_id,action,before_json,after_json) VALUES(?,?,?,?)',
                      (ident, 'manual-save', json.dumps(dict(old)) if old else None, json.dumps(result)))
        return result


def demo():
    with connection() as c:
        row = c.execute("SELECT id FROM courses WHERE name='SYNTH101 — Fictional Computing'").fetchone()
        if row:
            return dict(course_id=row['id'])
        cid = c.execute('INSERT INTO courses(name,color,folder) VALUES(?,?,?)',
                        ('SYNTH101 — Fictional Computing', '#427864', str(ROOT / 'examples' / 'course-pack'))).lastrowid
        return dict(course_id=cid)
 