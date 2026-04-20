#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

SERVER_PORT="${PORT:-4000}"
CLIENT_PORT="5173"

SEED_DB="false"
FAST_MODE="false"
for arg in "$@"; do
  case "$arg" in
    --seed)
      SEED_DB="true"
      ;;
    --fast)
      FAST_MODE="true"
      ;;
    *)
      echo "Unknown option: $arg"
      echo "Usage: ./start.sh [--seed] [--fast]"
      exit 1
      ;;
  esac
done

if [[ ! -f ".env" ]]; then
  echo "No .env file found. Creating one from .env.example..."
  cp .env.example .env
fi

set -a
# shellcheck disable=SC1091
source ".env"
set +a

ensure_database_exists() {
  if [[ -z "${DATABASE_URL:-}" ]]; then
    echo "DATABASE_URL is not set. Please update .env before running."
    exit 1
  fi

  if ! command -v psql >/dev/null 2>&1; then
    echo "psql is not installed. Install PostgreSQL client tools or create the database manually."
    exit 1
  fi

  local db_name
  local admin_url
  db_name="$(node -e 'const u = new URL(process.env.DATABASE_URL); console.log((u.pathname || "").replace(/^\//, ""));')"
  admin_url="$(node -e 'const u = new URL(process.env.DATABASE_URL); u.pathname = "/postgres"; console.log(u.toString());')"

  if [[ -z "$db_name" ]]; then
    echo "Could not parse database name from DATABASE_URL."
    exit 1
  fi

  local db_exists
  db_exists="$(psql "$admin_url" -tAc "SELECT 1 FROM pg_database WHERE datname = '$db_name'" 2>/dev/null || true)"

  if [[ "$db_exists" == "1" ]]; then
    echo "Database '$db_name' already exists."
    return
  fi

  echo "Database '$db_name' not found. Creating it..."
  if ! psql "$admin_url" -v ON_ERROR_STOP=1 -c "CREATE DATABASE \"$db_name\";" >/dev/null; then
    echo "Failed to create database '$db_name'."
    echo "Make sure PostgreSQL is running and the DATABASE_URL user can create databases."
    exit 1
  fi

  echo "Database '$db_name' created."
}

port_pid() {
  local port="$1"
  lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null | head -n1 || true
}

stop_stale_sabbar_listener() {
  local port="$1"
  local pid
  pid="$(port_pid "$port")"

  if [[ -z "$pid" ]]; then
    return
  fi

  local cmd
  cmd="$(ps -p "$pid" -o args= 2>/dev/null || true)"

  if [[ "$cmd" == *"$ROOT_DIR"* || "$cmd" == *"node dist/server.js"* || "$cmd" == *"vite preview"* ]]; then
    echo "Port $port is used by a stale Sabbar process (PID $pid). Stopping it..."
    kill "$pid" 2>/dev/null || true
    sleep 1
    if kill -0 "$pid" 2>/dev/null; then
      kill -9 "$pid" 2>/dev/null || true
    fi
    return
  fi

  echo "Port $port is already in use by another process (PID $pid)."
  echo "Command: $cmd"
  echo "Please stop that process or change ports in your .env before running ./start.sh."
  exit 1
}

ensure_ports_available() {
  if ! command -v lsof >/dev/null 2>&1; then
    echo "lsof is required to verify local ports. Please install it and rerun ./start.sh."
    exit 1
  fi

  stop_stale_sabbar_listener "$SERVER_PORT"
  stop_stale_sabbar_listener "$CLIENT_PORT"
}

if [[ "$FAST_MODE" == "true" ]]; then
  echo "Fast mode enabled: skipping install and rebuild."
else
  echo "Installing dependencies..."
  npm install

  echo "Rebuilding server and client..."
  npm run build
fi

echo "Ensuring database exists..."
ensure_database_exists

echo "Ensuring required ports are available..."
ensure_ports_available

echo "Running database migrations..."
npm run migrate

if [[ "$SEED_DB" == "true" ]]; then
  echo "Seeding database..."
  npm run seed
fi

cleanup() {
  local exit_code=$?
  if [[ -n "${SERVER_PID:-}" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null || true
  fi
  if [[ -n "${CLIENT_PID:-}" ]] && kill -0 "$CLIENT_PID" 2>/dev/null; then
    kill "$CLIENT_PID" 2>/dev/null || true
  fi
  exit "$exit_code"
}

trap cleanup INT TERM EXIT

echo "Starting backend on http://localhost:${SERVER_PORT} ..."
npm run start --workspace server &
SERVER_PID=$!

echo "Starting frontend preview on http://localhost:5173 ..."
npm run preview --workspace client -- --host 0.0.0.0 --port 5173 &
CLIENT_PID=$!

wait
