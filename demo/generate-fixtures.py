"""Export text previews and saved replay outputs for the public course demo."""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.documents import extract

examples = ROOT / 'examples'
documents = [extract(path.name, path.read_bytes())
             for path in sorted((examples / 'course-pack').iterdir()) if path.is_file()]
replay = json.loads((examples / 'replay.json').read_text(encoding='utf-8'))
payload = {'documents': documents, 'replay': {
    doc['sha256']: replay[doc['sha256']] for doc in documents if doc['sha256'] in replay
}}
Path(__file__).with_name('fixtures.json').write_text(
    json.dumps(payload, ensure_ascii=False, indent=2) + '\n', encoding='utf-8'
)
