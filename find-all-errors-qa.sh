#!/bin/bash

echo "🔍 Simple Error Hunter That Actually Works"
echo "========================================="

# Setup
rm -rf .error-hunt
mkdir -p .error-hunt

# Function to run and capture errors
hunt_errors() {
    local stage=$1
    local description=$2
    
    echo -e "\n>>> Stage $stage: $description"
    echo "================================"
    
    # Create stage directory
    mkdir -p .error-hunt/stage-$stage
    
    # Run TypeScript check and CAPTURE OUTPUT
    echo "Running tsc..."
    npx tsc --noEmit --skipLibCheck > .error-hunt/stage-$stage/tsc.out 2>&1
    
    # Run build and CAPTURE OUTPUT
    echo "Running build..."
    npm run build > .error-hunt/stage-$stage/build.out 2>&1
    
    # Show what we found
    echo -e "\nTypeScript errors:"
    grep -E "error TS|\.tsx?.*:" .error-hunt/stage-$stage/tsc.out | head -10 || echo "None found (or tsc passed)"
    
    echo -e "\nBuild errors:"
    grep -A3 -B3 "Type error:\|Failed to compile" .error-hunt/stage-$stage/build.out | head -20 || echo "None found (or build passed)"
    
    # Log everything
    {
        echo -e "\n=== STAGE $stage: $description ==="
        echo "TypeScript output:"
        cat .error-hunt/stage-$stage/tsc.out
        echo -e "\nBuild output:"
        cat .error-hunt/stage-$stage/build.out
    } >> .error-hunt/all-errors.log
}

# STAGE 1: Current state
hunt_errors 1 "Initial state with all files"

# STAGE 2: Remove syntax error files
echo -e "\n>>> Removing syntax error files..."
mv archive/lib/styles/themes/activity-theme.ts archive/lib/styles/themes/activity-theme.ts.bak2 2>/dev/null || true
mv archive/hooks/test-utilities/hook-error-scanner.ts archive/hooks/test-utilities/hook-error-scanner.ts.bak2 2>/dev/null || true
hunt_errors 2 "After removing archived syntax errors"

# STAGE 3: Remove bulk-upload
echo -e "\n>>> Removing bulk-upload..."
mv app/components/shared/bulk-upload-interface.tsx app/components/shared/bulk-upload-interface.tsx.bak2 2>/dev/null || true
hunt_errors 3 "After removing bulk-upload"

# STAGE 4: Remove teacher-home (new error!)
echo -e "\n>>> Removing teacher-home..."
mv app/\(tabs\)/teacher-home.tsx app/\(tabs\)/teacher-home.tsx.bak2 2>/dev/null || true
hunt_errors 4 "After removing teacher-home"

# STAGE 5: Check individual components
echo -e "\n>>> Checking individual components..."
for file in app/components/shared/*.tsx; do
    [ -f "$file" ] || continue
    echo -n "Checking $(basename $file)... "
    if npx tsc --noEmit --skipLibCheck "$file" > /tmp/check.out 2>&1; then
        echo "OK"
    else
        echo "ERRORS:"
        grep -E "error|Error" /tmp/check.out | head -3
    fi
done >> .error-hunt/component-check.log 2>&1

# Restore everything
echo -e "\n>>> Restoring all files..."
find . -name "*.bak2" | while read f; do
    mv "$f" "${f%.bak2}"
done

# Final report
echo -e "\n=== FINAL REPORT ==="
echo "All outputs saved in .error-hunt/"
echo "Key files:"
echo "  - all-errors.log: Complete log of all stages"
echo "  - stage-*/: Individual stage outputs"
echo "  - component-check.log: Individual component errors"

# Show summary
echo -e "\nSummary of errors found:"
grep -h "Type error:\|error TS" .error-hunt/stage-*/build.out .error-hunt/stage-*/tsc.out 2>/dev/null | cut -d: -f1-2 | sort -u | head -20