import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { subscribersCol } from "@/app/lib/db/collections";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid subscriber id" }, { status: 400 });
    }
    const body = await request.json();
    const col = await subscribersCol();

    const update: any = { updatedAt: new Date() };
    if (body.name !== undefined) update.name = body.name;
    if (body.phone !== undefined) update.phone = body.phone;
    if (body.tags !== undefined) update.tags = body.tags;
    if (body.groupIds !== undefined) update.groupIds = body.groupIds;
    if (body.status !== undefined) {
      update.status = body.status;
      update.unsubscribedAt = body.status === "unsubscribed" ? new Date() : null;
    }

    await col.updateOne({ _id: new ObjectId(id) }, { $set: update });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("PATCH /api/subscribers/[id] error:", err);
    return NextResponse.json({ error: "Failed to update subscriber" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid subscriber id" }, { status: 400 });
    }
    const col = await subscribersCol();
    await col.deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/subscribers/[id] error:", err);
    return NextResponse.json({ error: "Failed to delete subscriber" }, { status: 500 });
  }
}
