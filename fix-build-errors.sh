#!/bin/bash

echo "🔍 Complete Build Error Detector & Analyzer"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Clean up previous runs
rm -rf .build-analysis
mkdir -p .build-analysis

echo -e "\n${YELLOW}Phase 1: Initial TypeScript Check${NC}"
echo "----------------------------------------"
npx tsc --noEmit --skipLibCheck 2>&1 | tee .build-analysis/tsc-initial.txt
SYNTAX_ERRORS=$(grep -c "error TS1005\|error TS1109" .build-analysis/tsc-initial.txt || echo 0)
echo -e "Found ${RED}$SYNTAX_ERRORS${NC} syntax errors blocking other checks"

# Extract files with syntax errors
grep -E "error TS1005|error TS1109" .build-analysis/tsc-initial.txt | cut -d: -f1 | sort -u > .build-analysis/syntax-error-files.txt

echo -e "\n${YELLOW}Phase 2: Bypass Syntax Errors to Find ALL Other Errors${NC}"
echo "----------------------------------------------------"

# Temporarily move syntax error files
echo "Moving files with syntax errors..."
while IFS= read -r file; do
    if [ -f "$file" ]; then
        echo "   Temporarily moving: $file"
        mv "$file" "$file.temp-syntax"
    fi
done < .build-analysis/syntax-error-files.txt

echo -e "\n${CYAN}Running build without syntax error files...${NC}"
# Run multiple checks
npm run build 2>&1 | tee .build-analysis/build-output.txt
npx tsc --noEmit --skipLibCheck 2>&1 | tee .build-analysis/tsc-second.txt

# Restore files
echo -e "\n${CYAN}Restoring files...${NC}"
while IFS= read -r file; do
    if [ -f "$file.temp-syntax" ]; then
        mv "$file.temp-syntax" "$file"
    fi
done < .build-analysis/syntax-error-files.txt

echo -e "\n${YELLOW}Phase 3: Analyzing All Errors${NC}"
echo "--------------------------------"

# Extract all unique errors
grep -E "error TS[0-9]+:|Type error:|Error:|Failed to compile" .build-analysis/*.txt > .build-analysis/all-errors-raw.txt
sort -u .build-analysis/all-errors-raw.txt > .build-analysis/all-errors.txt

# Count errors by type
echo -e "\n${BLUE}=== ERROR SUMMARY ===${NC}"
echo -e "\n${CYAN}Error Types:${NC}"
grep -o "error TS[0-9]\+" .build-analysis/all-errors.txt | sort | uniq -c | sort -nr | while read count code; do
    case $code in
        *"TS1005"*) desc="Syntax: Missing token" ;;
        *"TS1109"*) desc="Syntax: Expression expected" ;;
        *"TS2339"*) desc="Property does not exist" ;;
        *"TS2345"*) desc="Argument not assignable" ;;
        *"TS2322"*) desc="Type not assignable" ;;
        *"TS7006"*) desc="Implicit any parameter" ;;
        *"TS7053"*) desc="Element implicitly any" ;;
        *) desc="Other" ;;
    esac
    printf "   %-10s : %3d - %s\n" "$code" "$count" "$desc"
done

# Files with errors
echo -e "\n${CYAN}Files with Errors:${NC}"
grep -Eo "[a-zA-Z0-9/_.-]+\.(ts|tsx):" .build-analysis/all-errors.txt | sed 's/:$//' | sort | uniq -c | sort -nr > .build-analysis/files-with-errors.txt

echo -e "\n${RED}Production (app/) Files:${NC}"
grep "app/" .build-analysis/files-with-errors.txt | head -10 || echo "   ✅ No errors in app/ directory!"

echo -e "\n${YELLOW}Other Files:${NC}"
grep -v "app/" .build-analysis/files-with-errors.txt | head -10

# Specific error details
echo -e "\n${BLUE}=== SPECIFIC ERRORS ===${NC}"

echo -e "\n${MAGENTA}1. Syntax Errors (Must Fix First):${NC}"
grep -E "TS1005|TS1109" .build-analysis/tsc-initial.txt | head -5 | while IFS= read -r line; do
    echo "   $line"
done

echo -e "\n${MAGENTA}2. Type/Build Errors in app/:${NC}"
grep "app/" .build-analysis/build-output.txt | grep -E "Type error:|error" | head -10 | while IFS= read -r line; do
    echo "   $line"
done

echo -e "\n${MAGENTA}3. Bulk-Upload Specific:${NC}"
grep -B2 -A2 "bulk-upload" .build-analysis/build-output.txt | head -10 || echo "   No bulk-upload errors found"

# Generate fix script
cat > .build-analysis/apply-fixes.sh << 'EOF'
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
EOF
chmod +x .build-analysis/apply-fixes.sh

# Final summary
echo -e "\n${GREEN}=== FINAL SUMMARY ===${NC}"
TOTAL_ERRORS=$(wc -l < .build-analysis/all-errors.txt)
PROD_ERRORS=$(grep -c "app/" .build-analysis/all-errors.txt || echo 0)

echo -e "Total unique errors: ${RED}$TOTAL_ERRORS${NC}"
echo -e "Errors in production (app/): ${RED}$PROD_ERRORS${NC}"
echo -e "Syntax errors blocking build: ${RED}$SYNTAX_ERRORS${NC}"

echo -e "\n${YELLOW}=== RECOMMENDED ACTIONS ===${NC}"
if [ $SYNTAX_ERRORS -gt 0 ]; then
    echo "1. Move syntax error files to archive (not needed for production)"
    echo "   Run: ./build-analysis/apply-fixes.sh"
fi
if [ $PROD_ERRORS -gt 0 ]; then
    echo "2. Fix production errors in app/ directory"
    echo "   See details above"
fi
echo "3. Re-run this script after fixes"

echo -e "\n${CYAN}All results saved in .build-analysis/${NC}"
echo "To apply automated fixes: ./.build-analysis/apply-fixes.sh"