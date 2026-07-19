// Thin wrapper around the Resend REST API (no SDK dependency required).
// Swap this file out if you switch email providers later — nothing else
// in the app talks to the ESP directly.

interface SendEmailParams {
  to: string;
  from: string;
  subject: string;
  html?: string;
  text?: string;
  headers?: Record<string, string>;
}

export async function sendEmail(params: SendEmailParams) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured on the server");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: params.from,
      to: [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text,
      headers: params.headers,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.message || `Resend API error (${res.status})`);
  }

  return data;
}
