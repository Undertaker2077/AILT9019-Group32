import json
import os
import tempfile
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_BASE = 'https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1'
DEFAULT_MODEL = 'qwen3.8-flash'


def location():
    return Path(os.environ.get('STUDY_CALENDAR_CONFIG', ROOT / 'local' / 'config.json'))


def load():
    p = location()
    value = json.loads(p.read_text(encoding='utf-8')) if p.exists() else {}
    return dict(base_url=os.environ.get('STUDY_API_BASE', value.get('base_url', DEFAULT_BASE)),
                model=os.environ.get('STUDY_API_MODEL', value.get('model', DEFAULT_MODEL)),
                api_key=os.environ.get('STUDY_API_KEY', value.get('api_key', '')))


def validate(value):
    u = urlsplit(value['base_url'])
    if (u.scheme != 'https' or not u.netloc or u.username or u.password or u.query or u.fragment):
        raise ValueError('API base URL must be HTTPS, without credentials, query or fragment.')
    if not value['model'].strip() or len(value['model']) > 150:
        raise ValueError('Enter a model name (maximum 150 characters).')
    if len(value['api_key']) > 4096 or any(c in value['api_key'] for c in '\r\n'):
        raise ValueError('Invalid API key.')
    return value


def public():
    value = load()
    return dict(base_url=value['base_url'], model=value['model'], key_configured=bool(value['api_key']))


def save(data):
    # Never return an existing secret to the browser. Blank input retains it.
    old = load()
    value = validate(dict(base_url=str(data.get('base_url', old['base_url'])).rstrip('/'),
                          model=str(data.get('model', old['model'])).strip(),
                          api_key=str(data.get('api_key') or old['api_key'])))
    if data.get('clear_key'):
        value['api_key'] = ''
    p = location()
    p.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary = tempfile.mkstemp(dir=p.parent)
    try:
        with os.fdopen(fd, 'w', encoding='utf-8') as f:
            json.dump(value, f, ensure_ascii=False, indent=2)
        os.replace(temporary, p)
        if os.name != 'nt':
            p.chmod(0o600)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)
    return public()
