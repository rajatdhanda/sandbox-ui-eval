#!/bin/bash
set -e
echo "=== Running Run-time Diagnostics ==="
npx tsx diagnostics/health-check.ts
npx tsx diagnostics/file-usage-map.ts
# Add more fast, essential checks here as you build them.
echo "=== Run-time Diagnostics Complete ==="