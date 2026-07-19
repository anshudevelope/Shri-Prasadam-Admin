import { NextRequest, NextResponse } from "next/server";
import { subscribersCol } from "@/app/lib/db/collections";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email")?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Missing email parameter" }, { status: 400 });
    }

    const col = await subscribersCol();
    await col.updateOne(
      { email },
      { $set: { status: "unsubscribed", unsubscribedAt: new Date(), updatedAt: new Date() } }
    );

    return new Response(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Unsubscribed</title></head>
      <body style="font-family:Arial,sans-serif;text-align:center;padding:60px 20px;color:#1e293b;">
        <h2>You've been unsubscribed</h2>
        <p style="color:#64748b;">${email} will no longer receive marketing emails from Shri Prasadam.</p>
      </body></html>`,
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch (err: any) {
    console.error("GET /api/unsubscribe error:", err);
    return NextResponse.json({ error: "Failed to process unsubscribe request" }, { status: 500 });
  }
}
