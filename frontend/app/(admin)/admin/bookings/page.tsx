"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL, type Booking } from "@/lib/api";
import { ClipboardList, Search, ChevronRight, X, AlertTriangle, ShieldCheck } from "lucide-react";
import { BookingStatusBadge } from "@/components/shared/BookingStatusBadge";

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchVal, setSearchVal] = useState("");
  const [error, setError] = useState("");
  
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [resolveMessage, setResolveMessage] = useState("");

  const fetchAllBookings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/bookings/`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setBookings(data.results || []);
      } else {
        setError("Failed to sync bookings registry with the server.");
      }
    } catch {
      setError("Network error. Failed to retrieve platform bookings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllBookings();
  }, []);

  const handleArbitration = async (action: "release" | "refund") => {
    if (!selectedBooking) return;
    const nextStatus = action === "release" ? "done" : "cancelled";
    setResolveMessage("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/bookings/${selectedBooking.id}/${nextStatus}/`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        setResolveMessage(`Arbitration finalized! Funds successfully ${action === "release" ? "released to worker" : "refunded to customer"}.`);
        setTimeout(() => {
          fetchAllBookings();
          setSelectedBooking(null);
          setResolveMessage("");
        }, 1500);
      } else {
        const errData = await res.json().catch(() => ({}));
        setResolveMessage(`Error: ${errData.detail || "Failed to resolve booking."}`);
      }
    } catch {
      setResolveMessage("Network error. Failed to resolve dispute.");
    }
  };

  const filtered = bookings.filter((b) => {
    if (!searchVal) return true;
    const lowVal = searchVal.toLowerCase();
    return b.customer_name.toLowerCase().includes(lowVal) || 
      b.worker_name.toLowerCase().includes(lowVal) || 
      b.id.toLowerCase().includes(lowVal);
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">System Bookings Ledger</h1>
        <p className="text-xs font-semibold text-slate-500">Audit system transactions, resolve customer disputes and process escrow payouts releases</p>
      </div>

      {/* Search and filters */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          placeholder="Search by ID, customer name or worker..."
          className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-xs font-semibold outline-none focus:border-primary bg-white shadow-sm"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3 items-start">
        
        {/* LEFT COLUMN: TABLE LISTING */}
        <div className="lg:col-span-2 space-y-4">
          {error && (
            <div className="rounded-[2rem] border border-red-100 bg-red-50 p-4 text-xs font-bold text-red-750 flex items-center gap-1.5 animate-fade-in">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-650" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="h-40 bg-slate-200 animate-pulse rounded-[2rem]"></div>
          ) : filtered.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500">
              <ClipboardList className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-semibold">No bookings recorded.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filtered.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBooking(b)}
                  className={`w-full text-left rounded-3xl border p-5 bg-white shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-4 ${
                    b.status === "disputed" ? "border-amber-250 border-2" : "border-slate-100"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <BookingStatusBadge status={b.status} />
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase font-mono">ID: #{b.id.slice(-6).toUpperCase()}</span>
                    </div>
                    <div>
                      <strong className="text-xs font-black text-slate-800 block leading-tight">{b.customer_name} booked {b.worker_name}</strong>
                      <span className="text-[10px] text-slate-400 font-semibold block leading-normal italic truncate max-w-xs mt-1">&quot;{b.job_description}&quot;</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-black text-slate-700">₦{Number(b.quoted_amount).toLocaleString()}</span>
                    <ChevronRight className="h-4.5 w-4.5 text-slate-300" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: DETAIL RESOLUTION DRAWER SHEET */}
        <aside>
          {selectedBooking ? (
            <div className="rounded-[2.5rem] border border-slate-100 bg-white p-6 shadow-md space-y-6 animate-scale-up">
              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Arbitration panel</span>
                  <strong className="text-sm font-black text-slate-800">Booking #{selectedBooking.id.slice(-6).toUpperCase()}</strong>
                </div>
                <button onClick={() => setSelectedBooking(null)}>
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>

              {selectedBooking.status === "disputed" && (
                <div className="rounded-2xl bg-amber-50/50 border border-amber-100 p-4 flex gap-2.5">
                  <AlertTriangle className="h-5 w-5 text-accent shrink-0" />
                  <div>
                    <span className="text-[10px] font-black text-amber-700 uppercase tracking-wide">Dispute raised by customer</span>
                    <p className="text-[9px] text-slate-500 leading-normal mt-0.5">&quot;Artisan did not perform works up to standards.&quot;</p>
                  </div>
                </div>
              )}

              <div className="grid gap-2.5 text-xs font-semibold text-slate-500 border-b border-slate-50 pb-4">
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span className="text-slate-800 font-bold">{selectedBooking.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Artisan:</span>
                  <span className="text-slate-800 font-bold">{selectedBooking.worker_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Address:</span>
                  <span className="text-slate-800 font-bold truncate max-w-[150px]">{selectedBooking.address}</span>
                </div>
                <div className="flex justify-between">
                  <span>Quoted rate:</span>
                  <span className="text-slate-800 font-black">₦{Number(selectedBooking.quoted_amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Escrow state:</span>
                  <span className="rounded bg-slate-105 px-1 text-[10px] font-bold text-primary">{selectedBooking.payment_status}</span>
                </div>
              </div>

              {resolveMessage && (
                <p className="text-xs font-bold text-green-600 bg-green-50 p-2.5 rounded-xl border border-green-100 leading-normal">{resolveMessage}</p>
              )}

              {selectedBooking.status === "disputed" && !resolveMessage && (
                <div className="grid gap-2">
                  <button
                    onClick={() => handleArbitration("release")}
                    className="w-full rounded-2xl bg-primary hover:bg-primary-dark py-3 text-center text-xs font-black text-white shadow-md shadow-primary/10 flex items-center justify-center gap-1.5"
                  >
                    <ShieldCheck className="h-4.5 w-4.5" />
                    Release to Worker
                  </button>
                  <button
                    onClick={() => handleArbitration("refund")}
                    className="w-full rounded-2xl border border-red-200 hover:bg-red-50 py-3 text-center text-xs font-black text-red-600 flex items-center justify-center gap-1.5"
                  >
                    ✕ Refund Customer
                  </button>
                </div>
              )}

            </div>
          ) : (
            <div className="rounded-[2rem] border border-slate-100 bg-[#0f3a22]/5 p-5 border-dashed text-slate-550 leading-relaxed text-xs">
              <strong className="text-xs font-black text-primary uppercase block tracking-wider mb-2">Escrow holds management</strong>
              Select any booking transaction row from the registry table list to view full arbitration panels and manage active dispute refund workflows.
            </div>
          )}
        </aside>

      </div>

    </div>
  );
}
