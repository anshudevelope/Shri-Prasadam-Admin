// Thin wrapper around the Brevo (formerly Sendinblue) transactional email
// API (no SDK dependency required). Swap this file out if you switch email
// providers later — nothing else in the app talks to the ESP directly.

interface SendEmailParams {
  to: string;
  toName?: string;
  fromEmail: string;
  fromName: string;
  subject: string;
  html?: string;
  text?: string;
  headers?: Record<string, string>;
}

export async function sendEmail(params: SendEmailParams) {
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  if (!BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY is not configured on the server");
  }

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": BREVO_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: params.fromName, email: params.fromEmail },
      to: [{ email: params.to, name: params.toName || undefined }],
      subject: params.subject,
      htmlContent: params.html,
      textContent: params.text,
      headers: params.headers,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.message || `Brevo API error (${res.status})`);
  }

  return data;
}
