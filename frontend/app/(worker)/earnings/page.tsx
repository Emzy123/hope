"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { API_BASE_URL, type Booking } from "@/lib/api";
import {
  Wallet,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Calendar,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { BookingStatusBadge } from "@/components/shared/BookingStatusBadge";

// All payment ledger fields are now on the shared Booking type
type EarningsBooking = Booking;


function filterByPeriod(jobs: EarningsBooking[], period: string): EarningsBooking[] {
  const now = new Date();
  return jobs.filter((j) => {
    const date = new Date(j.updated_at || j.created_at || "");
    if (period === "week") {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      return date >= weekAgo;
    }
    if (period === "month") {
      const monthAgo = new Date(now);
      monthAgo.setMonth(now.getMonth() - 1);
      return date >= monthAgo;
    }
    return true; // all
  });
}

export default function WorkerEarningsLog() {
  const { user } = useAuth();
  const [completedJobs, setCompletedJobs] = useState<EarningsBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("month");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function fetchDoneBookings() {
      setErrorMsg("");
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/bookings/`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          const results: EarningsBooking[] = data.results || [];
          setCompletedJobs(results.filter((b) => b.status === "done"));
        } else {
          setErrorMsg("Failed to retrieve completed bookings from API.");
        }
      } catch {
        setErrorMsg("Network error. Failed to retrieve completed bookings.");
      } finally {
        setLoading(false);
      }
    }
    fetchDoneBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredJobs = filterByPeriod(completedJobs, activeTab);

  // Use server-side ledger values when available; fall back to estimate
  const COMMISSION_RATE = 0.12;
  const totalGross = filteredJobs.reduce((sum, j) => {
    return sum + (j.payment_amount ?? Number(j.quoted_amount));
  }, 0);
  const totalCommission = filteredJobs.reduce((sum, j) => {
    return sum + (j.platform_commission ?? (j.payment_amount ?? Number(j.quoted_amount)) * COMMISSION_RATE);
  }, 0);
  const totalNet = filteredJobs.reduce((sum, j) => {
    return sum + (j.worker_amount ?? (j.payment_amount ?? Number(j.quoted_amount)) * (1 - COMMISSION_RATE));
  }, 0);

  const releasedCount = filteredJobs.filter((j) => j.escrow_released).length;
  const pendingCount = filteredJobs.length - releasedCount;

  return (
    <div className="space-y-8 animate-fade-in py-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Wallet className="h-6 w-6 text-primary" />
          Earnings &amp; History
        </h1>
        <p className="text-xs font-semibold text-slate-500">
          Live ledger — gross pay, platform commission (12%), and your net payout per job.
        </p>
      </div>

      {errorMsg && (
        <div className="rounded-[2rem] border border-red-200 bg-red-50 p-5 flex items-start gap-3 shadow-sm animate-fade-in">
          <ShieldAlert className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <strong className="text-xs font-black text-red-800 block">Connection Alert</strong>
            <p className="text-[10.5px] font-semibold text-red-700 leading-tight">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Period Tabs */}
      <div className="flex gap-1.5 bg-slate-100 rounded-2xl p-1 w-fit">
        {[
          { id: "week", label: "This Week" },
          { id: "month", label: "This Month" },
          { id: "all", label: "All Time" },
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

      {/* Payout Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm space-y-2">
          <span className="text-[9px] font-black text-slate-400 uppercase block tracking-wider">Gross Earned</span>
          <strong className="text-base md:text-lg font-black block leading-none text-slate-800">
            ₦{totalGross.toLocaleString("en-NG", { maximumFractionDigits: 0 })}
          </strong>
          <div className="flex items-center gap-1 text-[9px] font-semibold text-slate-400">
            <ArrowUpRight className="h-3 w-3 text-emerald-500" />
            {filteredJobs.length} completed job{filteredJobs.length !== 1 ? "s" : ""}
          </div>
        </div>

        <div className="rounded-3xl border border-red-100 bg-red-50/40 p-5 shadow-sm space-y-2">
          <span className="text-[9px] font-black text-red-400 uppercase block tracking-wider">
            Platform Commission (12%)
          </span>
          <strong className="text-base md:text-lg font-black block leading-none text-red-600">
            −₦{totalCommission.toLocaleString("en-NG", { maximumFractionDigits: 0 })}
          </strong>
          <div className="flex items-center gap-1 text-[9px] font-semibold text-slate-400">
            <ArrowDownRight className="h-3 w-3 text-red-400" />
            Escrow holding margin
          </div>
        </div>

        <div className="rounded-3xl border border-primary/20 bg-primary/5 p-5 shadow-sm space-y-2">
          <span className="text-[9px] font-black text-primary/60 uppercase block tracking-wider">Net Payout</span>
          <strong className="text-base md:text-lg font-black block leading-none text-primary">
            ₦{totalNet.toLocaleString("en-NG", { maximumFractionDigits: 0 })}
          </strong>
          <div className="flex items-center gap-1 text-[9px] font-semibold text-slate-400">
            <CheckCircle2 className="h-3 w-3 text-primary" />
            {releasedCount} released · {pendingCount} pending
          </div>
        </div>
      </div>

      {/* Job History Table */}
      <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm space-y-4">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-primary" />
          Ledger — Job-by-Job Breakdown
        </h3>

        {loading ? (
          <div className="h-24 bg-slate-100 animate-pulse rounded-2xl" />
        ) : filteredJobs.length === 0 ? (
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center py-4">
            No completed jobs in this period.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-semibold text-slate-600">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 text-[9px] font-black text-slate-400 uppercase tracking-wider pr-4">
                    Customer
                  </th>
                  <th className="text-left py-2 text-[9px] font-black text-slate-400 uppercase tracking-wider pr-4">
                    Job
                  </th>
                  <th className="text-right py-2 text-[9px] font-black text-slate-400 uppercase tracking-wider pr-4">
                    Gross
                  </th>
                  <th className="text-right py-2 text-[9px] font-black text-red-400 uppercase tracking-wider pr-4">
                    Commission
                  </th>
                  <th className="text-right py-2 text-[9px] font-black text-primary uppercase tracking-wider">
                    Net Payout
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredJobs.map((j) => {
                  const gross = j.payment_amount ?? Number(j.quoted_amount);
                  const commission = j.platform_commission ?? gross * COMMISSION_RATE;
                  const net = j.worker_amount ?? gross - commission;
                  const released = j.escrow_released ?? false;

                  return (
                    <tr key={j.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 pr-4">
                        <div className="font-black text-slate-800">{j.customer_name}</div>
                        <div className="text-[9px] text-slate-400">{j.address}</div>
                      </td>
                      <td className="py-3 pr-4 max-w-[180px]">
                        <span className="line-clamp-2 text-slate-600">{j.job_description}</span>
                        <div className="mt-1">
                          <BookingStatusBadge status={j.status} />
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-right text-slate-700">
                        ₦{gross.toLocaleString("en-NG", { maximumFractionDigits: 0 })}
                      </td>
                      <td className="py-3 pr-4 text-right text-red-500">
                        −₦{commission.toLocaleString("en-NG", { maximumFractionDigits: 0 })}
                      </td>
                      <td className="py-3 text-right">
                        <span className="font-black text-primary">
                          ₦{net.toLocaleString("en-NG", { maximumFractionDigits: 0 })}
                        </span>
                        <span
                          className={`ml-1.5 inline-flex items-center gap-0.5 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                            released
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {released ? (
                            <>
                              <CheckCircle2 className="h-2.5 w-2.5" /> Released
                            </>
                          ) : (
                            <>
                              <Clock className="h-2.5 w-2.5" /> Pending
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
