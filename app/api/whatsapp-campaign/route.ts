import { NextResponse } from "next/server";
import clientPromise from "@/app/lib/mongodb";

type RecipientItem = string | { phone: string; name?: string };

export async function POST(request: Request) {
  try {
    const { campaignName, templateName, message, recipients, mediaUrl, mediaType, languageCode } = await request.json();

    if (!campaignName || !message || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: "Missing required campaign parameters or recipient list." }, { status: 400 });
    }

    const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
    const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
      return NextResponse.json({ error: "Missing credentials inside server environment." }, { status: 500 });
    }

    const normalizedRecipients = recipients
      .map((item: RecipientItem) => {
        if (typeof item === "string") {
          return {
            phone: item.replace(/[\s\+\-]/g, "").trim(),
            name: "Customer",
          };
        }
        return {
          phone: item.phone ? item.phone.replace(/[\s\+\-]/g, "").trim() : "",
          name: item.name || "Customer",
        };
      })
      .filter((r) => r.phone.length >= 10);

    const formattedMessage = message
      .replace(/<b>(.*?)<\/b>/gi, "*$1*")
      .replace(/<strong>(.*?)<\/strong>/gi, "*$1*")
      .replace(/<i>(.*?)<\/i>/gi, "_$1_")
      .replace(/<em>(.*?)<\/em>/gi, "_$1_")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]+>/g, "");

    const results: Array<{ phone: string; status: string; id?: string; error?: any }> = [];
    const activeTemplateName = templateName || "shri_prasadam_promo";
    
    // Default to "en" for standard English templates created via Manager portal
    let targetLangCode = languageCode || "en";

    for (const recipient of normalizedRecipients) {
      const recipientPhone = recipient.phone;
      const recipientName = recipient.name;

      const components: any[] = [];

      if (mediaUrl && mediaType) {
        const headerParam: any = { type: mediaType };
        if (mediaType === "image") headerParam.image = { link: mediaUrl };
        else if (mediaType === "video") headerParam.video = { link: mediaUrl };
        else if (mediaType === "document") headerParam.document = { link: mediaUrl, filename: "Attachment" };

        components.push({
          type: "header",
          parameters: [headerParam],
        });
      }

      components.push({
        type: "body",
        parameters: [
          { type: "text", text: recipientName },
          { type: "text", text: formattedMessage },
        ],
      });

      const buildMetaPayload = (lang: string) => ({
        messaging_product: "whatsapp",
        to: recipientPhone,
        type: "template",
        template: {
          name: activeTemplateName,
          language: { code: lang },
          components: components,
        },
      });

      try {
        let metaResponse = await fetch(`https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${WHATSAPP_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(buildMetaPayload(targetLangCode)),
          cache: "no-store",
        });

        let metaData = await metaResponse.json();

        // Fallback check if language code mismatched (132001)
        if (!metaResponse.ok && metaData.error?.code === 132001) {
          const fallbackLang = targetLangCode === "en" ? "en_US" : "en";
          
          metaResponse = await fetch(`https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${WHATSAPP_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(buildMetaPayload(fallbackLang)),
            cache: "no-store",
          });

          metaData = await metaResponse.json();
        }

        if (metaResponse.ok) {
          results.push({ phone: recipientPhone, status: "SUCCESS", id: metaData.messages?.[0]?.id });
        } else {
          console.error(`Failed delivery for ${recipientPhone}:`, metaData);
          results.push({ phone: recipientPhone, status: "FAILED", error: metaData.error?.message || "Meta API rejection" });
        }
      } catch (err: any) {
        results.push({ phone: recipientPhone, status: "ERROR", error: err.message });
      }
    }

    const successCount = results.filter((r) => r.status === "SUCCESS").length;
    const failureCount = results.length - successCount;

    try {
      const client = await clientPromise;
      const db = client.db("shri_prasadam");

      await db.collection("whatsapp_campaigns").insertOne({
        campaignName,
        templateName: activeTemplateName,
        message,
        totalRecipients: recipients.length,
        successCount,
        failureCount,
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || null,
        dispatchedAt: new Date(),
        deliveryStatus: successCount > 0 ? "Completed" : "Failed",
        dispatchResults: results,
      });
    } catch (dbErr) {
      console.error("MongoDB Logging Error:", dbErr);
    }

    if (successCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: results[0]?.error || "Failed to dispatch messages to Meta Cloud API.",
          details: results,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Campaign executed successfully. Sent to ${successCount} recipient(s).`,
      successCount,
      failureCount,
      details: results,
    });
  } catch (error: any) {
    console.error("Critical routing Exception Caught:", error);
    return NextResponse.json({ error: "Internal Server Processing Error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("shri_prasadam");

    const campaigns = await db
      .collection("whatsapp_campaigns")
      .find({})
      .sort({ dispatchedAt: -1 })
      .toArray();

    // Aggregate key metrics
    const totalCampaigns = campaigns.length;
    const totalDispatched = campaigns.reduce((acc, c) => acc + (c.totalRecipients || 0), 0);
    const totalSuccessful = campaigns.reduce((acc, c) => acc + (c.successCount || 0), 0);
    const totalFailed = campaigns.reduce((acc, c) => acc + (c.failureCount || 0), 0);

    const deliveryRate = totalDispatched > 0 
      ? ((totalSuccessful / totalDispatched) * 100).toFixed(1) 
      : "0.0";

    return NextResponse.json({
      success: true,
      stats: {
        totalCampaigns,
        totalDispatched,
        totalSuccessful,
        totalFailed,
        deliveryRate: `${deliveryRate}%`,
      },
      campaigns: campaigns.map((c) => ({
        _id: c._id.toString(),
        campaignName: c.campaignName,
        templateName: c.templateName,
        message: c.message,
        totalRecipients: c.totalRecipients || 0,
        successCount: c.successCount || 0,
        failureCount: c.failureCount || 0,
        mediaUrl: c.mediaUrl || null,
        mediaType: c.mediaType || null,
        dispatchedAt: c.dispatchedAt,
        deliveryStatus: c.deliveryStatus || "Completed",
        dispatchResults: c.dispatchResults || [],
      })),
    });
  } catch (error: any) {
    console.error("Failed to fetch campaigns history:", error);
    return NextResponse.json({ error: "Database retrieval failed" }, { status: 500 });
  }
}