import { NextRequest, NextResponse } from "next/server";
import { subscribersCol } from "@/app/lib/db/collections";
import { parseCSVToObjects } from "@/app/lib/csv";

// Accepts CSV exports from Shopify's customer export as well as generic
// CSVs. Only an "email" column is required — everything else is optional.

function normalizeHeaderKey(key: string): string {
  return key.trim().toLowerCase().replace(/\s+/g, "_");
}

function findValue(row: Record<string, string>, candidates: string[]): string {
  const normalizedRow: Record<string, string> = {};
  for (const key of Object.keys(row)) {
    normalizedRow[normalizeHeaderKey(key)] = row[key];
  }
  for (const c of candidates) {
    if (normalizedRow[c] !== undefined && normalizedRow[c] !== "") {
      return normalizedRow[c];
    }
  }
  return "";
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const groupId = (formData.get("groupId") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "No CSV file uploaded" }, { status: 400 });
    }

    const text = await file.text();
    const rows = parseCSVToObjects(text);

    if (rows.length === 0) {
      return NextResponse.json({ error: "CSV file is empty or unreadable" }, { status: 400 });
    }

    const col = await subscribersCol();
    const now = new Date();

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const row of rows) {
      const email = findValue(row, ["email", "email_address"]).trim().toLowerCase();

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        skipped++;
        continue;
      }

      const firstName = findValue(row, ["first_name", "firstname"]);
      const lastName = findValue(row, ["last_name", "lastname"]);
      const name = findValue(row, ["name"]) || [firstName, lastName].filter(Boolean).join(" ");
      const phone = findValue(row, ["phone", "phone_number", "default_address_phone"]);
      const tagsRaw = findValue(row, ["tags"]);
      const tags = tagsRaw ? tagsRaw.split(/[,;]/).map((t) => t.trim()).filter(Boolean) : [];
      const acceptsMarketing = findValue(row, ["accepts_marketing", "accepts_email_marketing"]);

      let status: "active" | "unsubscribed" = "active";
      if (acceptsMarketing && /^(no|false|0)$/i.test(acceptsMarketing.trim())) {
        status = "unsubscribed";
      }

      try {
        const existing = await col.findOne({ email });
        if (existing) {
          const update: any = { updatedAt: now };
          if (name) update.name = name;
          if (phone) update.phone = phone;
          if (tags.length) update.tags = Array.from(new Set([...(existing.tags || []), ...tags]));
          if (groupId) update.groupIds = Array.from(new Set([...(existing.groupIds || []), groupId]));
          await col.updateOne({ _id: existing._id }, { $set: update });
          updated++;
        } else {
          await col.insertOne({
            email,
            name,
            phone,
            status,
            source: "csv_import",
            groupIds: groupId ? [groupId] : [],
            tags,
            createdAt: now,
            updatedAt: now,
            unsubscribedAt: status === "unsubscribed" ? now : null,
          });
          imported++;
        }
      } catch (rowErr: any) {
        errors.push(`Row with email ${email}: ${rowErr.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      totalRows: rows.length,
      imported,
      updated,
      skipped,
      errors: errors.slice(0, 20),
    });
  } catch (err: any) {
    console.error("POST /api/subscribers/import error:", err);
    return NextResponse.json({ error: "Failed to import CSV" }, { status: 500 });
  }
}
