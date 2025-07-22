#!/bin/bash

echo "🔍 Advanced TypeScript Error Analyzer"
echo "===================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Create analysis directory
mkdir -p .ts-analysis

# Run TypeScript compiler and capture all errors
echo -e "\n${YELLOW}Collecting all TypeScript errors...${NC}"
npx tsc --noEmit --skipLibCheck 2>&1 > .ts-analysis/all-errors.txt

# Extract just the error lines
grep "error TS" .ts-analysis/all-errors.txt > .ts-analysis/errors-only.txt

# Count total errors
TOTAL_ERRORS=$(wc -l < .ts-analysis/errors-only.txt)
echo -e "${RED}Total errors: $TOTAL_ERRORS${NC}"

# Analyze error codes
echo -e "\n${BLUE}=== ERROR CODE ANALYSIS ===${NC}"
echo -e "${CYAN}Error Code Distribution:${NC}"
grep -o "error TS[0-9]*" .ts-analysis/errors-only.txt | sort | uniq -c | sort -nr | while read count code; do
    case $code in
        *"TS1005"*) desc="Missing or unexpected token (syntax error)" ;;
        *"TS1109"*) desc="Expression expected" ;;
        *"TS2339"*) desc="Property does not exist" ;;
        *"TS2345"*) desc="Type not assignable" ;;
        *"TS7006"*) desc="Parameter implicitly has 'any' type" ;;
        *"TS2531"*) desc="Object is possibly 'null'" ;;
        *"TS2532"*) desc="Object is possibly 'undefined'" ;;
        *"TS2322"*) desc="Type assignment error" ;;
        *) desc="Other error" ;;
    esac
    printf "   %-12s %3d errors - %s\n" "$code:" "$count" "$desc"
done

# Group by file
echo -e "\n${BLUE}=== FILES WITH MOST ERRORS ===${NC}"
cut -d: -f1 .ts-analysis/errors-only.txt | sort | uniq -c | sort -nr | head -10 | while read count file; do
    printf "   %3d errors: %s\n" "$count" "$file"
done

# Analyze syntax errors (TS1005, TS1109)
echo -e "\n${BLUE}=== SYNTAX ERROR ANALYSIS ===${NC}"
SYNTAX_ERRORS=$(grep -E "TS1005|TS1109" .ts-analysis/errors-only.txt | wc -l)
if [ $SYNTAX_ERRORS -gt 0 ]; then
    echo -e "${RED}Found $SYNTAX_ERRORS syntax errors!${NC}"
    echo -e "\n${YELLOW}Files with syntax errors:${NC}"
    grep -E "TS1005|TS1109" .ts-analysis/errors-only.txt | cut -d: -f1 | sort -u | while read file; do
        echo "   $file"
        # Show specific lines with errors
        grep "$file" .ts-analysis/errors-only.txt | grep -E "TS1005|TS1109" | head -3 | sed 's/^/      /'
    done
    
    echo -e "\n${GREEN}Common causes of syntax errors:${NC}"
    echo "   - Unclosed brackets or parentheses"
    echo "   - Missing semicolons"
    echo "   - Incorrect JSX/TSX syntax"
    echo "   - Template literal issues"
fi

# Deep dive into specific problematic files
echo -e "\n${BLUE}=== DEEP ANALYSIS OF PROBLEMATIC FILES ===${NC}"

# Check activity-theme.ts specifically
if grep -q "activity-theme.ts" .ts-analysis/errors-only.txt; then
    echo -e "\n${MAGENTA}lib/styles/themes/activity-theme.ts analysis:${NC}"
    THEME_ERRORS=$(grep "activity-theme.ts" .ts-analysis/errors-only.txt | wc -l)
    echo "   Total errors: $THEME_ERRORS"
    echo "   Error pattern: Multiple syntax errors on lines 162-168"
    echo -e "   ${GREEN}Likely issue:${NC} Malformed template literals or JSX syntax"
    echo -e "   ${GREEN}Action:${NC} Check for unclosed brackets or quotes around these lines"
fi

# Check bulk-upload-interface.tsx
if grep -q "bulk-upload-interface.tsx" .ts-analysis/errors-only.txt; then
    echo -e "\n${MAGENTA}app/components/shared/bulk-upload-interface.tsx analysis:${NC}"
    BULK_ERRORS=$(grep "bulk-upload-interface.tsx" .ts-analysis/errors-only.txt)
    echo "$BULK_ERRORS" | head -3 | sed 's/^/   /'
    echo -e "   ${GREEN}Fix suggestion:${NC} Add optional chaining or type guards"
