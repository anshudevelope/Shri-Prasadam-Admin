// import { NextResponse } from "next/server";
// import clientPromise from "@/app/lib/mongodb";

// export async function POST(request: Request) {
//   try {
//     const { campaignName, message, recipients } = await request.json();

//     if (!campaignName || !message || !recipients || !Array.isArray(recipients)) {
//       return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
//     }
    
//     // Fall back to environment variable values correctly
//     const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
//     const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

//     if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
//       console.error("Meta credentials missing from process.env configurations");
//       return NextResponse.json({ error: "Server credential missing setup configuration" }, { status: 500 });
//     }

//     console.log(`Starting campaign pipeline execution via Meta Framework: ${campaignName}`);

//     // Clean number string formatting (Ensure no +, whitespace, or dashes)
//     const targetRecipient = recipients[0].replace(/[\s\+\-]/g, "");

//     // NOTE: Because you are on a development sandbox / test number environment, 
//     // sending a raw text body message to an inactive conversation will get blocked by Meta.
//     // For testing, change the body object payload below to match your Meta template if needed.
//     const metaPayload = {
//       messaging_product: "whatsapp",
//       to: targetRecipient,
//       // type: "text",
//       text: { body: message },
//       // USE TEMPLATE IF INITIATING FREE COLD MESSAGES VIA TEST NUMBER:
//       type: "template",
//       template: {
//         name: "hello_world",
//         language: { code: "en_US" }
//       }
    
//     };

//     // Concrete execution mapping targeting Meta Cloud Graph API Layer
//     const metaResponse = await fetch(`https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`, {
//       method: 'POST',
//       headers: {
//         'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify(metaPayload)
//     });

//     const metaData = await metaResponse.json();

//     // CRITICAL FIX: Intercept Meta API response block status check failure logs 
//     if (!metaResponse.ok) {
//       console.error("Meta API Rejected Payload Delivery Attempt Details:", metaData);
//       return NextResponse.json({ 
//         success: false, 
//         error: metaData.error?.message || "Meta API target verification rejected batch request transmission",
//         metaDetails: metaData.error 
//       }, { status: metaResponse.status });
//     }

//     // 2. Persistent Storage Logging via MongoDB Connection Driver
//     const client = await clientPromise;
//     const db = client.db("shri_prasadam");
    
//     const operationReceipt = await db.collection("whatsapp_campaigns").insertOne({
//       campaignName,
//       message,
//       recipientCount: recipients.length,
//       metaMessageId: metaData.messages?.[0]?.id || null,
//       dispatchedAt: new Date(),
//       deliveryStatus: "Delivered_To_Recipient_Gateway",
//     });

//     return NextResponse.json({
//       success: true,
//       message: "Campaign completed and logged cleanly.",
//       metaResponseId: metaData.messages?.[0]?.id,
//       id: operationReceipt.insertedId
//     });

//   } catch (error: any) {
//     console.error("Critical API routing pipeline exception caught:", error);
//     return NextResponse.json({ error: "Internal Server Processing Error" }, { status: 500 });
//   }
// }

import { NextResponse } from "next/server";
import clientPromise from "@/app/lib/mongodb";

export async function POST(request: Request) {
  try {
    const { campaignName, message, recipients, mediaUrl, mediaType } = await request.json();

    if (!campaignName || !message || !recipients || !Array.isArray(recipients)) {
      return NextResponse.json({ error: "Missing required campaign parameters" }, { status: 400 });
    }
    
    const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
    const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
      return NextResponse.json({ error: "Missing credentials inside server environments." }, { status: 500 });
    }

    console.log(`Dispatched Campaign Strategy: ${campaignName} to ${recipients.length} recipients`);

    // We process recipient payloads. For testing sandbox accounts, we only process the first item.
    // In live production contexts with payment setup, replace with parallel/loop execution.
    const targetRecipient = recipients[0].replace(/[\s\+\-]/g, "");

    // Prepare media components array if custom media from Cloudinary exists
    const components: any[] = [];
    
    if (mediaUrl) {
      const parameter: any = {};
      if (mediaType === "image") parameter.image = { link: mediaUrl };
      else if (mediaType === "video") parameter.video = { link: mediaUrl };
      else if (mediaType === "document") parameter.document = { link: mediaUrl, filename: "Attachment" };

      components.push({
        type: "header",
        parameters: [parameter]
      });
    }

    // Bind parameters for message variables (e.g. {{1}} = Customer Name)
    components.push({
      type: "body",
      parameters: [
        { type: "text", text: "Customer" }, // Default variable replacement map
        { type: "text", text: message }
      ]
    });

    // Production Meta Payload Setup
    const metaPayload = {
      messaging_product: "whatsapp",
      to: targetRecipient,
      type: "template",
      template: {
        name: "shri_prasadam_promo", // Point directly to your approved Meta Template name
        language: { code: "en" },
        components: components
      }
    };

    const metaResponse = await fetch(`https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(metaPayload)
    });

    const metaData = await metaResponse.json();

    if (!metaResponse.ok) {
      console.error("Meta API Verification Rejected Delivery Attempt:", metaData);
      return NextResponse.json({ 
        success: false, 
        error: metaData.error?.message || "Meta Server rejected this delivery layout configurations.",
        metaDetails: metaData.error 
      }, { status: metaResponse.status });
    }

    // Database logging via MongoDB Engine
    const client = await clientPromise;
    const db = client.db("shri_prasadam");
    
    const operationReceipt = await db.collection("whatsapp_campaigns").insertOne({
      campaignName,
      message,
      recipientCount: recipients.length,
      metaMessageId: metaData.messages?.[0]?.id || null,
      mediaUrl,
      mediaType,
      dispatchedAt: new Date(),
      deliveryStatus: "Dispatched_From_NextJS_Server",
    });

    return NextResponse.json({
      success: true,
      message: "Production campaign dispatched cleanly.",
      metaResponseId: metaData.messages?.[0]?.id,
      id: operationReceipt.insertedId
    });

  } catch (error: any) {
    console.error("Critical routing Exception Caught:", error);
    return NextResponse.json({ error: "Internal Server Processing Error" }, { status: 500 });
  }
}