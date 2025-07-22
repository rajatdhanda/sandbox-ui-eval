#!/bin/bash
set -e
bash diagnostics/scripts/setup-diagnostics-env.sh

npx tsx diagnostics/deep/unused-tables-columns.ts
npx tsx diagnostics/deep/missing-audit-columns.ts
npx tsx diagnostics/deep/missing-indexes.ts
npx tsx diagnostics/deep/missing-soft-delete.ts
npx tsx diagnostics/deep/missing-primary-keys.ts
npx tsx diagnostics/deep/orphaned-foreign-keys.ts
npx tsx diagnostics/deep/not-null-constraint-check.ts
npx tsx diagnostics/deep/column-defaults-check.ts
npx tsx diagnostics/deep/pii-detection-diagnostics.ts
npx tsx diagnostics/deep/row-count-warnings.ts
npx tsx diagnostics/deep/api-error-spike-check.ts
npx tsx diagnostics/deep/crud-action-simulation.ts
bash diagnostics/core/test-coverage-enforce.sh || echo "Coverage check failed"
npx tsx diagnostics/scripts/build-diagnostics-summary.ts
echo "=== Scheduled diagnostics complete ==="