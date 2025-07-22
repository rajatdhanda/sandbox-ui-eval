#!/bin/bash
# path: diagnostics/run-monitoring-diagnostics.sh

set -e
echo "=== Running Monitoring Diagnostics ==="
npx tsx diagnostics/unused-tables-columns.ts
npx tsx diagnostics/orphaned-foreign-keys.ts
npx tsx diagnostics/missing-indexes.ts
npx tsx diagnostics/missing-audit-columns.ts
npx tsx diagnostics/pii-detection-diagnostics.ts
npx tsx diagnostics/supabase-crud-diagnostics.ts
npx tsx diagnostics/row-count-warnings.ts
npx tsx diagnostics/missing-soft-delete.ts
npx tsx diagnostics/missing-primary-keys.ts
npx tsx diagnostics/permissions-crud-diagnostics.ts
npx tsx diagnostics/crud-action-simulation.ts
npx tsx diagnostics/not-null-constraint-check.ts
npx tsx diagnostics/duplicate-data-check.ts
npx tsx diagnostics/column-defaults-check.ts
npx tsx diagnostics/enum-consistency-check.ts
npx tsx diagnostics/recent-errors-log-check.ts
npx tsx diagnostics/api-error-spike-check.ts
npx tsx diagnostics/event-logging-coverage.ts
echo "=== Monitoring Diagnostics Complete ==="