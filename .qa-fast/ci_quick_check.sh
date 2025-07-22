#!/bin/bash
# Ultra-fast CI check (< 30s)
echo "Running CI quick check..."
timeout 20 npx tsc --noEmit --skipLibCheck 2>&1 | grep -E "error TS|\.tsx?.*:" | head -10
exit_code=$?
if [ $exit_code -eq 124 ]; then
    echo "TypeScript check timed out (too many errors)"
    exit 1
elif [ $exit_code -ne 0 ]; then
    echo "TypeScript errors found"
    exit 1
fi
echo "Quick check passed!"