fi

# Generate automated fixes for common patterns
echo -e "\n${BLUE}=== AUTOMATED FIX SUGGESTIONS ===${NC}"

# For files in app directory only (production code)
echo -e "\n${CYAN}Production files needing fixes:${NC}"
grep "^app/" .ts-analysis/errors-only.txt | cut -d: -f1 | sort -u > .ts-analysis/app-errors.txt
APP_ERROR_COUNT=$(wc -l < .ts-analysis/app-errors.txt)
echo "   Files in app/ with errors: $APP_ERROR_COUNT"

# Check if we should just exclude more files
if [ $APP_ERROR_COUNT -lt 5 ]; then
    echo -e "\n${GREEN}Quick fix: Since only $APP_ERROR_COUNT app files have errors, consider:${NC}"
    cat .ts-analysis/app-errors.txt | while read file; do
        echo "   - Fix errors in: $file"
        grep "$file" .ts-analysis/errors-only.txt | head -2 | sed 's/^/     /'
    done
else
    echo -e "\n${YELLOW}Many files have errors. Consider fixing in batches.${NC}"
fi

# Create actionable report
cat > .ts-analysis/action-plan.md << EOF
# TypeScript Error Action Plan

Generated: $(date)

## Priority Actions

### 1. Fix Syntax Errors First (${SYNTAX_ERRORS} errors)
These are blocking compilation and must be fixed:

$(grep -E "TS1005|TS1109" .ts-analysis/errors-only.txt | cut -d: -f1 | sort -u | head -5 | sed 's/^/- /')

### 2. Fix Production Code (app/ directory)
$(cat .ts-analysis/app-errors.txt | head -10 | sed 's/^/- /')

### 3. Consider Moving/Archiving
Files outside app/ with many errors could be moved to archive:
$(grep -v "^app/" .ts-analysis/errors-only.txt | cut -d: -f1 | sort | uniq -c | sort -nr | head -5 | awk '{print "- " $2 " (" $1 " errors)"}')

## Specific Fixes

### For syntax errors in activity-theme.ts:
\`\`\`bash
# Check lines 162-168 for unclosed brackets
sed -n '160,170p' lib/styles/themes/activity-theme.ts
\`\`\`

### For bulk-upload-interface.tsx:
\`\`\`typescript
// Add optional chaining
const rows = config.sampleData?.map(row => ...) || [];
\`\`\`

## Command to run after fixes:
\`\`\`bash
npm run build
\`\`\`
EOF

# Summary
echo -e "\n${GREEN}=== SUMMARY ===${NC}"
echo -e "Total errors: ${RED}$TOTAL_ERRORS${NC}"
echo -e "Syntax errors: ${RED}$SYNTAX_ERRORS${NC} (must fix first!)"
echo -e "Files affected: $(cut -d: -f1 .ts-analysis/errors-only.txt | sort -u | wc -l)"
echo -e "\nReports generated:"
echo "   - Full errors: .ts-analysis/all-errors.txt"
echo "   - Action plan: .ts-analysis/action-plan.md"

# Specific recommendation for current situation
echo -e "\n${YELLOW}=== IMMEDIATE RECOMMENDATION ===${NC}"
if [ $SYNTAX_ERRORS -gt 10 ]; then
    echo -e "${RED}High number of syntax errors detected!${NC}"
    echo "1. Fix syntax errors in lib/styles/themes/activity-theme.ts first"
    echo "2. These are likely caused by malformed code around lines 162-168"
    echo "3. After fixing syntax errors, re-run this script"
else
    echo "1. Fix the bulk-upload-interface.tsx error with optional chaining"
    echo "2. Then handle remaining type errors one by one"
fi

# Option to view specific file
echo -e "\n${CYAN}Showing first syntax error file:${NC}"
FIRST_SYNTAX_FILE=$(grep -E "TS1005|TS1109" .ts-analysis/errors-only.txt | head -1 | cut -d: -f1)
if [ -n "$FIRST_SYNTAX_FILE" ]; then
    echo "File: $FIRST_SYNTAX_FILE"
    echo "Lines with errors:"
    grep "$FIRST_SYNTAX_FILE" .ts-analysis/errors-only.txt | grep -E "TS1005|TS1109" | cut -d: -f2 | sort -u | head -5 | sed 's/^/   Line /'
fi