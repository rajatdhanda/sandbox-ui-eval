// scripts/check-curriculum-schema.ts
// Path: scripts/check-curriculum-schema.ts

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;




if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables!');
  console.error('Please ensure you have the following in your .env.local file:');
  console.error('EXPO_PUBLIC_SUPABASE_URL=your-supabase-url');
  console.error('SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCurriculumSchema() {
  console.log('🔍 Checking curriculum-related table schemas...\n');
  
  try {
    // Check curriculum_executions table structure
    const { data: columns, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_schema', 'public')
      .eq('table_name', 'curriculum_executions')
      .order('ordinal_position');
    
    if (error) {
      console.error('❌ Error fetching schema:', error);
      return;
    }
    
    console.log('📋 curriculum_executions table structure:');
    console.log('----------------------------------------');
    columns?.forEach(col => {
      console.log(`${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    // Check for required fields
    const requiredFields = ['id', 'curriculum_item_id', 'class_id', 'execution_date', 'completion_status'];
    const columnNames = columns?.map(c => c.column_name) || [];
    
    console.log('\n✅ Required fields check:');
    requiredFields.forEach(field => {
      const exists = columnNames.includes(field);
      console.log(`  ${exists ? '✓' : '✗'} ${field}`);
    });
    
    // Check for optional time fields
    console.log('\n📅 Time-related fields:');
    const timeFields = ['scheduled_time', 'actual_start_time', 'actual_end_time'];
    timeFields.forEach(field => {
      const col = columns?.find(c => c.column_name === field);
      if (col) {
        console.log(`  ✓ ${field}: ${col.data_type} ${col.is_nullable === 'YES' ? '(optional)' : '(required)'}`);
      } else {
        console.log(`  ✗ ${field}: NOT FOUND`);
      }
    });
    
    // Test insert with minimal required fields
    console.log('\n🧪 Testing minimal insert...');
    const testData = {
      curriculum_item_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
      class_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
      execution_date: new Date().toISOString().split('T')[0],
      completion_status: 'scheduled'
    };
    
    const { error: insertError } = await supabase
      .from('curriculum_executions')
      .insert(testData)
      .select()
      .single();
    
    if (insertError) {
      console.log('❌ Insert test failed:', insertError.message);
      console.log('   This might indicate missing required fields or constraints');
    } else {
      console.log('✅ Insert test passed - minimal fields are sufficient');
      
      // Clean up test data
      await supabase
        .from('curriculum_executions')
        .delete()
        .eq('curriculum_item_id', testData.curriculum_item_id);
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the check
checkCurriculumSchema();

// Run this script with: npx tsx scripts/check-curriculum-schema.ts