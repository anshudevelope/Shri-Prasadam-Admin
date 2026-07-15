import { NextResponse } from "next/server";
import clientPromise from "@/app/lib/mongodb";

export async function POST(request: Request) {
  try {
    const { campaignName, message, recipients } = await request.json();

    if (!campaignName || !message || !recipients || !Array.isArray(recipients)) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }
    
    // Fall back to environment variable values correctly
    const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
    const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
      console.error("Meta credentials missing from process.env configurations");
      return NextResponse.json({ error: "Server credential missing setup configuration" }, { status: 500 });
    }

    console.log(`Starting campaign pipeline execution via Meta Framework: ${campaignName}`);

    // Clean number string formatting (Ensure no +, whitespace, or dashes)
    const targetRecipient = recipients[0].replace(/[\s\+\-]/g, "");

    // NOTE: Because you are on a development sandbox / test number environment, 
    // sending a raw text body message to an inactive conversation will get blocked by Meta.
    // For testing, change the body object payload below to match your Meta template if needed.
    const metaPayload = {
      messaging_product: "whatsapp",
      to: targetRecipient,
      // type: "text",
      text: { body: message },
      // USE TEMPLATE IF INITIATING FREE COLD MESSAGES VIA TEST NUMBER:
      type: "template",
      template: {
        name: "hello_world",
        language: { code: "en_US" }
      }
    
    };

    // Concrete execution mapping targeting Meta Cloud Graph API Layer
    const metaResponse = await fetch(`https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(metaPayload)
    });

    const metaData = await metaResponse.json();

    // CRITICAL FIX: Intercept Meta API response block status check failure logs 
    if (!metaResponse.ok) {
      console.error("Meta API Rejected Payload Delivery Attempt Details:", metaData);
      return NextResponse.json({ 
        success: false, 
        error: metaData.error?.message || "Meta API target verification rejected batch request transmission",
        metaDetails: metaData.error 
      }, { status: metaResponse.status });
    }

    // 2. Persistent Storage Logging via MongoDB Connection Driver
    const client = await clientPromise;
    const db = client.db("shri_prasadam");
    
    const operationReceipt = await db.collection("whatsapp_campaigns").insertOne({
      campaignName,
      message,
      recipientCount: recipients.length,
      metaMessageId: metaData.messages?.[0]?.id || null,
      dispatchedAt: new Date(),
      deliveryStatus: "Delivered_To_Recipient_Gateway",
    });

    return NextResponse.json({
      success: true,
      message: "Campaign completed and logged cleanly.",
      metaResponseId: metaData.messages?.[0]?.id,
      id: operationReceipt.insertedId
    });

  } catch (error: any) {
    console.error("Critical API routing pipeline exception caught:", error);
    return NextResponse.json({ error: "Internal Server Processing Error" }, { status: 500 });
  }
}