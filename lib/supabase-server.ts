// lib/supabase-server.ts
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) {
  throw new Error('EXPO_PUBLIC_SUPABASE_URL is required');
}

// Only require service key in server environments
if (typeof window === 'undefined' && !serviceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required in server environment');
}

// Use anon key as fallback in browser environments
const key = serviceKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabaseServer = createClient(url, key, {
  auth: { persistSession: false },
});
