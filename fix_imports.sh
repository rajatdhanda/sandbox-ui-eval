#!/bin/bash

# Fix Supabase Imports Script
echo "🔧 Fixing all Supabase imports..."

# 1. Replace all supabase-browser imports
echo "📝 Updating import statements..."
find components/ -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|from '\''@/lib/supabase-browser'\'';|from '\''@/lib/supabase/client'\'';|g'
find components/ -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|from '\''.*lib/supabase-browser'\'';|from '\''@/lib/supabase/client'\'';|g'

# 2. Replace supabaseBrowser as supabase pattern
find components/ -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|import { supabaseBrowser as supabase }|import { supabase }|g'

# 3. Fix specific client imports - replace with just supabase import
echo "🔄 Fixing client usage patterns..."

# Replace various client import patterns
find components/ -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|import { [^}]*Client[^}]* } from.*supabase.*|import { supabase } from '\''@/lib/supabase/client'\'';|g'

# 4. Fix specific usage patterns in files
echo "⚙️  Fixing specific files..."

# AdminDashboard-original.tsx
sed -i '' 's|usersClient()|supabase.from('\''users'\'')|g' components/admin/AdminDashboard-original.tsx
sed -i '' 's|childrenClient()|supabase.from('\''children'\'')|g' components/admin/AdminDashboard-original.tsx
sed -i '' 's|classesClient()|supabase.from('\''classes'\'')|g' components/admin/AdminDashboard-original.tsx

# Create a more comprehensive replacement script for all client patterns
echo "🎯 Applying comprehensive client pattern fixes..."

# List of all table clients that need to be replaced
tables=("users" "children" "classes" "attendance" "dailyLogs" "photos" "photoTags" "parentChildRelationships" "classAssignments" "curriculumAssignments" "curriculumTemplates" "curriculumItems" "curriculumExecutions" "curriculumImports" "timeSlots" "notifications" "events" "milestones")

for table in "${tables[@]}"; do
    # Convert camelCase to snake_case for table names
    snake_case=$(echo "$table" | sed 's/\([A-Z]\)/_\1/g' | tr '[:upper:]' '[:lower:]' | sed 's/^_//')
    
    # Replace client calls
    find components/ -name "*.tsx" -o -name "*.ts" | xargs sed -i '' "s|${table}Client()|supabase.from('${snake_case}')|g"
done

# Special cases for tables with different naming
find components/ -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|daily_logsClient()|supabase.from('\''daily_logs'\'')|g'
find components/ -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|photo_tagsClient()|supabase.from('\''photo_tags'\'')|g'
find components/ -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|parent_child_relationshipsClient()|supabase.from('\''parent_child_relationships'\'')|g'
find components/ -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|class_assignmentsClient()|supabase.from('\''class_assignments'\'')|g'
find components/ -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|curriculum_assignmentsClient()|supabase.from('\''curriculum_assignments'\'')|g'
find components/ -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|curriculum_templatesClient()|supabase.from('\''curriculum_templates'\'')|g'
find components/ -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|curriculum_itemsClient()|supabase.from('\''curriculum_items'\'')|g'
find components/ -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|curriculum_executionsClient()|supabase.from('\''curriculum_executions'\'')|g'
find components/ -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|curriculum_importsClient()|supabase.from('\''curriculum_imports'\'')|g'
find components/ -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|time_slotsClient()|supabase.from('\''time_slots'\'')|g'

echo "✅ Import fixes complete!"
echo "🧪 Run 'npm run dev' to test the changes"