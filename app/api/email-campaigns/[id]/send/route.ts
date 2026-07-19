import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { campaignsCol, subscribersCol, templatesCol } from "@/app/lib/db/collections";
import { sendEmail } from "@/app/lib/email/brevo";
import { renderMergeTags, wrapPlainTextAsHtml } from "@/app/lib/email/renderTemplate";
import type { Subscriber } from "@/app/lib/db/types";

// NOTE ON SCALE: this sends synchronously within the request/serverless
// function. That's fine for lists up to roughly 1,000-2,000 subscribers on
// most hosts. For larger lists, move this loop into a background job/queue
// (e.g. a cron-triggered worker or a queue like Inngest/QStash) so it isn't
// bound by the platform's function timeout.

const BATCH_SIZE = 25;
const BATCH_DELAY_MS = 1200;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid campaign id" }, { status: 400 });
    }

    const campaignsCollection = await campaignsCol();
    const campaign = await campaignsCollection.findOne({ _id: new ObjectId(id) });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }
    if (campaign.status === "sending" || campaign.status === "sent") {
      return NextResponse.json({ error: "Campaign has already been sent or is currently sending" }, { status: 400 });
    }

    let htmlContent = campaign.htmlContent || "";
    let textContent = campaign.textContent || "";

    if (campaign.contentType === "template" && campaign.templateId) {
      const templatesCollection = await templatesCol();
      const template = await templatesCollection.findOne({ _id: new ObjectId(campaign.templateId) });
      if (!template) {
        return NextResponse.json({ error: "Selected template no longer exists" }, { status: 400 });
      }
      htmlContent = template.htmlContent || "";
      textContent = template.textContent || "";
    }

    if (campaign.contentType === "text" && !htmlContent) {
      htmlContent = wrapPlainTextAsHtml(textContent);
    }

    if (!htmlContent && !textContent) {
      return NextResponse.json({ error: "Campaign has no content to send" }, { status: 400 });
    }

    const subscribersCollection = await subscribersCol();
    const audienceQuery: any = { status: "active" };

    if (campaign.audienceType === "groups" && campaign.groupIds.length > 0) {
      audienceQuery.groupIds = { $in: campaign.groupIds };
    } else if (campaign.audienceType === "subscribers" && campaign.subscriberIds.length > 0) {
      audienceQuery._id = {
        $in: campaign.subscriberIds.filter((sid: string) => ObjectId.isValid(sid)).map((sid: string) => new ObjectId(sid)),
      };
    }

    const recipients = await subscribersCollection.find(audienceQuery).toArray();

    if (recipients.length === 0) {
      return NextResponse.json({ error: "No active subscribers match this audience" }, { status: 400 });
    }

    await campaignsCollection.updateOne(
      { _id: campaign._id },
      { $set: { status: "sending", updatedAt: new Date(), "stats.totalRecipients": recipients.length } }
    );

    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://admin.shriprasadam.in";
    const errors: string[] = [];
    let sentCount = 0;
    let failedCount = 0;

    const batches: Subscriber[][] = [];
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      batches.push(recipients.slice(i, i + BATCH_SIZE));
    }

    for (let b = 0; b < batches.length; b++) {
      const batch = batches[b];
      const results = await Promise.allSettled(
        batch.map(async (subscriber) => {
          const unsubscribeUrl = `${appBaseUrl}/api/unsubscribe?email=${encodeURIComponent(subscriber.email)}&campaignId=${campaign._id}`;
          const mergeData = { name: subscriber.name, email: subscriber.email, unsubscribeUrl };

          const personalizedHtml = htmlContent
            ? `${renderMergeTags(htmlContent, mergeData)}<p style="font-size:11px;color:#94a3b8;margin-top:24px;">You're receiving this because you subscribed to Shri Prasadam updates. <a href="${unsubscribeUrl}" style="color:#94a3b8;">Unsubscribe</a></p>`
            : undefined;
          const personalizedText = textContent ? renderMergeTags(textContent, mergeData) : undefined;

          return sendEmail({
            to: subscriber.email,
            toName: subscriber.name,
            fromName: campaign.fromName,
            fromEmail: campaign.fromEmail,
            subject: campaign.subject,
            html: personalizedHtml,
            text: personalizedText,
            headers: { "List-Unsubscribe": `<${unsubscribeUrl}>` },
          });
        })
      );

      results.forEach((result, idx) => {
        if (result.status === "fulfilled") {
          sentCount++;
        } else {
          failedCount++;
          errors.push(`${batch[idx].email}: ${result.reason?.message || "send failed"}`);
        }
      });

      if (b < batches.length - 1) {
        await sleep(BATCH_DELAY_MS);
      }
    }

    const finalStatus = failedCount === recipients.length ? "failed" : "sent";

    await campaignsCollection.updateOne(
      { _id: campaign._id },
      {
        $set: {
          status: finalStatus,
          sentAt: new Date(),
          updatedAt: new Date(),
          "stats.sent": sentCount,
          "stats.failed": failedCount,
          errorLog: errors.slice(0, 50),
        },
      }
    );

    return NextResponse.json({
      success: true,
      totalRecipients: recipients.length,
      sent: sentCount,
      failed: failedCount,
    });
  } catch (err: any) {
    console.error("POST /api/email-campaigns/[id]/send error:", err);
    return NextResponse.json({ error: "Failed to send campaign" }, { status: 500 });
  }
}
