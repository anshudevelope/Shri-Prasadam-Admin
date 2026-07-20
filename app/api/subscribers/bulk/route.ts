import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { subscribersCol } from "@/app/lib/db/collections";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids, action, groupId } = body as { ids: string[]; action: string; groupId?: string };

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No subscriber ids provided" }, { status: 400 });
    }

    const objectIds = ids.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id));
    const col = await subscribersCol();

    if (action === "delete") {
      const result = await col.deleteMany({ _id: { $in: objectIds } });
      return NextResponse.json({ success: true, deleted: result.deletedCount });
    }

    if (action === "unsubscribe") {
      const result = await col.updateMany(
        { _id: { $in: objectIds } },
        { $set: { status: "unsubscribed", unsubscribedAt: new Date(), updatedAt: new Date() } }
      );
      return NextResponse.json({ success: true, modified: result.modifiedCount });
    }

    if (action === "resubscribe") {
      const result = await col.updateMany(
        { _id: { $in: objectIds } },
        { $set: { status: "active", unsubscribedAt: null, updatedAt: new Date() } }
      );
      return NextResponse.json({ success: true, modified: result.modifiedCount });
    }

    if (action === "addToGroup") {
      if (!groupId) return NextResponse.json({ error: "groupId is required" }, { status: 400 });
      const result = await col.updateMany(
        { _id: { $in: objectIds } },
        { $addToSet: { groupIds: groupId }, $set: { updatedAt: new Date() } }
      );
      return NextResponse.json({ success: true, modified: result.modifiedCount });
    }

    if (action === "removeFromGroup") {
      if (!groupId) return NextResponse.json({ error: "groupId is required" }, { status: 400 });
      const result = await col.updateMany(
        { _id: { $in: objectIds } },
        { $pull: { groupIds: groupId }, $set: { updatedAt: new Date() } } as any
      );
      return NextResponse.json({ success: true, modified: result.modifiedCount });
    }

    return NextResponse.json({ error: "Unknown bulk action" }, { status: 400 });
  } catch (err: any) {
    console.error("POST /api/subscribers/bulk error:", err);
    return NextResponse.json({ error: "Failed to perform bulk action" }, { status: 500 });
  }
}
