#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

unset PYTHONPATH

rm -rf backend/.venv
python3 -m venv backend/.venv

cat >> backend/.venv/bin/activate <<'EOF'

# EDU Pulse backend AI service must not inherit ROS/Jazzy packages.
unset PYTHONPATH
EOF

backend/.venv/bin/python -m pip install --upgrade pip
PIP_CACHE_DIR="${PIP_CACHE_DIR:-/tmp/pip-cache}" \
  backend/.venv/bin/python -m pip install --timeout 300 --retries 10 -r backend/requirements.txt

backend/.venv/bin/python -m pip check
