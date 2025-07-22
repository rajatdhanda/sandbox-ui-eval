#!/bin/bash
set -e
bash diagnostics/scripts/setup-diagnostics-env.sh

npx tsx diagnostics/core/health-check.ts
npx tsx diagnostics/core/file-usage-map.ts
bash diagnostics/core/dead-code-check.sh
npx tsx diagnostics/core/crud-check.ts
npx tsx diagnostics/core/duplicate-data-check.ts
npx tsx diagnostics/core/recent-errors-log-check.ts
npx tsx diagnostics/core/enum-consistency-check.ts
npx tsx diagnostics/deep/event-logging-coverage.ts
npx tsx diagnostics/scripts/build-diagnostics-summary.ts
echo "=== Always diagnostics complete ==="