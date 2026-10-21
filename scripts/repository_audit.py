"""Audit exactly the tracked + nonignored Git candidates; never print secret values."""
from pathlib import Path
import hashlib
import json
import re
import subprocess
import sys
import zipfile

ROOT = Path(__file__).resolve().parent.parent
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')


def candidates():
    result = subprocess.run(
        ['git', '-c', 'core.quotepath=false', 'ls-files', '--cached', '--others', '--exclude-standard', '-z'],
        cwd=ROOT, check=True, capture_output=True,
    )
    return sorted(set(x for x in result.stdout.decode('utf-8').split('\0') if x))


def audit():
    files = candidates()
    issues = []
    total = 0
    secret_patterns = {
        'private key': re.compile(rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'),
        'GitHub token': re.compile(rb'\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b'),
        'OpenAI key': re.compile(rb'\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{32,}\b'),
    }
    allowed_zips = {'work/default-templates.zip', 'work/legacy-default-templates.zip'}
    for name in files:
        p = ROOT / name
        if p.is_symlink() or not p.is_file():
            issues.append({'file': name, 'issue': 'Missing, nonregular or symbolic-link upload candidate'})
            continue
        data = p.read_bytes()
        total += len(data)
        parts = set(Path(name).parts)
        if parts & {'node_modules', 'outputs', '.git', '.tools', '.cache', '.venv', '保存工程', 'pdf-input', 'upstream'}:
            issues.append({'file': name, 'issue': 'Local/generated directory in upload'})
        if p.name in {'.env', '.npmrc', '本地设置.json', '.imo-local-session.json', 'saved-project.json'} or p.name.startswith('.env.'):
            issues.append({'file': name, 'issue': 'Local configuration/data in upload'})
        if p.suffix.lower() in {'.pdf', '.pem', '.key'} or re.search(r'\.imo(?:project|stores|defaults|effects)\.json$', name):
            issues.append({'file': name, 'issue': 'Personal document, project or credential file in upload'})
        if p.suffix.lower() == '.zip' and name not in allowed_zips:
            issues.append({'file': name, 'issue': 'Unexpected archive'})
        if p.suffix.lower() == '.xlsx' and not name.startswith('work/default-input/cleaned/'):
            issues.append({'file': name, 'issue': 'Unexpected workbook outside original blank templates'})
        if len(data) >= 95 * 1024 * 1024:
            issues.append({'file': name, 'issue': 'File exceeds repository size budget'})
        if b'\0' not in data[:8192] and p.suffix.lower() not in {'.xlsx', '.zip', '.exe', '.png'}:
            for label, pattern in secret_patterns.items():
                if pattern.search(data):
                    issues.append({'file': name, 'issue': f'Possible {label}; inspect locally'})

    required = {
        'README.md', 'AGENTS.md', 'docs/CLOUD.md', 'docs/REPOSITORY.md',
        'package.json', 'package-lock.json', 'requirements-dev.txt',
        'scripts/cloud-setup.sh', 'scripts/cloud-check.mjs',
        'work/build.py', 'work/IMO_Launcher.exe', 'work/LocalLauncher.cs',
        'work/default-templates.zip', 'work/legacy-default-templates.zip',
        'work/legacy-template-config.json', 'work/template-replacement-install.json',
        'work/reference-yzrt/LICENSE', 'work/reference-yzrt/SOURCE_METADATA.json',
        'work/reference-yzrt/纯CSS液态玻璃/index.html',
        'work/reference-yzrt/纯CSS液态玻璃/css/styles.css',
    }
    checks_source = (ROOT / 'work/run_checks.mjs').read_text(encoding='utf-8')
    required.update('work/' + n for n in re.findall(r"'([^']+\.mjs)'", checks_source))
    required.update('work/' + n for n in ['baseline-state.json', 'departure-state.json', 'overflow-state.json', 'reduced-state.json'])
    for name in sorted(required - set(files)):
        issues.append({'file': name, 'issue': 'Required source missing or ignored'})

    installed = json.loads((ROOT / 'work/template-replacement-install.json').read_text(encoding='utf-8'))
    template_zip = ROOT / 'work/default-templates.zip'
    if hashlib.sha256(template_zip.read_bytes()).hexdigest() != installed['sourceSha256']:
        issues.append({'file': 'work/default-templates.zip', 'issue': 'Original template archive bytes changed'})
    with zipfile.ZipFile(template_zip) as archive:
        if archive.testzip() is not None:
            issues.append({'file': 'work/default-templates.zip', 'issue': 'Archive CRC failure'})
        entries = {Path(n).name: n for n in archive.namelist() if not n.endswith('/')}
        if len(entries) != 10 or len(installed['files']) != 10:
            issues.append({'file': 'work/default-templates.zip', 'issue': 'Expected exactly 10 templates'})
        for entry in installed['files']:
            name = 'work/default-input/cleaned/' + entry['name']
            expected = entry['sha256']
            if name not in files or hashlib.sha256((ROOT / name).read_bytes()).hexdigest() != expected:
                issues.append({'file': name, 'issue': 'Original workbook missing or changed'})
            if entry['name'] not in entries or hashlib.sha256(archive.read(entries[entry['name']])).hexdigest() != expected:
                issues.append({'file': name, 'issue': 'Packed template hash mismatch'})

    report = {
        'passed': not issues, 'files': len(files), 'bytes': total,
        'originalTemplateCount': len(installed['files']), 'issues': issues,
        'scope': 'Git upload candidates, required sources, original template hashes and common credential patterns. Not an exhaustive personal-data or secret detector.',
    }
    return report, files


if __name__ == '__main__':
    report, _ = audit()
    print(json.dumps(report, ensure_ascii=False, indent=2))
    sys.exit(0 if report['passed'] else 1)
