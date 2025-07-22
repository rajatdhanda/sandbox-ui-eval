#!/bin/bash
set -e
bash diagnostics/scripts/setup-diagnostics-env.sh
npx playwright test diagnostics/frontend/ui-smoke.spec.ts || echo "E2E UI smoke test failures detected"