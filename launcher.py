#!/usr/bin/env python3
"""Cross-platform launcher; uses the current Python interpreter and webbrowser."""
import argparse
import json
import subprocess
import sys
import time
import urllib.error
import urllib.request
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def probe(url):
    try:
        with urllib.request.urlopen(url+'/api/state',timeout=1) as response:
            value=json.load(response)
        return 'ours' if value.get('app')=='ai-study-calendar' else 'other'
    except urllib.error.HTTPError:
        return 'other'
    except (urllib.error.URLError, TimeoutError, OSError, ValueError):
        return 'unavailable'


def main():
    p=argparse.ArgumentParser()
    p.add_argument('--port',type=int,default=3458)
    p.add_argument('--no-open',action='store_true')
    p.add_argument('--demo',action='store_true')
    args=p.parse_args()
    url=f'http://localhost:{args.port}'
    status=probe(url)
    if status=='other':
        raise SystemExit('Port is occupied by another app. Choose --port 3460.')
    child=None
    if status!='ours':
        command=[sys.executable,str(ROOT/'server.py'),'--port',str(args.port)]
        if args.demo:
            command.append('--demo')
        child=subprocess.Popen(command,cwd=ROOT)
        for _ in range(50):
            if probe(url)=='ours':
                break
            if child.poll() is not None:
                raise SystemExit('Server could not start. Read the error above.')
            time.sleep(.1)
        else:
            child.terminate()
            raise SystemExit('Server startup timed out.')
    print('AI Study Calendar: '+url,flush=True)
    if not args.no_open:
        webbrowser.open(url)
    if child:
        print('Keep this window open. Press Ctrl+C to stop.',flush=True)
        try:
            child.wait()
        except KeyboardInterrupt:
            child.terminate()
            child.wait()


if __name__=='__main__':
    main()
