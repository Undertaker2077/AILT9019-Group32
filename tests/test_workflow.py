import base64
import copy
import io
import json
import os
from pathlib import Path
import sqlite3
import tempfile
import threading
import unittest
from unittest.mock import patch
import urllib.error
from app import config, documents, engine, model, store


class WorkflowTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.env=patch.dict(os.environ,{'STUDY_CALENDAR_DB':str(Path(self.tmp.name)/'calendar.sqlite3'),
                                      'STUDY_CALENDAR_CONFIG':str(Path(self.tmp.name)/'config.json')})
        self.env.start();store.initialize();self.cid=store.demo()['course_id']

    def tearDown(self):
        self.env.stop();self.tmp.cleanup()

    def scan(self,path):
        p=config.ROOT/'examples'/path
        return engine.preview(dict(course_id=self.cid,files=[dict(name=p.name,content=base64.b64encode(p.read_bytes()).decode())]))

    def process(self,path,mode='replay',**extra):
        snap=self.scan(path)
        if mode=='live':
            extra.setdefault('provider',{k:config.load()[k] for k in ('base_url','model')})
            if extra.get('consent') == 'scope':
                hashes=[d['sha256'] for d in snap['documents']]
                extra['consent']=dict(confirmed=True,scan_id=snap['scan_id'],hashes=hashes,provider=extra['provider'])
        return engine.process(dict(scan_id=snap['scan_id'],hashes=[d['sha256'] for d in snap['documents']],mode=mode,**extra))

    def pending(self):
        return [p for p in engine.proposals() if p['status']=='pending']

    def test_empty_install_and_preview_never_write_tasks(self):
        self.assertEqual(store.state()['tasks'],[])
        p=engine.preview(dict(course_id=self.cid))
        self.assertEqual(len(p['documents']),4)
        self.assertEqual(p['errors'],[])
        self.assertEqual(store.state()['tasks'],[])

    def test_new_preview_replaces_the_previous_snapshot_for_a_course(self):
        first=self.scan('course-pack/01-lab-brief.txt')
        self.scan('course-pack/02-project-brief.pdf')
        with store.connection() as c:
            self.assertEqual(c.execute('SELECT COUNT(*) FROM scans WHERE course_id=?',(self.cid,)).fetchone()[0],1)
        with self.assertRaisesRegex(ValueError,'Preview these files first'):
            engine.process(dict(scan_id=first['scan_id'],hashes=[first['documents'][0]['sha256']],mode='replay'))

    def test_initialize_prunes_legacy_scans_and_enforces_one_per_course(self):
        with store.connection() as c:
            c.execute('DROP INDEX IF EXISTS scans_one_per_course')
            c.execute('INSERT INTO scans(id,course_id,snapshot) VALUES(?,?,?)',('legacy-old',self.cid,'old'))
            c.execute('INSERT INTO scans(id,course_id,snapshot) VALUES(?,?,?)',('legacy-new',self.cid,'new'))
        store.initialize()
        with store.connection() as c:
            rows=c.execute('SELECT id,snapshot FROM scans WHERE course_id=?',(self.cid,)).fetchall()
            self.assertEqual([(r['id'],r['snapshot']) for r in rows],[('legacy-new','new')])
            with self.assertRaises(sqlite3.IntegrityError):
                c.execute('INSERT INTO scans(id,course_id,snapshot) VALUES(?,?,?)',('extra',self.cid,'extra'))

    def test_course_with_only_a_preview_snapshot_can_be_deleted(self):
        self.scan('course-pack/01-lab-brief.txt')
        result=store.mutate('courses',self.cid,'DELETE',{})
        self.assertEqual(result,{'deleted':self.cid})
        with store.connection() as c:
            self.assertEqual(c.execute('SELECT COUNT(*) FROM scans WHERE course_id=?',(self.cid,)).fetchone()[0],0)

    def test_success_requires_confirmation_and_is_recoverable(self):
        self.process('course-pack/01-lab-brief.txt')
        self.assertEqual(store.state()['tasks'],[])
        p=self.pending()[0]
        r=engine.decide(p['id'],{'decision':'accept'})
        self.assertEqual(r['task']['date'],'2026-10-26')
        self.assertEqual(r['task']['time'],'17:00')
        self.assertIn('line 4:',r['task']['notes'])
        self.assertEqual(engine.decide(p['id'],{'decision':'accept'})['task_id'],r['task_id'])
        self.assertEqual(len(store.state()['tasks']),1)

    def test_all_formats_have_valid_locators(self):
        for name in ['01-lab-brief.txt','02-project-brief.pdf','03-reflection.docx','04-reading.md']:
            r=self.process('course-pack/'+name)
            self.assertEqual(r['results'][0]['status'],'proposed')
        self.assertEqual(len(self.pending()),3)

    def test_missing_deadline_stays_blank(self):
        self.process('course-pack/03-reflection.docx')
        t=engine.decide(self.pending()[0]['id'],{'decision':'accept'})['task']
        self.assertEqual((t['date'],t['time']),('',''))

    def test_repeated_content_does_not_duplicate(self):
        self.process('course-pack/01-lab-brief.txt')
        r=self.process('course-pack/01-lab-brief.txt')
        self.assertEqual(r['results'][0]['status'],'unchanged')
        self.assertEqual(len(self.pending()),1)

    def test_identical_bytes_under_another_name_are_reused(self):
        p=config.ROOT/'examples/course-pack/01-lab-brief.txt'
        files=[dict(name=n,content=base64.b64encode(p.read_bytes()).decode()) for n in ['a.txt','b.txt']]
        s=engine.preview(dict(course_id=self.cid,files=files))
        self.assertTrue(s['documents'][1]['duplicate_in_selection'])
        r=engine.process(dict(scan_id=s['scan_id'],hashes=[d['sha256'] for d in s['documents']],mode='replay'))
        self.assertEqual(len(r['results']),1)

    def accepted_lab(self):
        self.process('course-pack/01-lab-brief.txt')
        return engine.decide(self.pending()[0]['id'],{'decision':'accept'})['task']

    def test_revised_date_waits_for_review_and_preserves_progress(self):
        t=self.accepted_lab()
        t=store.mutate('tasks',t['id'],'PUT',{**t,'progress':75,'notes':'My own note','expected_version':t['version']})
        self.process('updates/lab-1-revised.txt')
        self.assertEqual(store.state()['tasks'][0]['date'],'2026-10-26')
        p=self.pending()[0]
        self.assertTrue(p['conflict'])
        with self.assertRaises(ValueError):
            engine.decide(p['id'],dict(decision='accept',expected_version=t['version']))
        r=engine.decide(p['id'],dict(decision='accept',expected_version=t['version'],conflict_ack=True))
        self.assertEqual(r['task']['date'],'2026-10-28')
        self.assertEqual(r['task']['progress'],75)
        self.assertTrue(r['task']['notes'].startswith('My own note'))

    def test_later_user_edit_blocks_stale_proposal(self):
        t=self.accepted_lab();self.process('updates/lab-1-revised.txt')
        t=store.mutate('tasks',t['id'],'PUT',{**t,'date':'2026-10-29','expected_version':t['version']})
        p=self.pending()[0]
        self.assertTrue(p['stale'])
        with self.assertRaises(store.Conflict):
            engine.decide(p['id'],dict(decision='accept',expected_version=t['version'],conflict_ack=True))
        self.assertEqual(store.state()['tasks'][0]['date'],'2026-10-29')

    def test_conflicting_notices_need_acknowledgement(self):
        self.process('updates/lab-1-conflict.txt')
        p=self.pending()[0];self.assertTrue(p['conflict'])
        with self.assertRaises(ValueError):engine.decide(p['id'],dict(decision='accept'))
        engine.decide(p['id'],dict(decision='accept',conflict_ack=True))
        self.assertEqual(len(store.state()['tasks']),1)

    def test_reject_changes_no_calendar_records(self):
        self.process('course-pack/01-lab-brief.txt')
        engine.decide(self.pending()[0]['id'],dict(decision='reject'))
        self.assertEqual(store.state()['tasks'],[])

    def test_replay_refuses_unknown_input(self):
        s=engine.preview(dict(course_id=self.cid,files=[dict(name='custom.txt',content=base64.b64encode(b'Unexpected user document').decode())]))
        r=engine.process(dict(scan_id=s['scan_id'],hashes=[s['documents'][0]['sha256']],mode='replay'))
        self.assertEqual(r['results'][0]['status'],'failed')
        self.assertEqual(store.state()['tasks'],[])

    def test_live_requires_consent_before_any_call(self):
        with patch.object(model,'complete') as call:
            with self.assertRaises(ValueError):self.process('course-pack/01-lab-brief.txt',mode='live')
            call.assert_not_called()

    def test_live_accepts_consent_bound_to_the_current_scan_hashes_and_provider(self):
        with patch.object(model,'complete',return_value={'tasks':[]}) as call:
            result=self.process('course-pack/01-lab-brief.txt',mode='live',consent='scope')
        self.assertEqual(result['results'][0]['status'],'proposed')
        call.assert_called_once()

    def test_live_rejects_consent_from_another_scan(self):
        first=self.scan('course-pack/01-lab-brief.txt')
        second=self.scan('course-pack/02-project-brief.pdf')
        provider={k:config.load()[k] for k in ('base_url','model')}
        stale=dict(confirmed=True,scan_id=first['scan_id'],hashes=[first['documents'][0]['sha256']],provider=provider)
        with patch.object(model,'complete') as call:
            with self.assertRaisesRegex(ValueError,'current preview and provider'):
                engine.process(dict(scan_id=second['scan_id'],hashes=[second['documents'][0]['sha256']],
                                    mode='live',provider=provider,consent=stale))
            call.assert_not_called()

    def test_live_extraction_blocks_preview_and_settings_mutations(self):
        files=[]
        for name in ['01-lab-brief.txt','02-project-brief.pdf']:
            path=config.ROOT/'examples/course-pack'/name
            files.append(dict(name=name,content=base64.b64encode(path.read_bytes()).decode()))
        snap=engine.preview(dict(course_id=self.cid,files=files))
        hashes=[d['sha256'] for d in snap['documents']]
        provider={k:config.load()[k] for k in ('base_url','model')}
        consent=dict(confirmed=True,scan_id=snap['scan_id'],hashes=hashes,provider=provider)
        started,release=threading.Event(),threading.Event()
        result=[]

        def complete(*args,**kwargs):
            started.set()
            if not release.wait(5):
                raise AssertionError('Test did not release the model call.')
            return {'tasks':[]}

        def run():
            result.append(engine.process(dict(scan_id=snap['scan_id'],hashes=hashes,mode='live',
                                              provider=provider,consent=consent)))

        with patch.object(model,'complete',side_effect=complete) as call:
            worker=threading.Thread(target=run)
            worker.start()
            self.assertTrue(started.wait(5))
            failures=[]
            try:
                for mutation in (
                    lambda: engine.preview(dict(course_id=self.cid,files=files)),
                    lambda: engine.save_settings(dict(model='changed-during-extraction')),
                    lambda: engine.mutate('courses',self.cid,'DELETE',{}),
                ):
                    try:
                        mutation()
                    except store.Conflict:
                        pass
                    except Exception as exc:
                        failures.append(type(exc).__name__)
                    else:
                        failures.append('allowed')
            finally:
                release.set()
                worker.join(5)
            self.assertEqual(failures,[])
            self.assertFalse(worker.is_alive())
            self.assertEqual(call.call_count,2)
        self.assertEqual(result[0]['results'][0]['status'],'proposed')
        self.assertEqual(config.load()['model'],provider['model'])

    def test_api_failure_preserves_saved_records(self):
        before=self.accepted_lab()
        with patch.object(model,'complete',side_effect=ValueError('Provider unavailable')):
            r=self.process('updates/lab-1-revised.txt',mode='live',consent='scope')
        self.assertEqual(r['results'][0]['status'],'failed')
        self.assertEqual(store.state()['tasks'][0],before)

    def test_unreadable_pdf_reports_error(self):
        s=self.scan('updates/unreadable.pdf')
        self.assertEqual(s['documents'],[])
        self.assertIn('No readable text',s['errors'][0]['error'])

    def test_prompt_injection_fixture_has_no_authority(self):
        self.process('updates/untrusted-instruction.txt')
        self.assertEqual(self.pending(),[])
        self.assertEqual(store.state()['tasks'],[])

    def test_unsupported_deadline_is_cleared(self):
        s=self.scan('course-pack/01-lab-brief.txt');d=s['documents'][0]
        output=copy.deepcopy(engine.replay(d));output['tasks'][0]['date']='2030-12-31'
        tasks,errors=engine.validated_tasks(output,d['units'])
        self.assertFalse(errors);self.assertEqual((tasks[0]['date'],tasks[0]['time']),('',''))

    def test_unsupported_default_time_is_cleared(self):
        s=self.scan('course-pack/01-lab-brief.txt');d=s['documents'][0]
        output=copy.deepcopy(engine.replay(d));output['tasks'][0]['time']='23:59'
        tasks,_=engine.validated_tasks(output,d['units'])
        self.assertEqual(tasks[0]['time'],'')

    def test_hallucinated_quote_rejected(self):
        d=self.scan('course-pack/01-lab-brief.txt')['documents'][0]
        output=copy.deepcopy(engine.replay(d));output['tasks'][0]['evidence'][0]['quote']='This does not occur in the source.'
        tasks,errors=engine.validated_tasks(output,d['units'])
        self.assertEqual(tasks,[]);self.assertTrue(errors)

    def test_hallucinated_title_and_task_key_are_rejected(self):
        d=self.scan('course-pack/01-lab-brief.txt')['documents'][0]
        for field,value in [('title','Buy groceries'),('task_key','shopping-list')]:
            output=copy.deepcopy(engine.replay(d));output['tasks'][0][field]=value
            tasks,errors=engine.validated_tasks(output,d['units'])
            self.assertEqual(tasks,[]);self.assertTrue(errors)

    def test_source_grounding_allows_case_only_differences(self):
        d=self.scan('course-pack/01-lab-brief.txt')['documents'][0]
        output=copy.deepcopy(engine.replay(d));task=output['tasks'][0]
        task['task_key']='LAB-1';task['title']=task['title'].upper();task['requirements'][0]=task['requirements'][0].upper()
        tasks,errors=engine.validated_tasks(output,d['units'])
        self.assertFalse(errors);self.assertEqual(tasks[0]['task_key'],'lab-1');self.assertEqual(len(tasks[0]['requirements']),1)

    def test_each_requirement_needs_its_own_supporting_quote(self):
        d=self.scan('course-pack/01-lab-brief.txt')['documents'][0]
        output=copy.deepcopy(engine.replay(d));output['tasks'][0]['requirements'].append('Pay a processing fee.')
        tasks,errors=engine.validated_tasks(output,d['units'])
        self.assertFalse(errors)
        self.assertEqual(tasks[0]['requirements'],['Submission: Upload one PDF report (maximum 3 pages).'])
        self.assertTrue(any('requirement' in warning.lower() for warning in tasks[0]['warnings']))

    def test_grounding_does_not_join_separate_source_units(self):
        units=[
            {'locator':'line 1','text':'Alpha'},
            {'locator':'line 2','text':'Beta'},
            {'locator':'line 3','text':'Need red'},
            {'locator':'line 4','text':'blue rule'},
        ]
        task=dict(title='Alpha',task_key='Alpha',date='',time='',tentative=False,
                  requirements=['Need red'],evidence=[
                      {'locator':'line 1','quote':'Alpha','field':'task'},
                      {'locator':'line 2','quote':'Beta','field':'task'},
                      {'locator':'line 3','quote':'Need red','field':'requirements'},
                      {'locator':'line 4','quote':'blue rule','field':'requirements'},
                  ])
        for field,value in (
            ('title','Alpha Beta'),
            ('task_key','Alpha Beta'),
            ('requirements',['Need red blue rule']),
        ):
            with self.subTest(field=field):
                candidate=copy.deepcopy(task)
                candidate[field]=value
                tasks,errors=engine.validated_tasks({'tasks':[candidate]},units)
                if field == 'requirements':
                    self.assertEqual(tasks[0]['requirements'],[])
                    self.assertTrue(tasks[0]['warnings'])
                else:
                    self.assertEqual(tasks,[])
                    self.assertTrue(errors)

    def test_fake_locator_rejected(self):
        d=self.scan('course-pack/01-lab-brief.txt')['documents'][0]
        output=copy.deepcopy(engine.replay(d));output['tasks'][0]['evidence'][0]['locator']='page 999'
        tasks,errors=engine.validated_tasks(output,d['units'])
        self.assertEqual(tasks,[]);self.assertTrue(errors)

    def test_upload_path_traversal_rejected(self):
        with self.assertRaises(ValueError):documents.uploads([dict(name='../private.txt',content='dGVzdA==')])

    def test_folder_scan_skips_hidden_and_external_symlinks(self):
        root=Path(self.tmp.name)/'input';root.mkdir();(root/'ok.txt').write_text('Visible text')
        (root/'.private.txt').write_text('Hidden')
        outside=Path(self.tmp.name)/'outside.txt';outside.write_text('Outside')
        try:(root/'link.txt').symlink_to(outside)
        except OSError:pass  # Some Windows accounts cannot create symlinks.
        self.assertEqual([n for n,_ in documents.folder_files(root)],['ok.txt'])

    def test_manual_edit_requires_expected_version(self):
        t=self.accepted_lab()
        with self.assertRaises(store.Conflict):store.mutate('tasks',t['id'],'PUT',{**t,'progress':100})

    def test_configuration_redacts_and_keeps_secret(self):
        with patch.dict(os.environ,{},clear=True):
            os.environ['STUDY_CALENDAR_CONFIG']=str(Path(self.tmp.name)/'private.json')
            result=config.save(dict(api_key='synthetic-test-secret',model='example-model'))
            self.assertNotIn('api_key',result)
            self.assertTrue(result['key_configured'])
            config.save(dict(api_key=''))
            self.assertEqual(config.load()['api_key'],'synthetic-test-secret')

    def test_provider_errors_do_not_expose_response(self):
        class Client:
            def open(self,*args,**kwargs):
                raise urllib.error.HTTPError('https://example.invalid',401,'Unauthorized',{},io.BytesIO(b'SECRET_FROM_PROVIDER'))
        with self.assertRaisesRegex(ValueError,'HTTP 401') as caught:
            model.complete([],settings=dict(base_url='https://example.invalid/v1',model='test',api_key='synthetic'),opener=Client())
        self.assertNotIn('SECRET',str(caught.exception))

    def test_provider_redirect_never_forwards_authorization(self):
        self.assertIsNone(model.NoRedirect().redirect_request(None,None,302,'Moved',{},'https://other.invalid'))

    def test_clear_key_and_forbid_insecure_endpoint(self):
        config.save(dict(api_key='synthetic'))
        config.save(dict(clear_key=True))
        self.assertFalse(config.public()['key_configured'])
        with self.assertRaises(ValueError):config.save(dict(base_url='http://example.invalid'))

    def test_provider_destination_change_blocks_transmission(self):
        with patch.object(model,'complete') as call:
            with self.assertRaisesRegex(ValueError,'Provider settings changed'):
                self.process('course-pack/01-lab-brief.txt',mode='live',consent='scope',
                             provider={'base_url':'https://different.invalid/v1','model':'unknown'})
            call.assert_not_called()

    def test_default_provider_client_keeps_tls_verification(self):
        import ssl
        class Response:
            def __enter__(self):return self
            def __exit__(self,*args):return False
            def read(self,*args):return b'{"choices":[{"finish_reason":"stop","message":{"content":"{\\"tasks\\":[]}"}}]}'
        class Client:
            def open(self,*args,**kwargs):return Response()
        with patch.object(model.urllib.request,'build_opener',return_value=Client()) as build:
            self.assertEqual(model.complete([],settings=dict(base_url='https://example.invalid/v1',model='test',api_key='synthetic')),{'tasks':[]})
        context=build.call_args.args[1]._context
        self.assertEqual(context.verify_mode,ssl.CERT_REQUIRED)
        self.assertTrue(context.check_hostname)


if __name__=='__main__':unittest.main()
