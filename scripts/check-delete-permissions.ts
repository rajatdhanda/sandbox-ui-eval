// scripts/check-delete-permissions.ts
// Path: scripts/check-delete-permissions.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkDeletePermissions() {
  console.log('🔍 Checking delete permissions and RLS policies...\n');
  
  const tables = ['classes', 'users', 'children', 'curriculum_assignments', 'parent_child_relationships'];
  
  for (const table of tables) {
    console.log(`\n📋 Checking ${table} table:`);
    console.log('----------------------------------------');
    
    try {
      // First, check if table has is_active column
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_schema', 'public')
        .eq('table_name', table);
      
      const hasIsActive = columns?.some(col => col.column_name === 'is_active');
      console.log(`✓ Has is_active column: ${hasIsActive ? 'YES' : 'NO'}`);
      
      // Try to create a test record
      const testData = {
        id: '00000000-0000-0000-0000-000000000001',
        created_at: new Date().toISOString(),
        ...(hasIsActive && { is_active: true })
      };
      
      // Add table-specific required fields
      switch (table) {
        case 'classes':
          Object.assign(testData, { name: 'Test Class', age_group: '3-4' });
          break;
        case 'users':
          Object.assign(testData, { email: 'test@example.com', role: 'parent', full_name: 'Test User' });
          break;
        case 'children':
          Object.assign(testData, { first_name: 'Test', last_name: 'Child', date_of_birth: '2020-01-01' });
          break;
        case 'curriculum_assignments':
          Object.assign(testData, {
            curriculum_id: '00000000-0000-0000-0000-000000000002',
            class_id: '00000000-0000-0000-0000-000000000003',
            start_date: '2025-01-01'
          });
          break;
        case 'parent_child_relationships':
          Object.assign(testData, {
            parent_id: '00000000-0000-0000-0000-000000000004',
            child_id: '00000000-0000-0000-0000-000000000005',
            relationship_type: 'parent'
          });
          break;
      }
      
      // Test INSERT
      const { error: insertError } = await supabase
        .from(table)
        .insert(testData)
        .select()
        .single();
      
      if (insertError) {
        console.log(`✗ INSERT failed: ${insertError.message}`);
      } else {
        console.log('✓ INSERT successful');
        
        // Test UPDATE (soft delete)
        if (hasIsActive) {
          const { error: updateError } = await supabase
            .from(table)
            .update({ is_active: false })
            .eq('id', testData.id);
          
          if (updateError) {
            console.log(`✗ UPDATE (soft delete) failed: ${updateError.message}`);
          } else {
            console.log('✓ UPDATE (soft delete) successful');
          }
        }
        
        // Test DELETE (hard delete)
        const { error: deleteError } = await supabase
          .from(table)
          .delete()
          .eq('id', testData.id);
        
        if (deleteError) {
          console.log(`✗ DELETE (hard delete) failed: ${deleteError.message}`);
        } else {
          console.log('✓ DELETE (hard delete) successful');
        }
      }
      
      // Check RLS policies
      const { data: policies, error: policiesError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', table);
      
      if (policies && policies.length > 0) {
        console.log(`\n📜 RLS Policies for ${table}:`);
        policies.forEach(policy => {
          console.log(`  - ${policy.policyname}: ${policy.cmd} (${policy.permissive ? 'PERMISSIVE' : 'RESTRICTIVE'})`);
        });
      } else {
        console.log(`\n⚠️  No RLS policies found for ${table}`);
      }
      
    } catch (error) {
      console.error(`💥 Unexpected error checking ${table}:`, error);
    }
  }
  
  console.log('\n\n🔍 Checking system_logs table specifically...');
  try {
    // Check if we can delete from system_logs
    const { error: logsDeleteError } = await supabase
      .from('system_logs')
      .delete()
      .eq('id', '00000000-0000-0000-0000-000000000099');
    
    if (logsDeleteError) {
      console.log(`✗ Cannot delete from system_logs: ${logsDeleteError.message}`);
    } else {
      console.log('✓ Can delete from system_logs');
    }
  } catch (error) {
    console.error('💥 Error checking system_logs:', error);
  }
}

// Run the check
checkDeletePermissions();