"""Package only reviewable source/fictional fixtures, never local data or secrets."""
import json
import sys
import zipfile
from pathlib import Path
from check_submission import ROOT, distributable, main as check


def main():
    if check():
        raise SystemExit('Source check failed; no ZIP created.')
    output=ROOT/'output';output.mkdir(exist_ok=True)
    target=output/'ai-study-calendar-source.zip'
    # Root-level files and these source directories are the complete allowlist.
    folders={'app','dist','docs','examples','tests','scripts','.github'}
    root_files={'README.md','.gitignore','.gitattributes','.env.example','requirements.txt','server.py','launcher.py',
                'Setup-Windows.bat','Start-Windows.bat','Setup-Mac.command','Start-Mac.command'}
    files=[p for p in ROOT.rglob('*') if p.is_file() and distributable(p) and
           (p.relative_to(ROOT).parts[0] in folders or p.relative_to(ROOT).as_posix() in root_files)]
    with zipfile.ZipFile(target,'w',compression=zipfile.ZIP_DEFLATED) as z:
        for p in sorted(files):
            name='ai-study-calendar/'+p.relative_to(ROOT).as_posix()
            if p.suffix=='.bat':
                z.writestr(name,p.read_text(encoding='utf-8').replace('\r\n','\n').replace('\n','\r\n'))
            else:
                z.write(p,name)
    manifest=[p.relative_to(ROOT).as_posix() for p in sorted(files)]
    (output/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
    print(f'Created {target.name}: {len(manifest)} source files. Review output/manifest.json before sharing.')


if __name__=='__main__':main()
