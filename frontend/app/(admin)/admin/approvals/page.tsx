"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL, type Worker } from "@/lib/api";
import { UserCheck, ShieldCheck, MapPin, ChevronRight, ArrowRight, User, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function WorkerApprovalsRegistry() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    async function loadWorkersList() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/workers/`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setWorkers(data.results || []);
        } else {
          setError("Failed to retrieve approvals queue.");
        }
      } catch {
        setError("Network error. Failed to retrieve approvals queue.");
      } finally {
        setLoading(false);
      }
    }
    loadWorkersList();
  }, []);

  const filtered = workers.filter((w) => {
    if (activeTab === "pending") return !w.is_approved;
    return w.is_approved; // "approved"
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="space-y-1">
        <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Worker Approvals Queue</h1>
        <p className="text-xs font-semibold text-slate-500">Perform KYC background checks and review NIN identity applications</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 bg-slate-100 rounded-2xl p-1 w-fit shrink-0">
        {[
          { id: "pending", label: "Pending Approvals" },
          { id: "approved", label: "Approved Registry" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-wider transition-all ${
              activeTab === tab.id
                ? "bg-white text-primary shadow-sm"
                : "text-slate-500 hover:bg-white/40"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-[2rem] border border-red-100 bg-red-50 p-4 text-xs font-bold text-red-755 flex items-center gap-1.5 animate-fade-in mb-4">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-650" />
          <span>{error}</span>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="h-40 bg-slate-200 animate-pulse rounded-[2.5rem]"></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[2.5rem] border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500">
          <UserCheck className="h-8 w-8 text-slate-400 mx-auto mb-2" />
          <p className="text-xs font-semibold">Queue completely cleared! No pending worker applications.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((w) => (
            <Link
              key={w.id}
              href={`/admin/approvals/${w.id}`}
              className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm">
                  {w.full_name.charAt(0)}
                </div>
                <div>
                  <strong className="text-xs font-black text-slate-800 block leading-tight">{w.full_name}</strong>
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase mt-1 block flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-primary shrink-0" />
                    {w.city}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <span className="text-[10px] text-slate-400 font-black">₦{Number(w.hourly_rate).toLocaleString()}/hr</span>
                <span className="rounded-xl bg-primary hover:bg-primary-dark text-white px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  Review
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

    </div>
  );
}
