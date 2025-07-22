#!/bin/bash
# path: diagnostics/test-coverage-report.sh
set -e
echo "=== Running test coverage report ==="
npm install --no-save --ignore-scripts --progress=false
npm run test -- --coverage || echo "Tests failed, but coverage report generated if possible."
echo "=== Test coverage complete ==="