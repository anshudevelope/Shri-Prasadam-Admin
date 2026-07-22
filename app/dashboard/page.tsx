"use client";
import DashboardLayout from "@/components/DashboardLayout";
import { TrendingUp, CheckCircle, MousePointer, Radio, Plus, MessageSquare, Mail, AlertTriangle } from "lucide-react";

export default function GeneralDashboard() {
  return (
    <DashboardLayout activeTabTitle="Dashboard Overview">
      <div className="space-y-8 max-w-[1400px] mx-auto">
        
        {/* Upper Action Banner Section */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Marketing Performance</h1>
            <p className="text-xs text-slate-500 mt-0.5">Real-time overview of your Shri Prasadam campaign engagement.</p>
          </div>
          <div className="flex gap-2 text-xs">
            <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50">
              Last 30 Days
            </button>
            <button className="px-4 py-2 bg-brand-deep hover:bg-brand-primary text-white font-medium rounded-lg flex items-center gap-1.5 shadow-sm">
              <Plus className="w-3.5 h-3.5" /> New Campaign
            </button>
          </div>
        </div>

        {/* KPI Grid Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total Messages Hero Metric */}
          <div className="bg-gradient-to-br from-brand-deep to-brand-primary p-5 rounded-xl shadow-md text-white relative overflow-hidden flex flex-col justify-between min-h-[140px]">
            <div className="absolute right-[-10px] bottom-[-20px] opacity-10">
              <TrendingUp className="w-36 h-36" />
            </div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-slate-300">Total Messages Sent</div>
            <div className="text-3xl font-bold tracking-tight my-2">842.5K</div>
            <div className="text-[11px] text-teal-300 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5" /> +12.4% from last month
            </div>
          </div>

          {/* Delivery Rate Block */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[140px]">
            <div className="flex justify-between items-start">
              <div className="p-2.5 bg-blue-50 text-brand-primary rounded-lg">
                <CheckCircle className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">98.2%</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Delivery Rate</span>
              <span className="text-xl font-bold text-slate-900 mt-1 block">827,331</span>
            </div>
          </div>

          {/* CTR Analytics Block */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[140px]">
            <div className="flex justify-between items-start">
              <div className="p-2.5 bg-slate-50 text-slate-700 rounded-lg">
                <MousePointer className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">-2.1%</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">CTR (Global)</span>
              <span className="text-xl font-bold text-slate-900 mt-1 block">14.8%</span>
            </div>
          </div>

          {/* Active Broadcast Channels */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[140px]">
            <div className="flex justify-between items-start">
              <div className="p-2.5 bg-slate-50 text-slate-700 rounded-lg">
                <Radio className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Active</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Active Campaigns</span>
              <span className="text-xl font-bold text-slate-900 mt-1 block">24</span>
            </div>
          </div>
        </div>

        {/* Data Split Table & Analytics Rows */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Table Section */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Recent Campaign Activity</h3>
              <button className="text-xs font-semibold text-brand-accent hover:underline">View All</button>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-4">Campaign Name</th>
                    <th className="p-4">Channel</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Engagement</th>
                    <th className="p-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  <tr>
                    <td className="p-4 font-semibold text-slate-900">Summer Festive Sale</td>
                    <td className="p-4 flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5 text-blue-400" /> WhatsApp</td>
                    <td className="p-4"><span className="px-2 py-0.5 bg-teal-50 text-teal-600 rounded text-[10px] font-bold">Completed</span></td>
                    <td className="p-4">88.5%</td>
                    <td className="p-4 text-slate-400 text-[11px]">Oct 12, 2026</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-slate-900">Weekly Prasad Newsletter</td>
                    <td className="p-4 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-indigo-400" /> Email</td>
                    <td className="p-4"><span className="px-2 py-0.5 bg-blue-50 text-brand-accent rounded text-[10px] font-bold">In Progress</span></td>
                    <td className="p-4">42.1%</td>
                    <td className="p-4 text-slate-400 text-[11px]">Oct 15, 2026</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-slate-900">Customer Reactivation</td>
                    <td className="p-4 flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5 text-blue-400" /> WhatsApp</td>
                    <td className="p-4"><span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold">Scheduled</span></td>
                    <td className="p-4">--</td>
                    <td className="p-4 text-slate-400 text-[11px]">Oct 18, 2026</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Distribution Split */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Channel Split</h3>
            </div>
            <div className="my-6 flex flex-col items-center justify-center">
              {/* Premium Simulated Circular Radial Graph Display */}
              <div className="w-36 h-36 rounded-full border-8 border-slate-100 border-t-brand-deep border-r-brand-deep flex flex-col items-center justify-center relative">
                <span className="text-2xl font-bold text-slate-900">72%</span>
                <span className="text-[10px] font-medium text-slate-400">WhatsApp</span>
              </div>
            </div>
            <div className="space-y-2 text-xs font-medium">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-slate-500"><span className="w-2.5 h-2.5 bg-brand-deep rounded-full" /> WhatsApp Automation</span>
                <span className="font-bold text-slate-800">72.4%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-slate-500"><span className="w-2.5 h-2.5 bg-brand-accent rounded-full" /> Email Campaigns</span>
                <span className="font-bold text-slate-800">27.6%</span>
              </div>
            </div>
            <button className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs mt-4 transition">
              Download Full Report
            </button>
          </div>
        </div>

        {/* Systems Diagnostics Notice Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-xl flex gap-3 text-xs">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg h-fit">⚡</span>
            <div>
              <span className="font-bold block text-emerald-900 mb-0.5">Optimization Tip</span>
              <p className="text-slate-600 font-medium leading-relaxed">Your "Festive" campaigns perform 40% better on WhatsApp between 10 AM and 1 PM.</p>
            </div>
          </div>
          <div className="p-4 bg-blue-50/40 border border-blue-100 rounded-xl flex gap-3 text-xs">
            <span className="p-2 bg-blue-50 text-brand-primary rounded-lg h-fit">👤</span>
            <div>
              <span className="font-bold block text-blue-900 mb-0.5">New Leads Added</span>
              <p className="text-slate-600 font-medium leading-relaxed">2,450 new customers imported from CRM today. Sync active.</p>
            </div>
          </div>
          <div className="p-4 bg-amber-50/40 border border-amber-100 rounded-xl flex gap-3 text-xs">
            <span className="p-2 bg-amber-50 text-amber-600 rounded-lg h-fit"><AlertTriangle className="w-3.5 h-3.5" /></span>
            <div>
              <span className="font-bold block text-amber-900 mb-0.5">System Health</span>
              <p className="text-slate-600 font-medium leading-relaxed">Webhook latency increased by 15ms. Monitoring active for Meta APIs.</p>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}