import { NextRequest, NextResponse } from "next/server";
import { subscribersCol } from "@/app/lib/db/collections";
import { toCSV } from "@/app/lib/csv";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const groupId = searchParams.get("groupId");

    const query: any = {};
    if (status && status !== "all") query.status = status;
    if (groupId) query.groupIds = groupId;

    const col = await subscribersCol();
    const subscribers = await col.find(query).sort({ createdAt: -1 }).toArray();

    const headers = ["email", "name", "phone", "status", "tags", "source", "subscribed_at"];
    const rows = subscribers.map((s: any) => [
      s.email,
      s.name || "",
      s.phone || "",
      s.status,
      (s.tags || []).join(";"),
      s.source || "",
      s.createdAt ? new Date(s.createdAt).toISOString() : "",
    ]);

    const csv = toCSV(headers, rows);

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="subscribers-export-${Date.now()}.csv"`,
      },
    });
  } catch (err: any) {
    console.error("GET /api/subscribers/export error:", err);
    return NextResponse.json({ error: "Failed to export subscribers" }, { status: 500 });
  }
}
