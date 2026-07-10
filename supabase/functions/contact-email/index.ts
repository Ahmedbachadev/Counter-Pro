import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    const {
      fullName,
      businessName,
      businessType,
      email,
      phone,
      city,
      branches,
      subject,
      message,
      submittedAt,
      userAgent,
      recipient
    } = payload

    if (!RESEND_API_KEY) {
      console.warn('RESEND_API_KEY is not set. Simulating email send in edge function.')
      return new Response(
        JSON.stringify({ success: true, message: 'Simulated email delivery (Missing API Key)' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Counter Pro <noreply@counterpro.com>',
        to: [recipient || 'abuh68653@gmail.com'],
        subject: `New Lead: ${businessName} - ${subject}`,
        html: `
          <h2>New Contact Inquiry</h2>
          <p><strong>Name:</strong> ${fullName}</p>
          <p><strong>Business Name:</strong> ${businessName}</p>
          <p><strong>Business Type:</strong> ${businessType}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
          <p><strong>City:</strong> ${city || 'Not provided'}</p>
          <p><strong>Branches:</strong> ${branches || 'Not provided'}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <blockquote style="border-left: 4px solid #ccc; padding-left: 10px;">
            ${message.replace(/\n/g, '<br/>')}
          </blockquote>
          <hr/>
          <p><small>Submitted At: ${submittedAt}</small></p>
          <p><small>User Agent: ${userAgent}</small></p>
        `,
      }),
    })

    if (!resendRes.ok) {
      const errText = await resendRes.text()
      throw new Error(`Resend API Error: ${errText}`)
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
