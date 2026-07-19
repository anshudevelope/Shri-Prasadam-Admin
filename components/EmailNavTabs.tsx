"use client";
import React from "react";
import { useRouter, usePathname } from "next/navigation";

const tabs = [
  { label: "Campaigns", path: "/dashboard/email" },
  { label: "Subscribers", path: "/dashboard/email/subscribers" },
  { label: "Templates", path: "/dashboard/email/templates" },
];

export default function EmailNavTabs() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex gap-1 border-b border-slate-200 mb-6">
      {tabs.map((tab) => {
        const isActive = pathname === tab.path;
        return (
          <button
            key={tab.path}
            onClick={() => router.push(tab.path)}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
              isActive
                ? "border-brand-deep text-brand-deep"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
