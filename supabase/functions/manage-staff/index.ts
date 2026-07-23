import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, PUT, DELETE, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Server misconfiguration: Missing Supabase URL or Service Key')
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Verify JWT of the caller
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header provided')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user: caller }, error: callerError } = await supabaseAdmin.auth.getUser(token)
    
    if (callerError || !caller) {
      throw new Error('Invalid or expired token')
    }

    const role = caller.user_metadata?.role?.toLowerCase()
    if (role !== 'admin' && role !== 'owner') {
      throw new Error('Unauthorized: Only admins can manage staff')
    }

    // Process Request
    const method = req.method

    if (method === 'POST') {
      const body = await req.json()
      const { email, password, username, name, phone, role: staffRole, permissions, status, workspaceId, workspaceName } = body

      if (!username || !password) {
        throw new Error('Username and password are required')
      }

      const safeEmail = email || `${username}@counterpro.local`

      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: safeEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          username,
          name,
          phone,
          role: staffRole || 'Cashier',
          permissions,
          status: status || 'Active',
          workspaceId,
          workspaceName
        }
      })

      if (error) throw error

      return new Response(JSON.stringify({ user: data.user }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (method === 'PUT') {
      const body = await req.json()
      const { id, updates } = body

      if (!id || !updates) {
        throw new Error('User ID and updates object are required')
      }

      const updatePayload: any = {
        user_metadata: {
          ...updates
        }
      }

      if (updates.password) {
        updatePayload.password = updates.password
        delete updates.password
      }
      if (updates.email) {
        updatePayload.email = updates.email
        delete updates.email
      }

      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(id, updatePayload)

      if (error) throw error

      return new Response(JSON.stringify({ user: data.user }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (method === 'DELETE') {
      const body = await req.json()
      const { id } = body

      if (!id) {
        throw new Error('User ID is required for deletion')
      }

      const { data, error } = await supabaseAdmin.auth.admin.deleteUser(id)

      if (error) throw error

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    throw new Error('Method not allowed')
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
