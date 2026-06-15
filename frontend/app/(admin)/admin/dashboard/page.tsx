"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/AuthContext";
import { API_BASE_URL } from "@/lib/api";
import { Sparkles, Shield, UserCheck, Calendar, Wallet, Star, Briefcase, AlertTriangle, ChevronRight, Activity, ArrowRight, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

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

  // --- Chart Simulation State ---
  const [chartData, setChartData] = useState<{ id: number; value: number }[]>([
    { id: 1, value: 35 },
    { id: 2, value: 48 },
    { id: 3, value: 38 },
    { id: 4, value: 52 },
    { id: 5, value: 68 },
    { id: 6, value: 58 },
    { id: 7, value: 72 },
    { id: 8, value: 85 },
    { id: 9, value: 65 },
    { id: 10, value: 90 },
    { id: 11, value: 80 },
    { id: 12, value: 95 }
  ]);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const nextId = useRef(13);

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

  // Poll real stats from the database every 10 seconds
  useEffect(() => {
    loadStats();
    const pollInterval = setInterval(() => {
      loadStats();
    }, 10000);
    return () => clearInterval(pollInterval);
  }, []);

  // Shift graph timeline to the left and append simulated active value (every 6 seconds)
  useEffect(() => {
    const shiftInterval = setInterval(() => {
      setChartData((prev) => {
        const nextVal = Math.floor(Math.random() * 50) + 40; // baseline activity 40-90
        const shifted = prev.slice(1);
        const newId = nextId.current;
        nextId.current += 1;
        return [...shifted, { id: newId, value: nextVal }];
      });
    }, 6000);

    return () => clearInterval(shiftInterval);
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Upper warning banner alert */}
      {stats.pendingApprovals > 0 && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200/60 rounded-2xl px-5 py-3 text-xs font-black text-amber-800 animate-scale-up">
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Platform Operations</h1>
          <p className="text-xs font-semibold text-slate-500">Track dynamic platform metrics, audit system logs and review queue applications</p>
        </div>
        
        {/* Live Simulation status pill */}
        <div className="self-start sm:self-center flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[9px] font-black uppercase text-emerald-800 tracking-wider">Live Chart Active</span>
        </div>
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
              <span className="text-[10px] text-slate-450 font-bold uppercase">Live Timeline</span>
            </div>

            {/* Live Animated Bar Chart */}
            <div className="h-48 rounded-2xl bg-slate-50 border border-slate-100 flex items-end justify-between p-4 relative overflow-hidden">
              
              {/* Subtle Horizontal Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none opacity-20">
                <div className="border-t border-slate-300 w-full"></div>
                <div className="border-t border-slate-300 w-full"></div>
                <div className="border-t border-slate-300 w-full"></div>
                <div className="border-t border-slate-300 w-full"></div>
              </div>

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-wider bg-white/80 px-3 py-1.5 rounded-full border border-slate-100/50 shadow-sm">
                  Simulated Operations Telemetry
                </span>
              </div>

              <div className="w-full h-full flex items-end justify-between gap-1.5 relative z-10 pt-6">
                {chartData.map((bar, i) => (
                  <div 
                    key={bar.id} 
                    className="flex-1 flex flex-col items-center justify-end h-full relative group"
                    onMouseEnter={() => setHoveredBar(i)}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    {/* Hover tooltip */}
                    {hoveredBar === i && (
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[8px] font-black px-2 py-0.5 rounded shadow-md pointer-events-none z-50 whitespace-nowrap animate-fade-in">
                        {bar.value} Bookings
                      </div>
                    )}

                    {/* Animated bar */}
                    <motion.div
                      layout
                      initial={{ height: 0 }}
                      animate={{ height: `${bar.value}%` }}
                      transition={{ type: "spring", stiffness: 100, damping: 15 }}
                      className={`w-full max-w-[28px] rounded-t-md cursor-pointer transition-all duration-300 ${
                        i === chartData.length - 1 
                          ? "bg-gradient-to-t from-primary to-accent hover:opacity-95 shadow-md shadow-accent/15 animate-pulse" 
                          : "bg-primary/20 hover:bg-primary/45"
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: RECENT ACTIVITIES LOGS */}
        <aside className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Operations Log</h3>
          
          <div className="space-y-3.5 shadow-inner rounded-2xl border border-slate-50 bg-slate-50/20 p-4 h-64 overflow-y-auto">
            <AnimatePresence initial={false}>
              {stats.operationsLog.map((act, i) => (
                <motion.div 
                  key={act.text + act.time}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-[10px] font-semibold text-slate-650 leading-relaxed border-b border-slate-100 pb-2.5 last:border-b-0 last:pb-0"
                >
                  <p>{act.text}</p>
                  <span className="text-[8px] text-slate-400 font-bold block mt-0.5">{act.time}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </aside>

      </div>

    </div>
  );
}
