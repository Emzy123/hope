"use client";

import { useEffect, useState } from "react";
import { Clock, CheckCircle2, ShieldAlert, Star, MessageSquare, Send, Calendar, AlertCircle, X } from "lucide-react";
import { getWorkers, type Booking } from "@/lib/api";
import { API_BASE_URL } from "@/lib/api";
import confetti from "canvas-confetti";

type ActiveBookingsPanelProps = {
  isLive: boolean;
  onRefresh: () => void;
};

type ReviewForm = {
  bookingId: string;
  rating: number;
  comment: string;
};

export function ActiveBookingsPanel({ isLive, onRefresh }: ActiveBookingsPanelProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeChatBooking, setActiveChatBooking] = useState<Booking | null>(null);
  
  // Chat States
  const [messages, setMessages] = useState<{ sender: "user" | "worker"; text: string; time: string }[]>([]);
  const [newMsg, setNewMsg] = useState("");

  // Review States
  const [reviewForm, setReviewForm] = useState<ReviewForm | null>(null);
  const [reviewSuccessMessage, setReviewSuccessMessage] = useState("");
  const [reviewErrorMessage, setReviewErrorMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [hoverRating, setHoverRating] = useState(0);

  // Status mapping colors & labels
  const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
    pending: { label: "Pending Approval", bg: "bg-blue-50 border-blue-100", text: "text-blue-700" },
    accepted: { label: "Booking Accepted", bg: "bg-purple-50 border-purple-100", text: "text-purple-700" },
    in_progress: { label: "Job In Progress", bg: "bg-amber-50 border-amber-100", text: "text-amber-700" },
    done: { label: "Completed & Released", bg: "bg-green-50 border-green-100", text: "text-green-700" },
    cancelled: { label: "Cancelled", bg: "bg-slate-50 border-slate-100", text: "text-slate-500" },
    disputed: { label: "Disputed Payment", bg: "bg-red-50 border-red-100", text: "text-red-700" },
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  async function fetchBookings() {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/bookings/`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setBookings(data.results || []);
      }
    } catch {
      // Offline mock bookings
      setBookings([
        {
          id: "mock-booking-1",
          customer: "demo-cust",
          worker: "demo-worker-1",
          status: "pending",
          payment_status: "escrowed",
          job_description: "Repair bathroom sink and fix water heater pipes.",
          address: "14 Victoria Island, Lagos",
          scheduled_for: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          quoted_amount: 14500.0,
          worker_name: "Adewale Plumbing Pro",
          customer_name: "Chioma Okafor",
        },
        {
          id: "mock-booking-2",
          customer: "demo-cust",
          worker: "demo-worker-2",
          status: "done",
          payment_status: "released",
          job_description: "Fix living room wiring, install 3 socket extensions.",
          address: "7 Abuja Close, Maitama",
          scheduled_for: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          quoted_amount: 19000.0,
          worker_name: "Zainab Electricals",
          customer_name: "Chioma Okafor",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  async function transitionBooking(bookingId: string, nextStatus: string) {
    setActionError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/bookings/${bookingId}/${nextStatus}/`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        fetchBookings();
        onRefresh();
      } else {
        const errData = await res.json().catch(() => ({}));
        setActionError(errData.detail || `Failed to transition booking to ${nextStatus}.`);
      }
    } catch {
      setActionError("Network error. Failed to execute booking transition.");
    }
  }

  // Open Chat Window
  function openChat(booking: Booking) {
    setActiveChatBooking(booking);
    setMessages([
      { sender: "worker", text: `Hello! I have received your request regarding: "${booking.job_description}". I am review it now.`, time: "10:14" },
      { sender: "user", text: "Great, thank you! Let me know if you need any directions.", time: "10:15" },
    ]);
  }

  function handleSendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!newMsg.trim() || !activeChatBooking) return;

    const currentMsg = newMsg;
    setMessages((prev) => [...prev, { sender: "user", text: currentMsg, time: "Just Now" }]);
    setNewMsg("");

    // Simulate custom automated responses matching worker name!
    setTimeout(() => {
      let replyText = "Understood. I am working on it!";
      if (currentMsg.toLowerCase().includes("where")) {
        replyText = `I am currently heading out to ${activeChatBooking.address}. See you shortly!`;
      } else if (currentMsg.toLowerCase().includes("cost") || currentMsg.toLowerCase().includes("price")) {
        replyText = "The price is already securely held in SkillBridge Escrow, so no extra cash payment is needed.";
      } else if (activeChatBooking.worker_name) {
        replyText = `Thanks for the message! I'm details checking. — ${activeChatBooking.worker_name}`;
      }
      setMessages((prev) => [...prev, { sender: "worker", text: replyText, time: "Just Now" }]);
    }, 1200);
  }

  // Submit Review Flow
  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!reviewForm) return;
    setReviewSuccessMessage("");
    setReviewErrorMessage("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/reviews/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: reviewForm.bookingId,
          rating: reviewForm.rating,
          comment: reviewForm.comment,
        }),
        credentials: "include",
      });

      if (res.ok) {
        setReviewSuccessMessage("Review submitted! Thank you!");
        confetti({ particleCount: 80, spread: 60 });
        setTimeout(() => {
          setReviewForm(null);
          setReviewSuccessMessage("");
          fetchBookings();
          onRefresh();
        }, 1500);
      } else {
        const errData = await res.json().catch(() => ({}));
        setReviewErrorMessage(errData.detail || "Failed to submit review.");
      }
    } catch {
      setReviewErrorMessage("Network error. Failed to connect to reviews endpoint.");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Bookings List */}
      <div className="lg:col-span-2 space-y-4">
        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-[#0f3a22]" />
          My Booking Registry
        </h3>

        {actionError && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-xs font-bold text-red-700 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-650" />
              <span>{actionError}</span>
            </div>
            <button onClick={() => setActionError("")} className="text-red-500 hover:text-red-700 font-black text-sm p-1">×</button>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-8">
            <div className="h-6 w-6 border-2 border-[#0f3a22]/30 border-t-[#0f3a22] rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs font-semibold text-slate-500">Querying bookings history...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
            <AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-semibold">No active bookings recorded yet.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {bookings.map((booking) => {
              const config = statusConfig[booking.status] || { label: booking.status, bg: "bg-slate-50", text: "text-slate-700" };
              return (
                <div key={booking.id} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                  
                  {/* Status & ID */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                    <span className="text-[10px] font-extrabold font-mono text-slate-400">ID: {booking.id.slice(-6).toUpperCase()}</span>
                    <div className="flex gap-2 items-center">
                      <span className={`rounded-xl border px-3 py-1 text-[10px] font-black uppercase tracking-wider ${config.bg} ${config.text}`}>
                        {config.label}
                      </span>
                      <span className={`rounded-xl border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-green-50 border-green-100 text-green-700`}>
                        Escrow: {booking.payment_status}
                      </span>
                    </div>
                  </div>

                  {/* Booking Metadata */}
                  <div className="grid gap-1">
                    <h4 className="text-sm font-black text-slate-800">{booking.worker_name || "Seeded Professional"}</h4>
                    <p className="text-xs font-semibold text-[#0f3a22]">{booking.address}</p>
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-5 italic">&quot;{booking.job_description}&quot;</p>
                  </div>

                  {/* Actions & Escrow release details */}
                  <div className="flex items-center justify-between border-t border-slate-100 mt-4 pt-4">
                    <div className="text-xs font-semibold text-slate-500">
                      Amount Hold: <strong className="text-slate-800">₦{Number(booking.quoted_amount).toLocaleString()}</strong>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Chat Bubbles */}
                      <button
                        onClick={() => openChat(booking)}
                        className="rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100 p-2.5 text-slate-600 transition-colors"
                        title="Chat with worker"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </button>

                      {/* State Transitions for Demonstration */}
                      {booking.status === "pending" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => transitionBooking(booking.id, "cancelled")}
                            className="rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 text-xs font-bold transition-all"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => transitionBooking(booking.id, "accepted")}
                            className="rounded-xl bg-[#0f3a22] text-white hover:bg-[#154e2f] px-3 py-1.5 text-xs font-bold transition-all"
                          >
                            Accept Job (Worker View)
                          </button>
                        </div>
                      )}

                      {booking.status === "accepted" && (
                        <button
                          onClick={() => transitionBooking(booking.id, "in_progress")}
                          className="rounded-xl bg-[#0f3a22] text-white hover:bg-[#154e2f] px-3.5 py-2 text-xs font-bold transition-all"
                        >
                          Start Project
                        </button>
                      )}

                      {booking.status === "in_progress" && (
                        <button
                          onClick={() => transitionBooking(booking.id, "done")}
                          className="rounded-xl bg-green-700 text-white hover:bg-green-800 px-3.5 py-2 text-xs font-bold transition-all"
                        >
                          Mark Complete & Release Escrow
                        </button>
                      )}

                      {booking.status === "done" && (
                        <button
                          onClick={() => setReviewForm({ bookingId: booking.id, rating: 5, comment: "" })}
                          className="rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 px-3.5 py-2 text-xs font-extrabold transition-all flex items-center gap-1.5"
                        >
                          <Star className="h-3.5 w-3.5 fill-amber-500 stroke-amber-500" />
                          Rate Service
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Side Panels - Chat Box or Instructions Info */}
      <div className="space-y-4">
        {activeChatBooking ? (
          <div className="rounded-3xl border border-slate-100 bg-white shadow-lg overflow-hidden flex flex-col h-[400px]">
            {/* Chat header */}
            <div className="bg-[#0f3a22] text-white px-4 py-3 flex items-center justify-between">
              <div>
                <strong className="text-xs block leading-tight font-black">{activeChatBooking.worker_name}</strong>
                <span className="text-[9px] font-semibold text-green-200">Active conversation</span>
              </div>
              <button 
                onClick={() => setActiveChatBooking(null)}
                className="rounded-lg p-1 text-white/80 hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Chat messages */}
            <div className="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-3">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex flex-col max-w-[80%] ${
                    msg.sender === "user" ? "ml-auto items-end" : "items-start"
                  }`}
                >
                  <div className={`rounded-2xl px-3 py-2 text-xs font-semibold leading-5 ${
                    msg.sender === "user"
                      ? "bg-[#0f3a22] text-white"
                      : "bg-white text-slate-800 border border-slate-200"
                  }`}>
                    {msg.text}
                  </div>
                  <span className="text-[8px] font-semibold text-slate-400 mt-1">{msg.time}</span>
                </div>
              ))}
            </div>

            {/* Chat inputs */}
            <form onSubmit={handleSendChat} className="border-t border-slate-100 p-2.5 flex gap-2 bg-white">
              <input
                type="text"
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                placeholder="Ask worker 'where are you?'"
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#0f3a22]"
              />
              <button
                type="submit"
                className="rounded-xl bg-[#0f3a22] hover:bg-[#154e2f] p-2.5 text-white transition-all"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>

          </div>
        ) : (
          <div className="rounded-3xl border border-slate-100 bg-[#0f3a22]/5 p-5 border-dashed">
            <h4 className="text-xs font-black text-[#0f3a22] uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="h-4.5 w-4.5" />
              Platform Escrow Guarantee
            </h4>
            <p className="text-[11px] leading-5 text-slate-600 font-semibold mt-2.5">
              SkillBridge utilizes custom smart escrow routing. Once you create a booking, Paystack holds the funds securely. The payment is released only when you confirm the worker has successfully delivered the project.
            </p>
            <div className="mt-4 text-[10px] font-bold text-slate-500 bg-white border border-slate-100 p-2.5 rounded-xl">
              💡 **Tip:** Press &quot;Accept Job&quot; to simulate the worker&apos;s approval in real-time.
            </div>
          </div>
        )}
      </div>

      {/* Review Submission Modal overlay */}
      {reviewForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-sm font-black text-slate-800">Leave Professional Review</span>
              <button onClick={() => setReviewForm(null)} className="rounded-xl p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={submitReview} className="mt-4 grid gap-4">
              <div className="text-center">
                <span className="text-xs font-bold text-slate-500 block mb-2">Assign Star Rating</span>
                <div className="flex justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setReviewForm((prev) => prev ? { ...prev, rating: star } : null)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-7 w-7 ${
                          star <= (hoverRating || reviewForm.rating)
                            ? "fill-amber-400 stroke-amber-400 animate-wiggle"
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
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm((prev) => prev ? { ...prev, comment: e.target.value } : null)}
                  placeholder="e.g. Excellent service! Highly skilled, professional plumber."
                  className="w-full min-h-16 rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-[#0f3a22]"
                />
              </div>

              {reviewSuccessMessage && (
                <p className="text-xs font-bold text-green-600 bg-green-50 p-2.5 rounded-xl border border-green-100">{reviewSuccessMessage}</p>
              )}

              {reviewErrorMessage && (
                <p className="text-xs font-bold text-red-650 bg-red-50 p-2.5 rounded-xl border border-red-150">{reviewErrorMessage}</p>
              )}

              <button
                type="submit"
                className="w-full rounded-2xl bg-[#0f3a22] hover:bg-[#154e2f] py-3 text-center text-xs font-bold text-white shadow-lg transition-all"
              >
                Submit Verified Review
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
