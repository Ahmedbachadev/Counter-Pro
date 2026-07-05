import https from 'https';

const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52ZW52dWlrZXBianRnYWthc29nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5NzM2NzAsImV4cCI6MjA5ODU0OTY3MH0.cQDjgDxPihczXMY1dHS9Uvl06ggJhbRlOdP0mmilekg';

const options = {
  hostname: 'nvenvuikepbjtgakasog.supabase.co',
  path: '/rest/v1/workspaces?select=id,name,status&limit=5',
  method: 'GET',
  headers: {
    'apikey': ANON_KEY,
    'Authorization': `Bearer ${ANON_KEY}`,
  }
};

console.log('Testing Supabase REST API...');

const req = https.get(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    if (res.statusCode === 200) {
      console.log('✓ Connected! Data:', data);
    } else {
      console.log('Response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.end();
