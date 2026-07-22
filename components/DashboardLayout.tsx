"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutGrid,
  MessageSquare,
  Mail,
  LogOut,
  Search,
  Bell,
  Settings,
  UtensilsCrossed,
  ChevronDown,
  Send,
  Users,
  FileText,
  BarChart3,
  Radio
} from "lucide-react";
import { isAuthenticated, logoutSession } from "@/app/lib/auth-mock";

interface LayoutProps {
  children: React.ReactNode;
  activeTabTitle: string;
}

export default function DashboardLayout({ children, activeTabTitle }: LayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  // Dropdown states
  const [emailMenuOpen, setEmailMenuOpen] = useState(false);
  const [whatsappMenuOpen, setWhatsappMenuOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/");
    } else {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    logoutSession();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-lightBg flex items-center justify-center text-xs font-semibold tracking-widest text-slate-400 uppercase">
        Verifying Session Securely...
      </div>
    );
  }

  // Section Checks
  const isWhatsappSection = pathname.startsWith("/dashboard/whatsapp");
  const isWhatsappMenuExpanded = isWhatsappSection || whatsappMenuOpen;

  const isEmailSection = pathname.startsWith("/dashboard/email");
  const isEmailMenuExpanded = isEmailSection || emailMenuOpen;

  // Navigation Items Definitions
  const whatsappSubItems = [
    {
      label: "Broadcast Studio",
      path: "/dashboard/whatsapp",
      icon: Radio,
      isActive: pathname === "/dashboard/whatsapp",
    },
    {
      label: "All Campaigns",
      path: "/dashboard/whatsapp/campaigns",
      icon: BarChart3,
      isActive: pathname.startsWith("/dashboard/whatsapp/campaigns"),
    },
  ];

  const emailSubItems = [
    {
      label: "Campaigns",
      path: "/dashboard/email",
      icon: Send,
      isActive: pathname === "/dashboard/email" || pathname.startsWith("/dashboard/email/campaigns"),
    },
    {
      label: "Subscribers",
      path: "/dashboard/email/subscribers",
      icon: Users,
      isActive: pathname.startsWith("/dashboard/email/subscribers"),
    },
    {
      label: "Templates",
      path: "/dashboard/email/templates",
      icon: FileText,
      isActive: pathname.startsWith("/dashboard/email/templates"),
    },
  ];

  return (
    <div className="h-screen flex overflow-hidden bg-brand-lightBg font-sans">

      {/* 1. FIXED SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 h-full z-30">
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-slate-100 flex flex-col">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-deep flex items-center justify-center text-white">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-brand-deep text-lg block tracking-tight">Shri Prasadam</span>
                <span className="text-[10px] uppercase tracking-widest text-slate-400 block font-semibold -mt-1">Admin Panel</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 mt-4">
            
            {/* Dashboard Link */}
            <button
              onClick={() => router.push("/dashboard")}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                pathname === "/dashboard"
                  ? "bg-slate-100 text-brand-deep border-l-4 border-brand-deep font-bold"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <LayoutGrid className={`w-4 h-4 ${pathname === "/dashboard" ? "text-brand-deep" : "text-slate-400"}`} />
              Dashboard
            </button>

            {/* WhatsApp Automation Dropdown */}
            <div>
              <button
                onClick={() => setWhatsappMenuOpen((prev) => !prev)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  isWhatsappSection
                    ? "bg-slate-100 text-brand-deep border-l-4 border-brand-deep font-bold"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <MessageSquare className={`w-4 h-4 ${isWhatsappSection ? "text-brand-deep" : "text-slate-400"}`} />
                <span className="flex-1 text-left">WhatsApp Automation</span>
                <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${isWhatsappMenuExpanded ? "rotate-180" : ""} ${isWhatsappSection ? "text-brand-deep" : "text-slate-400"}`} />
              </button>

              {isWhatsappMenuExpanded && (
                <div className="mt-1 ml-4 pl-3.5 border-l border-slate-200 space-y-1">
                  {whatsappSubItems.map((sub) => {
                    const SubIcon = sub.icon;
                    return (
                      <button
                        key={sub.path}
                        onClick={() => router.push(sub.path)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-semibold tracking-wide transition-all cursor-pointer ${
                          sub.isActive
                            ? "bg-emerald-50 text-emerald-700 font-bold"
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                        }`}
                      >
                        <SubIcon className={`w-3.5 h-3.5 ${sub.isActive ? "text-emerald-600" : "text-slate-400"}`} />
                        {sub.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Email Marketing Dropdown */}
            <div>
              <button
                onClick={() => setEmailMenuOpen((prev) => !prev)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  isEmailSection
                    ? "bg-slate-100 text-brand-deep border-l-4 border-brand-deep font-bold"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <Mail className={`w-4 h-4 ${isEmailSection ? "text-brand-deep" : "text-slate-400"}`} />
                <span className="flex-1 text-left">Email Marketing</span>
                <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${isEmailMenuExpanded ? "rotate-180" : ""} ${isEmailSection ? "text-brand-deep" : "text-slate-400"}`} />
              </button>

              {isEmailMenuExpanded && (
                <div className="mt-1 ml-4 pl-3.5 border-l border-slate-200 space-y-1">
                  {emailSubItems.map((sub) => {
                    const SubIcon = sub.icon;
                    return (
                      <button
                        key={sub.path}
                        onClick={() => router.push(sub.path)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-semibold tracking-wide transition-all cursor-pointer ${
                          sub.isActive
                            ? "bg-blue-50 text-brand-primary font-bold"
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                        }`}
                      >
                        <SubIcon className={`w-3.5 h-3.5 ${sub.isActive ? "text-brand-primary" : "text-slate-400"}`} />
                        {sub.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

          </nav>
        </div>

        {/* Fixed Bottom Action Area */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3.5 px-4 py-3 text-xs font-semibold text-slate-500 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition"
          >
            <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-500" />
            Logout
          </button>
        </div>
      </aside>

      {/* RIGHT CONTENT FRAME STACK */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* 2. FIXED HEADER BAR */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-20 shadow-sm">
          {/* Breadcrumb Info Display */}
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <span>Admin</span>
            <span>&rsaquo;</span>
            <span className="text-slate-700 font-semibold">{activeTabTitle}</span>
          </div>

          {/* Action Tools & Profile Summary */}
          <div className="flex items-center gap-6">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search analytics..."
                className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 text-xs rounded-md focus:outline-none w-56 focus:bg-white focus:border-brand-primary"
              />
            </div>

            <button className="relative text-slate-400 hover:text-slate-600">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full animate-ping" />
            </button>
            <button className="text-slate-400 hover:text-slate-600">
              <Settings className="w-4 h-4" />
            </button>

            <div className="h-8 w-px bg-slate-200" />

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs font-semibold block text-slate-800">Admin User</span>
                <span className="text-[10px] text-slate-400 block -mt-0.5">Master Account</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100"
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </header>

        {/* 3. SCROLLABLE MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>

      </div>
    </div>
  );
}