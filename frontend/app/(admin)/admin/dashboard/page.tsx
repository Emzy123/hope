"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { API_BASE_URL, type Booking } from "@/lib/api";
import { Sparkles, Shield, UserCheck, Calendar, Wallet, Star, Briefcase, AlertTriangle, ChevronRight, Activity, ArrowRight, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeWorkers: 0,
    totalBookings: 0,
    revenue: 0,
    openDisputes: 0,
    pendingApprovals: 0,
    operationsLog: [] as { text: string; time: string }[]
  });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const loadStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/admin/dashboard-stats/`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        setErrorMsg("Failed to load operations metrics.");
      }
    } catch {
      setErrorMsg("Network error. Failed to load operations metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Upper warning banner alert */}
      {stats.pendingApprovals > 0 && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200/60 rounded-2xl px-5 py-3 text-xs font-black text-amber-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-accent animate-pulse" />
            <span>Operations Alert: {stats.pendingApprovals} worker KYC applications require administrative approval.</span>
          </div>
          <Link 
            href="/admin/approvals"
            className="flex items-center gap-1 hover:underline shrink-0 text-accent font-black uppercase text-[10px]"
          >
            Review Now
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-[2rem] border border-red-200 bg-red-50 p-5 flex items-start gap-3 shadow-sm animate-fade-in">
          <ShieldAlert className="h-5 w-5 text-red-650 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <strong className="text-xs font-black text-red-800 block">System Connection Alert</strong>
            <p className="text-[10.5px] font-semibold text-red-755 leading-tight">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Greetings Header */}
      <div className="space-y-1">
        <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Platform Operations</h1>
        <p className="text-xs font-semibold text-slate-500">Track dynamic platform metrics, audit system logs and review queue applications</p>
      </div>

      {/* SECTION 1: STATS CARDS */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {[
          { label: "Active Workers", val: stats.activeWorkers, desc: "KYC approved", color: "text-primary" },
          { label: "Total Bookings", val: stats.totalBookings, desc: "Platform total", color: "text-slate-800" },
          { label: "Platform Revenue", val: `₦${stats.revenue.toLocaleString()}`, desc: "12% escrow cut", color: "text-primary" },
          { label: "Open Disputes", val: stats.openDisputes, desc: "Awaiting arbitration", color: "text-red-650" }
        ].map((card, idx) => (
          <div key={idx} className="rounded-3xl border border-slate-100 bg-white p-5 space-y-1 shadow-sm hover:shadow-md transition-all">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">{card.label}</span>
            <strong className={`text-base md:text-lg font-black block leading-none ${card.color}`}>{card.val}</strong>
            <span className="text-[9px] text-slate-400 font-semibold block">{card.desc}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3 items-start">
        
        {/* LEFT COLUMN: ACTIVITY CHART */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-50 pb-3">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="h-4.5 w-4.5 text-primary" />
                Bookings activity chart
              </h3>
              <span className="text-[10px] text-slate-450 font-bold uppercase">Last 30 Days</span>
            </div>

            {/* Simulated Recharts Line chart */}
            <div className="h-48 rounded-2xl bg-slate-50 border border-slate-100 flex items-end justify-between p-4 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-[10px] font-black text-slate-350 uppercase tracking-wider">Simulated Activity Logs</span>
              </div>
              
              {[40, 55, 45, 60, 75, 65, 80, 95, 85, 100].map((h, i) => (
                <div key={i} className="w-6 bg-primary/10 hover:bg-primary rounded-t-lg transition-all" style={{ height: `${h}%` }}></div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: RECENT ACTIVITIES LOGS */}
        <aside className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Operations Log</h3>
          
          <div className="space-y-3.5 shadow-inner rounded-2xl border border-slate-50 bg-slate-50/20 p-4">
            {stats.operationsLog.map((act, i) => (
              <div key={i} className="text-[10px] font-semibold text-slate-650 leading-relaxed border-b border-slate-50 pb-2.5 last:border-b-0 last:pb-0">
                <p>{act.text}</p>
                <span className="text-[8px] text-slate-400 font-bold block mt-0.5">{act.time}</span>
              </div>
            ))}
          </div>
        </aside>

      </div>

    </div>
  );
}
