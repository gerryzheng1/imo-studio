import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const python = process.env.IMO_PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
const env = { ...process.env, IMO_BROWSERS: 'chromium', PYTHONUTF8: '1' };
const steps = process.argv.includes('--guide')
  ? [[python, ['work/build.py']], [process.execPath, ['work/make_v322_guide.mjs']]]
  : [[python, ['work/build.py']], [process.execPath, ['work/run_checks.mjs']], [python, ['work/verify_multiport_xml.py']]];

for (const [command, args] of steps) {
  console.log(`\nRunning ${path.basename(command)} ${args.join(' ')}`);
  const code = await new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, env, stdio: 'inherit', windowsHide: true });
    child.once('error', reject);
    child.once('exit', (code, signal) => resolve(signal ? 1 : (code ?? 1)));
  });
  if (code !== 0) process.exit(code);
}
