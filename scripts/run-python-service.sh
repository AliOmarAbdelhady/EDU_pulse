#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

unset PYTHONPATH
export TF_CPP_MIN_LOG_LEVEL="${TF_CPP_MIN_LOG_LEVEL:-2}"
export TF_NUM_INTEROP_THREADS="${TF_NUM_INTEROP_THREADS:-2}"
export TF_NUM_INTRAOP_THREADS="${TF_NUM_INTRAOP_THREADS:-2}"
export CUDA_VISIBLE_DEVICES="${CUDA_VISIBLE_DEVICES:--1}"
export EDUPULSE_EMOTION_ENGINE="${EDUPULSE_EMOTION_ENGINE:-deepface}"
export SKIP_DB_INIT="${SKIP_DB_INIT:-true}"

if [ ! -x backend/.venv/bin/uvicorn ]; then
  echo "Backend AI service venv is missing. Run: npm run setup:python" >&2
  exit 1
fi

exec backend/.venv/bin/uvicorn backend.main:app \
  --host 0.0.0.0 \
  --port "${PYTHON_SERVICE_PORT:-8001}"
