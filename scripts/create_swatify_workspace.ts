import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://nvenvuikepbjtgakasog.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52ZW52dWlrZXBianRnYWthc29nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mjk3MzY3MCwiZXhwIjoyMDk4NTQ5NjcwfQ.eyJXK0prf957QfbNLfmT2LRyqDBShi3GBJ252w82tuw';

// Create a Supabase client with the service role key for admin privileges
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  const email = 'swatifylabs@gmail.com';
  const password = 'swatifylabs1@#7';
  
  // Ensure workspace exists first!
  console.log('Checking existing workspaces...');
  const { data: workspaces, error: wsError } = await supabase
    .from('workspaces')
    .select('id')
    .eq('slug', 'swatify-labs');
    
  if (wsError) {
    console.error('Error fetching workspaces:', wsError);
  }

  let workspaceId;
  if (!workspaces || workspaces.length === 0) {
    console.log('Creating demo workspace...');
    const { data: newWs, error: newWsError } = await supabase
      .from('workspaces')
      .insert({
        name: 'Swatify Labs',
        slug: 'swatify-labs',
        status: 'Active',
        access_period: 'Lifetime',
        is_lifetime: true,
      })
      .select()
      .single();
      
    if (newWsError) {
      console.error('Error creating workspace:', newWsError);
      return;
    }
    workspaceId = newWs.id;
    console.log('Created workspace:', workspaceId);
  } else {
    workspaceId = workspaces[0].id;
    console.log('Workspace already exists:', workspaceId);
  }

  console.log('Attempting to create user with Admin API...');
  let userId;
  
  // Try to create the user directly using the admin API
  const { data: adminUser, error: adminCreateError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: 'Swatify Labs', workspaceId: workspaceId }
  });

  if (adminCreateError) {
    if (adminCreateError.message.includes('already been registered') || adminCreateError.message.includes('already exists')) {
      console.log('User already exists, fetching user...');
      // Fetch user ID
      const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
      if (!usersError) {
         const existing = usersData.users.find(u => u.email === email);
         if (existing) {
            userId = existing.id;
         }
      }
    } else {
      console.error('Admin user creation failed:', adminCreateError);
      return;
    }
  } else {
    userId = adminUser?.user?.id;
    console.log('Successfully created and auto-confirmed user via Admin API:', userId);
  }

  if (!userId) {
     console.error('Could not determine user ID.');
     return;
  }
  
  // Set owner_id on workspace now that we have userId
  await supabase.from('workspaces').update({ owner_id: userId }).eq('id', workspaceId);

  // Ensure user is in the public.users table
  const { data: existingUser } = await supabase.from('users').select('id').eq('id', userId).maybeSingle();
  if (!existingUser) {
    console.log('Users record not found. Inserting directly...');
    const { error: insertUserError } = await supabase.from('users').insert({
      id: userId,
      workspace_id: workspaceId,
      username: 'Swatify Labs',
      email: email,
      role: 'Admin',
      name: 'Swatify Labs',
      status: 'Active',
      password_hash: 'managed_by_supabase_auth'
    });
    if (insertUserError) console.error('Error inserting user:', insertUserError);
    else console.log('User inserted successfully.');
  } else {
    // Update user with workspace_id and role
    console.log('Updating user workspace and role...');
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({
        workspace_id: workspaceId,
        role: 'Admin',
        name: 'Swatify Labs',
        status: 'Active'
      })
      .eq('id', userId);
      
    if (userUpdateError) {
      console.error('Error updating user:', userUpdateError);
    } else {
      console.log('User updated successfully.');
    }
  }

  // Ensure workspace_users linkage exists
  console.log('Ensuring workspace_users link exists...');
  const { data: wsUser } = await supabase.from('workspace_users').select('*').eq('workspace_id', workspaceId).eq('user_id', userId).maybeSingle();
  if (!wsUser) {
    const { error: wsUserInsertError } = await supabase.from('workspace_users').insert({
      workspace_id: workspaceId,
      user_id: userId,
      role: 'Owner'
    });
    if (wsUserInsertError) console.error('Error creating workspace_user link:', wsUserInsertError);
    else console.log('Created workspace_users link successfully.');
  } else {
    console.log('workspace_users link already exists.');
  }

  console.log('Setup complete! You can now log in.');
}

main().catch(console.error);
