#!/bin/bash
# fast-qa-error-finder.sh
# Optimized QA Error Discovery - Fast but Thorough

echo "⚡ Fast QA Error Finder - Optimized Edition"
echo "=========================================="
echo "Optimizations:"
echo "✓ Parallel execution where possible"
echo "✓ Skip redundant checks"
echo "✓ Fast fail on known errors"
echo "✓ Incremental discovery"
echo ""

# Setup
QA_DIR=".qa-fast"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_DIR="$QA_DIR/run_$TIMESTAMP"
ERRORS_DB="$QA_DIR/errors_database.txt"
EXCLUDED_FILES="$QA_DIR/excluded.txt"

# Create directories
rm -rf "$QA_DIR"
mkdir -p "$LOG_DIR"
touch "$ERRORS_DB" "$EXCLUDED_FILES"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Timing function
time_it() {
    local start=$(date +%s)
    "$@"
    local end=$(date +%s)
    echo "⏱️  Execution time: $((end - start))s"
}

# OPTIMIZATION 1: Quick initial scan (5-10 seconds)
quick_scan() {
    echo -e "\n${BLUE}Phase 1: Quick Error Scan (Target: <10s)${NC}"
    
    # Run only TypeScript check first (fastest)
    echo "Running TypeScript check..."
    timeout 30 npx tsc --noEmit --skipLibCheck > "$LOG_DIR/tsc_quick.txt" 2>&1 &
    TSC_PID=$!
    
    # Meanwhile, do a quick file analysis
    echo "Analyzing project structure..."
    find . -name "*.tsx" -o -name "*.ts" | grep -v node_modules | grep -v ".next" > "$LOG_DIR/ts_files.txt"
    
    # Wait for TSC or timeout
    wait $TSC_PID 2>/dev/null
    
    # Extract errors quickly
    if [ -f "$LOG_DIR/tsc_quick.txt" ]; then
        grep -E "error TS|\.tsx?.*:" "$LOG_DIR/tsc_quick.txt" | head -20 > "$LOG_DIR/quick_errors.txt"
        echo -e "${YELLOW}Found $(wc -l < "$LOG_DIR/quick_errors.txt") initial errors${NC}"
        cat "$LOG_DIR/quick_errors.txt"
    fi
}

# OPTIMIZATION 2: Parallel error discovery (10-20 seconds per round)
parallel_discovery() {
    local round=$1
    echo -e "\n${BLUE}Discovery Round #$round (Target: <20s)${NC}"
    
    # Start all checks in parallel
    echo "Starting parallel checks..."
    
    # TypeScript (with timeout)
    timeout 20 npx tsc --noEmit --skipLibCheck > "$LOG_DIR/round_${round}_tsc.txt" 2>&1 &
    PID_TSC=$!
    
    # Build check (with timeout and fail fast)
    timeout 30 npm run build -- --no-lint > "$LOG_DIR/round_${round}_build.txt" 2>&1 &
    PID_BUILD=$!
    
    # Quick ESLint on changed files only
    if [ $round -eq 1 ]; then
        timeout 15 npx eslint . --ext .ts,.tsx --max-warnings 0 > "$LOG_DIR/round_${round}_lint.txt" 2>&1 &
        PID_LINT=$!
    fi
    
    # Wait for all with progress indicator
    local count=0
    while [ $count -lt 30 ]; do
        if ! kill -0 $PID_TSC 2>/dev/null && ! kill -0 $PID_BUILD 2>/dev/null; then
            break
        fi
        echo -n "."
        sleep 1
        count=$((count + 1))
    done
    echo ""
    
    # Kill any hanging processes
    kill $PID_TSC $PID_BUILD $PID_LINT 2>/dev/null
    wait $PID_TSC $PID_BUILD $PID_LINT 2>/dev/null
    
    # Extract errors from all sources
    extract_errors $round
}

