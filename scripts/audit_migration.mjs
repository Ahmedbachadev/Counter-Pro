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
  ALTER TABLE public.activity_logs
    ADD COLUMN IF NOT EXISTS module VARCHAR(100),
    ADD COLUMN IF NOT EXISTS severity VARCHAR(20) DEFAULT 'Info',
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Success',
    ADD COLUMN IF NOT EXISTS user_agent TEXT,
    ADD COLUMN IF NOT EXISTS before_values JSONB,
    ADD COLUMN IF NOT EXISTS after_values JSONB,
    ADD COLUMN IF NOT EXISTS request_id VARCHAR(100);

  -- For filtering, we might want to ensure user_id is a foreign key to users if not already
  -- Also add indexes for performance
  CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_activity_logs_module ON public.activity_logs(module);
  CREATE INDEX IF NOT EXISTS idx_activity_logs_severity ON public.activity_logs(severity);
  CREATE INDEX IF NOT EXISTS idx_activity_logs_status ON public.activity_logs(status);
`;

async function run() {
  console.log('🚀 Applying Audit Logs schema migration...');
  const result = await mgmtApiRequest(
    `/v1/projects/${PROJECT_REF}/database/query`,
    'POST',
    { query: sql },
    PAT
  );
  
  if (result.status >= 200 && result.status < 300) {
    console.log('✅ Migration applied successfully');
  } else {
    console.error('❌ Failed:', result.status, result.data);
  }
}

run();