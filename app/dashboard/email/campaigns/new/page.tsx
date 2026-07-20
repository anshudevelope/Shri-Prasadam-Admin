"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { ArrowLeft, Loader2, Send, Save, Eye } from "lucide-react";

interface Group { _id: string; name: string; subscriberCount: number; }
interface Template { _id: string; name: string; subject: string; contentType: "html" | "text"; htmlContent?: string; textContent?: string; }

// Replaces merge tags with sample data purely for the live preview panel —
// actual sends use each subscriber's real name/email (see renderTemplate.ts).
function previewMergeTags(content: string): string {
  return content
    .replace(/\{\{\s*name\s*\}\}/gi, "Priya")
    .replace(/\{\{\s*email\s*\}\}/gi, "priya@example.com")
    .replace(/\{\{\s*unsubscribe_url\s*\}\}/gi, "#");
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export default function NewCampaignPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [fromName, setFromName] = useState("Shri Prasadam");
  const [fromEmail, setFromEmail] = useState("orders@shriprasadam.in");

  const [audienceType, setAudienceType] = useState<"all" | "groups">("all");
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

  const [contentType, setContentType] = useState<"template" | "html" | "text">("html");
  const [templateId, setTemplateId] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [textContent, setTextContent] = useState("");

  const [sendOption, setSendOption] = useState<"now" | "schedule">("now");
  const [scheduledAt, setScheduledAt] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [groupsRes, templatesRes] = await Promise.all([
          fetch("/api/groups"),
          fetch("/api/templates"),
        ]);
        setGroups((await groupsRes.json()).items || []);
        setTemplates((await templatesRes.json()).items || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingData(false);
      }
    })();
  }, []);

  const handleTemplateSelect = (tid: string) => {
    setTemplateId(tid);
    const t = templates.find((tpl) => tpl._id === tid);
    if (t) {
      if (!subject) setSubject(t.subject);
      setHtmlContent(t.htmlContent || "");
      setTextContent(t.textContent || "");
    }
  };

  const toggleGroup = (gid: string) => {
    setSelectedGroupIds((prev) => (prev.includes(gid) ? prev.filter((g) => g !== gid) : [...prev, gid]));
  };

  const buildPayload = () => ({
    name,
    subject,
    fromName,
    fromEmail,
    contentType,
    templateId: contentType === "template" ? templateId : null,
    htmlContent,
    textContent,
    audienceType,
    groupIds: audienceType === "groups" ? selectedGroupIds : [],
    scheduledAt: sendOption === "schedule" && scheduledAt ? scheduledAt : null,
  });

  const validate = () => {
    if (!name.trim() || !subject.trim()) { alert("Campaign name and subject are required"); return false; }
    if (contentType === "template" && !templateId) { alert("Please select a template"); return false; }
    if (contentType === "html" && !htmlContent.trim()) { alert("Please add HTML content"); return false; }
    if (contentType === "text" && !textContent.trim()) { alert("Please add text content"); return false; }
    if (audienceType === "groups" && selectedGroupIds.length === 0) { alert("Please select at least one group"); return false; }
    if (sendOption === "schedule" && !scheduledAt) { alert("Please pick a schedule date/time"); return false; }
    return true;
  };

  const handleSaveDraft = async () => {
    if (!name.trim() || !subject.trim()) { alert("Campaign name and subject are required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/email-campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const data = await res.json();
      if (res.ok) router.push(`/dashboard/email/campaigns/${data.id}`);
      else alert(data.error || "Failed to save campaign");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSendNow = async () => {
    if (!validate()) return;
    if (!confirm("Send this campaign now? This cannot be undone.")) return;
    setSaving(true);
    try {
      const createRes = await fetch("/api/email-campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const created = await createRes.json();
      if (!createRes.ok) { alert(created.error || "Failed to create campaign"); return; }

      const sendRes = await fetch(`/api/email-campaigns/${created.id}/send`, { method: "POST" });
      const sendData = await sendRes.json();
      if (sendRes.ok) {
        router.push(`/dashboard/email/campaigns/${created.id}`);
      } else {
        alert(sendData.error || "Campaign was created but sending failed. You can retry from the campaign page.");
        router.push(`/dashboard/email/campaigns/${created.id}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Live preview content — mirrors what the send route resolves at send time.
  const previewIsHtml = contentType === "html" || contentType === "template";
  const previewHtmlSrc = previewIsHtml && htmlContent ? previewMergeTags(htmlContent) : "";
  const previewTextSrc = contentType === "text" && textContent ? previewMergeTags(textContent) : "";
  const hasPreviewContent = previewIsHtml ? !!previewHtmlSrc : !!previewTextSrc;

  if (loadingData) {
    return (
      <DashboardLayout activeTabTitle="Email Marketing">
        <div className="p-10 flex justify-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeTabTitle="Email Marketing">
      <div className="max-w-[1500px] mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.push("/dashboard/email")} className="p-2 hover:bg-slate-100 rounded-lg">
            <ArrowLeft className="w-4 h-4 text-slate-500" />
          </button>
          <h1 className="text-xl font-bold text-slate-900">New Campaign</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          {/* Form column */}
          <div className="lg:col-span-3 space-y-6">
            {/* Details */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3 mb-1">
                <span className="w-6 h-6 rounded-full bg-brand-deep text-white text-xs font-bold flex items-center justify-center">1</span>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Campaign Details</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">Campaign Name (internal)</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rath Yatra Sale Blast" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 text-xs rounded-lg focus:outline-none focus:border-brand-primary focus:bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">Subject Line</label>
                  <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Rath Yatra Sale — Up to 40% Off" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 text-xs rounded-lg focus:outline-none focus:border-brand-primary focus:bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">From Name</label>
                  <input value={fromName} onChange={(e) => setFromName(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 text-xs rounded-lg focus:outline-none focus:border-brand-primary focus:bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">From Email</label>
                  <input value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 text-xs rounded-lg focus:outline-none focus:border-brand-primary focus:bg-white" />
                </div>
              </div>
            </div>

            {/* Audience */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3 mb-1">
                <span className="w-6 h-6 rounded-full bg-brand-deep text-white text-xs font-bold flex items-center justify-center">2</span>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Audience</h2>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setAudienceType("all")} className={`flex-1 py-2 rounded-lg text-xs font-semibold border ${audienceType === "all" ? "bg-brand-deep text-white border-brand-deep" : "bg-white border-slate-200 text-slate-600"}`}>All Active Subscribers</button>
                <button onClick={() => setAudienceType("groups")} className={`flex-1 py-2 rounded-lg text-xs font-semibold border ${audienceType === "groups" ? "bg-brand-deep text-white border-brand-deep" : "bg-white border-slate-200 text-slate-600"}`}>Specific Groups</button>
              </div>
              {audienceType === "groups" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                  {groups.length === 0 && <p className="text-[11px] text-slate-400 col-span-3">No groups yet — create one from the Subscribers tab.</p>}
                  {groups.map((g) => (
                    <label key={g._id} className={`px-3 py-2 rounded-lg border text-[11px] font-medium cursor-pointer flex items-center gap-2 ${selectedGroupIds.includes(g._id) ? "border-brand-primary bg-blue-50 text-brand-primary" : "border-slate-200 text-slate-600"}`}>
                      <input type="checkbox" checked={selectedGroupIds.includes(g._id)} onChange={() => toggleGroup(g._id)} className="hidden" />
                      {g.name} <span className="text-slate-400">({g.subscriberCount})</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3 mb-1">
                <span className="w-6 h-6 rounded-full bg-brand-deep text-white text-xs font-bold flex items-center justify-center">3</span>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Content</h2>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setContentType("template")} className={`flex-1 py-2 rounded-lg text-xs font-semibold border ${contentType === "template" ? "bg-brand-deep text-white border-brand-deep" : "bg-white border-slate-200 text-slate-600"}`}>Use Template</button>
                <button onClick={() => setContentType("html")} className={`flex-1 py-2 rounded-lg text-xs font-semibold border ${contentType === "html" ? "bg-brand-deep text-white border-brand-deep" : "bg-white border-slate-200 text-slate-600"}`}>Raw HTML</button>
                <button onClick={() => setContentType("text")} className={`flex-1 py-2 rounded-lg text-xs font-semibold border ${contentType === "text" ? "bg-brand-deep text-white border-brand-deep" : "bg-white border-slate-200 text-slate-600"}`}>Plain Text</button>
              </div>

              {contentType === "template" && (
                <select value={templateId} onChange={(e) => handleTemplateSelect(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 text-xs rounded-lg focus:outline-none">
                  <option value="">Select a template...</option>
                  {templates.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              )}

              {contentType === "html" && (
                <textarea value={htmlContent} onChange={(e) => setHtmlContent(e.target.value)} rows={14} placeholder="<h1>Hello {{name}}!</h1>" className="w-full p-3 bg-slate-50 border border-slate-200 text-xs font-mono rounded-lg focus:outline-none focus:border-brand-primary focus:bg-white resize-none" />
              )}

              {contentType === "text" && (
                <textarea value={textContent} onChange={(e) => setTextContent(e.target.value)} rows={14} placeholder="Hello {{name}}, ..." className="w-full p-3 bg-slate-50 border border-slate-200 text-xs rounded-lg focus:outline-none focus:border-brand-primary focus:bg-white resize-none" />
              )}

              {contentType === "template" && templateId && (
                <p className="text-[10px] text-slate-400">Loaded from template — edit the HTML/Text tabs above if you want to tweak it just for this campaign.</p>
              )}

              <p className="text-[10px] text-slate-400">Merge tags available: {"{{name}}"}, {"{{email}}"}, {"{{unsubscribe_url}}"} — see the live preview on the right.</p>
            </div>

            {/* Schedule */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3 mb-1">
                <span className="w-6 h-6 rounded-full bg-brand-deep text-white text-xs font-bold flex items-center justify-center">4</span>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Delivery</h2>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setSendOption("now")} className={`flex-1 py-2 rounded-lg text-xs font-semibold border ${sendOption === "now" ? "bg-brand-deep text-white border-brand-deep" : "bg-white border-slate-200 text-slate-600"}`}>Send Now</button>
                <button onClick={() => setSendOption("schedule")} className={`flex-1 py-2 rounded-lg text-xs font-semibold border ${sendOption === "schedule" ? "bg-brand-deep text-white border-brand-deep" : "bg-white border-slate-200 text-slate-600"}`}>Schedule for Later</button>
              </div>
              {sendOption === "schedule" && (
                <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 text-xs rounded-lg focus:outline-none" />
              )}
              {sendOption === "schedule" && (
                <p className="text-[10px] text-slate-400">Scheduled sends require a cron job configured on your server — this saves the schedule but won't auto-trigger without one set up.</p>
              )}
            </div>
          </div>

          {/* Live preview + actions column */}
          <div className="lg:col-span-2 space-y-4 sticky top-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" /> Live Preview
                </h3>
                <span className="text-[10px] text-slate-400">Updates as you type</span>
              </div>

              <div className="p-4 bg-slate-50 space-y-3">
                <div className="bg-white rounded-lg border border-slate-200 p-3 text-[11px] space-y-1.5">
                  <div className="flex gap-2">
                    <span className="text-slate-400 w-14 shrink-0">From</span>
                    <span className="font-semibold text-slate-800 truncate">{fromName || "Sender Name"} &lt;{fromEmail || "sender@domain.com"}&gt;</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-slate-400 w-14 shrink-0">Subject</span>
                    <span className="font-semibold text-slate-900 truncate">{subject || "Your subject line will appear here"}</span>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                  {hasPreviewContent && previewIsHtml && (
                    <iframe title="live-preview" srcDoc={previewHtmlSrc} className="w-full h-[420px]" />
                  )}
                  {hasPreviewContent && !previewIsHtml && (
                    <div className="p-4 text-xs whitespace-pre-wrap text-slate-700 h-[420px] overflow-y-auto">
                      {previewTextSrc}
                    </div>
                  )}
                  {!hasPreviewContent && (
                    <div className="h-[420px] flex items-center justify-center text-center text-xs text-slate-400 px-6">
                      {contentType === "template"
                        ? "Select a template above to see the preview."
                        : "Start typing content above to see the preview."}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Ready to go?</h3>
              <p className="text-[11px] text-slate-500">Save as a draft to keep editing, or send/schedule immediately.</p>
              <button onClick={handleSaveDraft} disabled={saving} className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50">
                <Save className="w-3.5 h-3.5" /> Save Draft
              </button>
              <button onClick={handleSendNow} disabled={saving} className="w-full py-2.5 bg-brand-deep hover:bg-brand-primary text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                {sendOption === "schedule" ? "Save & Schedule" : "Send Now"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}