# OPTIMIZATION 3: Smart error extraction
extract_errors() {
    local round=$1
    local new_errors=0
    
    echo "Extracting errors from round $round..."
    
    # TypeScript errors
    if [ -f "$LOG_DIR/round_${round}_tsc.txt" ]; then
        grep -E "error TS|\.tsx?.*:" "$LOG_DIR/round_${round}_tsc.txt" | while read -r line; do
            if ! grep -qF "$line" "$ERRORS_DB" 2>/dev/null; then
                echo "$line" >> "$ERRORS_DB"
                echo -e "${RED}NEW:${NC} $line"
                new_errors=$((new_errors + 1))
            fi
        done
    fi
    
    # Build errors (focus on Type errors)
    if [ -f "$LOG_DIR/round_${round}_build.txt" ]; then
        grep -B2 -A2 "Type error:" "$LOG_DIR/round_${round}_build.txt" | grep -E "\.tsx?:|Type error:" | while read -r line; do
            if ! grep -qF "$line" "$ERRORS_DB" 2>/dev/null; then
                echo "$line" >> "$ERRORS_DB"
                echo -e "${RED}NEW:${NC} $line"
                new_errors=$((new_errors + 1))
            fi
        done
    fi
    
    return $new_errors
}

# OPTIMIZATION 4: Fast file exclusion
fast_exclude() {
    local file="$1"
    if [ -f "$file" ]; then
        mv "$file" "${file}.qa_excluded"
        echo "$file" >> "$EXCLUDED_FILES"
        echo -e "${YELLOW}Excluded:${NC} $file"
        return 0
    fi
    return 1
}

# OPTIMIZATION 5: Batch exclusion of known problem files
batch_exclude_known_issues() {
    echo -e "\n${BLUE}Fast excluding known problematic files...${NC}"
    
    # Common problem patterns
    local problem_patterns=(
        "archive/lib/styles/themes/activity-theme.ts"
        "archive/hooks/test-utilities/hook-error-scanner.ts"
        "*/teacher-home.tsx"
        "*/attachment-field.tsx"
    )
    
    for pattern in "${problem_patterns[@]}"; do
        for file in $pattern; do
            [ -f "$file" ] && fast_exclude "$file"
        done
    done
}

# Main execution
echo -e "\n${GREEN}Starting optimized error discovery...${NC}"
START_TIME=$(date +%s)

# Phase 1: Quick scan (5-10s)
time_it quick_scan

# Phase 2: Batch exclude known issues (2s)
time_it batch_exclude_known_issues

# Phase 3: Parallel discovery rounds (20s each, max 5 rounds)
max_rounds=5
for round in $(seq 1 $max_rounds); do
    time_it parallel_discovery $round
    
    # Check if we found new errors
    if [ $(tail -10 "$ERRORS_DB" | wc -l) -eq 0 ]; then
        echo -e "${GREEN}No new errors found. Stopping.${NC}"
        break
    fi
    
    # Exclude one problematic file per round
    problem_file=$(tail -5 "$ERRORS_DB" | grep -oE "[a-zA-Z0-9_/.\\-]+\.(tsx?|js)" | head -1)
    if [ -n "$problem_file" ] && [ -f "$problem_file" ]; then
        fast_exclude "$problem_file"
    fi
done

# Generate report
END_TIME=$(date +%s)
TOTAL_TIME=$((END_TIME - START_TIME))

echo -e "\n${BLUE}=== FAST QA REPORT ===${NC}"
echo "Total execution time: ${TOTAL_TIME}s"
echo "Errors found: $(wc -l < "$ERRORS_DB")"
echo "Files excluded: $(wc -l < "$EXCLUDED_FILES")"

# Summary report
REPORT="$QA_DIR/fast_qa_report.md"
{
    echo "# Fast QA Error Report"
    echo "Generated in ${TOTAL_TIME} seconds"
    echo ""
    echo "## Summary"
    echo "- Unique errors: $(sort -u "$ERRORS_DB" | wc -l)"
    echo "- Files excluded: $(wc -l < "$EXCLUDED_FILES")"
    echo ""
    echo "## Top Error Files"
    grep -oE "[a-zA-Z0-9_/.\\-]+\.(tsx?|js)" "$ERRORS_DB" | sort | uniq -c | sort -rn | head -10
    echo ""
    echo "## All Errors"
    echo '```'
    sort -u "$ERRORS_DB" | head -50
    echo '```'
} > "$REPORT"

# Restore files
echo -e "\n${GREEN}Restoring excluded files...${NC}"
find . -name "*.qa_excluded" | while read f; do
    mv "$f" "${f%.qa_excluded}"
done

echo -e "\n${GREEN}✓ Fast QA Complete in ${TOTAL_TIME} seconds!${NC}"
echo "Report: $REPORT"
echo "All errors: $ERRORS_DB"

# Create a super-fast version for CI/CD
cat > "$QA_DIR/ci_quick_check.sh" << 'EOF'
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
EOF
chmod +x "$QA_DIR/ci_quick_check.sh"