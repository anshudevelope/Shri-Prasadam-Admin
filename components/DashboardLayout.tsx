"use client";
import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LayoutGrid, MessageSquare, Mail, LogOut, Search, Bell, Settings, UtensilsCrossed } from "lucide-react";
import { isAuthenticated, logoutSession } from "@/app/lib/auth-mock";

interface LayoutProps {
  children: React.ReactNode;
  activeTabTitle: string;
}

export default function DashboardLayout({ children, activeTabTitle }: LayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

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

  const menuItems = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutGrid },
    { label: "WhatsApp Automation", path: "/dashboard/whatsapp", icon: MessageSquare },
    { label: "Email Marketing", path: "/dashboard/email", icon: Mail },
  ];

  return (
    <div className="h-screen flex overflow-hidden bg-brand-lightBg">
      
      {/* 1. FIXED PREMIUM SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 h-full z-30">
        <div>
          {/* Brand Header Header */}
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
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    isActive 
                      ? "bg-slate-100 text-brand-deep border-l-4 border-brand-deep font-bold" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-brand-deep" : "text-slate-400"}`} />
                  {item.label}
                </button>
              );
            })}
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
                type="text" placeholder="Search analytics..." 
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
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100" alt="Avatar" className="w-full h-full object-cover" />
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