# TypeScript Error Action Plan

Generated: Fri Jul 18 14:56:24 IST 2025

## Priority Actions

### 1. Fix Syntax Errors First (      17 errors)
These are blocking compilation and must be fixed:

- hooks/test-utilities/hook-error-scanner.ts(158,50)
- lib/styles/themes/activity-theme.ts(162,27)
- lib/styles/themes/activity-theme.ts(162,31)
- lib/styles/themes/activity-theme.ts(162,54)
- lib/styles/themes/activity-theme.ts(162,55)

### 2. Fix Production Code (app/ directory)


### 3. Consider Moving/Archiving
Files outside app/ with many errors could be moved to archive:
- lib/styles/themes/activity-theme.ts(168,55) (1 errors)
- lib/styles/themes/activity-theme.ts(168,54) (1 errors)
- lib/styles/themes/activity-theme.ts(168,31) (1 errors)
- lib/styles/themes/activity-theme.ts(168,27) (1 errors)
- lib/styles/themes/activity-theme.ts(166,51) (1 errors)

## Specific Fixes

### For syntax errors in activity-theme.ts:
```bash
# Check lines 162-168 for unclosed brackets
sed -n '160,170p' lib/styles/themes/activity-theme.ts
```

### For bulk-upload-interface.tsx:
```typescript
// Add optional chaining
const rows = config.sampleData?.map(row => ...) || [];
```

## Command to run after fixes:
```bash
npm run build
```
