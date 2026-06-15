"use client";

import Link from "next/link";
import { Sparkle } from "lucide-react";
import { usePathname } from "next/navigation";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSplitPage = pathname === "/login" || pathname === "/register";

  if (isSplitPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50/50">
      {/* Auth Navbar */}
      <header className="px-6 py-4 flex justify-between items-center bg-white border-b border-slate-100/50">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
            <Sparkle className="h-4.5 w-4.5 text-accent fill-accent" />
          </span>
          <span className="text-base font-black tracking-tight text-primary">SkillBridge</span>
        </Link>
        <Link href="/browse" className="text-xs font-bold text-slate-500 hover:text-primary transition-colors">
          Browse Services
        </Link>
      </header>

      {/* Auth Form Center Area */}
      <main className="flex-grow flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-slate-100 rounded-[2rem] p-8 shadow-xl shadow-slate-200/20">
          {children}
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="py-4 text-center text-[10px] font-black text-slate-400">
        SkillBridge Authentication Center • Abuja • Lagos • Port Harcourt
      </footer>
    </div>
  );
}
