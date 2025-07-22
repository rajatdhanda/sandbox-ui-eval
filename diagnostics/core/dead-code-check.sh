#!/bin/bash
# path: diagnostics/dead-code-check.sh
set -e
echo "=== Checking for unused TypeScript exports (dead code) ==="
npx ts-prune || echo "ts-prune not installed; run 'npm install --save-dev ts-prune'"
echo "=== Dead code check complete ==="