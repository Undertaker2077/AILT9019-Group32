import base64
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import time
import unittest
from unittest.mock import patch
import urllib.error
import urllib.request

ROOT=Path(__file__).resolve().parents[1]


class HttpTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp=tempfile.TemporaryDirectory()
        cls.addClassCleanup(cls.tmp.cleanup)
        cls.log_path=Path(cls.tmp.name)/'server.log'
        cls.log=cls.log_path.open('wb')
        cls.addClassCleanup(cls.log.close)
        env=os.environ.copy()
        env['STUDY_CALENDAR_DB']=str(Path(cls.tmp.name)/'calendar.sqlite3')
        env['STUDY_CALENDAR_CONFIG']=str(Path(cls.tmp.name)/'config.json')
        cls.proc=subprocess.Popen([sys.executable,str(ROOT/'server.py'),'--port','0'],cwd=ROOT,env=env,stdout=cls.log,stderr=cls.log)
        cls.addClassCleanup(cls.stop_server)
        import re
        # Cold imports and local hostname resolution can be slower on hosted runners.
        deadline=time.monotonic()+30
        while time.monotonic()<deadline:
            text=cls.log_path.read_text(errors='replace')
            match=re.search(r'http://localhost:(\d+)',text)
            if match:
                cls.url='http://127.0.0.1:'+match[1];return
            if cls.proc.poll() is not None:
                raise RuntimeError('Server failed: '+text)
            time.sleep(.05)
        raise RuntimeError('Server startup exceeded 30 seconds: '+text)

    @classmethod
    def stop_server(cls):
        if cls.proc.poll() is None:
            cls.proc.terminate()
        try:
            cls.proc.wait(timeout=10)
        except subprocess.TimeoutExpired:
            cls.proc.kill()
            cls.proc.wait(timeout=10)

    def request(self,path,method='GET',data=None,origin=None):
        headers={} if data is None else {'Content-Type':'application/json'}
        if origin:headers['Origin']=origin
        req=urllib.request.Request(self.url+path,method=method,headers=headers,data=None if data is None else json.dumps(data).encode())
        try:
            with urllib.request.urlopen(req,timeout=5) as r:return r.status,json.load(r)
        except urllib.error.HTTPError as e:
            with e:return e.code,json.load(e)

    def test_local_server_starts_without_dns(self):
        from server import Handler, LoopbackHTTPServer
        with patch('socket.getfqdn', side_effect=AssertionError('Local startup must not need DNS')):
            with LoopbackHTTPServer(('127.0.0.1',0),Handler) as server:
                self.assertEqual(server.server_name,'127.0.0.1')
                self.assertGreater(server.server_port,0)

    def test_api_lifecycle_and_confirmation(self):
        status,state=self.request('/api/state');self.assertEqual(status,200)
        self.assertEqual(state['app'],'ai-study-calendar');self.assertEqual(state['tasks'],[])
        _,demo=self.request('/api/demo','POST',{})
        _,preview=self.request('/api/scan','POST',{'course_id':demo['course_id']})
        pdf=next(d for d in preview['documents'] if d['filename'].endswith('.pdf'))
        _,result=self.request('/api/extract','POST',dict(scan_id=preview['scan_id'],hashes=[pdf['sha256']],mode='replay'))
        self.assertFalse(result['calendar_changed'])
        _,proposals=self.request('/api/proposals')
        pid=proposals[0]['id']
        status,accepted=self.request(f'/api/proposals/{pid}/decision','POST',dict(decision='accept'))
        self.assertEqual(status,200)
        t=accepted['task'];self.assertEqual(t['date'],'2026-11-03')
        self.assertEqual(self.request('/api/tasks/'+str(t['id']),'PUT',{**t,'progress':50})[0],409)
        status,updated=self.request('/api/tasks/'+str(t['id']),'PUT',{**t,'progress':50,'expected_version':t['version']})
        self.assertEqual(status,200);self.assertEqual(updated['progress'],50)
        self.assertTrue(self.request('/api/history')[1])

    def test_origin_and_content_boundaries(self):
        self.assertEqual(self.request('/api/demo','POST',{},origin='https://example.invalid')[0],403)
        with urllib.request.urlopen(self.url+'/workflow.js',timeout=5) as r:self.assertEqual(r.status,200)
        with self.assertRaises(urllib.error.HTTPError) as e:urllib.request.urlopen(self.url+'/local/config.json',timeout=5)
        self.assertEqual(e.exception.code,404)
        e.exception.close()

    def test_settings_roundtrip_never_returns_key(self):
        status,result=self.request('/api/settings','POST',dict(api_key='synthetic-http-test-key'))
        self.assertEqual(status,200);self.assertTrue(result['key_configured'])
        self.assertNotIn('api_key',self.request('/api/settings')[1])


if __name__=='__main__':unittest.main()
