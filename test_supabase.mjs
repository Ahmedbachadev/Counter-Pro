import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nvenvuikepbjtgakasog.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52ZW52dWlrZXBianRnYWthc29nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5NzM2NzAsImV4cCI6MjA5ODU0OTY3MH0.cQDjgDxPihczXMY1dHS9Uvl06ggJhbRlOdP0mmilekg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    const { data, error } = await supabase.from('users').select('*').limit(1);
    if (error) {
      console.error('Error connecting to Supabase:', error);
    } else {
      console.log('Successfully connected to Supabase!', data);
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

testConnection();
