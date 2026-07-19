import { NextRequest, NextResponse } from "next/server";
import { campaignsCol } from "@/app/lib/db/collections";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);

    const col = await campaignsCol();
    const total = await col.countDocuments({});
    const items = await col
      .find({})
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    return NextResponse.json({ items, total, page, limit });
  } catch (err: any) {
    console.error("GET /api/email-campaigns error:", err);
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = (body.name || "").trim();
    const subject = (body.subject || "").trim();

    if (!name || !subject) {
      return NextResponse.json({ error: "Campaign name and subject are required" }, { status: 400 });
    }

    const col = await campaignsCol();
    const now = new Date();

    const doc = {
      name,
      subject,
      fromName: body.fromName || "Shri Prasadam",
      fromEmail: body.fromEmail || process.env.EMAIL_FROM_ADDRESS || "orders@shriprasadam.in",
      contentType: body.contentType || "html",
      templateId: body.templateId || null,
      htmlContent: body.htmlContent || "",
      textContent: body.textContent || "",
      audienceType: body.audienceType || "all",
      groupIds: Array.isArray(body.groupIds) ? body.groupIds : [],
      subscriberIds: Array.isArray(body.subscriberIds) ? body.subscriberIds : [],
      status: "draft" as const,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      sentAt: null,
      stats: { totalRecipients: 0, sent: 0, failed: 0, opened: 0, clicked: 0, unsubscribed: 0 },
      errorLog: [],
      createdAt: now,
      updatedAt: now,
    };

    if (doc.scheduledAt) {
      (doc as any).status = "scheduled";
    }

    const result = await col.insertOne(doc);
    return NextResponse.json({ success: true, id: result.insertedId, campaign: doc });
  } catch (err: any) {
    console.error("POST /api/email-campaigns error:", err);
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}
