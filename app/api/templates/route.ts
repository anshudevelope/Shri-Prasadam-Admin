import { NextRequest, NextResponse } from "next/server";
import { templatesCol } from "@/app/lib/db/collections";

export async function GET() {
  try {
    const col = await templatesCol();
    const items = await col.find({}).sort({ updatedAt: -1 }).toArray();
    return NextResponse.json({ items });
  } catch (err: any) {
    console.error("GET /api/templates error:", err);
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = (body.name || "").trim();
    const subject = (body.subject || "").trim();
    if (!name || !subject) {
      return NextResponse.json({ error: "Template name and subject are required" }, { status: 400 });
    }
    const col = await templatesCol();
    const now = new Date();
    const doc = {
      name,
      subject,
      contentType: body.contentType === "text" ? ("text" as const) : ("html" as const),
      htmlContent: body.htmlContent || "",
      textContent: body.textContent || "",
      category: body.category || "general",
      createdAt: now,
      updatedAt: now,
    };
    const result = await col.insertOne(doc);
    return NextResponse.json({ success: true, id: result.insertedId, template: doc });
  } catch (err: any) {
    console.error("POST /api/templates error:", err);
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}
