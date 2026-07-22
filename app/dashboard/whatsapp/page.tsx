"use client";

import React, { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Send, FileText, CheckCircle, Loader2, Image as ImageIcon,
  X, Upload, Clipboard, List, AlertCircle, FileSpreadsheet,
  Link as LinkIcon, Bold, Italic, Strikethrough, Code, Smartphone,
  Sparkles, Video, ExternalLink, UserCheck
} from "lucide-react";
import * as XLSX from "xlsx";

type InputMethod = "raw" | "csv" | "sheet";

interface Recipient {
  phone: string;
  name: string;
  email?: string;
}

interface MetaTemplate {
  name: string;
  language: string;
  status: string;
  components: Array<{
    type: string;
    text?: string;
    format?: string;
  }>;
}

export default function WhatsappAutomation() {
  const [campaignName, setCampaignName] = useState("");
  const [messageBody, setMessageBody] = useState("");

  // Custom Dynamic Variable 2 (e.g., Offer Code / Discount)
  const [var2, setVar2] = useState("25% OFF");

  // Promotional Link State
  const [promoUrl, setPromoUrl] = useState("");
  const [ctaText, setCtaText] = useState("Claim Offer Now");

  // Meta Templates
  const [templates, setTemplates] = useState<MetaTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("shri_prasadam_promo");
  const [isLoadingTemplates, setIsLoadingTemplates] = useState<boolean>(false);

  // Recipient States (Store Objects with name, phone, email)
  const [phoneInput, setPhoneInput] = useState("");
  const [activeTab, setActiveTab] = useState<InputMethod>("raw");
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  // Media Attachment States
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video" | "document" | null>(null);

  // UI Status Tracking
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusNotice, setStatusNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Fetch Approved Templates on Load
  useEffect(() => {
    fetchMetaTemplates();
  }, []);

  const fetchMetaTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const res = await fetch("/api/whatsapp-templates");
      const data = await res.json();
      if (res.ok && data.success) {
        setTemplates(data.templates || []);
      }
    } catch (err) {
      console.error("Failed to load templates:", err);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  // Helper: Sanitize Mobile Number
  const sanitizePhone = (raw: string): string => {
    const cleaned = raw.replace(/[\s\+\-]/g, "").trim();
    return cleaned.length >= 10 && /^\d+$/.test(cleaned) ? cleaned : "";
  };

  // Parse Raw Text Input (Format: Phone, Name, Email per line OR comma-separated)
  useEffect(() => {
    if (activeTab === "raw") {
      if (!phoneInput.trim()) {
        setRecipients([]);
        return;
      }
      const lines = phoneInput.split("\n");
      const parsed: Recipient[] = [];

      lines.forEach((line) => {
        const parts = line.split(/[,;\t]+/).map((s) => s.trim());
        const validPhone = sanitizePhone(parts[0] || "");
        if (validPhone) {
          parsed.push({
            phone: validPhone,
            name: parts[1] || "Valued Customer",
            email: parts[2] || "",
          });
        }
      });
      setRecipients(parsed);
    }
  }, [phoneInput, activeTab]);

  // Handle File Upload (CSV or Excel Sheet with columns: Phone, Name, Email)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    if (activeTab === "csv" || file.name.endsWith(".csv")) {
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split("\n");
        const parsed: Recipient[] = [];

        lines.forEach((line, index) => {
          // Skip header row if present
          if (index === 0 && (line.toLowerCase().includes("phone") || line.toLowerCase().includes("mobile"))) return;

          const parts = line.split(/[,;\t]+/).map((s) => s.trim().replace(/^["']|["']$/g, ""));
          const validPhone = sanitizePhone(parts[0] || "");
          if (validPhone) {
            parsed.push({
              phone: validPhone,
              name: parts[1] || "Valued Customer",
              email: parts[2] || "",
            });
          }
        });

        setRecipients(parsed);
        setStatusNotice({ type: "success", message: `Parsed ${parsed.length} personalized recipients from CSV.` });
      };
      reader.readAsText(file);
    } else if (activeTab === "sheet" || file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
      reader.onload = (event) => {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const json: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const parsed: Recipient[] = [];
        json.forEach((row, index) => {
          if (index === 0 && String(row[0]).toLowerCase().includes("phone")) return;

          const rawPhone = String(row[0] || "");
          const validPhone = sanitizePhone(rawPhone);
          if (validPhone) {
            parsed.push({
              phone: validPhone,
              name: String(row[1] || "Valued Customer").trim(),
              email: String(row[2] || "").trim(),
            });
          }
        });

        setRecipients(parsed);
        setStatusNotice({ type: "success", message: `Parsed ${parsed.length} personalized recipients from Sheet.` });
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const openCloudinaryWidget = () => {
    // @ts-ignore
    if (window.cloudinary) {
      setIsUploading(true);
      // @ts-ignore
      window.cloudinary.openUploadWidget(
        {
          cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "your-cloud-name",
          uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_PRESET || "your-preset",
          sources: ["local", "url", "camera"],
          multiple: false,
          resourceType: "auto"
        },
        (error: any, result: any) => {
          setIsUploading(false);
          if (!error && result && result.event === "success") {
            setMediaUrl(result.info.secure_url);
            if (result.info.resource_type === "image") setMediaType("image");
            else if (result.info.resource_type === "video") setMediaType("video");
            else setMediaType("document");
            setStatusNotice({ type: "success", message: "Media resource uploaded successfully!" });
          }
        }
      );
    }
  };

  const clearAttachedMedia = () => {
    setMediaUrl("");
    setMediaType(null);
  };

  const formatSelection = (prefix: string, suffix: string = prefix) => {
    const textarea = messageInputRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = messageBody.substring(start, end);
    const before = messageBody.substring(0, start);
    const after = messageBody.substring(end);

    const formatted = `${before}${prefix}${selectedText || "text"}${suffix}${after}`;
    setMessageBody(formatted);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const handleTemplateChange = (templateName: string) => {
    setSelectedTemplate(templateName);
    const tmpl = templates.find((t) => t.name === templateName);
    if (tmpl) {
      const bodyComp = tmpl.components.find((c) => c.type === "BODY");
      if (bodyComp && bodyComp.text) {
        setMessageBody(bodyComp.text);
      }
    }
  };

  // Preview using the first recipient's name or placeholder
  const getFormattedPreview = () => {
    const sampleName = recipients[0]?.name || "Aarav Sharma";
    let formatted = messageBody;
    formatted = formatted.replace(/\{\{1\}\}/g, sampleName);
    formatted = formatted.replace(/\{\{2\}\}/g, var2 || "{{2}}");

    return formatted
      .replace(/\*(.*?)\*/g, "<strong>$1</strong>")
      .replace(/_(.*?)_/g, "<em>$1</em>")
      .replace(/~(.*?)~/g, "<del>$1</del>")
      .replace(/```(.*?)```/g, "<code class='bg-emerald-100/60 text-emerald-900 px-1 rounded font-mono text-[11px]'>$1</code>");
  };

  // Send Personalize Campaigns
  const handleSendCampaign = async () => {
    if (!campaignName || !messageBody || recipients.length === 0) {
      setStatusNotice({ type: "error", message: "Please configure campaign settings, recipients, and content." });
      return;
    }

    setIsSubmitting(true);
    setStatusNotice(null);

    try {
      const res = await fetch("/api/whatsapp-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignName,
          templateName: selectedTemplate,
          message: messageBody,
          var2, // Custom Variable 2 (Discount Code, Offer name, etc.)
          recipients, // Array of { phone, name, email }
          mediaUrl: mediaUrl || null,
          mediaType: mediaType || null,
          promoUrl: promoUrl || null,
          ctaText: ctaText || null
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatusNotice({ type: "success", message: `Personalized campaign dispatched to ${recipients.length} recipient(s) successfully!` });
        setCampaignName("");
        setMessageBody("");
        setPhoneInput("");
        setRecipients([]);
        setPromoUrl("");
        clearAttachedMedia();
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        setStatusNotice({
          type: "error",
          message: data.error || "Meta delivery channel rejected this payload."
        });
      }
    } catch (err) {
      console.error(err);
      setStatusNotice({ type: "error", message: "Network connection timeout while processing request." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout activeTabTitle="WhatsApp Automation">
      <div className="space-y-8 max-w-[1500px] mx-auto px-4 py-6 text-slate-900 selection:bg-slate-100">

        {/* Header Notice */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Personalized Broadcast Studio</h1>
            <p className="text-xs text-slate-500 mt-1">Dispatch personalized Meta-approved WhatsApp messages with custom recipient names and details.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm">
              <CheckCircle className="w-3.5 h-3.5" /> Meta Dynamic Personalization Active
            </span>
          </div>
        </div>

        {/* Banner Alert System */}
        {statusNotice && (
          <div className={`p-4 rounded-xl border text-xs font-medium flex justify-between items-center transition-all shadow-sm ${statusNotice.type === "success"
            ? "bg-emerald-50/70 border-emerald-200 text-emerald-800"
            : "bg-rose-50/70 border-rose-200 text-rose-800"
            }`}>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{statusNotice.message}</span>
            </div>
            <button onClick={() => setStatusNotice(null)} className="cursor-pointer opacity-60 hover:opacity-100 transition"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Master Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column - Inputs & Setup */}
          <div className="lg:col-span-7 space-y-6">

            {/* Step 1: Campaign details & Meta Template Dropdown */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">1</span>
                <h2 className="text-sm font-bold tracking-wider text-slate-800 uppercase">Campaign Setup</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Campaign Name / Reference</label>
                  <input
                    type="text" value={campaignName} onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="e.g. Personalized Festival Greetings - Batch 1"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 text-xs rounded-xl focus:outline-none focus:border-slate-400 focus:bg-white transition-all shadow-inner"
                  />
                </div>

                {/* Meta Template Selector */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Approved Meta Template</label>
                    <button type="button" onClick={fetchMetaTemplates} className="text-[10px] text-slate-400 hover:text-slate-700 underline cursor-pointer">Refresh Templates</button>
                  </div>
                  <div className="relative">
                    <select
                      value={selectedTemplate}
                      onChange={(e) => handleTemplateChange(e.target.value)}
                      disabled={isLoadingTemplates}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 text-xs rounded-xl focus:outline-none focus:border-slate-400 focus:bg-white transition-all font-medium text-slate-800 shadow-inner appearance-none cursor-pointer"
                    >
                      <option value="shri_prasadam_promo">shri_prasadam_promo (Default)</option>
                      {templates.map((tmpl) => (
                        <option key={tmpl.name} value={tmpl.name}>
                          {tmpl.name} ({tmpl.language})
                        </option>
                      ))}
                    </select>
                    {isLoadingTemplates && (
                      <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-3.5 text-slate-400" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Recipient Upload with Personalization Fields */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">2</span>
                <h2 className="text-sm font-bold tracking-wider text-slate-800 uppercase">Personalized Audience Import</h2>
              </div>

              {/* Input Method Switcher */}
              <div className="grid grid-cols-3 gap-2 p-1 bg-slate-50 rounded-xl border border-slate-100">
                {(["raw", "csv", "sheet"] as InputMethod[]).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => {
                      setActiveTab(method);
                      setRecipients([]);
                      setPhoneInput("");
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className={`py-2 text-[10px] font-bold uppercase rounded-lg transition-all cursor-pointer ${activeTab === method ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                      }`}
                  >
                    {method === "raw" && <span className="flex items-center justify-center gap-1.5"><Clipboard className="w-3 h-3" /> Quick Paste</span>}
                    {method === "csv" && <span className="flex items-center justify-center gap-1.5"><FileText className="w-3 h-3" /> CSV File</span>}
                    {method === "sheet" && <span className="flex items-center justify-center gap-1.5"><FileSpreadsheet className="w-3 h-3" /> Excel Sheet</span>}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {activeTab === "raw" ? (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Format: <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded">Phone, Name, Email</code> (One entry per line)
                    </label>
                    <textarea
                      rows={4} value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="919876543210, Aarav Sharma, aarav@example.com&#10;919812345678, Priya Patel, priya@example.com"
                      className="w-full p-4 bg-slate-50 border border-slate-100 text-xs rounded-xl focus:outline-none focus:border-slate-400 focus:bg-white transition-all resize-none placeholder:text-slate-400 shadow-inner font-mono"
                    />
                  </div>
                ) : (
                  <div className="border border-dashed border-slate-200 hover:border-slate-400 rounded-2xl bg-slate-50/50 p-6 text-center transition-all relative">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept={activeTab === "csv" ? ".csv" : ".xlsx, .xls"}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-700">Drag & Drop or Click to Upload Audience File</p>
                    <p className="text-[10px] text-slate-400 mt-1">Expected Columns: <strong>Col 1: Mobile</strong> | <strong>Col 2: Name</strong> | <strong>Col 3: Email</strong></p>
                  </div>
                )}

                {/* Recipient Validation Count & Data Table */}
                <div className="space-y-2">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      <span className="font-semibold text-slate-600">Parsed Recipients:</span>
                    </div>
                    <span className="font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 shadow-xs">
                      {recipients.length} Verified Contacts
                    </span>
                  </div>

                  {recipients.length > 0 && (
                    <div className="max-h-36 overflow-y-auto border border-slate-100 rounded-xl text-xs bg-slate-50/50 p-2 space-y-1">
                      {recipients.slice(0, 5).map((r, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white px-3 py-1.5 rounded border border-slate-100 text-[11px]">
                          <span className="font-bold text-slate-800">{r.name}</span>
                          <span className="font-mono text-slate-500">+{r.phone}</span>
                          <span className="text-slate-400 truncate max-w-[120px]">{r.email || "N/A"}</span>
                        </div>
                      ))}
                      {recipients.length > 5 && (
                        <p className="text-[10px] text-center text-slate-400 font-medium py-1">
                          + {recipients.length - 5} more recipients ready to receive personalized messages...
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Step 3: Message Content & Rich Editor */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">3</span>
                  <h2 className="text-sm font-bold tracking-wider text-slate-800 uppercase">Message & Personalization Tag</h2>
                </div>
              </div>

              {/* Text Formatting Toolbar */}
              <div className="flex items-center gap-1 p-1 bg-slate-50 rounded-xl border border-slate-100">
                <button type="button" onClick={() => formatSelection("*", "*")} title="Bold" className="p-2 hover:bg-white rounded-lg text-slate-600 transition cursor-pointer"><Bold className="w-3.5 h-3.5" /></button>
                <button type="button" onClick={() => formatSelection("_", "_")} title="Italic" className="p-2 hover:bg-white rounded-lg text-slate-600 transition cursor-pointer"><Italic className="w-3.5 h-3.5" /></button>
                <button type="button" onClick={() => formatSelection("~", "~")} title="Strikethrough" className="p-2 hover:bg-white rounded-lg text-slate-600 transition cursor-pointer"><Strikethrough className="w-3.5 h-3.5" /></button>
                <button type="button" onClick={() => formatSelection("```", "```")} title="Monospace" className="p-2 hover:bg-white rounded-lg text-slate-600 transition cursor-pointer"><Code className="w-3.5 h-3.5" /></button>
                <div className="h-4 w-px bg-slate-200 mx-1" />
                <button type="button" onClick={() => setMessageBody((prev) => `${prev} {{1}}`)} className="...">+ Recipient Name ({"{{1}}"})</button>
                <button type="button" onClick={() => setMessageBody((prev) => `${prev} {{2}}`)} className="...">+ Custom Var ({"{{2}}"})</button>
              </div>

              <div className="space-y-4">
                <div>
                  <textarea
                    ref={messageInputRef}
                    rows={5}
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    placeholder="Namaste {{1}}! Enjoy {{2}} on our collection."
                    className="w-full p-4 bg-slate-50 border border-slate-100 text-xs rounded-xl focus:outline-none focus:border-slate-400 focus:bg-white transition-all resize-none shadow-inner font-sans"
                  />
                </div>

                {/* Variable 2 Value */}
                <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Custom Variable 2 Value ({"{{2}}"})</label>
                  <input
                    type="text"
                    value={var2}
                    onChange={(e) => setVar2(e.target.value)}
                    placeholder="e.g. 25% OFF or FESTIVE25"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 text-xs rounded-lg focus:outline-none"
                  />
                </div>

                {/* Promotional Link & CTA */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <LinkIcon className="w-4 h-4 text-emerald-600" />
                    <span>Promotional Link & Call-To-Action Button</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="url"
                      value={promoUrl}
                      onChange={(e) => setPromoUrl(e.target.value)}
                      placeholder="https://shriprasadam.com/collections/festive"
                      className="w-full px-3 py-2 bg-white border border-slate-200 text-xs rounded-lg focus:outline-none"
                    />
                    <input
                      type="text"
                      value={ctaText}
                      onChange={(e) => setCtaText(e.target.value)}
                      placeholder="CTA Label (e.g. Claim 25% Off)"
                      className="w-full px-3 py-2 bg-white border border-slate-200 text-xs rounded-lg focus:outline-none"
                    />
                  </div>
                </div>

                {/* Media Attachment */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Campaign Header Media</label>
                  {mediaUrl ? (
                    <div className="p-3 border border-emerald-100 bg-emerald-50/30 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate pr-2">
                        {mediaType === "video" ? <Video className="w-4 h-4 text-emerald-600" /> : <ImageIcon className="w-4 h-4 text-emerald-600" />}
                        <span className="font-bold text-emerald-800 truncate">{mediaUrl}</span>
                      </div>
                      <button type="button" onClick={clearAttachedMedia} className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={openCloudinaryWidget}
                      disabled={isUploading}
                      className="w-full py-3 border border-dashed border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <ImageIcon className="w-4 h-4 text-slate-400" /> Upload Header Image / Video
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Action Dispatch Bar */}
            <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
              <div>
                <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Gateway Engine</span>
                <span className="font-bold text-slate-800 text-xs">Meta Cloud API Direct</span>
              </div>
              <button
                type="button"
                onClick={handleSendCampaign}
                disabled={isSubmitting || isUploading || recipients.length === 0}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-sm transition disabled:opacity-40 cursor-pointer text-xs"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isSubmitting ? "Dispatching Personalized Messages..." : `Launch Campaign to ${recipients.length} Contacts`}
              </button>
            </div>

          </div>

          {/* Right Column - Live WhatsApp Smartphone Preview */}
          <div className="lg:col-span-5 sticky top-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Live Preview (Sample Contact)</h3>
                </div>
                <span className="text-[10px] bg-slate-100 px-2.5 py-1 rounded-full font-medium text-slate-500">WhatsApp View</span>
              </div>

              {/* Mockup Frame */}
              <div className="w-full max-w-[340px] mx-auto bg-[#efeae2] rounded-[32px] border-[8px] border-slate-800 p-3 shadow-2xl space-y-3 min-h-[520px] flex flex-col justify-between relative overflow-hidden">

                {/* Header Bar */}
                <div className="bg-[#075e54] text-white p-3 -mx-3 -mt-3 flex items-center gap-3 shadow-xs">
                  <div className="w-7 h-7 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-slate-700 font-bold text-xs">
                    SP
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-none">Shri Prasadam</p>
                    <p className="text-[9px] text-emerald-100 mt-0.5">Official Account</p>
                  </div>
                </div>

                {/* Chat Bubble Body */}
                <div className="flex-1 my-2">
                  <div className="bg-white rounded-lg p-3 shadow-sm max-w-[92%] space-y-2 text-slate-800 relative">

                    {/* Header Media */}
                    {mediaUrl && (
                      <div className="rounded-md overflow-hidden border border-slate-100 bg-slate-50 max-h-48 flex items-center justify-center">
                        {mediaType === "video" ? (
                          <div className="p-8 text-center text-slate-400">
                            <Video className="w-8 h-8 mx-auto mb-1" />
                            <span className="text-[10px]">Video Header Preview</span>
                          </div>
                        ) : (
                          <img src={mediaUrl} alt="Header Preview" className="w-full h-full object-cover" />
                        )}
                      </div>
                    )}

                    {/* Message Copy */}
                    <div
                      className="text-xs leading-relaxed font-sans whitespace-pre-wrap break-words"
                      dangerouslySetInnerHTML={{ __html: getFormattedPreview() || "Your personalized message copy preview will render here..." }}
                    />

                    {/* Interactive CTA Link Button */}
                    {promoUrl && (
                      <div className="pt-2 border-t border-slate-100 mt-2">
                        <a
                          href={promoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-emerald-700 font-bold text-[11px] rounded flex items-center justify-center gap-1.5 transition border border-slate-200/60"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {ctaText || "Visit Link"}
                        </a>
                      </div>
                    )}

                    {/* Timestamp */}
                    <span className="text-[9px] text-slate-400 block text-right mt-1">10:42 AM</span>
                  </div>
                </div>

                {/* Footer Note */}
                <div className="text-center py-1 bg-white/60 backdrop-blur-xs rounded-full border border-slate-200/50">
                  <p className="text-[9px] text-slate-500 font-medium flex items-center justify-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" /> Meta Official Business Message
                  </p>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}