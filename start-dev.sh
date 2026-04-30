#!/bin/bash
# Starts the Macrobot dev server on http://127.0.0.1:3000 using Node 22 LTS.
# Node 25 (system default) causes the build/dev server to hang with Next.js 16.

pkill -f "next dev" 2>/dev/null || true
pkill -f "next start" 2>/dev/null || true
sleep 1

export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
echo "Using Node: $(node --version)"

cd "$(dirname "$0")"
npm run dev
