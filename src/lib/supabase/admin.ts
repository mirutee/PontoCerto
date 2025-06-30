import { createClient } from '@supabase/supabase-js'
import type { Database } from './models'

// WARNING: This client is for ADMIN-LEVEL a...
// ...
// It should ONLY be used in server-side code (e.g., server actions, API routes).
// NEVER expose this client or the service role key to the browser.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Supabase admin credentials are not set. Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are in your .env file.');
}

export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
