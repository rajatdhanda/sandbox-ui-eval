#!/bin/bash
echo "🔧 Applying common fixes..."

# Fix 1: Bulk upload optional chaining
if [ -f "app/components/shared/bulk-upload-interface.tsx" ]; then
    echo "Fixing bulk-upload-interface.tsx..."
    sed -i.bak 's/config\.sampleData\.map/config.sampleData?.map/g' app/components/shared/bulk-upload-interface.tsx
fi

# Fix 2: Archive syntax error files
echo "Moving syntax error files to archive..."
mkdir -p archive/lib/styles/themes
mkdir -p archive/hooks/test-utilities
[ -f "lib/styles/themes/activity-theme.ts" ] && mv lib/styles/themes/activity-theme.ts archive/lib/styles/themes/
[ -f "hooks/test-utilities/hook-error-scanner.ts" ] && mv hooks/test-utilities/hook-error-scanner.ts archive/hooks/test-utilities/

echo "✅ Fixes applied!"
