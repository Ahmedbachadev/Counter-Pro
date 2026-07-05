import https from 'https';

const PROJECT_REF = 'nvenvuikepbjtgakasog';
const PAT = process.env.SUPABASE_ACCESS_TOKEN;

if (!PAT) {
  console.error('❌ Error: SUPABASE_ACCESS_TOKEN environment variable is not defined.');
  process.exit(1);
}

function mgmtApiRequest(path, method, body, token) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.supabase.com',
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: data }));
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

const sql = `
  CREATE OR REPLACE FUNCTION public.log_failed_admin_login(
    p_email TEXT,
    p_user_agent TEXT
  )
  RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
  BEGIN
    INSERT INTO public.activity_logs (
      action, module, description, severity, status, user_agent, entity_type, entity_id
    ) VALUES (
      'Failed Login Attempt',
      'Authentication',
      'Failed admin login attempt for email: ' || p_email,
      'Warning',
      'Failed',
      p_user_agent,
      'Platform',
      '00000000-0000-0000-0000-000000000000'
    );
  END;
  $$;
`;

async function run() {
  console.log('🚀 Applying Failed Login Logging RPC...');
  const result = await mgmtApiRequest(
    `/v1/projects/${PROJECT_REF}/database/query`,
    'POST',
    { query: sql },
    PAT
  );
  if (result.status >= 200 && result.status < 300) {
    console.log('✅ Fix applied successfully');
  } else {
    console.error('❌ Failed:', result.status, result.data);
  }
}

run();