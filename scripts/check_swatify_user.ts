import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://nvenvuikepbjtgakasog.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52ZW52dWlrZXBianRnYWthc29nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mjk3MzY3MCwiZXhwIjoyMDk4NTQ5NjcwfQ.eyJXK0prf957QfbNLfmT2LRyqDBShi3GBJ252w82tuw';
const supabase = createClient(supabaseUrl, serviceRoleKey);
async function main() {
  const { data: users, error: e1 } = await supabase.from('users').select('*').eq('email', 'swatifylabs@gmail.com');
  console.log('users table:', users, e1);
  const { data: authUsers, error: e2 } = await supabase.auth.admin.listUsers();
  const authUser = authUsers?.users.find(u => u.email === 'swatifylabs@gmail.com');
  console.log('auth user:', authUser ? authUser.id : null, e2);
  
  if (users && users.length > 0) {
     const { data: ws, error: e3 } = await supabase.from('workspaces').select('*').eq('id', users[0].workspace_id);
     console.log('workspaces table:', ws, e3);
     
     // Test the exact query that is failing:
     const { data: joinedData, error: joinError } = await supabase
            .from('users')
            .select(`*, workspaces!inner(id, name, status, is_lifetime, expiry_date)`)
            .eq('id', authUser?.id)
            .maybeSingle();
     console.log('joined query result:', joinedData, joinError);
  }
}
main().catch(console.error);
