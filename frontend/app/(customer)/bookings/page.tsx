"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { API_BASE_URL, type Booking } from "@/lib/api";
import { Calendar, Search, ArrowRight, Wrench, ChevronRight, AlertCircle } from "lucide-react";
import Link from "next/link";
import { BookingStatusBadge } from "@/components/shared/BookingStatusBadge";

export default function BookingsRegistry() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchVal, setSearchVal] = useState("");

  useEffect(() => {
    async function fetchAllBookings() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/bookings/`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setBookings(data.results || []);
        } else {
          setError("Unable to sync active bookings registry with the server.");
        }
      } catch {
        setError("Network error. Unable to connect to bookings registry server.");
      } finally {
        setLoading(false);
      }
    }
    fetchAllBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = bookings.filter((b) => {
    const matchesSearch = searchQueryMatches(b, searchVal);
    const matchesStatus = filterStatus === "all" || 
      (filterStatus === "active" && (b.status === "pending" || b.status === "accepted" || b.status === "in_progress" || b.status === "disputed")) ||
      (filterStatus === "completed" && b.status === "done") ||
      (filterStatus === "cancelled" && b.status === "cancelled");

    return matchesSearch && matchesStatus;
  });

  function searchQueryMatches(b: Booking, val: string) {
    if (!val) return true;
    const lowVal = val.toLowerCase();
    return b.worker_name.toLowerCase().includes(lowVal) || b.job_description.toLowerCase().includes(lowVal);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Booking Registry</h1>
        <p className="text-xs font-semibold text-slate-500">Track and review current escrow milestones and historical services logs</p>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center border-b border-slate-100 pb-4">
        
        {/* Tabs */}
        <div className="flex gap-1.5 bg-slate-100 rounded-2xl p-1 shrink-0">
          {[
            { id: "all", label: "All" },
            { id: "active", label: "Active" },
            { id: "completed", label: "Completed" },
            { id: "cancelled", label: "Cancelled" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-wider transition-all ${
                filterStatus === tab.id
                  ? "bg-white text-primary shadow-sm"
                  : "text-slate-500 hover:bg-white/40"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search bookings..."
            className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-4 text-xs font-semibold outline-none focus:border-primary bg-white"
          />
        </div>

      </div>

      {/* Desktop Table View / Mobile cards list */}
      {error && (
        <div className="rounded-3xl border border-red-100 bg-red-50 p-4 text-xs font-bold text-red-750 flex items-center gap-1.5 animate-fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-650" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="h-40 bg-slate-200 animate-pulse rounded-3xl"></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500">
          <Calendar className="h-8 w-8 text-slate-400 mx-auto mb-2" />
          <p className="text-xs font-semibold">No bookings found matching filters criteria.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((b) => (
            <Link
              key={b.id}
              href={`/bookings/${b.id}`}
              className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <BookingStatusBadge status={b.status} />
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase">ID: {b.id.slice(-6).toUpperCase()}</span>
                </div>
                
                <div>
                  <strong className="text-sm font-black text-slate-800">{b.worker_name}</strong>
                  <p className="text-xs text-slate-500 mt-1 leading-normal italic line-clamp-1">&quot;{b.job_description}&quot;</p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-slate-50 pt-3 sm:pt-0 shrink-0">
                <div className="text-left sm:text-right">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Escrow Amount</span>
                  <strong className="text-sm font-black text-slate-850">₦{Number(b.quoted_amount).toLocaleString()}</strong>
                </div>

                <ChevronRight className="h-5 w-5 text-slate-300" />
              </div>
            </Link>
          ))}
        </div>
      )}

    </div>
  );
}
