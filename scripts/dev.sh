#!/bin/bash
# Aumenta limite de arquivos abertos para evitar "EMFILE: too many open files"
ulimit -n 10240 2>/dev/null
exec npx next dev --port 3000 --hostname 127.0.0.1
