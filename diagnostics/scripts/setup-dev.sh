#!/bin/bash

# Run this from your project root: bash diagnostics/setup-dev.sh

set -e

echo "=== Fixing npm permissions if needed ==="
sudo chown -R $(id -u):$(id -g) "$HOME/.npm"

echo "=== Installing core dependencies ==="
npm install --save axios dotenv @supabase/supabase-js

echo "=== Installing dev tools ==="
npm install --save-dev tsx

echo "=== Running Diagnostics Scripts ==="

if [ -f diagnostics/health-check.ts ]; then
  echo "--- Running health-check.ts ---"
  npx tsx diagnostics/health-check.ts || { echo "health-check.ts failed"; exit 1; }
fi

if [ -f diagnostics/file-usage-map.ts ]; then
  echo "--- Running file-usage-map.ts ---"
  npx tsx diagnostics/file-usage-map.ts || { echo "file-usage-map.ts failed"; exit 1; }
fi

if [ -f diagnostics/crud-check.ts ]; then
  echo "--- Running crud-check.ts ---"
  npx tsx diagnostics/crud-check.ts || { echo "crud-check.ts failed"; exit 1; }
fi

echo "--- Running supabase-crud-diagnostics.ts ---"
npx tsx diagnostics/supabase-crud-diagnostics.ts || { echo "supabase-crud-diagnostics.ts failed"; exit 1; }

echo "=== All setup and diagnostics complete! ==="