"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import EmailNavTabs from "@/components/EmailNavTabs";
import {
  Upload, Download, Plus, Search, Trash2, UserX, UserCheck, Tag, Loader2, X, ChevronLeft, ChevronRight,
} from "lucide-react";

interface Subscriber {
  _id: string;
  email: string;
  name?: string;
  phone?: string;
  status: "active" | "unsubscribed" | "bounced";
  groupIds: string[];
  tags: string[];
  source: string;
  createdAt: string;
}

interface Group {
  _id: string;
  name: string;
  subscriberCount: number;
}

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newSubscriber, setNewSubscriber] = useState({ email: "", name: "", phone: "" });
  const [newGroupName, setNewGroupName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadGroups = useCallback(async () => {
    try {
      const res = await fetch("/api/groups");
      const data = await res.json();
      setGroups(data.items || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadSubscribers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        status: statusFilter,
      });
      if (search) params.set("search", search);
      if (groupFilter) params.set("groupId", groupFilter);

      const res = await fetch(`/api/subscribers?${params.toString()}`);
      const data = await res.json();
      setSubscribers(data.items || []);
      setTotal(data.total || 0);
      setSelectedIds([]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter, groupFilter]);

  useEffect(() => { loadGroups(); }, [loadGroups]);
  useEffect(() => { loadSubscribers(); }, [loadSubscribers]);

  const toggleSelectAll = () => {
    if (selectedIds.length === subscribers.length) setSelectedIds([]);
    else setSelectedIds(subscribers.map((s) => s._id));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const runBulkAction = async (action: string, groupId?: string) => {
    if (selectedIds.length === 0) return;
    if (action === "delete" && !confirm(`Delete ${selectedIds.length} subscriber(s)? This cannot be undone.`)) return;
    try {
      await fetch("/api/subscribers/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, action, groupId }),
      });
      await loadSubscribers();
      await loadGroups();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSubscriber = async () => {
    if (!newSubscriber.email) return;
    try {
      const res = await fetch("/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSubscriber),
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewSubscriber({ email: "", name: "", phone: "" });
        await loadSubscribers();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to add subscriber");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroupName }),
      });
      setNewGroupName("");
      setShowGroupModal(false);
      await loadGroups();
    } catch (err) {
      console.error(err);
    }
  };

  const handleImportCSV = async (file: File) => {
    setImporting(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (groupFilter) formData.append("groupId", groupFilter);

      const res = await fetch("/api/subscribers/import", { method: "POST", body: formData });
      const data = await res.json();
      setImportResult(data);
      await loadSubscribers();
      await loadGroups();
    } catch (err) {
      console.error(err);
      setImportResult({ error: "Import failed. Please check the file and try again." });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleExportCSV = () => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (groupFilter) params.set("groupId", groupFilter);
    window.location.href = `/api/subscribers/export?${params.toString()}`;
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <DashboardLayout activeTabTitle="Email Marketing">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Email Marketing</h1>
            <p className="text-xs text-slate-500 mt-0.5">Manage your subscriber list and audience groups.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleImportCSV(e.target.files[0])}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 text-xs font-medium hover:bg-slate-50 flex items-center gap-1.5 disabled:opacity-50"
            >
              {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              Import CSV
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 text-xs font-medium hover:bg-slate-50 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 py-2 bg-brand-deep hover:bg-brand-primary text-white text-xs font-medium rounded-lg flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Add Subscriber
            </button>
          </div>
        </div>

        <EmailNavTabs />

        {importResult && (
          <div className={`mb-4 p-4 rounded-xl border text-xs font-medium flex justify-between items-start ${importResult.error ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-emerald-50 border-emerald-200 text-emerald-800"}`}>
            <div>
              {importResult.error ? (
                <span>{importResult.error}</span>
              ) : (
                <span>
                  Imported {importResult.imported}, updated {importResult.updated}, skipped {importResult.skipped} of {importResult.totalRows} rows.
                  {importResult.errors?.length > 0 && ` ${importResult.errors.length} row error(s) — check console for details.`}
                </span>
              )}
            </div>
            <button onClick={() => setImportResult(null)} className="opacity-60 hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
          </div>
        )}

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by email or name..."
              value={search}
              onChange={(e) => { setPage(1); setSearch(e.target.value); }}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-xs rounded-lg focus:outline-none focus:border-brand-primary focus:bg-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 text-xs rounded-lg focus:outline-none"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="unsubscribed">Unsubscribed</option>
            <option value="bounced">Bounced</option>
          </select>
          <select
            value={groupFilter}
            onChange={(e) => { setPage(1); setGroupFilter(e.target.value); }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 text-xs rounded-lg focus:outline-none"
          >
            <option value="">All groups</option>
            {groups.map((g) => (
              <option key={g._id} value={g._id}>{g.name} ({g.subscriberCount})</option>
            ))}
          </select>
          <button
            onClick={() => setShowGroupModal(true)}
            className="px-3 py-2 bg-white border border-dashed border-slate-300 rounded-lg text-slate-600 text-xs font-medium hover:bg-slate-50 flex items-center gap-1.5 whitespace-nowrap"
          >
            <Tag className="w-3.5 h-3.5" /> New Group
          </button>
        </div>

        {selectedIds.length > 0 && (
          <div className="bg-brand-deep/5 border border-brand-deep/20 rounded-xl p-3 mb-4 flex items-center justify-between text-xs flex-wrap gap-2">
            <span className="font-semibold text-brand-deep">{selectedIds.length} selected</span>
            <div className="flex gap-2 flex-wrap">
              <select
                onChange={(e) => e.target.value && runBulkAction("addToGroup", e.target.value)}
                defaultValue=""
                className="px-2 py-1.5 bg-white border border-slate-200 rounded-md text-[11px]"
              >
                <option value="" disabled>Add to group...</option>
                {groups.map((g) => <option key={g._id} value={g._id}>{g.name}</option>)}
              </select>
              <button onClick={() => runBulkAction("unsubscribe")} className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-md hover:bg-slate-50 flex items-center gap-1"><UserX className="w-3 h-3" /> Unsubscribe</button>
              <button onClick={() => runBulkAction("resubscribe")} className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-md hover:bg-slate-50 flex items-center gap-1"><UserCheck className="w-3 h-3" /> Resubscribe</button>
              <button onClick={() => runBulkAction("delete")} className="px-2.5 py-1.5 bg-white border border-rose-200 text-rose-600 rounded-md hover:bg-rose-50 flex items-center gap-1"><Trash2 className="w-3 h-3" /> Delete</button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-10 flex justify-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : subscribers.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-400">No subscribers found. Import a CSV or add one manually.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-4 w-8">
                      <input type="checkbox" checked={selectedIds.length === subscribers.length} onChange={toggleSelectAll} />
                    </th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Name</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Source</th>
                    <th className="p-4">Added</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  {subscribers.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-50">
                      <td className="p-4"><input type="checkbox" checked={selectedIds.includes(s._id)} onChange={() => toggleSelect(s._id)} /></td>
                      <td className="p-4 font-semibold text-slate-900">{s.email}</td>
                      <td className="p-4">{s.name || "—"}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                          s.status === "active" ? "bg-teal-50 text-teal-600" : s.status === "unsubscribed" ? "bg-slate-100 text-slate-500" : "bg-rose-50 text-rose-600"
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400">{s.source}</td>
                      <td className="p-4 text-slate-400 text-[11px]">{new Date(s.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="p-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
            <span>{total} total subscriber{total !== 1 ? "s" : ""}</span>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="p-1.5 border border-slate-200 rounded-md disabled:opacity-40"><ChevronLeft className="w-3.5 h-3.5" /></button>
              <span>Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="p-1.5 border border-slate-200 rounded-md disabled:opacity-40"><ChevronRight className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-900">Add Subscriber</h3>
              <button onClick={() => setShowAddModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="space-y-3">
              <input placeholder="Email address" type="email" value={newSubscriber.email} onChange={(e) => setNewSubscriber({ ...newSubscriber, email: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs rounded-lg focus:outline-none" />
              <input placeholder="Name (optional)" value={newSubscriber.name} onChange={(e) => setNewSubscriber({ ...newSubscriber, name: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs rounded-lg focus:outline-none" />
              <input placeholder="Phone (optional)" value={newSubscriber.phone} onChange={(e) => setNewSubscriber({ ...newSubscriber, phone: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs rounded-lg focus:outline-none" />
            </div>
            <button onClick={handleAddSubscriber} className="w-full mt-4 py-2.5 bg-brand-deep hover:bg-brand-primary text-white text-xs font-semibold rounded-lg">Add Subscriber</button>
          </div>
        </div>
      )}

      {showGroupModal && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-900">Create Group</h3>
              <button onClick={() => setShowGroupModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <input placeholder="Group name (e.g. VIP Customers)" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs rounded-lg focus:outline-none" />
            <button onClick={handleCreateGroup} className="w-full mt-4 py-2.5 bg-brand-deep hover:bg-brand-primary text-white text-xs font-semibold rounded-lg">Create Group</button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
