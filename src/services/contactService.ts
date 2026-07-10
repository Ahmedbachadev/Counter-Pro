export interface ContactFormData {
  fullName: string;
  businessName: string;
  businessType: string;
  email: string;
  phone?: string;
  city?: string;
  branches?: string;
  subject: string;
  message: string;
}

interface SendEmailResponse {
  success: boolean;
  error?: string;
}

/**
 * Sends the contact form data directly to the live Supabase Edge Function
 */
export const sendContactEmail = async (formData: ContactFormData): Promise<SendEmailResponse> => {
  try {
    // Manually injecting your live production variables so the frontend can find your function
    const SUPABASE_URL = "https://nvenvuikepbjtgakasog.supabase.co";
    const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52ZW52dWlrZXBianRnYWthc29nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5NzM2NzAsImV4cCI6MjA5ODU0OTY3MH0.cQDjgDxPihczXMY1dHS9Uvl06ggJhbRlOdP0mmilekg";

    // This must match your exact folder name under supabase/functions/
    const FUNCTION_NAME = "send-email";
    const endpoint = `${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY
      },
      body: JSON.stringify({
        ...formData,
        submittedAt: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown',
        recipient: 'abuh68653@gmail.com'
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Server responded with status code ${response.status}`
      };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Contact service network error:', err);
    return {
      success: false,
      error: err.message || 'Failed to communicate with the Edge Function network layer.'
    };
  }
};