import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "shri_prasadam_secret_token_2026";

  if (mode === "subscribe" && token === WHATSAPP_VERIFY_TOKEN) {
    console.log("=== WEBHOOK VERIFICATION SUCCESS ===");
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification token mismatch" }, { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Meta Webhook Received Log Event:", JSON.stringify(body, null, 2));
    
    return NextResponse.json({ status: "EVENT_RECEIVED" }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Invalid payload layout" }, { status: 400 });
  }
}