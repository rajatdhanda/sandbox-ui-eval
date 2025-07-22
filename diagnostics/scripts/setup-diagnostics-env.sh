#!/bin/bash
set -e
npm install --no-save --ignore-scripts --progress=false
npm install --save-dev ts-prune @playwright/test tsx
if [ ! -f .env ]; then
  echo "❌ .env file missing! Create .env before running diagnostics."
  exit 1
fi
REQUIRED_VARS=(SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY)
for var in "${REQUIRED_VARS[@]}"; do
  if ! grep -q "^$var=" .env; then
    echo "❌ Missing $var in .env"
    exit 1
  fi
done
echo "✅ Diagnostics env setup complete."