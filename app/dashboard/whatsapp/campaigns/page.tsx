"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    BarChart3,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Search,
    Layers,
    Clock,
    Eye,
    ArrowLeft,
    Send,
    TrendingUp,
    ArrowUpRight,
    Image as ImageIcon,
    MessageSquare,
    Users
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

interface CampaignItem {
    _id: string;
    campaignName: string;
    templateName: string;
    message: string;
    totalRecipients: number;
    successCount: number;
    failureCount: number;
    mediaUrl?: string;
    mediaType?: string;
    dispatchedAt: string;
    deliveryStatus: string;
    dispatchResults: Array<{ phone: string; status: string; id?: string; error?: string }>;
}

export default function AllWhatsAppCampaignsPage() {
    const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
    const [stats, setStats] = useState({
        totalCampaigns: 0,
        totalDispatched: 0,
        totalSuccessful: 0,
        totalFailed: 0,
        deliveryRate: "0.0%",
    });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCampaign, setSelectedCampaign] = useState<CampaignItem | null>(null);

    // Fetch all campaigns and performance analytics
    const fetchCampaigns = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/whatsapp-campaigns");
            const data = await res.json();
            if (res.ok && data.success) {
                setCampaigns(data.campaigns || []);
                setStats(data.stats || {
                    totalCampaigns: 0,
                    totalDispatched: 0,
                    totalSuccessful: 0,
                    totalFailed: 0,
                    deliveryRate: "0.0%",
                });
            }
        } catch (err) {
            console.error("Failed to load campaigns:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const filteredCampaigns = campaigns.filter(
        (c) =>
            c.campaignName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.templateName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <DashboardLayout activeTabTitle="WhatsApp Automation">

            <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8 space-y-8 font-sans text-slate-800">

                {/* TOP HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Link
                                href="/dashboard/whatsapp"
                                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" /> Back to Broadcast Studio
                            </Link>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            WhatsApp Campaign Analytics
                            <span className="text-xs bg-indigo-50 text-indigo-600 font-semibold px-2.5 py-1 rounded-full border border-indigo-200">
                                Historical Records
                            </span>
                        </h1>
                        <p className="text-slate-500 text-sm">
                            Monitor broadcast performance, recipient delivery logs, and campaign history.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchCampaigns}
                            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition flex items-center gap-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Sync Data
                        </button>
                        <Link
                            href="/dashboard/whatsapp"
                            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition flex items-center gap-2 shadow-sm"
                        >
                            <Send className="w-4 h-4" /> New Broadcast
                        </Link>
                    </div>
                </div>

                {/* KPI METRICS OVERVIEW */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Campaigns</p>
                            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{stats.totalCampaigns}</h3>
                            <span className="text-xs text-slate-400 mt-1 inline-block">Executed via Cloud API</span>
                        </div>
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-700">
                            <Layers className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Dispatched</p>
                            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{stats.totalDispatched}</h3>
                            <span className="text-xs text-emerald-600 mt-1 flex items-center gap-1 font-medium">
                                <TrendingUp className="w-3.5 h-3.5" /> Total target reach
                            </span>
                        </div>
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                            <Users className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Delivered Messages</p>
                            <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">{stats.totalSuccessful}</h3>
                            <span className="text-xs text-slate-400 mt-1 inline-block">Confirmed delivered</span>
                        </div>
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Delivery Rate</p>
                            <h3 className="text-2xl font-extrabold text-indigo-600 mt-1">{stats.deliveryRate}</h3>
                            <span className="text-xs text-slate-400 mt-1 inline-block">Success accuracy</span>
                        </div>
                        <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
                            <ArrowUpRight className="w-6 h-6" />
                        </div>
                    </div>

                </div>

                {/* CAMPAIGN LISTINGS TABLE */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

                    <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by campaign name or template..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                            />
                        </div>

                        <div className="text-xs text-slate-500 font-medium">
                            Showing <span className="font-bold text-slate-900">{filteredCampaigns.length}</span> campaign(s)
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50/70 text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 font-bold">Campaign Name</th>
                                    <th className="px-6 py-4 font-bold">Template</th>
                                    <th className="px-6 py-4 font-bold">Recipients</th>
                                    <th className="px-6 py-4 font-bold">Success / Failure</th>
                                    <th className="px-6 py-4 font-bold">Dispatched At</th>
                                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-12 text-slate-400">
                                            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                                            Loading campaign analytics...
                                        </td>
                                    </tr>
                                ) : filteredCampaigns.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-12 text-slate-400">
                                            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                            No WhatsApp campaigns found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCampaigns.map((item) => (
                                        <tr key={item._id} className="hover:bg-slate-50/50 transition">
                                            <td className="px-6 py-4 font-bold text-slate-900">
                                                <div className="flex items-center gap-2">
                                                    {item.campaignName}
                                                    {item.mediaUrl && (
                                                        <span title="Contains Media Attachment">
                                                            <ImageIcon className="w-4 h-4 text-slate-400" />
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-md font-mono">
                                                    {item.templateName}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-slate-800">
                                                {item.totalRecipients} Recipient(s)
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                                                        <CheckCircle2 className="w-4 h-4" /> {item.successCount}
                                                    </span>
                                                    {item.failureCount > 0 && (
                                                        <span className="text-rose-600 font-bold flex items-center gap-1">
                                                            <XCircle className="w-4 h-4" /> {item.failureCount}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 text-xs">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                    {new Date(item.dispatchedAt).toLocaleString("en-IN")}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => setSelectedCampaign(item)}
                                                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-semibold rounded-lg text-xs transition flex items-center gap-1 ml-auto"
                                                >
                                                    <Eye className="w-3.5 h-3.5" /> View Audit
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                </div>

                {/* AUDIT MODAL DRILL-DOWN */}
                {selectedCampaign && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">

                            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">{selectedCampaign.campaignName}</h3>
                                    <p className="text-xs text-slate-400 font-mono mt-0.5">Template: {selectedCampaign.templateName}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedCampaign(null)}
                                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Message Content Dispatched</h4>
                                    <p className="text-sm bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-700 whitespace-pre-wrap">
                                        {selectedCampaign.message}
                                    </p>
                                </div>

                                {selectedCampaign.mediaUrl && (
                                    <div>
                                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Media Header Attached</h4>
                                        <a
                                            href={selectedCampaign.mediaUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs text-indigo-600 hover:underline break-all"
                                        >
                                            {selectedCampaign.mediaUrl}
                                        </a>
                                    </div>
                                )}

                                <div>
                                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Recipient Delivery Status Log</h4>
                                    <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                                        {selectedCampaign.dispatchResults.map((r, idx) => (
                                            <div key={idx} className="p-3 bg-white text-xs flex justify-between items-center">
                                                <span className="font-mono text-slate-700">{r.phone}</span>
                                                {r.status === "SUCCESS" ? (
                                                    <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3" /> Delivered ({r.id?.slice(0, 10)}...)
                                                    </span>
                                                ) : (
                                                    <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded flex items-center gap-1">
                                                        <XCircle className="w-3 h-3" /> Failed: {r.error}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedCampaign(null)}
                                className="w-full py-2.5 bg-slate-900 text-white font-semibold rounded-xl text-sm hover:bg-slate-800 transition"
                            >
                                Close Audit
                            </button>

                        </div>
                    </div>
                )}

            </div>

        </DashboardLayout>
    );
}