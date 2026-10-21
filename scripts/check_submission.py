"""Fail before sharing if the distributable source contains local data or keys.

Ignores the same runtime paths as .gitignore. Prints filenames only, never secrets.
"""
from pathlib import Path
import re
import sys

ROOT=Path(__file__).resolve().parents[1]
EXCLUDED={'.git','.venv','venv','__pycache__','data','local','output','.pytest_cache','更新核验'}


def distributable(path):
    parts=path.relative_to(ROOT).parts
    return (not any(x in EXCLUDED for x in parts) and path.name not in {'.DS_Store','Thumbs.db'}
            and not (path.name.startswith('.env') and path.name!='.env.example')
            and path.suffix not in {'.pyc','.log','.sqlite3','.zip'})


def main():
    files=[p for p in ROOT.rglob('*') if p.is_file() and distributable(p)]
    bad=[]
    for p in files:
        if p.is_symlink():
            bad.append(str(p.relative_to(ROOT))+': symbolic link');continue
        if p.suffix in {'.pdf','.docx'}:
            if 'examples' not in p.relative_to(ROOT).parts:
                bad.append(str(p.relative_to(ROOT))+': unexpected document')
            continue
        text=p.read_text(encoding='utf-8',errors='replace')
        if (re.search(r'sk-(?:sp-)?[A-Za-z0-9_.-]{35,}',text)
            or '/Users/'+'ding/' in text or 'Ding'+' Ruoque' in text):
            bad.append(str(p.relative_to(ROOT))+': possible secret or personal data')
    if bad:
        print('\n'.join(bad));return 1
    print(f'Submission source check passed: {len(files)} files; runtime data/config excluded. This is a bounded check, not a universal secret detector.')
    return 0


if __name__=='__main__':sys.exit(main())
