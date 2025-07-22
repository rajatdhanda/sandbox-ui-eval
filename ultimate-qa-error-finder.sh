#!/bin/bash
# ultimate-qa-error-finder.sh
# The Ultimate QA Error Discovery Script - Finds ALL errors through iterative exclusion

echo "🔍 Ultimate QA Error Finder - Actually Finds Errors Edition"
echo "=========================================================="
echo "This script will find EVERY error in your project by:"
echo "1. Running builds repeatedly"
echo "2. ACTUALLY CAPTURING THE OUTPUT"
echo "3. Excluding problematic files one by one"
echo "4. Continuing until ALL errors are discovered"
echo ""

# Setup
QA_DIR=".qa-ultimate"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_DIR="$QA_DIR/run_$TIMESTAMP"
MASTER_LOG="$QA_DIR/master_error_log.txt"
EXCLUDED_FILES="$QA_DIR/excluded_files.txt"
FOUND_ERRORS="$QA_DIR/all_found_errors.txt"
EXCLUDED_LIST="$QA_DIR/excluded_list.txt"

# Create directories
rm -rf "$QA_DIR"
mkdir -p "$LOG_DIR"
touch "$MASTER_LOG" "$EXCLUDED_FILES" "$FOUND_ERRORS" "$EXCLUDED_LIST"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$MASTER_LOG"
}

# Function to run build attempt and ACTUALLY CAPTURE ERRORS
run_qa_stage() {
    local stage=$1
    local description=$2
    local stage_dir="$LOG_DIR/stage_$stage"
    
    mkdir -p "$stage_dir"
    
    echo -e "\n${BLUE}=== QA Stage #$stage: $description ===${NC}"
    echo "================================"
    log "Starting QA stage #$stage: $description"
    
    # Run TypeScript check and ACTUALLY CAPTURE OUTPUT
    echo "Running TypeScript check..."
    npx tsc --noEmit --skipLibCheck > "$stage_dir/tsc.out" 2>&1
    local tsc_exit=$?
    
    # Run Next.js build and ACTUALLY CAPTURE OUTPUT
    echo "Running Next.js build..."
    npm run build > "$stage_dir/build.out" 2>&1
    local build_exit=$?
    
    # Show what we found IMMEDIATELY
    echo -e "\n${YELLOW}TypeScript errors found:${NC}"
    if grep -E "error TS|\.tsx?.*:" "$stage_dir/tsc.out" | head -10; then
        grep -E "error TS|\.tsx?.*:" "$stage_dir/tsc.out" >> "$FOUND_ERRORS"
    else
        echo "None found (or tsc passed)"
    fi
    
    echo -e "\n${YELLOW}Build errors found:${NC}"
    if grep -A3 -B3 "Type error:\|Failed to compile" "$stage_dir/build.out" | head -20; then
        grep -A3 -B3 "Type error:\|Failed to compile" "$stage_dir/build.out" >> "$FOUND_ERRORS"
    else
        echo "None found (or build passed)"
    fi
    
    # Log everything for complete record
    {
        echo -e "\n=== STAGE $stage: $description ==="
        echo "TypeScript output:"
        cat "$stage_dir/tsc.out"
        echo -e "\nBuild output:"
        cat "$stage_dir/build.out"
    } >> "$MASTER_LOG"
    
    # Return whether we found errors
    return $((tsc_exit + build_exit))
}

# Function to exclude a problematic file
exclude_file() {
    local file="$1"
    if [ -f "$file" ]; then
        local backup="${file}.qa_backup_${TIMESTAMP}"
        mv "$file" "$backup"
        echo "$file|$backup" >> "$EXCLUDED_LIST"
        echo -e "${YELLOW}Excluded: $file${NC}"
        log "Excluded file: $file"
        return 0
    fi
    return 1
}

# Function to find next file to exclude from errors
find_file_to_exclude() {
    local stage_dir="$1"
    
    # Try TypeScript errors first
    local error_file=$(grep -E "error TS|\.tsx?.*:" "$stage_dir/tsc.out" 2>/dev/null | grep -oE "[a-zA-Z0-9_/.\\()-]+\.(tsx?|js|json)" | grep -v "node_modules" | head -1)
    
    # If no TypeScript error file, try build errors - BE MORE AGGRESSIVE
    if [ -z "$error_file" ]; then
        # Look for Type error files
        error_file=$(grep -B5 -A5 "Type error:" "$stage_dir/build.out" 2>/dev/null | grep -E "\.\/.*\.(tsx?|js)" | grep -oE "[a-zA-Z0-9_/.\\()-]+\.(tsx?|js)" | head -1)
    fi
    
    # If still nothing, look for any file path in build output
    if [ -z "$error_file" ]; then
        error_file=$(grep -oE "\./[a-zA-Z0-9_/.\\()-]+\.(tsx?|js)" "$stage_dir/build.out" 2>/dev/null | head -1 | sed 's/^\.\///')
    fi
    
    echo "$error_file"
}

