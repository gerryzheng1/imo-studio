# IMO Studio development instructions

Read README.md, docs/CLOUD.md, PRODUCT.md and 制作思路与开发交接.md section 20 before changes. DESIGN.md and .impeccable/design.json describe the current visual direction; earlier directions are historical.

## Source and behavior

- Edit work/ source files; rebuild with python work/build.py. Never hand-edit outputs/ HTML or bundled assets.
- The application remains fully local and offline. Cloud is the development environment, not an application backend. Do not add telemetry, online assets or data uploads.
- Preserve the ten original workbooks and work/default-templates.zip byte-for-byte. Keep legacy-default-templates.zip and legacy-template-config.json for compatibility. Do not rerun install_replacement_templates.py: it is a one-time migration.
- Preserve multi-port isolation, whole-project saves, identity-based effects snapshots, inventory calculations, manual health/NIL/date confirmations, original worksheet inventory and one-page print configuration.
- Dates passing never automatically completes a port. Completion requires actual-date review and preserves the remaining ports.
- Keep the fixed author credit in the app, never in Excel output. Retain third-party source and license files.

## Checks

- Node.js >=24, Python >=3.11. Install with npm ci and python -m pip install -r requirements-dev.txt.
- Linux/cloud: run bash scripts/cloud-setup.sh, then npm run test:cloud. The setup uses a writable project npm cache and installs Chromium without sudo by default. On a machine that permits system-package installation, set IMO_INSTALL_SYSTEM_DEPS=1 if libraries are missing. The checks build, run all 16 current regression scripts using Chromium, then independently check 30 generated XLSX files with Python/openpyxl.
- In the prepared Codex environment at /workspace/imo-studio, activate .venv before Python/npm checks and explicitly export PLAYWRIGHT_BROWSERS_PATH=/workspace/.cache/ms-playwright, npm_config_cache=/workspace/.cache/npm and PIP_CACHE_DIR=/workspace/.cache/pip in the command shell. Setup-shell exports are not automatically inherited. See docs/CLOUD.md for the verified command block; do not reinstall healthy dependencies. If a sandbox blocks Chromium, use the normal approval flow, without weakening security settings.
- Windows: python work/build.py, npm test (Chrome and Edge), npm run test:native, python work/verify_multiport_xml.py. The native launcher and Excel/WPS printing must be verified on Windows. Cloud passing does not certify these.
- For narrow changes, run the relevant checks; run the full cloud suite for browser-runner/build changes or before handoff. Report failures and unrun checks explicitly.
- Fresh-clone verification and upload audit: python scripts/repository_audit.py. It reads the Git upload candidate list without modifying user files. Historical report files do not count as new validation.
- npm run guide:cloud exports current help. Release packaging is a separate workflow; see docs/REPOSITORY.md for its required generated inputs.

## Repository hygiene

- Keep user projects, actual personal/ship documents, tokens, local settings, test outputs, dependency folders, historical extracted copies and screenshots out of Git. Test state JSONs are synthetic PACIFIC TEST/CREW fixtures.
- Do not blanket ignore every ZIP/XLSX/EXE: the two template ZIPs, ten blank XLSX files and the Windows launcher are intentional source assets.
- Do not run the legacy one-off migration/rewrite scripts just to set up the repository. Do not regenerate or overwrite original templates.
- Preserve old local outputs. Do not claim a GitHub push or cloud migration succeeded until the remote repository/environment has been checked.
