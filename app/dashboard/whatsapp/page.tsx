"use client";
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Send, FileText, CheckCircle, Loader2, Image as ImageIcon, Link as LinkIcon, X } from "lucide-react";

export default function WhatsappAutomation() {
  const [campaignName, setCampaignName] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  
  // Media Attachment States
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video" | "document" | null>(null);
  
  // UI Status Tracking
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusNotice, setStatusNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Script Injection helper to load Cloudinary Widget dynamically
  useEffect(() => {
    if (!window.hasOwnProperty("cloudinary")) {
      const script = document.createElement("script");
      script.src = "https://upload-widget.cloudinary.com/global/all.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

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
          resourceType: "auto" // Automatically determines image vs video vs raw files
        },
        (error: any, result: any) => {
          setIsUploading(false);
          if (!error && result && result.event === "success") {
            const secureUrl = result.info.secure_url;
            setMediaUrl(secureUrl);
            
            // Map file types to match Meta's explicit endpoint specifications
            if (result.info.resource_type === "image") setMediaType("image");
            else if (result.info.resource_type === "video") setMediaType("video");
            else setMediaType("document");
            
            setStatusNotice({ type: "success", message: "Media resource securely uploaded to Cloudinary CDN!" });
          }
        }
      );
    } else {
      setStatusNotice({ type: "error", message: "Cloudinary SDK script failed to load. Check console configuration logs." });
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
    if (!campaignName || !messageBody || !phoneInput) {
      setStatusNotice({ type: "error", message: "Please configure all campaign variables first." });
      return;
    }

    const recipientArray = phoneInput
      .split(",")
      .map((num) => num.trim())
      .filter((num) => num.length > 0);
    
    if (recipientArray.length === 0) {
      setStatusNotice({ type: "error", message: "Please enter at least one valid recipient phone number." });
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
          recipients: recipientArray,
          mediaUrl: mediaUrl || null,
          mediaType: mediaType || null
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatusNotice({ type: "success", message: "Broadcast dispatched to Meta gateway successfully!" });
        setCampaignName("");
        setMessageBody("");
        setPhoneInput("");
        clearAttachedMedia();
      } else {
        setStatusNotice({ 
          type: "error", 
          message: data.error || "Meta cloud architecture pipeline rejected processing layout specs." 
        });
      }
    } catch (err) {
      console.error(err);
      setStatusNotice({ type: "error", message: "Network connection timeout while calling server routes." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const validatedNumbersCount = phoneInput
    .split(",")
    .map((num) => num.trim())
    .filter((num) => num.length > 0).length;

  return (
    <DashboardLayout activeTabTitle="WhatsApp Automation">
      <div className="space-y-6 max-w-[1400px] mx-auto">
        
        {/* Connection Context Notice */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-teal-50 text-teal-600 border border-teal-100 rounded-full font-bold flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Meta API Connected
            </span>
            <span className="text-slate-500 font-semibold">Account: <span className="text-slate-800">Shri Prasadam Official</span></span>
          </div>
        </div>

        {/* Global Runtime Notification Messaging System */}
        {statusNotice && (
          <div className={`p-4 rounded-xl border text-xs font-semibold flex justify-between items-center ${
            statusNotice.type === "success" 
              ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}>
            <span>{statusNotice.message}</span>
            <button onClick={() => setStatusNotice(null)} className="opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Dynamic Studio Layout Grid Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Configuration Matrix Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-brand-deep text-white text-xs font-bold flex items-center justify-center">1</span>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Campaign Details</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">Campaign Name</label>
                  <input 
                    type="text" value={campaignName} onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="e.g. Traditional Heritage Launch Blast"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 text-xs rounded-lg focus:outline-none focus:border-brand-primary focus:bg-white transition"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-brand-deep text-white text-xs font-bold flex items-center justify-center">2</span>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Target Audience</h2>
              </div>
              <div>
                <textarea 
                  rows={3} value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="Enter phone numbers separated by comma (e.g. +91XXXXXXXXXX)"
                  className="w-full p-4 bg-slate-50 border border-slate-200 text-xs rounded-lg focus:outline-none focus:border-brand-primary focus:bg-white transition resize-none placeholder:text-slate-400"
                />
                <div className="mt-2 p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-medium text-slate-500 flex justify-between">
                  <span>Validated Recipient Targets:</span>
                  <span className="font-bold text-slate-800">{validatedNumbersCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Mobile Live Preview Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-deep text-white text-xs font-bold flex items-center justify-center">3</span>
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Message Editor</h2>
                </div>
                <div className="flex gap-1.5 text-[10px] font-bold">
                  <button type="button" onClick={() => injectTemplateTag("{Name}")} className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded hover:bg-slate-200 transition">+ {"{Name}"}</button>
                  <button type="button" onClick={() => injectTemplateTag("{Order_ID}")} className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded hover:bg-slate-200 transition">+ {"{Order_ID}"}</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
                <div className="md:col-span-6 flex flex-col justify-between space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">Message Body</label>
                    <textarea 
                      rows={6} value={messageBody} onChange={(e) => setMessageBody(e.target.value)}
                      placeholder="Type your message here..."
                      className="w-full p-3 bg-slate-50 border border-slate-200 text-xs rounded-lg focus:outline-none focus:border-brand-primary focus:bg-white transition resize-none"
                    />
                  </div>
                  
                  {/* Dynamic Cloudinary Engine Interaction Blocks */}
                  <div className="space-y-2">
                    {mediaUrl ? (
                      <div className="p-2 border border-emerald-100 bg-emerald-50/50 rounded-lg flex items-center justify-between text-[10px]">
                        <span className="truncate max-w-[80%] font-semibold text-emerald-800">Attached: {mediaType?.toUpperCase()} asset</span>
                        <button type="button" onClick={clearAttachedMedia} className="text-rose-500 hover:text-rose-700 font-bold"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : (
                      <button 
                        type="button"
                        onClick={openCloudinaryWidget}
                        disabled={isUploading}
                        className="w-full p-2.5 border border-dashed border-slate-300 text-slate-600 rounded-lg text-[10px] font-bold hover:bg-slate-50 flex items-center justify-center gap-1.5 transition"
                      >
                        {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" /> : <ImageIcon className="w-3.5 h-3.5 text-slate-400" />}
                        Upload Custom Media via Cloudinary
                      </button>
                    )}
                  </div>
                </div>

                {/* Smartphone Wireframe Element Layout View */}
                <div className="md:col-span-6 bg-slate-900 p-3 rounded-[24px] border-4 border-slate-800 shadow-inner min-h-[300px] flex flex-col">
                  <div className="w-20 h-3.5 bg-slate-800 rounded-full mx-auto mb-2" />
                  <div className="flex-1 bg-neutral-900 rounded-[16px] p-2.5 flex flex-col justify-between overflow-hidden relative">
                    <div className="bg-neutral-800 p-1.5 rounded flex items-center gap-1.5 text-[9px] font-bold text-white mb-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Shri Prasadam Admins</span>
                    </div>
                    
                    {/* Live WhatsApp Speech Node Container with Media Processing Node */}
                    <div className="bg-[#E2F7CB] text-neutral-800 p-2 rounded-lg text-[10px] font-medium leading-relaxed self-start shadow-sm border border-emerald-200/40 w-full break-words">
                      {mediaUrl && (
                        <div className="mb-2 rounded overflow-hidden bg-white border border-emerald-100 max-h-[100px] flex items-center justify-center text-[9px] font-bold text-slate-400">
                          {mediaType === "image" && <img src={mediaUrl} className="object-cover w-full h-full" alt="Attached preview element" />}
                          {mediaType === "video" && <video src={mediaUrl} className="object-cover w-full h-full" muted />}
                          {mediaType === "document" && <span className="p-4 flex items-center gap-1">📁 Document Attached</span>}
                        </div>
                      )}
                      <p className="whitespace-pre-wrap">{messageBody || "Configure layout settings view..."}</p>
                      <span className="block text-[7px] text-right text-emerald-700/60 font-semibold mt-1">10:45 PM ✓✓</span>
                    </div>
                    <div className="bg-neutral-800 h-4 rounded-full mt-2" />
                  </div>
                </div>
              </div>

              {/* Action submission buttons block */}
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Transit Pipeline Strategy</span>
                  <span className="font-bold text-slate-800">Meta Live HTTP Broadcast</span>
                </div>
                <button 
                  type="button"
                  onClick={handleSendCampaign}
                  disabled={isSubmitting || isUploading}
                  className="px-6 py-2 bg-brand-deep hover:bg-brand-primary text-white font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px] justify-center"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  {isSubmitting ? "Sending..." : "Send Now"}
                </button>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </DashboardLayout>
  );
}