#!/bin/zsh
cd -- "${0:A:h}"
if [[ -x .venv/bin/python ]]; then
  exec .venv/bin/python launcher.py "$@"
else
  exec python3 launcher.py "$@"
fi
