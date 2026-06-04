"use client";

import { useEffect, useState, useCallback } from "react";
import { API_BASE_URL, type Booking } from "@/lib/api";
import {
  AlertTriangle,
  Scale,
  ShieldCheck,
  RefreshCcw,
  Search,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Briefcase,
  Banknote,
  MapPin,
  CalendarDays,
  FileText,
} from "lucide-react";

// All payment ledger fields are now on the shared Booking type
type DisputedBooking = Booking;


const STATUS_COLORS: Record<string, string> = {
  disputed: "bg-red-100 text-red-700 border-red-200",
  done: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelled: "bg-slate-100 text-slate-600 border-slate-200",
};

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminDisputesPage() {
  const [bookings, setBookings] = useState<DisputedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [error, setError] = useState("");

  const [selected, setSelected] = useState<DisputedBooking | null>(null);
  const [actionMsg, setActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [actioning, setActioning] = useState(false);

  const fetchDisputes = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/bookings/`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        const all: DisputedBooking[] = data.results || [];
        // Keep disputed + recently resolved (done/cancelled) for context
        setBookings(all.filter((b) => b.status === "disputed" || b.status === "done" || b.status === "cancelled"));
      } else {
        setError("Failed to retrieve bookings from the API.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const handleArbitrate = async (action: "release" | "refund") => {
    if (!selected) return;
    const nextStatus = action === "release" ? "done" : "cancelled";
    setActioning(true);
    setActionMsg(null);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/bookings/${selected.id}/${nextStatus}/`,
        { method: "POST", credentials: "include" }
      );
      if (res.ok) {
        setActionMsg({
          type: "success",
          text:
            action === "release"
              ? "✓ Escrow released to worker. Ledger updated."
              : "✓ Refund issued to customer. Booking cancelled.",
        });
        setTimeout(() => {
          fetchDisputes(true);
          setSelected(null);
          setActionMsg(null);
        }, 2000);
      } else {
        const errData = await res.json().catch(() => ({}));
        setActionMsg({ type: "error", text: errData.detail || "Arbitration failed." });
      }
    } catch {
      setActionMsg({ type: "error", text: "Network error. Arbitration failed." });
    } finally {
      setActioning(false);
    }
  };

  const disputed = bookings.filter((b) => b.status === "disputed");
  const resolved = bookings.filter((b) => b.status !== "disputed");

  const filteredDisputed = disputed.filter(
    (b) =>
      b.customer_name?.toLowerCase().includes(searchVal.toLowerCase()) ||
      b.worker_name?.toLowerCase().includes(searchVal.toLowerCase()) ||
      b.job_description?.toLowerCase().includes(searchVal.toLowerCase()) ||
      b.address?.toLowerCase().includes(searchVal.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in py-4">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Scale className="h-6 w-6 text-red-500" />
            Disputes Arbitration
          </h1>
          <p className="text-xs font-semibold text-slate-500">
            Review escalated disputes and arbitrate escrow release or refund decisions.
          </p>
        </div>
        <button
          onClick={() => fetchDisputes(true)}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
        >
          <RefreshCcw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-3xl border border-red-100 bg-red-50/60 p-4 space-y-1">
          <span className="text-[9px] font-black text-red-400 uppercase tracking-wider block">Active Disputes</span>
          <strong className="text-2xl font-black text-red-600">{disputed.length}</strong>
          <span className="text-[9px] text-slate-400 font-semibold block">Awaiting arbitration</span>
        </div>
        <div className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-4 space-y-1">
          <span className="text-[9px] font-black text-emerald-500 uppercase tracking-wider block">Resolved</span>
          <strong className="text-2xl font-black text-emerald-600">{resolved.length}</strong>
          <span className="text-[9px] text-slate-400 font-semibold block">Closed cases</span>
        </div>
        <div className="rounded-3xl border border-amber-100 bg-amber-50/60 p-4 space-y-1">
          <span className="text-[9px] font-black text-amber-500 uppercase tracking-wider block">Total Escrow at Risk</span>
          <strong className="text-xl font-black text-amber-600">
            ₦{disputed.reduce((s, b) => s + (b.payment_amount ?? Number(b.quoted_amount)), 0).toLocaleString("en-NG", { maximumFractionDigits: 0 })}
          </strong>
          <span className="text-[9px] text-slate-400 font-semibold block">Across active disputes</span>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 flex items-center gap-3 text-xs font-bold text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Active Disputes Panel */}
      <div className="rounded-[2rem] border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-6 pt-6 pb-4 border-b border-slate-50">
          <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Open Disputes
            {filteredDisputed.length > 0 && (
              <span className="ml-1 rounded-full bg-red-100 text-red-700 text-[8px] font-black px-2 py-0.5">
                {filteredDisputed.length}
              </span>
            )}
          </h2>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search disputes…"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-48 rounded-xl border border-slate-100 bg-slate-50 pl-8 pr-3 py-2 text-xs font-semibold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : filteredDisputed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <ShieldCheck className="h-12 w-12 text-emerald-300" />
            <p className="text-xs font-black uppercase tracking-wider">No active disputes</p>
            <p className="text-[10px] font-semibold">All clear — no pending arbitration cases.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filteredDisputed.map((b) => {
              const gross = b.payment_amount ?? Number(b.quoted_amount);
              const net = b.worker_amount ?? gross * 0.88;
              return (
                <div
                  key={b.id}
                  onClick={() => { setSelected(b); setActionMsg(null); }}
                  className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-red-50/30 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-10 w-10 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
                      <AlertTriangle className="h-4.5 w-4.5 text-red-500" />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-slate-800">{b.customer_name}</span>
                        <span className="text-[9px] text-slate-400 font-semibold">→</span>
                        <span className="text-xs font-black text-slate-700">{b.worker_name}</span>
                      </div>
                      <p className="text-[10px] font-semibold text-slate-500 line-clamp-1">{b.job_description}</p>
                      <p className="text-[9px] text-slate-400 font-semibold">{formatDate(b.updated_at)}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 space-y-0.5">
                    <span className="text-sm font-black text-red-600">
                      ₦{gross.toLocaleString("en-NG", { maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-[9px] text-slate-400 font-semibold block">escrowed</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recently Resolved */}
      {resolved.length > 0 && (
        <div className="rounded-[2rem] border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50">
            <h2 className="text-xs font-black text-slate-600 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Recently Closed Cases
            </h2>
          </div>
          <div className="divide-y divide-slate-50">
            {resolved.slice(0, 10).map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-4 px-6 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${b.status === "done" ? "bg-emerald-100" : "bg-slate-100"}`}>
                    {b.status === "done" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-slate-700">
                      {b.customer_name} → {b.worker_name}
                    </div>
                    <div className="text-[9px] text-slate-400 font-semibold line-clamp-1">{b.job_description}</div>
                  </div>
                </div>
                <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border ${STATUS_COLORS[b.status] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                  {b.status === "done" ? "Released" : "Refunded"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Arbitration Drawer / Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg mx-4 mb-0 md:mb-0 bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl overflow-y-auto max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="h-10 w-10 rounded-2xl bg-red-100 flex items-center justify-center">
                  <Scale className="h-5 w-5 text-red-500" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-800">Arbitration Panel</h3>
                  <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Admin Action Required</p>
                </div>
              </div>
              <button
                onClick={() => { setSelected(null); setActionMsg(null); }}
                className="rounded-xl p-2 hover:bg-slate-100 transition-colors"
              >
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Dispute Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 p-3 space-y-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <User className="h-3 w-3" /> Customer
                  </span>
                  <span className="text-xs font-black text-slate-800">{selected.customer_name}</span>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3 space-y-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Briefcase className="h-3 w-3" /> Worker
                  </span>
                  <span className="text-xs font-black text-slate-800">{selected.worker_name}</span>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-3 space-y-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <FileText className="h-3 w-3" /> Job Description
                </span>
                <p className="text-xs font-semibold text-slate-700">{selected.job_description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 p-3 space-y-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Location
                  </span>
                  <p className="text-xs font-semibold text-slate-700">{selected.address}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3 space-y-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" /> Escalated
                  </span>
                  <p className="text-xs font-semibold text-slate-700">{formatDate(selected.updated_at)}</p>
                </div>
              </div>

              {/* Escrow Ledger */}
              <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4 space-y-3">
                <h4 className="text-[9px] font-black text-amber-600 uppercase tracking-wider flex items-center gap-1">
                  <Banknote className="h-3.5 w-3.5" /> Escrow Ledger
                </h4>
                <div className="space-y-2">
                  {[
                    {
                      label: "Gross Amount",
                      val: `₦${(selected.payment_amount ?? Number(selected.quoted_amount)).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`,
                      color: "text-slate-800",
                    },
                    {
                      label: "Platform Commission (12%)",
                      val: `−₦${(selected.platform_commission ?? (selected.payment_amount ?? Number(selected.quoted_amount)) * 0.12).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`,
                      color: "text-red-600",
                    },
                    {
                      label: "Worker Net Payout",
                      val: `₦${(selected.worker_amount ?? (selected.payment_amount ?? Number(selected.quoted_amount)) * 0.88).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`,
                      color: "text-primary font-black",
                    },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-500">{row.label}</span>
                      <span className={`font-black ${row.color}`}>{row.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Feedback */}
              {actionMsg && (
                <div
                  className={`rounded-2xl px-4 py-3 text-xs font-bold flex items-center gap-2 ${
                    actionMsg.type === "success"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {actionMsg.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                  )}
                  {actionMsg.text}
                </div>
              )}

              {/* Only show action buttons if still disputed */}
              {selected.status === "disputed" && (
                <>
                  <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider">
                    Select an arbitration outcome — this action is irreversible.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleArbitrate("release")}
                      disabled={actioning}
                      className="flex flex-col items-center gap-2 rounded-2xl bg-primary/5 border border-primary/20 px-4 py-4 hover:bg-primary/10 transition-all disabled:opacity-50 group"
                    >
                      <CheckCircle2 className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                      <div className="text-center">
                        <span className="text-xs font-black text-primary block">Release Escrow</span>
                        <span className="text-[9px] text-slate-400 font-semibold">Pay worker</span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleArbitrate("refund")}
                      disabled={actioning}
                      className="flex flex-col items-center gap-2 rounded-2xl bg-red-50 border border-red-200 px-4 py-4 hover:bg-red-100 transition-all disabled:opacity-50 group"
                    >
                      <XCircle className="h-6 w-6 text-red-500 group-hover:scale-110 transition-transform" />
                      <div className="text-center">
                        <span className="text-xs font-black text-red-600 block">Issue Refund</span>
                        <span className="text-[9px] text-slate-400 font-semibold">Refund customer</span>
                      </div>
                    </button>
                  </div>

                  {actioning && (
                    <div className="flex items-center justify-center gap-2 py-2">
                      <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Processing...</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
