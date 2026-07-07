import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  // Get workspace id and current user
  const { data: { user } } = await supabase.auth.getUser();
  console.log("Auth user:", user?.id);

  const { data: workspaces } = await supabase.from('workspaces').select('id').limit(1);
  const workspaceId = workspaces[0].id;
  console.log("Workspace:", workspaceId);

  // Get a user from the workspace to use as created_by
  const { data: users } = await supabase.from('users').select('id').eq('workspace_id', workspaceId).limit(1);
  const userId = user?.id || users?.[0]?.id;
  console.log("User ID for created_by:", userId);

  // Try a minimal product insert
  const payload = {
    workspace_id: workspaceId,
    name: "Test Product " + Date.now(),
    price: 500,
    cost: 300,
    stock: 10,
    initial_stock: 10,
    min_stock: 2,
    status: 'Active',
    created_by: userId,
    updated_by: userId
  };

  console.log("Inserting product:", payload);
  const { data, error } = await supabase.from('products').insert(payload).select().single();
  console.log("Error:", error);
  console.log("Data:", data?.id);

  if (data) {
    // Cleanup
    await supabase.from('products').delete().eq('id', data.id);
    console.log("Cleaned up test product.");
  }
}

test().catch(console.error);
