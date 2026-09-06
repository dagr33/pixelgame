#!/bin/bash
set -eu

LOG_FILE="/var/log/project-bootstrap.log"
umask 027

{
  printf '\n[%s] Pixel Siege bootstrap check\n' "$(date -u +%FT%TZ)"

  if command -v docker >/dev/null 2>&1; then
    printf 'Docker: installed\n'
  else
    printf 'Docker: not installed\n'
  fi

  if command -v psql >/dev/null 2>&1; then
    printf 'PostgreSQL client: installed\n'
  else
    printf 'PostgreSQL client: not installed\n'
  fi
} >> "$LOG_FILE"
