"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, LogIn, Info, UtensilsCrossed } from "lucide-react";
import { STATIC_CREDENTIALS, loginSession, isAuthenticated } from "@/app/lib/auth-mock";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated()) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === STATIC_CREDENTIALS.email && password === STATIC_CREDENTIALS.password) {
      loginSession();
      router.push("/dashboard");
    } else {
      setError("Invalid administrative credentials. Please check details below.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-lightBg px-4 py-12">
      <div className="max-w-5xl w-full flex flex-col md:flex-row items-stretch bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden min-h-[580px]">
        
        {/* Left Interactive Login Side */}
        <div className="w-full md:w-1/2 p-8 lg:p-12 flex flex-col justify-between">
          <div className="text-center md:text-left flex flex-col items-center md:items-start gap-2 mb-4">
            <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm">
              <UtensilsCrossed className="w-6 h-6 text-brand-deep" />
            </div>
            <h1 className="text-2xl font-bold text-brand-deep mt-2">Shri Prasadam</h1>
            <p className="text-xs text-slate-400 font-medium">Admin Management Portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 my-auto">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-1">Welcome Back</h2>
              <p className="text-xs text-slate-400">Please enter your credentials to access the panel.</p>
            </div>

            {error && (
              <div className="p-3 text-xs bg-red-50 text-red-600 rounded-lg border border-red-100">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="email" required
                    placeholder="name@shriprasadam.com"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-sm rounded-lg focus:outline-none focus:border-brand-primary focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Password</label>
                  <a href="#" className="text-xs font-medium text-brand-accent hover:underline">Forgot?</a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type={showPassword ? "text" : "password"} required
                    placeholder="••••••••"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 text-sm rounded-lg focus:outline-none focus:border-brand-primary focus:bg-white transition"
                  />
                  <button 
                    type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <input id="remember" type="checkbox" className="w-4 h-4 text-brand-primary rounded border-slate-300 focus:ring-0" />
              <label htmlFor="remember" className="ml-2 text-xs font-medium text-slate-500">Remember this device</label>
            </div>

            <button type="submit" className="w-full py-3 bg-brand-deep hover:bg-brand-primary text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-blue-900/10 transition">
              Sign In <LogIn className="w-4 h-4" />
            </button>

            {/* Credential Helper Badge */}
            <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-lg flex gap-3 text-xs text-brand-primary">
              <Info className="w-4 h-4 shrink-0 text-brand-accent mt-0.5" />
              <div>
                <span className="font-semibold block mb-0.5 text-blue-900">Static credentials for demo:</span>
                <code className="bg-white px-1.5 py-0.5 rounded border border-blue-100 text-[11px]">admin@shriprasadam.com</code> / <code className="bg-white px-1.5 py-0.5 rounded border border-blue-100 text-[11px]">admin123</code>
              </div>
            </div>
          </form>

          <p className="text-[10px] text-center text-slate-400 font-medium">© 2026 Shri Prasadam. All rights reserved.</p>
        </div>

        {/* Right Split Image Area */}
        <div className="hidden md:block md:w-1/2 p-6 bg-slate-50 relative">
          <div className="w-full h-full rounded-xl overflow-hidden relative shadow-inner group">
            {/* Soft backdrop texture placeholder */}
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-deep to-slate-800 opacity-90 mix-blend-multiply z-10" />
            <img 
              src="https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=600" 
              alt="Luxury Sweets Display" 
              className="w-full h-full object-cover transform scale-105 group-hover:scale-100 transition duration-700"
            />
            <div className="absolute bottom-0 left-0 right-0 p-8 z-20 text-white">
              <h3 className="text-lg font-bold mb-2">Excellence in Service</h3>
              <p className="text-xs text-slate-200/80 leading-relaxed font-light">
                Managing the heart of hospitality with precision and modern technology.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}