Document 1: Project Instructions
Create docs/project-instructions.md:
markdown# Project Instructions
# Path: docs/project-instructions.md

## Core Development Principles

### 1. File Naming Convention
- Use `x-y.tsx` format (e.g., `class-management.tsx`, `test-delete.tsx`)
- Keep path comment at top of every file: `// Path: app/(tabs)/x-y.tsx`
- NO "enhanced", "improved", "v2" naming - update existing files

### 2. Code Structure Rules
- Target 50-100 lines per file
- Use shared components from `app/components/shared/`
- Reference reusable functions instead of duplicating
- Maintain consistent styling via `lib/styles/index`

### 3. Development Workflow
- One small step at a time
- Clear instructions: what to do, where, how
- Test before moving to next step
- When updating: specify exact location (above/below function X)

### 4. Backend-First Approach
- Robust Supabase connections
- High logging/debugging for proactive issue identification
- Proper CRUD hygiene via `hooks/use-crud`
- Maintain schema sync with `scripts/sync-schema.ts`

### 5. Testing Protocol
Before major changes, especially in shared files:

#### Terminal Tests
```bash
# 1. Test Supabase connection
npx tsx scripts/test-supabase-connection.ts

# 2. Test CRUD operations
npx tsx scripts/test-crud-operations.ts

# 3. Sync schema
npm run sync-schema
Frontend Tests

Use app/(tabs)/test.tsx for UI debugging
Test each CRUD operation (Create, Read, Update, Delete)
Check console logs for errors
Verify data persistence

6. File Organization
app/
  (tabs)/           # All tab pages
  components/
    shared/         # Reusable components
    admin/          # Role-specific (future)
lib/
  styles/          # Centralized styles
  schemas/         # Type definitions
  supabase/
    services/      # Database service
hooks/
  use-crud.ts      # Main CRUD hook
scripts/
  test-*.ts        # Test scripts
  sync-schema.ts   # Schema sync
7. Clean-up Protocol

Delete unused files immediately
Call out files to be deleted in handover
Keep only active test scripts
Remove commented code

8. Module Development

Build as tabs first
Test thoroughly
Assign to user roles later
Keep modular and reusable

9. Critical Files to Maintain

lib/supabase/client.ts - Supabase connection
lib/supabase/services/database.service.ts - CRUD operations
hooks/use-crud.ts - Standardized CRUD hook
app/components/shared/crud-components.tsx - UI components
app/(tabs)/test.tsx - Debug interface

10. Common Issues & Solutions

Delete not working: Check Alert/confirm dialog
Env vars missing: Use both NEXT_PUBLIC_ and EXPO_PUBLIC_
Route not found: Ensure files are in (tabs) directory
State not updating: Check fetchItems() is called after mutations

