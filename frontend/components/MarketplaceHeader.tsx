"use client";

import { LogOut, Shield, Briefcase, Calendar, Search, Sparkles, Wifi, WifiOff } from "lucide-react";

type User = {
  id: string;
  phone: string;
  full_name: string;
  role: string;
} | null;

type MarketplaceHeaderProps = {
  user: User;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isLive: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
};

export function MarketplaceHeader({
  user,
  onLogout,
  activeTab,
  setActiveTab,
  isLive,
  searchQuery,
  setSearchQuery,
}: MarketplaceHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between lg:px-8">
        {/* Brand & Connection State */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0f3a22] text-white shadow-md shadow-green-900/20">
              <Sparkles className="h-5 w-5 text-amber-400" />
            </span>
            <div>
              <span className="text-xl font-black tracking-tight text-[#0f3a22]">SkillBridge</span>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                {isLive ? (
                  <>
                    <Wifi className="h-3 w-3 text-green-500 animate-pulse" />
                    <span className="text-green-600">LIVE API</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 text-amber-500" />
                    <span className="text-amber-600">DEMO MODE</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-slate-100/80 p-1">
          <button
            onClick={() => setActiveTab("marketplace")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "marketplace"
                ? "bg-white text-[#0f3a22] shadow-sm"
                : "text-slate-600 hover:bg-white/40"
            }`}
          >
            <Search className="h-3.5 w-3.5" />
            Browse Workers
          </button>
          
          <button
            onClick={() => setActiveTab("bookings")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all relative ${
              activeTab === "bookings"
                ? "bg-white text-[#0f3a22] shadow-sm"
                : "text-slate-600 hover:bg-white/40"
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            My Bookings
          </button>

          <button
            onClick={() => setActiveTab("worker")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "worker"
                ? "bg-white text-[#0f3a22] shadow-sm"
                : "text-slate-600 hover:bg-white/40"
            }`}
          >
            <Briefcase className="h-3.5 w-3.5" />
            Worker Console
          </button>

          <button
            onClick={() => setActiveTab("admin")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "admin"
                ? "bg-white text-[#0f3a22] shadow-sm"
                : "text-slate-600 hover:bg-white/40"
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            Admin Operations
          </button>
        </nav>

        {/* Search & User Status */}
        <div className="flex items-center gap-3">
          {activeTab === "marketplace" && (
            <div className="relative hidden w-48 lg:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Plumbers..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs font-medium outline-none focus:border-[#0f3a22] focus:bg-white transition-all"
              />
            </div>
          )}

          {user ? (
            <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-1.5 pr-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-green-800/10 text-xs font-black text-[#0f3a22]">
                {user.full_name?.charAt(0) || "U"}
              </span>
              <div className="hidden flex-col items-start leading-none sm:flex">
                <span className="text-xs font-extrabold text-slate-800">{user.full_name || "User"}</span>
                <span className="text-[9px] font-semibold uppercase tracking-wider text-[#0f3a22] mt-0.5">{user.role}</span>
              </div>
              <button
                onClick={onLogout}
                className="ml-2 rounded-xl p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                title="Logout"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-slate-300"></span>
              <span className="text-xs font-bold text-slate-500">Not logged in</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
