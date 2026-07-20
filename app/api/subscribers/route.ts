import { NextRequest, NextResponse } from "next/server";
import { subscribersCol } from "@/app/lib/db/collections";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "25", 10), 200);
    const search = searchParams.get("search")?.trim();
    const status = searchParams.get("status");
    const groupId = searchParams.get("groupId");

    const col = await subscribersCol();

    const query: any = {};
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
      ];
    }
    if (status && status !== "all") {
      query.status = status;
    }
    if (groupId) {
      query.groupIds = groupId;
    }

    const total = await col.countDocuments(query);
    const items = await col
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    return NextResponse.json({ items, total, page, limit });
  } catch (err: any) {
    console.error("GET /api/subscribers error:", err);
    return NextResponse.json({ error: "Failed to fetch subscribers" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = (body.email || "").trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
    }

    const col = await subscribersCol();
    const existing = await col.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "Subscriber with this email already exists" }, { status: 409 });
    }

    const now = new Date();
    const doc = {
      email,
      name: body.name || "",
      phone: body.phone || "",
      status: "active" as const,
      source: body.source || "manual",
      groupIds: Array.isArray(body.groupIds) ? body.groupIds : [],
      tags: Array.isArray(body.tags) ? body.tags : [],
      createdAt: now,
      updatedAt: now,
      unsubscribedAt: null,
    };

    const result = await col.insertOne(doc);
    return NextResponse.json({ success: true, id: result.insertedId, subscriber: doc });
  } catch (err: any) {
    console.error("POST /api/subscribers error:", err);
    return NextResponse.json({ error: "Failed to create subscriber" }, { status: 500 });
  }
}
