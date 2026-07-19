import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { campaignsCol } from "@/app/lib/db/collections";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid campaign id" }, { status: 400 });
    const col = await campaignsCol();
    const campaign = await col.findOne({ _id: new ObjectId(id) });
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    return NextResponse.json({ campaign });
  } catch (err: any) {
    console.error("GET /api/email-campaigns/[id] error:", err);
    return NextResponse.json({ error: "Failed to fetch campaign" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid campaign id" }, { status: 400 });
    const col = await campaignsCol();

    const existing = await col.findOne({ _id: new ObjectId(id) });
    if (!existing) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    if (existing.status === "sent" || existing.status === "sending") {
      return NextResponse.json({ error: "Cannot edit a campaign that has already been sent" }, { status: 400 });
    }

    const body = await request.json();
    const update: any = { updatedAt: new Date() };
    [
      "name", "subject", "fromName", "fromEmail", "contentType", "templateId",
      "htmlContent", "textContent", "audienceType", "groupIds", "subscriberIds", "scheduledAt",
    ].forEach((key) => {
      if (body[key] !== undefined) {
        update[key] = key === "scheduledAt" && body[key] ? new Date(body[key]) : body[key];
      }
    });
    if (body.scheduledAt) update.status = "scheduled";

    await col.updateOne({ _id: new ObjectId(id) }, { $set: update });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("PATCH /api/email-campaigns/[id] error:", err);
    return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid campaign id" }, { status: 400 });
    const col = await campaignsCol();
    await col.deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/email-campaigns/[id] error:", err);
    return NextResponse.json({ error: "Failed to delete campaign" }, { status: 500 });
  }
}
