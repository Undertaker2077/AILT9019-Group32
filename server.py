#!/usr/bin/env python3
"""Local single-user server. Run: python server.py --port 3458."""
import argparse
import json
import os
from pathlib import Path
import re
import subprocess
import sys
from socketserver import TCPServer
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit
from app import config, engine, model, store


class LoopbackHTTPServer(ThreadingHTTPServer):
    def server_bind(self):
        # This local-only service needs no reverse DNS lookup during startup.
        TCPServer.server_bind(self)
        self.server_name, self.server_port = self.server_address[:2]


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(config.ROOT/'dist'), **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control','no-store')
        self.send_header('X-Content-Type-Options','nosniff')
        self.send_header('Referrer-Policy','no-referrer')
        self.send_header('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; form-action 'self'")
        super().end_headers()

    def allowed(self):
        hosts = {f'localhost:{self.server.server_port}', f'127.0.0.1:{self.server.server_port}'}
        return self.headers.get('Host') in hosts and (not self.headers.get('Origin') or self.headers['Origin'] in {'http://'+h for h in hosts})

    def send_json(self, value, status=200):
        raw = json.dumps(value,ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header('Content-Type','application/json; charset=utf-8')
        self.send_header('Content-Length',str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def list_directory(self, path):
        self.send_error(404)
        return None

    def do_GET(self):
        if not self.allowed():
            return self.send_json({'error':'Local access only.'},403)
        path = urlsplit(self.path).path
        try:
            if path in ('/api/state','/api/export'):
                return self.send_json(store.state())
            if path == '/api/settings':
                return self.send_json(config.public())
            if path == '/api/proposals':
                return self.send_json(engine.proposals())
            if path == '/api/history':
                with store.connection() as c:
                    return self.send_json([dict(r) for r in c.execute('SELECT * FROM history ORDER BY id DESC LIMIT 100')])
            if path.startswith('/api/'):
                return self.send_json({'error':'Unknown endpoint.'},404)
            return super().do_GET()
        except (ValueError, OSError):
            self.send_json({'error':'Local configuration/data could not be read.'},500)

    def mutate(self, method):
        if not self.allowed():
            return self.send_json({'error':'Local access only.'},403)
        if self.headers.get('Content-Type','').split(';')[0] != 'application/json':
            return self.send_json({'error':'JSON required.'},415)
        try:
            length = int(self.headers.get('Content-Length','0'))
            if not 0 < length <= 30*1024*1024:
                raise ValueError('Request must contain JSON, maximum 30 MB.')
            data = json.loads(self.rfile.read(length))
            if not isinstance(data,dict):
                raise ValueError('Expected a JSON object.')
            path = urlsplit(self.path).path
            if method == 'POST':
                if path == '/api/settings':
                    return self.send_json(config.save(data))
                if path == '/api/settings/test':
                    model.complete([{'locator':'connection-check','text':'This is a connection check. There are no academic tasks. Return {"tasks":[]}.'}])
                    return self.send_json({'ok':True,'notice':'Synthetic connection request succeeded.'})
                if path == '/api/demo':
                    return self.send_json(store.demo())
                if path == '/api/scan':
                    return self.send_json(engine.preview(data))
                if path == '/api/extract':
                    return self.send_json(engine.process(data))
                match = re.fullmatch(r'/api/proposals/(\d+)/decision',path)
                if match:
                    return self.send_json(engine.decide(int(match[1]),data))
                match = re.fullmatch(r'/api/courses/(\d+)/(folder|open-folder)',path)
                if match:
                    cid, action = int(match[1]),match[2]
                    with store.connection() as c:
                        course = c.execute('SELECT * FROM courses WHERE id=?',(cid,)).fetchone()
                        if not course:
                            raise ValueError('Course not found.')
                        if action == 'folder':
                            folder = Path(str(data.get('folder',''))).expanduser()
                            if not str(data.get('folder','')).strip() or not folder.is_dir() or folder.is_symlink():
                                raise ValueError('Enter an existing local folder, not a symbolic link.')
                            c.execute('UPDATE courses SET folder=? WHERE id=?',(str(folder.resolve()),cid))
                            return self.send_json({'saved':True})
                    folder = Path(course['folder'])
                    if not course['folder'] or not folder.is_dir():
                        raise ValueError('Associate an existing course folder first.')
                    if sys.platform == 'win32':
                        os.startfile(str(folder))
                    else:
                        subprocess.Popen(['open' if sys.platform=='darwin' else 'xdg-open',str(folder)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
                    return self.send_json({'opened':True,'folder':folder.name})
            match = re.fullmatch(r'/api/(courses|tasks)(?:/(\d+))?',path)
            if match:
                table, ident = match[1],int(match[2]) if match[2] else None
                if (method=='POST') != (ident is None):
                    raise ValueError('Invalid record endpoint.')
                result = store.mutate(table,ident,method,data)
                return self.send_json(result,201 if method=='POST' else 200)
            return self.send_json({'error':'Unknown endpoint.'},404)
        except store.Conflict as e:
            self.send_json({'error':str(e)},409)
        except (ValueError,TypeError,KeyError,OverflowError) as e:
            self.send_json({'error':str(e)},400)
        except Exception:
            # Do not expose tracebacks, file content, provider responses or secrets.
            self.send_json({'error':'Operation failed. Check local files and configuration; existing tasks were preserved.'},500)

    def do_POST(self):
        self.mutate('POST')

    def do_PUT(self):
        self.mutate('PUT')

    def do_DELETE(self):
        self.mutate('DELETE')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--port',type=int,default=3458)
    parser.add_argument('--demo',action='store_true',help='Add a fictional course associated with bundled examples; does not run AI or create tasks.')
    args = parser.parse_args()
    store.initialize()
    if args.demo:
        store.demo()
    with LoopbackHTTPServer(('127.0.0.1',args.port),Handler) as server:
        print(f'AI Study Calendar: http://localhost:{server.server_port} (Ctrl+C to stop)',flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__=='__main__':
    main()
