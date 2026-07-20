"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { ArrowLeft, Loader2, Send, Trash2 } from "lucide-react";

interface Campaign {
  _id: string;
  name: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  status: string;
  contentType: string;
  htmlContent?: string;
  textContent?: string;
  audienceType: string;
  stats: { totalRecipients: number; sent: number; failed: number; opened: number; clicked: number };
  errorLog?: string[];
  createdAt: string;
  sentAt: string | null;
  scheduledAt: string | null;
}

const statusStyles: Record<string, string> = {
  draft: "bg-slate-100 text-slate-500",
  scheduled: "bg-blue-50 text-brand-accent",
  sending: "bg-amber-50 text-amber-600",
  sent: "bg-teal-50 text-teal-600",
  failed: "bg-rose-50 text-rose-600",
};

export default function CampaignDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/email-campaigns/${id}`);
      const data = await res.json();
      setCampaign(data.campaign || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleSend = async () => {
    if (!confirm("Send this campaign now? This cannot be undone.")) return;
    setSending(true);
    try {
      const res = await fetch(`/api/email-campaigns/${id}/send`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) alert(data.error || "Failed to send campaign");
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this campaign?")) return;
    await fetch(`/api/email-campaigns/${id}`, { method: "DELETE" });
    router.push("/dashboard/email");
  };

  if (loading) {
    return (
      <DashboardLayout activeTabTitle="Email Marketing">
        <div className="p-10 flex justify-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
      </DashboardLayout>
    );
  }

  if (!campaign) {
    return (
      <DashboardLayout activeTabTitle="Email Marketing">
        <div className="p-10 text-center text-xs text-slate-400">Campaign not found.</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeTabTitle="Email Marketing">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/dashboard/email")} className="p-2 hover:bg-slate-100 rounded-lg">
              <ArrowLeft className="w-4 h-4 text-slate-500" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{campaign.name}</h1>
              <p className="text-xs text-slate-400">{campaign.subject}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${statusStyles[campaign.status] || "bg-slate-100 text-slate-500"}`}>
              {campaign.status}
            </span>
            {(campaign.status === "draft" || campaign.status === "scheduled") && (
              <button onClick={handleSend} disabled={sending} className="px-4 py-2 bg-brand-deep hover:bg-brand-primary text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 disabled:opacity-50">
                {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Send Now
              </button>
            )}
            {campaign.status !== "sending" && (
              <button onClick={handleDelete} className="p-2 border border-rose-200 text-rose-500 rounded-lg hover:bg-rose-50"><Trash2 className="w-3.5 h-3.5" /></button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            ["Recipients", campaign.stats?.totalRecipients ?? 0],
            ["Sent", campaign.stats?.sent ?? 0],
            ["Failed", campaign.stats?.failed ?? 0],
            ["Opened", campaign.stats?.opened ?? 0],
          ].map(([label, value]) => (
            <div key={label as string} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">{label}</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">Content Preview</div>
            <div className="p-4 bg-slate-50">
              {campaign.htmlContent ? (
                <iframe title="preview" srcDoc={campaign.htmlContent} className="w-full h-96 bg-white rounded-lg border border-slate-200" />
              ) : (
                <div className="w-full h-96 bg-white rounded-lg border border-slate-200 p-4 text-xs whitespace-pre-wrap text-slate-700 overflow-y-auto">
                  {campaign.textContent || "No content"}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3 text-xs">
            <div className="flex justify-between border-b border-slate-100 pb-2"><span className="text-slate-400">From</span><span className="font-semibold text-slate-800">{campaign.fromName} &lt;{campaign.fromEmail}&gt;</span></div>
            <div className="flex justify-between border-b border-slate-100 pb-2"><span className="text-slate-400">Audience</span><span className="font-semibold text-slate-800 capitalize">{campaign.audienceType}</span></div>
            <div className="flex justify-between border-b border-slate-100 pb-2"><span className="text-slate-400">Created</span><span className="font-semibold text-slate-800">{new Date(campaign.createdAt).toLocaleString()}</span></div>
            {campaign.sentAt && <div className="flex justify-between border-b border-slate-100 pb-2"><span className="text-slate-400">Sent</span><span className="font-semibold text-slate-800">{new Date(campaign.sentAt).toLocaleString()}</span></div>}
            {campaign.errorLog && campaign.errorLog.length > 0 && (
              <div className="pt-2">
                <span className="text-rose-500 font-semibold block mb-1.5">Delivery Errors ({campaign.errorLog.length})</span>
                <div className="max-h-40 overflow-y-auto space-y-1 text-[10px] text-rose-500 bg-rose-50 p-2 rounded-lg">
                  {campaign.errorLog.map((e, i) => <div key={i}>{e}</div>)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
