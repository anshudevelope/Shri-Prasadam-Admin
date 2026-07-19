"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import EmailNavTabs from "@/components/EmailNavTabs";
import { Plus, FileText, Trash2, Loader2 } from "lucide-react";

interface Template {
  _id: string;
  name: string;
  subject: string;
  contentType: "html" | "text";
  category?: string;
  updatedAt: string;
}

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/templates");
      const data = await res.json();
      setTemplates(data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    await fetch(`/api/templates/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <DashboardLayout activeTabTitle="Email Marketing">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Email Marketing</h1>
            <p className="text-xs text-slate-500 mt-0.5">Reusable templates for your email campaigns.</p>
          </div>
          <button
            onClick={() => router.push("/dashboard/email/templates/new")}
            className="px-4 py-2 bg-brand-deep hover:bg-brand-primary text-white text-xs font-medium rounded-lg flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> New Template
          </button>
        </div>

        <EmailNavTabs />

        {loading ? (
          <div className="p-10 flex justify-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
        ) : templates.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 text-center text-xs text-slate-400">
            No templates yet. Create your first reusable template.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {templates.map((t) => (
              <div
                key={t._id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between hover:border-brand-primary/40 transition cursor-pointer"
                onClick={() => router.push(`/dashboard/email/templates/${t._id}`)}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-blue-50 text-brand-primary rounded-lg"><FileText className="w-4 h-4" /></div>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase">{t.contentType}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{t.name}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">{t.subject}</p>
                </div>
                <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400">Updated {new Date(t.updatedAt).toLocaleDateString()}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(t._id); }}
                    className="text-rose-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
