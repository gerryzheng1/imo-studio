"""Create an audited GitHub upload ZIP without dependencies, user data or .git."""
from pathlib import Path
import hashlib
import json
import zipfile
from repository_audit import ROOT, audit

report, files = audit()
if not report['passed']:
    raise SystemExit(json.dumps(report, ensure_ascii=True, indent=2))
out = ROOT / 'outputs/github'
out.mkdir(parents=True, exist_ok=True)
archive = out / 'imo-studio-github-ready.zip'
manifest = [{'path': name, 'bytes': (ROOT / name).stat().st_size,
             'sha256': hashlib.sha256((ROOT / name).read_bytes()).hexdigest()} for name in files]
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    for item in manifest:
        z.write(ROOT / item['path'], item['path'])
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    assert len(z.namelist()) == len(manifest)
(out / 'UPLOAD_MANIFEST.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(out / 'REPOSITORY_AUDIT.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
sha = hashlib.sha256(archive.read_bytes()).hexdigest()
(out / 'SHA256SUMS.txt').write_text(sha + '  ' + archive.name + '\n', encoding='utf-8')
print(json.dumps({'archive': str(archive), 'files': len(files), 'bytes': archive.stat().st_size, 'sha256': sha}, ensure_ascii=True))
