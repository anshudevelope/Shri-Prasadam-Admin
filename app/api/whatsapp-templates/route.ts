import { NextResponse } from "next/server";

export async function GET() {
  try {
    const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
    const WABA_ID = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

    if (!WHATSAPP_TOKEN || !WABA_ID) {
      console.error("Missing WhatsApp token or Business Account ID in environment variables.");
      return NextResponse.json(
        { error: "Missing WhatsApp Credentials or WABA ID in .env" },
        { status: 500 }
      );
    }

    // Sanitize quotes from env string if present
    const cleanWabaId = WABA_ID.replace(/['"]/g, "").trim();
    const cleanToken = WHATSAPP_TOKEN.replace(/['"]/g, "").trim();

    // Fetch approved templates directly from Meta Graph API
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${cleanWabaId}/message_templates?limit=100`,
      {
        headers: {
          Authorization: `Bearer ${cleanToken}`,
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Meta Template API Error:", data);
      return NextResponse.json(
        { error: data.error?.message || "Failed to fetch templates from Meta" },
        { status: response.status }
      );
    }

    // Filter only APPROVED templates
    const approvedTemplates = (data.data || []).filter(
      (t: any) => t.status === "APPROVED"
    );

    return NextResponse.json({ success: true, templates: approvedTemplates });
  } catch (error: any) {
    console.error("Templates fetch exception:", error);
    return NextResponse.json(
      { error: "Failed to connect to Meta API: " + error.message },
      { status: 500 }
    );
  }
}