import { NextRequest, NextResponse } from "next/server";

// 1. GET Request: Handles Meta's initial Webhook Verification challenge handshake
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  // This should match the string value you type inside the Meta dashboard input box
  const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "shri_prasadam_secret_token_2026";

  if (mode === "subscribe" && token === WHATSAPP_VERIFY_TOKEN) {
    console.log("=== WEBHOOK CONFIRMED WITH META SUCCESSFUL ===");
    // Meta strictly requires returning the raw challenge text code as a text response
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification token mismatch" }, { status: 403 });
}

// 2. POST Request: Where Meta will dispatch delivery logs and incoming responses later
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Incoming Webhook Payload Event from Meta:", JSON.stringify(body, null, 2));
    
    // Always return a 200 OK fast to acknowledge receipt to Meta
    return NextResponse.json({ status: "EVENT_RECEIVED" }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Invalid payload layout" }, { status: 400 });
  }
}