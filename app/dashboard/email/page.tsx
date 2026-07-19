"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import EmailNavTabs from "@/components/EmailNavTabs";
import { Plus, Mail, Send, Users, Loader2 } from "lucide-react";

interface Campaign {
  _id: string;
  name: string;
  subject: string;
  status: string;
  stats: { totalRecipients: number; sent: number; failed: number; opened: number; clicked: number };
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
  cancelled: "bg-slate-100 text-slate-400",
};

export default function EmailCampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [campaignsRes, subsRes] = await Promise.all([
          fetch("/api/email-campaigns?limit=50"),
          fetch("/api/subscribers?limit=1&status=active"),
        ]);
        const campaignsData = await campaignsRes.json();
        const subsData = await subsRes.json();
        setCampaigns(campaignsData.items || []);
        setSubscriberCount(subsData.total ?? null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalSent = campaigns.reduce((sum, c) => sum + (c.stats?.sent || 0), 0);
  const sentCampaigns = campaigns.filter((c) => c.status === "sent").length;

  return (
    <DashboardLayout activeTabTitle="Email Marketing">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Email Marketing</h1>
            <p className="text-xs text-slate-500 mt-0.5">Create, send, and track email campaigns for Shri Prasadam.</p>
          </div>
          <button
            onClick={() => router.push("/dashboard/email/campaigns/new")}
            className="px-4 py-2 bg-brand-deep hover:bg-brand-primary text-white text-xs font-medium rounded-lg flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> New Campaign
          </button>
        </div>

        <EmailNavTabs />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-brand-primary rounded-lg"><Users className="w-5 h-5" /></div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Active Subscribers</div>
              <div className="text-xl font-bold text-slate-900">{subscriberCount ?? "—"}</div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><Send className="w-5 h-5" /></div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Campaigns Sent</div>
              <div className="text-xl font-bold text-slate-900">{sentCampaigns}</div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><Mail className="w-5 h-5" /></div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Emails Sent</div>
              <div className="text-xl font-bold text-slate-900">{totalSent}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Campaigns</h3>
          </div>
          {loading ? (
            <div className="p-10 flex justify-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : campaigns.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-400">
              No campaigns yet. Create your first campaign to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-4">Campaign</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Recipients</th>
                    <th className="p-4">Sent</th>
                    <th className="p-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  {campaigns.map((c) => (
                    <tr
                      key={c._id}
                      className="hover:bg-slate-50 cursor-pointer"
                      onClick={() => router.push(`/dashboard/email/campaigns/${c._id}`)}
                    >
                      <td className="p-4">
                        <div className="font-semibold text-slate-900">{c.name}</div>
                        <div className="text-slate-400 text-[11px]">{c.subject}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${statusStyles[c.status] || "bg-slate-100 text-slate-500"}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="p-4">{c.stats?.totalRecipients ?? 0}</td>
                      <td className="p-4">{c.stats?.sent ?? 0}</td>
                      <td className="p-4 text-slate-400 text-[11px]">
                        {c.sentAt
                          ? new Date(c.sentAt).toLocaleDateString()
                          : c.scheduledAt
                          ? `Scheduled: ${new Date(c.scheduledAt).toLocaleDateString()}`
                          : new Date(c.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
