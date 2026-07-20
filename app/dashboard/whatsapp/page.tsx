

"use client";
import React, { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Send, FileText, CheckCircle, Loader2, Image as ImageIcon, 
  X, Upload, Clipboard, List, AlertCircle, FileSpreadsheet, Trash2 
} from "lucide-react";
import * as XLSX from "xlsx";

type InputMethod = "raw" | "csv" | "sheet";

export default function WhatsappAutomation() {
  const [campaignName, setCampaignName] = useState("");
  const [messageBody, setMessageBody] = useState("");
  
  // Phone Number states
  const [phoneInput, setPhoneInput] = useState("");
  const [activeTab, setActiveTab] = useState<InputMethod>("raw");
  const [parsedNumbers, setParsedNumbers] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Media Attachment States
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video" | "document" | null>(null);
  
  // UI Status Tracking
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusNotice, setStatusNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Script Injection to load Cloudinary Widget dynamically
  useEffect(() => {
    if (!window.hasOwnProperty("cloudinary")) {
      const script = document.createElement("script");
      script.src = "https://upload-widget.cloudinary.com/global/all.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Clean and validate numbers helper
  const cleanAndValidateNumbers = (rawText: string): string[] => {
    return rawText
      .split(/[\n,;]+/) // Split by newline, comma, or semicolon
      .map((num) => num.replace(/[\s\+\-]/g, "").trim())
      .filter((num) => num.length >= 10 && /^\d+$/.test(num));
  };

  // Keep manual text input and parsed number list in sync
  useEffect(() => {
    if (activeTab === "raw") {
      setParsedNumbers(cleanAndValidateNumbers(phoneInput));
    }
  }, [phoneInput, activeTab]);

  // Handle File Upload for CSV / Excel
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    
    if (activeTab === "csv" || file.name.endsWith(".csv")) {
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const numbers = cleanAndValidateNumbers(text);
        setParsedNumbers(numbers);
        setStatusNotice({ type: "success", message: `Successfully loaded ${numbers.length} numbers from CSV file.` });
      };
      reader.readAsText(file);
    } else if (activeTab === "sheet" || file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
      reader.onload = (event) => {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Extract all cell values
        const json: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const flatNumbers = json
          .flat()
          .map(cell => String(cell))
          .join(",");
          
        const numbers = cleanAndValidateNumbers(flatNumbers);
        setParsedNumbers(numbers);
        setStatusNotice({ type: "success", message: `Successfully parsed ${numbers.length} numbers from sheet.` });
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
            const secureUrl = result.info.secure_url;
            setMediaUrl(secureUrl);
            
            if (result.info.resource_type === "image") setMediaType("image");
            else if (result.info.resource_type === "video") setMediaType("video");
            else setMediaType("document");
            
            setStatusNotice({ type: "success", message: "Media resource securely uploaded to Cloudinary CDN!" });
          }
        }
      );
    } else {
      setStatusNotice({ type: "error", message: "Cloudinary SDK failed to initialize. Try checking your environmental settings." });
    }
  };

  const clearAttachedMedia = () => {
    setMediaUrl("");
    setMediaType(null);
  };

  const injectTemplateTag = (tag: string) => {
    setMessageBody((prev) => `${prev} ${tag}`);
  };

  const handleSendCampaign = async () => {
    if (!campaignName || !messageBody || parsedNumbers.length === 0) {
      setStatusNotice({ type: "error", message: "Please configure your campaign settings and add recipients." });
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
          message: messageBody,
          recipients: parsedNumbers,
          mediaUrl: mediaUrl || null,
          mediaType: mediaType || null
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatusNotice({ type: "success", message: `Campaign dispatched to ${parsedNumbers.length} recipients successfully!` });
        setCampaignName("");
        setMessageBody("");
        setPhoneInput("");
        setParsedNumbers([]);
        clearAttachedMedia();
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        setStatusNotice({ 
          type: "error", 
          message: data.error || "Meta delivery channel rejected processing this payload." 
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
      <div className="space-y-8 max-w-[1400px] mx-auto px-4 py-6 text-slate-900 selection:bg-slate-100">
        
        {/* Header Notice */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Broadcast Studio</h1>
            <p className="text-xs text-slate-500 mt-1">Design premium layouts and dispatch instant template messages.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm">
              <CheckCircle className="w-3.5 h-3.5" /> Meta Live Connected
            </span>
          </div>
        </div>

        {/* Banner Alert System */}
        {statusNotice && (
          <div className={`p-4 rounded-xl border text-xs font-medium flex justify-between items-center transition-all shadow-sm ${
            statusNotice.type === "success" 
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
          
          {/* Left Inputs Columns */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Step 1: Campaign details */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">1</span>
                <h2 className="text-sm font-bold tracking-wider text-slate-800 uppercase">Campaign Setup</h2>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Campaign Identifier</label>
                <input 
                  type="text" value={campaignName} onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g. Festival Launch Promo Blast"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 text-xs rounded-xl focus:outline-none focus:border-slate-400 focus:bg-white transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Step 2: Advanced Target uploader */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">2</span>
                  <h2 className="text-sm font-bold tracking-wider text-slate-800 uppercase">Target Recipients</h2>
                </div>
              </div>

              {/* Advanced Mode Selectors */}
              <div className="grid grid-cols-3 gap-2 p-1 bg-slate-50 rounded-xl border border-slate-100">
                {(["raw", "csv", "sheet"] as InputMethod[]).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => {
                      setActiveTab(method);
                      setParsedNumbers([]);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className={`py-2 text-[10px] font-bold uppercase rounded-lg transition-all cursor-pointer ${
                      activeTab === method 
                        ? "bg-white text-slate-900 shadow-sm" 
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {method === "raw" && <span className="flex items-center justify-center gap-1.5"><Clipboard className="w-3 h-3" /> Paste Numbers</span>}
                    {method === "csv" && <span className="flex items-center justify-center gap-1.5"><FileText className="w-3 h-3" /> CSV File</span>}
                    {method === "sheet" && <span className="flex items-center justify-center gap-1.5"><FileSpreadsheet className="w-3 h-3" /> Excel Sheet</span>}
                  </button>
                ))}
              </div>

              {/* Conditional Inputs rendering */}
              <div className="space-y-4">
                {activeTab === "raw" ? (
                  <textarea 
                    rows={4} value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="Type or paste mobile numbers separated by commas or lines... (e.g. 919876543210)"
                    className="w-full p-4 bg-slate-50 border border-slate-100 text-xs rounded-xl focus:outline-none focus:border-slate-400 focus:bg-white transition-all resize-none placeholder:text-slate-400 shadow-inner"
                  />
                ) : (
                  <div className="border border-dashed border-slate-200 hover:border-slate-400 rounded-2xl bg-slate-50/50 p-8 text-center transition-all relative">
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileUpload} 
                      accept={activeTab === "csv" ? ".csv" : ".xlsx, .xls"}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    <p className="text-xs font-semibold text-slate-700">Drag & Drop or Click to Upload</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {activeTab === "csv" ? "Upload a valid .csv file" : "Upload standard .xlsx or .xls files"}
                    </p>
                  </div>
                )}

                {/* Audit Metrics Panel */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <List className="w-4 h-4 text-slate-400" />
                    <span className="font-semibold text-slate-500">Validated Audiences:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-100 shadow-sm">
                      {parsedNumbers.length} Verified Recipients
                    </span>
                    {parsedNumbers.length > 0 && (
                      <button 
                        onClick={() => {
                          setParsedNumbers([]);
                          setPhoneInput("");
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Clear list"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Mobile Interactive Column */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Step 3: Message Editor */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">3</span>
                  <h2 className="text-sm font-bold tracking-wider text-slate-800 uppercase">Creative Studio</h2>
                </div>
                <div className="flex gap-1.5">
                  <button type="button" onClick={() => injectTemplateTag("{{1}}")} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg transition-all cursor-pointer">+ Name</button>
                  <button type="button" onClick={() => injectTemplateTag("{{2}}")} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg transition-all cursor-pointer">+ Offer</button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Message Copy</label>
                  <textarea 
                    rows={5} value={messageBody} onChange={(e) => setMessageBody(e.target.value)}
                    placeholder="Craft premium messaging templates... (e.g. Hello {{1}}! Enjoy our collection)"
                    className="w-full p-4 bg-slate-50 border border-slate-100 text-xs rounded-xl focus:outline-none focus:border-slate-400 focus:bg-white transition-all resize-none shadow-inner"
                  />
                </div>
                
                {/* Custom Cloudinary Upload Button */}
                <div className="space-y-2">
                  {mediaUrl ? (
                    <div className="p-3 border border-emerald-100 bg-emerald-50/30 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="truncate font-bold text-emerald-800">Attached: {mediaType?.toUpperCase()}</span>
                      </div>
                      <button type="button" onClick={clearAttachedMedia} className="p-1 hover:bg-emerald-100/50 text-rose-500 rounded-lg transition cursor-pointer"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <button 
                      type="button"
                      onClick={openCloudinaryWidget}
                      disabled={isUploading}
                      className="w-full py-3 border border-dashed border-slate-200 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-50 hover:border-slate-400 flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : <ImageIcon className="w-4 h-4 text-slate-400" />}
                      Cloudinary Media Engine
                    </button>
                  )}
                </div>
              </div>

              {/* Simulated iPhone Wireframe */}
              <div className="bg-slate-950 p-4 rounded-[40px] border-[6px] border-slate-800/90 shadow-2xl min-h-[340px] flex flex-col relative">
                {/* Camera notch */}
                <div className="w-24 h-4.5 bg-slate-800/80 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-slate-900" />
                </div>
                
                <div className="flex-1 bg-neutral-900 rounded-[28px] p-3 flex flex-col justify-between overflow-hidden relative border border-white/5">
                  <div className="bg-neutral-800/80 backdrop-blur-md p-2.5 rounded-xl flex items-center gap-2 text-[10px] font-bold text-white mb-4 border border-white/5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Shri Prasadam Official</span>
                  </div>
                  
                  {/* Whatsapp speech bubble */}
                  <div className="bg-[#E2F7CB] text-neutral-800 p-3 rounded-2xl text-[11px] font-medium leading-relaxed self-start shadow-md border border-emerald-200/20 w-full break-words">
                    {mediaUrl && (
                      <div className="mb-2 rounded-xl overflow-hidden bg-white/70 border border-emerald-100 max-h-[140px] flex items-center justify-center">
                        {mediaType === "image" && <img src={mediaUrl} className="object-cover w-full h-full hover:scale-105 transition" alt="Cloudinary attached" />}
                        {mediaType === "video" && <video src={mediaUrl} className="object-cover w-full h-full" muted autoPlay loop />}
                        {mediaType === "document" && <span className="p-6 flex items-center gap-2 text-xs font-bold text-slate-500">📁 Attached Document</span>}
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{messageBody || "Configure layout settings view..."}</p>
                    <span className="block text-[8px] text-right text-emerald-700/60 font-bold mt-1.5">10:45 PM ✓✓</span>
                  </div>
                  <div className="bg-neutral-800/40 h-5 rounded-full mt-4" />
                </div>
              </div>

              {/* Action and dispatch buttons */}
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Gateway Protocol</span>
                  <span className="font-bold text-slate-800">Meta HTTP Direct API</span>
                </div>
                <button 
                  type="button"
                  onClick={handleSendCampaign}
                  disabled={isSubmitting || isUploading || parsedNumbers.length === 0}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center gap-2 shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed min-w-[130px] justify-center cursor-pointer"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {isSubmitting ? "Dispatched" : "Send Blast"}
                </button>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </DashboardLayout>
  );
}