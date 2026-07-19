import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { templatesCol } from "@/app/lib/db/collections";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid template id" }, { status: 400 });
    const col = await templatesCol();
    const template = await col.findOne({ _id: new ObjectId(id) });
    if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });
    return NextResponse.json({ template });
  } catch (err: any) {
    console.error("GET /api/templates/[id] error:", err);
    return NextResponse.json({ error: "Failed to fetch template" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid template id" }, { status: 400 });
    const body = await request.json();
    const col = await templatesCol();
    const update: any = { updatedAt: new Date() };
    ["name", "subject", "contentType", "htmlContent", "textContent", "category"].forEach((key) => {
      if (body[key] !== undefined) update[key] = body[key];
    });
    await col.updateOne({ _id: new ObjectId(id) }, { $set: update });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("PATCH /api/templates/[id] error:", err);
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid template id" }, { status: 400 });
    const col = await templatesCol();
    await col.deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/templates/[id] error:", err);
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
  }
}