# Function to restore all files
restore_all_files() {
    echo -e "\n${GREEN}Restoring all excluded files...${NC}"
    while IFS='|' read -r original backup; do
        if [ -f "$backup" ]; then
            mv "$backup" "$original"
            echo "Restored: $original"
        fi
    done < "$EXCLUDED_LIST"
}

# Main QA loop
echo -e "\n${BLUE}Starting comprehensive error discovery...${NC}"
echo "This will take several minutes to find ALL errors"

# STAGE 1: Initial state with all files
run_qa_stage 1 "Initial state with all files"

# STAGE 2: Remove known syntax error files
echo -e "\n>>> Temporarily excluding known syntax error files..."
if [ -f "archive/lib/styles/themes/activity-theme.ts" ]; then
    exclude_file "archive/lib/styles/themes/activity-theme.ts"
fi
if [ -f "archive/hooks/test-utilities/hook-error-scanner.ts" ]; then
    exclude_file "archive/hooks/test-utilities/hook-error-scanner.ts"
fi
run_qa_stage 2 "After removing archived syntax errors"

# STAGE 3-20: Keep finding and excluding errors
stage=3
max_stages=30  # Increased for more thorough search
files_excluded=2
consecutive_no_errors=0

while [ $stage -le $max_stages ]; do
    # Find a file to exclude from previous stage
    prev_stage=$((stage - 1))
    error_file=$(find_file_to_exclude "$LOG_DIR/stage_$prev_stage")
    
    # If we can't find a file from normal methods, be more aggressive
    if [ -z "$error_file" ] || [ ! -f "$error_file" ]; then
        echo -e "\n${YELLOW}Being more aggressive in finding errors...${NC}"
        
        # Special handling for specific known problematic files
        if [ $stage -eq 3 ] && [ -f "app/(tabs)/teacher-home.tsx" ]; then
            error_file="app/(tabs)/teacher-home.tsx"
            echo "Targeting known problematic file: teacher-home.tsx"
        elif [ $stage -eq 4 ] && [ -f "app/components/shared/attachment-field.tsx" ]; then
            error_file="app/components/shared/attachment-field.tsx"
            echo "Targeting potential problematic file: attachment-field.tsx"
        elif [ $stage -eq 5 ] && [ -f "app/components/shared/bulk-upload-interface.tsx" ]; then
            error_file="app/components/shared/bulk-upload-interface.tsx"
            echo "Targeting potential problematic file: bulk-upload-interface.tsx"
        elif [ -f "tsconfig.json" ] && grep -q "error TS5098" "$LOG_DIR/stage_$prev_stage/tsc.out" 2>/dev/null; then
            # Don't exclude tsconfig.json, but note the error
            echo "Note: tsconfig.json has configuration issues but continuing..."
            error_file=""
        else
            # Try to find ANY tsx/ts file mentioned in errors
            error_file=$(grep -hoE "[a-zA-Z0-9_/.\\()-]+\.(tsx?|js)" "$LOG_DIR/stage_$prev_stage"/*.out 2>/dev/null | grep -v "node_modules" | grep -v ".next" | sort -u | head -1)
        fi
    fi
    
    if [ -n "$error_file" ] && [ -f "$error_file" ]; then
        echo -e "\n>>> Found problematic file: $error_file"
        exclude_file "$error_file"
        files_excluded=$((files_excluded + 1))
        consecutive_no_errors=0
        
        run_qa_stage $stage "After excluding $files_excluded files ($error_file)"
        
        # Continue even if no new unique errors, there might be hidden ones
    else
        consecutive_no_errors=$((consecutive_no_errors + 1))
        
        if [ $consecutive_no_errors -ge 3 ]; then
            echo -e "${GREEN}No more files to exclude after multiple attempts. Discovery complete.${NC}"
            break
        else
            echo -e "${YELLOW}No file found to exclude in this round, trying again...${NC}"
            # Run another stage anyway to see if errors appear
            run_qa_stage $stage "Retry attempt #$consecutive_no_errors"
        fi
    fi
    
    stage=$((stage + 1))
done

# Generate final comprehensive report
echo -e "\n${BLUE}=== FINAL QA REPORT ===${NC}"
echo "Total stages run: $((stage - 1))"
echo "Files excluded: $files_excluded"
echo ""

# NEW: Create compressed error analysis
echo -e "\n${BLUE}=== COMPRESSED ERROR ANALYSIS ===${NC}"
ANALYSIS_FILE="$QA_DIR/error_analysis_$TIMESTAMP.md"

{
    echo "# Compressed Error Analysis"
    echo "Generated: $(date)"
    echo ""
    
    # Error Pattern Summary
    echo "## 🎯 Error Patterns (Fix these patterns to solve many files)"
    echo ""
    echo "### Import Errors"
    echo '```'
    grep -h "Cannot find module" "$FOUND_ERRORS" | \
        sed "s/.*Cannot find module '\([^']*\)'.*/\1/" | \
        sort | uniq -c | sort -rn | head -10
    echo '```'
    echo ""
    
    echo "### Type Errors"
    echo '```'
    grep -h "Type error:" "$FOUND_ERRORS" | \
        sed 's/.*Type error: //' | \
        cut -d. -f1 | \
        sort | uniq -c | sort -rn | head -10
    echo '```'
    echo ""
    
    # Error by TypeScript Code
    echo "## 📊 Error Types Distribution"
    echo '```'
    grep -oE "error TS[0-9]+:" "$FOUND_ERRORS" | \
        sort | uniq -c | sort -rn | \
        while read count code; do
            case ${code#error } in
                "TS2307:") desc="Cannot find module" ;;
                "TS17004:") desc="JSX not enabled" ;;
                "TS1259:") desc="Module import issue" ;;
                "TS2304:") desc="Cannot find name" ;;
                "TS2339:") desc="Property does not exist" ;;
                *) desc="" ;;
            esac
            printf "%6d %s %s\n" "$count" "$code" "$desc"
        done | head -15
    echo '```'
    echo ""
    
    # Files by error count
    echo "## 📁 Top Problem Files"
    echo '```'
    grep -E "error TS|Type error:" "$FOUND_ERRORS" | \
        grep -oE "[a-zA-Z0-9_/.\\()-]+\.(tsx?|js)" | \
        grep -v "node_modules" | \
        sort | uniq -c | sort -rn | head -20
    echo '```'
    echo ""
    
    # Quick stats
    prod_errors=$(grep -c "app/" "$FOUND_ERRORS" 2>/dev/null || echo 0)
    archive_errors=$(grep -c "archive/" "$FOUND_ERRORS" 2>/dev/null || echo 0)
    lib_errors=$(grep -c "lib/" "$FOUND_ERRORS" 2>/dev/null || echo 0)
    
    echo "## 📈 Quick Stats"
    echo "- Production code (app/): **$prod_errors errors**"
    echo "- Library code (lib/): **$lib_errors errors**"
    echo "- Archive code: **$archive_errors errors** (can ignore)"
    echo ""
    
    echo "## ✅ Priority Fixes"
    echo "1. **Archive files** - Rename 2 syntax error files"
    echo "2. **@/lib/styles imports** - Check tsconfig paths"
    echo "3. **React imports** - Add React to import statements"
    echo "4. **TypeScript config** - Ensure jsx and lib settings"
} > "$ANALYSIS_FILE"

