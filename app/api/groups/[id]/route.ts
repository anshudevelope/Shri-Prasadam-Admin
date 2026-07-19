import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { groupsCol, subscribersCol } from "@/app/lib/db/collections";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid group id" }, { status: 400 });
    const body = await request.json();
    const col = await groupsCol();
    const update: any = { updatedAt: new Date() };
    if (body.name !== undefined) update.name = body.name;
    if (body.description !== undefined) update.description = body.description;
    await col.updateOne({ _id: new ObjectId(id) }, { $set: update });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("PATCH /api/groups/[id] error:", err);
    return NextResponse.json({ error: "Failed to update group" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid group id" }, { status: 400 });
    const col = await groupsCol();
    const subs = await subscribersCol();
    await col.deleteOne({ _id: new ObjectId(id) });
    await subs.updateMany({ groupIds: id }, { $pull: { groupIds: id } } as any);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/groups/[id] error:", err);
    return NextResponse.json({ error: "Failed to delete group" }, { status: 500 });
  }
}
