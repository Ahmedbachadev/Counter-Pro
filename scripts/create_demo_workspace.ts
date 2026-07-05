import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://nvenvuikepbjtgakasog.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52ZW52dWlrZXBianRnYWthc29nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5NzM2NzAsImV4cCI6MjA5ODU0OTY3MH0.cQDjgDxPihczXMY1dHS9Uvl06ggJhbRlOdP0mmilekg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const email = 'mpbrand@gmail.com';
  const password = 'mpbrand1@#7';
  
  console.log('Attempting to log in or sign up user...');
  let userId;
  
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email, password
  });

  if (signInError && signInError.message.includes('Invalid login credentials')) {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email, password,
      options: { data: { name: 'MP Brand' } }
    });
    if (signUpError) {
      console.error('Sign up error:', signUpError);
      return;
    }
    userId = signUpData.user?.id;
    console.log('Created user:', userId);
    // Wait a moment for triggers (if any)
    await new Promise(resolve => setTimeout(resolve, 2000));
    // Login to get session
    await supabase.auth.signInWithPassword({ email, password });
  } else if (signInData.user) {
    userId = signInData.user.id;
    console.log('Logged in user:', userId);
  } else {
    console.error('Sign in error:', signInError);
    return;
  }

  // Ensure workspace exists
  console.log('Checking existing workspaces...');
  const { data: workspaces, error: wsError } = await supabase
    .from('workspaces')
    .select('id')
    .eq('slug', 'mp-brand');
    
  if (wsError) {
    console.error('Error fetching workspaces:', wsError);
  }

  let workspaceId;
  if (!workspaces || workspaces.length === 0) {
    console.log('Creating demo workspace...');
    const { data: newWs, error: newWsError } = await supabase
      .from('workspaces')
      .insert({
        name: 'MP Brand',
        slug: 'mp-brand',
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

  // Update user with workspace_id and role
  console.log('Updating user workspace and role...');
  const { error: userUpdateError } = await supabase
    .from('users')
    .update({
      workspace_id: workspaceId,
      role: 'Admin',
      name: 'MP Brand'
    })
    .eq('id', userId);
    
  if (userUpdateError) {
    console.error('Error updating user:', userUpdateError);
  } else {
    console.log('User updated successfully.');
  }
}

main().catch(console.error);
