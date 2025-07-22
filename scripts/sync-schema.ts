// scripts/sync-schema.ts
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

class SchemaSync {
  private supabase;
  private outputDir = path.resolve(process.cwd(), 'lib/supabase/_generated');

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('🔧 Environment check:');
    console.log(`  - Supabase URL: ${supabaseUrl ? '✅ Found' : '❌ Missing'}`);
    console.log(`  - Service Key: ${serviceKey ? '✅ Found' : '❌ Missing'}`);
    
    if (!supabaseUrl || !serviceKey) {
      console.error('❌ Missing environment variables!');
      console.error('Required variables:');
      console.error('  - NEXT_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_URL');
      console.error('  - SUPABASE_SERVICE_ROLE_KEY');
      console.error('\nMake sure these are in your .env.local or .env file');
      process.exit(1);
    }
    
    this.supabase = createClient(supabaseUrl, serviceKey);
  }

  async sync() {
    console.log('🔄 Starting schema sync...');
    
    try {
      const schema = await this.fetchSchema();
      await this.generateFiles(schema);
      console.log('✅ Schema sync completed successfully!');
      console.log('🔄 Please restart your development server');
    } catch (error) {
      console.error('❌ Schema sync failed:', error);
      process.exit(1);
    }
  }

  private async fetchSchema() {
    console.log('📡 Fetching database schema...');
    
    const { data: tables, error } = await this.supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');

    if (error) throw error;

    const schema = [];
    
    for (const table of tables || []) {
      const { data: columns, error: colError } = await this.supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_schema', 'public')
        .eq('table_name', table.table_name)
        .order('ordinal_position');

      if (colError) continue; // Skip tables we can't access

      schema.push({
        name: table.table_name,
        columns: columns?.map(col => ({
          name: col.column_name,
          type: this.mapType(col.data_type),
          nullable: col.is_nullable === 'YES'
        })) || []
      });
    }

    console.log(`📊 Found ${schema.length} tables`);
    return schema;
  }

  private mapType(pgType: string): string {
    const typeMap: Record<string, string> = {
      'character varying': 'string',
      'varchar': 'string',
      'text': 'string', 
      'uuid': 'string',
      'integer': 'number',
      'bigint': 'number',
      'smallint': 'number',
      'boolean': 'boolean',
      'timestamp with time zone': 'string',
      'timestamp without time zone': 'string',
      'date': 'string',
      'time': 'string',
      'json': 'any',
      'jsonb': 'any'
    };
    return typeMap[pgType] || 'any';
  }

  private toPascalCase(str: string): string {
    return str.replace(/_/g, ' ')
              .replace(/\w\S*/g, txt => txt[0].toUpperCase() + txt.slice(1))
              .replace(/\s+/g, '');
  }

  private async generateFiles(schema: any[]) {
    console.log('🏗️ Generating TypeScript files...');
    
    // Ensure directories exist
    await mkdir(this.outputDir, { recursive: true });
    await mkdir(path.join(this.outputDir, 'clients'), { recursive: true });
    await mkdir(path.join(this.outputDir, 'queries'), { recursive: true });

    // Generate types
    await this.generateTypes(schema);
    
    // Generate clients and queries
    for (const table of schema) {
      await this.generateClient(table);
      await this.generateQueries(table);
    }
    
    // Generate index
    await this.generateIndex(schema);
    
    console.log(`📁 Generated files for ${schema.length} tables`);
  }

  private async generateTypes(schema: any[]) {
    let content = `// AUTO-GENERATED TYPES - ${new Date().toISOString()}\n`;
    content += `export * from '@supabase/supabase-js';\n\n`;

    for (const table of schema) {
      const typeName = this.toPascalCase(table.name);
      content += `export interface ${typeName} {\n`;
      
      for (const col of table.columns) {
        const optional = col.nullable ? '?' : '';
        content += `  ${col.name}${optional}: ${col.type};\n`;
      }
      
      content += `}\n\n`;
    }

    await writeFile(path.join(this.outputDir, 'types.ts'), content);
  }

  private async generateClient(table: any) {
    const content = `// AUTO-GENERATED CLIENT
import { createClient } from '@supabase/supabase-js';

const getClient = () => {
  const isServer = typeof window === 'undefined';
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    isServer 
      ? process.env.SUPABASE_SERVICE_ROLE_KEY!
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

export const ${table.name}Client = () => getClient().from('${table.name}');
`;
    
    await writeFile(
      path.join(this.outputDir, 'clients', `${table.name}.ts`),
      content
    );
  }

  private async generateQueries(table: any) {
    const typeName = this.toPascalCase(table.name);
    const content = `// AUTO-GENERATED QUERIES
import { createClient } from '@supabase/supabase-js';
import type { ${typeName} } from '../types';

const getClient = () => {
  const isServer = typeof window === 'undefined';
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    isServer 
      ? process.env.SUPABASE_SERVICE_ROLE_KEY!
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

export const get${typeName} = () => getClient().from('${table.name}').select('*');
export const insert${typeName} = (data: Partial<${typeName}>) => getClient().from('${table.name}').insert(data);
export const update${typeName} = (id: string, data: Partial<${typeName}>) => getClient().from('${table.name}').update(data).eq('id', id);
export const delete${typeName} = (id: string) => getClient().from('${table.name}').delete().eq('id', id);
`;
    
    await writeFile(
      path.join(this.outputDir, 'queries', `${table.name}.ts`),
      content
    );
  }

  private async generateIndex(schema: any[]) {
    const content = `// AUTO-GENERATED INDEX - ${new Date().toISOString()}
export * from './types';

// Export all clients
${schema.map(table => `export { ${table.name}Client } from './clients/${table.name}';`).join('\n')}

// Export all queries
${schema.map(table => {
  const typeName = this.toPascalCase(table.name);
  return `export { get${typeName}, insert${typeName}, update${typeName}, delete${typeName} } from './queries/${table.name}';`;
}).join('\n')}
`;

    await writeFile(path.join(this.outputDir, 'index.ts'), content);
  }
}

// Execute the sync
const schemaSync = new SchemaSync();
schemaSync.sync().catch(console.error);