"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { Sparkles, Shield, UserCheck, ClipboardList, AlertTriangle, LayoutGrid, Settings, LogOut, ArrowLeft, Menu, Users, FileText } from "lucide-react";
import { useState } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50/50">
        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        <span className="text-xs font-black text-slate-500 mt-3 uppercase tracking-widest">Entering Operations Center...</span>
      </div>
    );
  }

  if (!user || user.role.toLowerCase() !== "admin") {
    return null; // Let redirection handle it
  }

  const sidebarLinks = [
    { label: "Dashboard", href: "/admin/dashboard", icon: Shield },
    { label: "Worker Approvals", href: "/admin/approvals", icon: UserCheck },
    { label: "Users Manager", href: "/admin/users", icon: Users },
    { label: "Bookings", href: "/admin/bookings", icon: ClipboardList },
    { label: "Disputes Arbitration", href: "/admin/disputes", icon: AlertTriangle },
    { label: "Categories Manager", href: "/admin/categories", icon: LayoutGrid },
    { label: "Platform Settings", href: "/admin/settings", icon: Settings },
    { label: "Audit Log", href: "/admin/audit-log", icon: FileText },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50/30">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-100 bg-white p-5 justify-between">
        <div className="space-y-6">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-white shadow-md shadow-primary/15">
              <Sparkles className="h-5 w-5 text-accent" />
            </span>
            <div>
              <span className="text-lg font-black tracking-tight text-primary">SkillBridge</span>
              <span className="text-[8px] font-extrabold uppercase tracking-widest text-[#f5a623] mt-0.5 block">Operations</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-black transition-all ${
                    isActive
                      ? "bg-primary-light text-primary"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="border-t border-slate-50 pt-4 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary font-black text-xs">
              A
            </span>
            <div className="leading-none">
              <span className="text-xs font-black text-slate-800">Admin Staff</span>
              <span className="text-[8px] font-extrabold uppercase tracking-widest text-slate-400 mt-1 block">Level 1 Manager</span>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-black text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4.5 w-4.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navbar - Mobile */}
        <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white">
              <Sparkles className="h-4 w-4 text-accent" />
            </span>
            <span className="text-sm font-black tracking-tight text-primary">SkillBridge Admin</span>
          </Link>
          
          <button 
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-xl border border-slate-100 p-2 text-slate-500 hover:bg-slate-50"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        {/* Mobile Dropdown Menu */}
        {mobileOpen && (
          <div className="lg:hidden border-b border-slate-100 bg-white p-4 space-y-2 animate-fade-in z-50">
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-black text-slate-600 hover:bg-slate-50"
                >
                  <Icon className="h-4.5 w-4.5 text-primary" />
                  {link.label}
                </Link>
              );
            })}
            <button
              onClick={() => { setMobileOpen(false); logout(); }}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-black text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4.5 w-4.5" />
              Sign Out
            </button>
          </div>
        )}

        {/* Operations Workspace Container */}
        <main className="flex-grow p-3 md:p-4 overflow-y-auto">
          {children}
        </main>
      </div>

    </div>
  );
}
