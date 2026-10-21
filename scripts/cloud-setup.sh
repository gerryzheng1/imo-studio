#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

node --version
python3 --version
npm ci
python3 -m pip install -r requirements-dev.txt
npx playwright install --with-deps chromium
python3 work/build.py
python3 scripts/repository_audit.py
