#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

node --version
python3 --version
export npm_config_cache="${npm_config_cache:-$PWD/.cache/npm}"
npm ci
python3 -m pip install -r requirements-dev.txt
# Managed cloud images may already have system libraries and disallow sudo.
# Opt in to system-package installation only on a machine that permits it.
if [[ "${IMO_INSTALL_SYSTEM_DEPS:-0}" == "1" ]]; then
  npx playwright install --with-deps chromium
else
  npx playwright install chromium
fi
python3 work/build.py
python3 scripts/repository_audit.py
