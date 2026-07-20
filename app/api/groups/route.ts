import { NextRequest, NextResponse } from "next/server";
import { groupsCol, subscribersCol } from "@/app/lib/db/collections";

export async function GET() {
  try {
    const col = await groupsCol();
    const subs = await subscribersCol();
    const groups = await col.find({}).sort({ createdAt: -1 }).toArray();

    const withCounts = await Promise.all(
      groups.map(async (g: any) => {
        const count = await subs.countDocuments({ groupIds: String(g._id) });
        return { ...g, subscriberCount: count };
      })
    );

    return NextResponse.json({ items: withCounts });
  } catch (err: any) {
    console.error("GET /api/groups error:", err);
    return NextResponse.json({ error: "Failed to fetch groups" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = (body.name || "").trim();
    if (!name) {
      return NextResponse.json({ error: "Group name is required" }, { status: 400 });
    }
    const col = await groupsCol();
    const now = new Date();
    const doc = { name, description: body.description || "", createdAt: now, updatedAt: now };
    const result = await col.insertOne(doc);
    return NextResponse.json({ success: true, id: result.insertedId, group: doc });
  } catch (err: any) {
    console.error("POST /api/groups error:", err);
    return NextResponse.json({ error: "Failed to create group" }, { status: 500 });
  }
}
