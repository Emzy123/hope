"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { API_BASE_URL, type Booking } from "@/lib/api";
import { Calendar, Clock, MapPin, Wrench, ShieldCheck, X, ShieldAlert } from "lucide-react";
import { BookingStatusBadge } from "@/components/shared/BookingStatusBadge";

export default function WorkerRequestsRegistry() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchRequests = async () => {
    setErrorMsg("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/bookings/`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data.results || []);
      } else {
        setErrorMsg("Failed to retrieve booking requests from API.");
      }
    } catch {
      setErrorMsg("Network error. Failed to retrieve booking requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAction = async (bookingId: string, nextStatus: string) => {
    setErrorMsg("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/bookings/${bookingId}/${nextStatus}/`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        fetchRequests();
      } else {
        const errData = await res.json().catch(() => ({}));
        setErrorMsg(errData.detail || `Failed to execute request action: ${nextStatus}.`);
      }
    } catch {
      setErrorMsg("Network error. Failed to accept or decline request.");
    }
  };

  const filtered = requests.filter((r) => {
    if (activeTab === "pending") return r.status === "pending";
    if (activeTab === "upcoming") return r.status === "accepted" || r.status === "in_progress";
    return true; // "all"
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto py-6">
      <div className="space-y-1">
        <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Service Requests</h1>
        <p className="text-xs font-semibold text-slate-500">Manage incoming service bookings and confirm scheduling details</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 bg-slate-100 rounded-2xl p-1 w-fit">
        {[
          { id: "pending", label: "New Requests" },
          { id: "upcoming", label: "Upcoming" },
          { id: "all", label: "All" }
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

      {errorMsg && (
        <div className="rounded-[2rem] border border-red-200 bg-red-50 p-5 flex items-start gap-3 shadow-sm animate-fade-in">
          <ShieldAlert className="h-5 w-5 text-red-650 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <strong className="text-xs font-black text-red-800 block">System Connection Alert</strong>
            <p className="text-[10.5px] font-semibold text-red-750 leading-tight">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Requests list */}
      {loading ? (
        <div className="h-40 bg-slate-200 animate-pulse rounded-[2rem]"></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500">
          <Calendar className="h-8 w-8 text-slate-400 mx-auto mb-2" />
          <p className="text-xs font-semibold">No requests listed under this category.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((r) => (
            <div key={r.id} className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between border-b border-slate-50 pb-3 gap-2">
                <div>
                  <strong className="text-sm font-black text-slate-800">{r.customer_name}</strong>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase mt-0.5 block">ID: {r.id.slice(-6).toUpperCase()}</span>
                </div>
                <div className="flex gap-2">
                  <BookingStatusBadge status={r.status} />
                  <span className="rounded-full bg-slate-50 border border-slate-100 text-slate-500 px-2.5 py-0.5 text-[9px] font-black uppercase">
                    Expires in 18h
                  </span>
                </div>
              </div>

              <div className="grid gap-3 text-xs font-semibold text-slate-500">
                <div className="flex gap-2.5">
                  <Wrench className="h-4.5 w-4.5 text-primary shrink-0" />
                  <p className="font-semibold italic text-slate-655">&quot;{r.job_description}&quot;</p>
                </div>
                <div className="flex gap-2.5">
                  <MapPin className="h-4.5 w-4.5 text-primary shrink-0" />
                  <span className="font-bold text-slate-800">{r.address}</span>
                </div>
                <div className="flex gap-2.5">
                  <Clock className="h-4.5 w-4.5 text-primary shrink-0" />
                  <span className="font-bold text-slate-800">{new Date(r.scheduled_for).toLocaleString()}</span>
                </div>
              </div>

              <div className="border-t border-slate-50 pt-4 flex justify-between items-center">
                <span className="text-sm font-black text-slate-800">₦{Number(r.quoted_amount).toLocaleString()}</span>

                {r.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(r.id, "cancelled")}
                      className="rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 text-xs font-black"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleAction(r.id, "accepted")}
                      className="rounded-xl bg-primary hover:bg-primary-dark text-white px-4 py-2 text-xs font-black shadow-sm shadow-primary/10"
                    >
                      Accept
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
