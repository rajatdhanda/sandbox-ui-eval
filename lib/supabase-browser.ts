// lib/supabase-browser.ts
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!url) {
  throw new Error('EXPO_PUBLIC_SUPABASE_URL is required');
}

if (!key) {
  throw new Error('EXPO_PUBLIC_SUPABASE_ANON_KEY is required');
}

export const supabaseBrowser = createClient(url, key, {
  auth: { persistSession: true, detectSessionInUrl: true },
});