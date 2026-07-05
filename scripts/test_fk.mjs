import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nvenvuikepbjtgakasog.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52ZW52dWlrZXBianRnYWthc29nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5NzM2NzAsImV4cCI6MjA5ODU0OTY3MH0.cQDjgDxPihczXMY1dHS9Uvl06ggJhbRlOdP0mmilekg';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function test() {
  const { data, error } = await supabase
    .from('workspaces')
    .select('id, users!public_users_workspace_id_fkey(id)')
    .limit(1);
    
  console.log('Result 1:', error ? error.message : 'Success');
  
  const { data: d2, error: e2 } = await supabase
    .from('workspaces')
    .select('id, users!users_workspace_id_fkey(id)')
    .limit(1);
    
  console.log('Result 2:', e2 ? e2.message : 'Success');
}

test();
