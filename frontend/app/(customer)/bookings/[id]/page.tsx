"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL, type Booking } from "@/lib/api";
import { ChevronLeft, Calendar, MapPin, Wrench, ShieldCheck, AlertTriangle, MessageSquare, Star, X } from "lucide-react";
import Link from "next/link";
import { BookingStatusBadge } from "@/components/shared/BookingStatusBadge";
import { ChatPanel } from "@/components/shared/ChatPanel";
import confetti from "canvas-confetti";

export default function BookingDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [hoverRating, setHoverRating] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchDetail = async () => {
    setErrorMsg("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/bookings/`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        const found = (data.results || []).find((b: Booking) => b.id === params.id);
        if (found) {
          setBooking(found);
        } else {
          setErrorMsg("Booking registry log not found.");
        }
      } else {
        setErrorMsg("Failed to sync bookings registry log with the server.");
      }
    } catch {
      setErrorMsg("Network error. Failed to connect to bookings server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 animate-pulse space-y-6">
        <div className="h-10 w-24 bg-slate-200 rounded-xl"></div>
        <div className="h-60 bg-slate-200 rounded-[2.5rem]"></div>
      </div>
    );
  }

  if (errorMsg && !booking) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-6">
        <Link 
          href="/bookings"
          className="inline-flex items-center gap-1 text-xs font-black text-slate-500 hover:text-primary transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Registry logs
        </Link>
        <div className="rounded-[2.5rem] border border-red-100 bg-red-50 p-8 text-center text-red-750 space-y-3">
          <AlertTriangle className="h-8 w-8 text-red-650 mx-auto" />
          <strong className="text-sm font-black block">Failed to load booking details</strong>
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
        fetchDetail();
      } else {
        const errData = await res.json().catch(() => ({}));
        setErrorMsg(errData.detail || `Failed to transition booking to ${nextStatus}.`);
      }
    } catch (err: any) {
      setErrorMsg("Network error. Failed to execute booking transition.");
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewSubmitting(true);
    setReviewMessage("");
    setReviewError("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/reviews/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: booking.id,
          rating,
          comment,
        }),
        credentials: "include",
      });
      if (res.ok) {
        setReviewMessage("Verified review submitted successfully!");
        confetti({ particleCount: 80, spread: 60 });
        setTimeout(() => {
          setShowReviewModal(false);
          fetchDetail();
        }, 1500);
      } else {
        const errData = await res.json().catch(() => ({}));
        setReviewError(errData.detail || "Failed to submit review.");
      }
    } catch {
      setReviewError("Network error. Failed to connect to reviews endpoint.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto py-6">
      
      {/* Back Header */}
      <Link 
        href="/bookings"
        className="inline-flex items-center gap-1 text-xs font-black text-slate-500 hover:text-primary transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Registry logs
      </Link>

      <div className="grid gap-8 lg:grid-cols-3 items-start">
        
        {/* LEFT COLUMN: TIMELINE & DETAILS */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Stepper Vertical Timeline */}
          <div className="rounded-[2.5rem] border border-slate-100 bg-white p-6 md:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-50 pb-4">
              <div>
                <span className="text-[9px] font-extrabold uppercase text-slate-400 block tracking-wider">Booking ID</span>
                <strong className="text-sm font-black text-slate-800">#{booking.id.slice(-6).toUpperCase()}</strong>
              </div>
              <BookingStatusBadge status={booking.status} />
            </div>

            {/* Stepper checklist logs */}
            <div className="relative pl-6 space-y-6 border-l-2 border-slate-100 ml-3">
              {[
                { status: "pending", label: "Booking Initiated", date: "Escrow funds locked successfully" },
                { status: "accepted", label: "Confirmed by Artisan", date: "Awaiting start signal" },
                { status: "in_progress", label: "Project in Progress", date: "Artisan is actively working" },
                { status: "done", label: "Completed & Released", date: "Escrow funds released successfully" }
              ].map((step, idx) => {
                const active = booking.status === step.status;
                const isPassed = getIsPassed(booking.status, step.status);
                return (
                  <div key={idx} className="relative space-y-0.5 leading-none">
                    <span className={`absolute -left-[31px] top-0 h-4.5 w-4.5 rounded-full border-2 flex items-center justify-center text-[8px] font-black ${
                      active 
                        ? "bg-primary border-primary text-white animate-pulse" 
                        : isPassed 
                        ? "bg-success border-success text-white" 
                        : "bg-white border-slate-200 text-slate-300"
                    }`}>
                      {isPassed || active ? "✓" : idx + 1}
                    </span>
                    <strong className={`text-xs font-black block ${active ? "text-primary" : "text-slate-700"}`}>{step.label}</strong>
                    <span className="text-[10px] text-slate-400 font-semibold block">{step.date}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Details Specification Card */}
          <div className="rounded-[2rem] border border-slate-100 bg-white p-6 space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Specifications</h3>
            
            <div className="grid gap-3.5 text-xs font-semibold text-slate-500">
              <div className="flex gap-2">
                <Wrench className="h-4.5 w-4.5 text-primary shrink-0" />
                <p className="leading-relaxed font-semibold italic text-slate-700">&quot;{booking.job_description}&quot;</p>
              </div>
              <div className="flex gap-2">
                <MapPin className="h-4.5 w-4.5 text-primary shrink-0" />
                <span className="font-bold text-slate-800">{booking.address}</span>
              </div>
              <div className="flex gap-2">
                <Calendar className="h-4.5 w-4.5 text-primary shrink-0" />
                <span className="font-bold text-slate-800">{new Date(booking.scheduled_for).toLocaleString()}</span>
              </div>
            </div>

            {/* Simulated leaflet map image placeholder */}
            <div className="h-40 rounded-2xl bg-slate-100 border border-slate-200/50 relative overflow-hidden flex items-center justify-center">
              <div className="text-center space-y-1.5 z-10 p-4">
                <MapPin className="h-6 w-6 text-primary mx-auto stroke-[2]" />
                <strong className="text-[10px] font-black text-slate-700 block">Leaflet Map Embed</strong>
                <span className="text-[9px] text-slate-400 font-semibold block leading-tight">{booking.address}</span>
              </div>
              <div className="absolute inset-0 bg-primary/5 opacity-50"></div>
            </div>
          </div>

          {/* Actions panel */}
          <div className="border-t border-slate-100 pt-4 space-y-3">
            {errorMsg && (
              <p className="text-xs font-bold text-red-650 bg-red-50/50 border border-red-100 rounded-xl p-3">
                {errorMsg}
              </p>
            )}

            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="text-xs font-semibold text-slate-500">
                Funds: <strong className="text-slate-800">₦{Number(booking.quoted_amount).toLocaleString()} ({booking.payment_status})</strong>
              </div>

              <div className="flex gap-2">
                {booking.status === "pending" && (
                  <button
                    onClick={() => handleStatusTransition("cancelled")}
                    className="rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2.5 text-xs font-black"
                  >
                    Cancel Booking
                  </button>
                )}

                {booking.status === "accepted" && (
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Awaiting worker commencement...
                  </span>
                )}

                {booking.status === "in_progress" && (
                  <>
                    <button
                      onClick={() => handleStatusTransition("disputed")}
                      className="rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2.5 text-xs font-black"
                    >
                      Raise Dispute
                    </button>
                    <button
                      onClick={() => handleStatusTransition("done")}
                      className="rounded-xl bg-success text-white hover:opacity-90 px-4 py-2.5 text-xs font-black shadow-sm"
                    >
                      Confirm Delivery & Release Escrow
                    </button>
                  </>
                )}

                {booking.status === "completed_by_worker" && (
                  <>
                    <button
                      onClick={() => handleStatusTransition("disputed")}
                      className="rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2.5 text-xs font-black"
                    >
                      Raise Dispute
                    </button>
                    <button
                      onClick={() => handleStatusTransition("done")}
                      className="rounded-xl bg-success text-white hover:opacity-90 px-4 py-2.5 text-xs font-black shadow-sm"
                    >
                      Confirm Delivery & Release Escrow
                    </button>
                  </>
                )}

                {booking.status === "disputed" && (
                  <span className="text-[10px] font-black uppercase text-red-600 tracking-wider">
                    Disputed • Under Administrative Review
                  </span>
                )}

                {booking.status === "done" && (
                  <button
                    onClick={() => setShowReviewModal(true)}
                    className="rounded-xl bg-accent text-slate-900 hover:bg-amber-400 px-5 py-2.5 text-xs font-black shadow-sm flex items-center gap-1"
                  >
                    <Star className="h-4 w-4 fill-slate-900 stroke-slate-900" />
                    Leave Professional Review
                  </button>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: REALTIME CHAT */}
        <aside>
          <ChatPanel 
            bookingId={booking.id}
            workerName={booking.worker_name}
          />
        </aside>

      </div>

      {/* REVIEW DIALOG MODAL */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[2rem] bg-white p-6 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Leave Verified Review</span>
              <button onClick={() => setShowReviewModal(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="mt-4 space-y-4">
              
              <div className="text-center space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Assign rating threshold</span>
                <div className="flex justify-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-7 w-7 ${
                          star <= (hoverRating || rating)
                            ? "fill-amber-400 stroke-amber-400"
                            : "text-slate-200"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Feedback Comments</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Excellent work! Polite, came right on schedule..."
                  className="w-full min-h-16 rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-primary font-medium"
                />
              </div>

              {reviewMessage && (
                <p className="text-xs font-bold text-green-600 bg-green-50 p-2.5 rounded-xl border border-green-100 leading-normal">{reviewMessage}</p>
              )}

              {reviewError && (
                <p className="text-xs font-bold text-red-650 bg-red-50 p-2.5 rounded-xl border border-red-150 leading-normal">{reviewError}</p>
              )}

              <button
                type="submit"
                disabled={reviewSubmitting}
                className="w-full rounded-xl bg-primary hover:bg-primary-dark py-3.5 text-center text-xs font-black text-white transition-all shadow-md shadow-primary/10"
              >
                {reviewSubmitting ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function getIsPassed(currentStatus: string, stepStatus: string) {
  const order = ["pending", "accepted", "in_progress", "done"];
  const currIdx = order.indexOf(currentStatus.toLowerCase());
  const stepIdx = order.indexOf(stepStatus.toLowerCase());
  return stepIdx < currIdx;
}
