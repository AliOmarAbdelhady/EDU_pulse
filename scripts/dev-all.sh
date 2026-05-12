#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

export PYTHON_SERVICE_URL="${PYTHON_SERVICE_URL:-http://localhost:8001}"
export EDUPULSE_EMOTION_ENGINE="${EDUPULSE_EMOTION_ENGINE:-deepface}"
export SKIP_DB_INIT="${SKIP_DB_INIT:-true}"
export CUDA_VISIBLE_DEVICES="${CUDA_VISIBLE_DEVICES:--1}"

pids=()

cleanup() {
  if [ "${#pids[@]}" -gt 0 ]; then
    kill "${pids[@]}" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

npm run dev &
pids+=("$!")

npm --prefix socket-server run dev &
pids+=("$!")

bash scripts/run-python-service.sh &
pids+=("$!")

wait -n "${pids[@]}"
