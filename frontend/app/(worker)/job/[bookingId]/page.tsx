"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL, type Booking } from "@/lib/api";
import { ChevronLeft, Phone, MapPin, Wrench, ShieldCheck, Play, CheckCircle2, MessageSquare, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { BookingStatusBadge } from "@/components/shared/BookingStatusBadge";
import { ChatPanel } from "@/components/shared/ChatPanel";

export default function WorkerActiveJob({ params }: { params: { bookingId: string } }) {
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchJobDetail = async () => {
    setErrorMsg("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/bookings/`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        const found = (data.results || []).find((b: Booking) => b.id === params.bookingId);
        if (found) {
          setBooking(found);
        } else {
          setErrorMsg("Active job booking registry log not found.");
        }
      } else {
        setErrorMsg("Failed to sync project details with the server.");
      }
    } catch {
      setErrorMsg("Network error. Failed to connect to project server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.bookingId]);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto py-12 animate-pulse space-y-6">
        <div className="h-10 w-24 bg-slate-200 rounded-xl"></div>
        <div className="h-60 bg-slate-200 rounded-[2.5rem]"></div>
      </div>
    );
  }

  if (errorMsg && !booking) {
    return (
      <div className="max-w-xl mx-auto py-12 space-y-6">
        <Link 
          href="/home"
          className="inline-flex items-center gap-1 text-xs font-black text-slate-500 hover:text-primary transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Console home
        </Link>
        <div className="rounded-[2.5rem] border border-red-100 bg-red-50 p-8 text-center text-red-750 space-y-3">
          <AlertTriangle className="h-8 w-8 text-red-650 mx-auto" />
          <strong className="text-sm font-black block">Failed to load project details</strong>
          <p className="text-xs font-semibold text-slate-500">{errorMsg}</p>
        </div>
      </div>
    );
  }

  if (!booking) return null;

  const handleStatusTransition = async (nextStatus: string) => {
    setErrorMsg("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/bookings/${booking.id}/${nextStatus}/`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        fetchJobDetail();
      } else {
        const errData = await res.json().catch(() => ({}));
        setErrorMsg(errData.detail || `Failed to transition job to ${nextStatus}.`);
      }
    } catch (err: any) {
      setErrorMsg("Network error. Failed to execute status transition.");
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in py-6">
      
      {/* Back button */}
      <Link 
        href="/home"
        className="inline-flex items-center gap-1 text-xs font-black text-slate-500 hover:text-primary transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Console home
      </Link>

      {/* Main card */}
      <div className="rounded-[2.5rem] border border-slate-100 bg-white p-6 md:p-8 space-y-6 shadow-sm">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-50 pb-4">
          <div>
            <span className="text-[9px] font-extrabold uppercase text-slate-400 block tracking-wider">Active Job Sheet</span>
            <strong className="text-sm font-black text-slate-800">#{booking.id.slice(-6).toUpperCase()}</strong>
          </div>
          <BookingStatusBadge status={booking.status} />
        </div>

        {/* Customer Contact */}
        <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100/50 flex items-center justify-between gap-4">
          <div>
            <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Customer Contact</span>
            <strong className="text-sm font-black text-slate-800 block mt-0.5">{booking.customer_name}</strong>
          </div>
          <a
            href="tel:08012345678"
            className="rounded-xl bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2.5 text-xs font-black transition-colors flex items-center gap-1.5"
          >
            <Phone className="h-3.5 w-3.5" />
            Call Customer
          </a>
        </div>

        {/* Map location */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Job Address</label>
          <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-600">
            <MapPin className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
            <span>{booking.address}</span>
          </div>

          <div className="h-36 rounded-2xl bg-slate-100 border border-slate-200/50 relative overflow-hidden flex items-center justify-center">
            <div className="text-center space-y-1 z-10 p-4">
              <MapPin className="h-5 w-5 text-primary mx-auto" />
              <strong className="text-[10px] font-black text-slate-700 block">Leaflet Map Embed</strong>
            </div>
            <div className="absolute inset-0 bg-primary/5 opacity-40"></div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Job Description</label>
          <div className="rounded-2xl border border-slate-100 p-4 bg-slate-50/20 text-xs font-semibold text-slate-605 italic leading-normal">
            &quot;{booking.job_description}&quot;
          </div>
        </div>

        {/* Status Actions */}
        <div className="border-t border-slate-50 pt-5 space-y-4">
          
          <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
            <span>Escrow hold payload:</span>
            <strong className="text-slate-800">₦{Number(booking.quoted_amount).toLocaleString()}</strong>
          </div>

          {errorMsg && (
            <p className="text-xs font-bold text-red-650 bg-red-50/50 border border-red-100 rounded-xl p-3">
              {errorMsg}
            </p>
          )}

          <div className="grid gap-2">
            {booking.status === "accepted" && (
              <button
                onClick={() => handleStatusTransition("in_progress")}
                className="w-full rounded-2xl bg-primary hover:bg-primary-dark py-3.5 text-center text-xs font-black text-white shadow-md shadow-primary/10 flex items-center justify-center gap-1.5"
              >
                <Play className="h-4.5 w-4.5 fill-white" />
                Mark as Started
              </button>
            )}

            {booking.status === "in_progress" && (
              <button
                onClick={() => handleStatusTransition("completed_by_worker")}
                className="w-full rounded-2xl bg-success text-white hover:opacity-95 py-3.5 text-center text-xs font-black shadow-md flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="h-4.5 w-4.5" />
                Mark as Completed
              </button>
            )}

            {booking.status === "completed_by_worker" && (
              <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4 text-center text-xs font-black text-amber-700">
                Completed • Awaiting customer verification & escrow release...
              </div>
            )}

            {booking.status === "disputed" && (
              <div className="rounded-2xl bg-red-50 border border-red-100 p-4 text-center text-xs font-black text-red-600">
                Disputed • Locked under administrative arbitration
              </div>
            )}

            {booking.status === "done" && (
              <div className="rounded-2xl bg-green-50 border border-green-100 p-4 text-center text-xs font-black text-green-700">
                Job marked complete! Payout released successfully.
              </div>
            )}

            <button
              onClick={() => setShowChat(!showChat)}
              className="w-full rounded-2xl border border-slate-200 py-3.5 text-center text-xs font-black text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5"
            >
              <MessageSquare className="h-4 w-4" />
              {showChat ? "Hide Chat Messenger" : "Open Chat Messenger"}
            </button>
          </div>

        </div>

      </div>

      {/* Embedded Chat Messenger */}
      {showChat && (
        <ChatPanel 
          bookingId={booking.id}
          workerName={booking.customer_name}
          onClose={() => setShowChat(false)}
        />
      )}

    </div>
  );
}