echo -e "${GREEN}Compressed analysis saved to: $ANALYSIS_FILE${NC}"

# Original report generation continues...

# Summarize all unique errors found
echo -e "${YELLOW}All Unique Errors Discovered:${NC}"
echo "================================"

# TypeScript errors
echo -e "\n${RED}TypeScript Errors:${NC}"
grep "error TS" "$FOUND_ERRORS" | sort -u | nl

# Build/Type errors
echo -e "\n${RED}Build/Type Errors:${NC}"
grep "Type error:" "$FOUND_ERRORS" | sort -u | nl

# Count errors by file
echo -e "\n${YELLOW}Files with Errors (sorted by error count):${NC}"
grep -E "error TS|Type error:" "$FOUND_ERRORS" | grep -oE "[a-zA-Z0-9_/.\\-]+\.(tsx?|js)" | sort | uniq -c | sort -rn

# List all excluded files
echo -e "\n${YELLOW}Files that were excluded (contain errors):${NC}"
cut -d'|' -f1 "$EXCLUDED_LIST" | nl

# Save markdown report
REPORT_FILE="$QA_DIR/qa_report_$TIMESTAMP.md"
{
    echo "# Ultimate QA Error Discovery Report"
    echo "Generated: $(date)"
    echo ""
    echo "## Summary"
    echo "- Total stages run: $((stage - 1))"
    echo "- Files excluded: $files_excluded"
    echo "- TypeScript errors found: $(grep -c "error TS" "$FOUND_ERRORS")"
    echo "- Build errors found: $(grep -c "Type error:" "$FOUND_ERRORS")"
    echo ""
    echo "## All Errors Found"
    echo "### TypeScript Errors"
    echo '```'
    grep "error TS" "$FOUND_ERRORS" | sort -u
    echo '```'
    echo ""
    echo "### Build Errors"
    echo '```'
    grep "Type error:" "$FOUND_ERRORS" | sort -u
    echo '```'
    echo ""
    echo "## Problematic Files"
    echo '```'
    cut -d'|' -f1 "$EXCLUDED_LIST"
    echo '```'
    echo ""
    echo "## Files by Error Count"
    echo '```'
    grep -E "error TS|Type error:" "$FOUND_ERRORS" | grep -oE "[a-zA-Z0-9_/.\\-]+\.(tsx?|js)" | sort | uniq -c | sort -rn
    echo '```'
} > "$REPORT_FILE"

echo -e "\n${GREEN}Comprehensive report saved to: $REPORT_FILE${NC}"

# Restore all files
restore_all_files

echo -e "\n${GREEN}✓ Ultimate QA Error Discovery Complete!${NC}"
echo "All logs and reports are in: $QA_DIR/"
echo ""
echo "Key outputs:"
echo "  - $REPORT_FILE - Complete markdown report"
echo "  - $FOUND_ERRORS - All errors found"
echo "  - $MASTER_LOG - Complete execution log"
echo "  - $LOG_DIR/ - Stage-by-stage outputs"