"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { Save, ArrowLeft, Loader2 } from "lucide-react";

export default function TemplateEditorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const isNew = id === "new";

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [contentType, setContentType] = useState<"html" | "text">("html");
  const [htmlContent, setHtmlContent] = useState("");
  const [textContent, setTextContent] = useState("");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew) return;
    (async () => {
      try {
        const res = await fetch(`/api/templates/${id}`);
        const data = await res.json();
        if (data.template) {
          setName(data.template.name);
          setSubject(data.template.subject);
          setCategory(data.template.category || "general");
          setContentType(data.template.contentType || "html");
          setHtmlContent(data.template.htmlContent || "");
          setTextContent(data.template.textContent || "");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isNew]);

  const handleSave = async () => {
    if (!name.trim() || !subject.trim()) {
      alert("Template name and subject are required");
      return;
    }
    setSaving(true);
    try {
      const payload = { name, subject, category, contentType, htmlContent, textContent };
      const res = await fetch(isNew ? "/api/templates" : `/api/templates/${id}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        router.push("/dashboard/email/templates");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save template");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout activeTabTitle="Email Marketing">
        <div className="p-10 flex justify-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeTabTitle="Email Marketing">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.push("/dashboard/email/templates")} className="p-2 hover:bg-slate-100 rounded-lg">
            <ArrowLeft className="w-4 h-4 text-slate-500" />
          </button>
          <h1 className="text-xl font-bold text-slate-900">{isNew ? "New Template" : "Edit Template"}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2">Template Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Festival Sale Announcement" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 text-xs rounded-lg focus:outline-none focus:border-brand-primary focus:bg-white" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2">Default Subject Line</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Rath Yatra Sale — Up to 40% Off" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 text-xs rounded-lg focus:outline-none focus:border-brand-primary focus:bg-white" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 text-xs rounded-lg focus:outline-none">
                <option value="general">General</option>
                <option value="promotion">Promotion / Sale</option>
                <option value="new-arrival">New Arrival</option>
                <option value="festival">Festival Greeting</option>
                <option value="newsletter">Newsletter</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2">Content Type</label>
              <div className="flex gap-2">
                <button onClick={() => setContentType("html")} className={`flex-1 py-2 rounded-lg text-xs font-semibold border ${contentType === "html" ? "bg-brand-deep text-white border-brand-deep" : "bg-white border-slate-200 text-slate-600"}`}>Raw HTML</button>
                <button onClick={() => setContentType("text")} className={`flex-1 py-2 rounded-lg text-xs font-semibold border ${contentType === "text" ? "bg-brand-deep text-white border-brand-deep" : "bg-white border-slate-200 text-slate-600"}`}>Plain Text</button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2">
                {contentType === "html" ? "HTML Content" : "Text Content"}
              </label>
              <p className="text-[10px] text-slate-400 mb-2">Merge tags available: {"{{name}}"}, {"{{email}}"}, {"{{unsubscribe_url}}"}</p>
              {contentType === "html" ? (
                <textarea
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  rows={16}
                  placeholder="<h1>Hello {{name}}!</h1><p>Your content here...</p>"
                  className="w-full p-3 bg-slate-50 border border-slate-200 text-xs font-mono rounded-lg focus:outline-none focus:border-brand-primary focus:bg-white resize-none"
                />
              ) : (
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  rows={16}
                  placeholder="Hello {{name}}, ..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 text-xs rounded-lg focus:outline-none focus:border-brand-primary focus:bg-white resize-none"
                />
              )}
            </div>
            <button onClick={handleSave} disabled={saving} className="w-full py-2.5 bg-brand-deep hover:bg-brand-primary text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Template
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">Live Preview</div>
            <div className="p-4 bg-slate-50 min-h-[500px]">
              {contentType === "html" ? (
                <iframe title="preview" srcDoc={htmlContent} className="w-full h-[500px] bg-white rounded-lg border border-slate-200" />
              ) : (
                <div className="w-full h-[500px] bg-white rounded-lg border border-slate-200 p-4 text-xs whitespace-pre-wrap text-slate-700 overflow-y-auto">
                  {textContent || "Your plain text preview will appear here..."}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
