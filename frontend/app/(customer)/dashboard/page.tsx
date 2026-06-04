"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { getWorkers, type Booking } from "@/lib/api";
import { API_BASE_URL } from "@/lib/api";
import { Sparkles, Calendar, Search, ArrowRight, MessageSquare, Wrench, Clock, CheckCircle } from "lucide-react";
import Link from "next/link";
import { BookingStatusBadge } from "@/components/shared/BookingStatusBadge";
import { ChatPanel } from "@/components/shared/ChatPanel";

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [activeBookings, setActiveBookings] = useState<Booking[]>([]);
  const [pastBookings, setPastBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);
  const [chatBooking, setChatBooking] = useState<Booking | null>(null);

  const fetchDashboardBookings = async () => {
    setErrorMsg("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/bookings/`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        const results: Booking[] = data.results || [];
        // Filter out completed and cancelled bookings case-insensitively
        setActiveBookings(results.filter((b) => {
          const s = (b.status || "").toLowerCase();
          return s !== "done" && s !== "cancelled";
        }));
        setPastBookings(results.filter((b) => {
          const s = (b.status || "").toLowerCase();
          return s === "done" || s === "cancelled";
        }));
      } else {
        throw new Error("Failed to load");
      }
    } catch {
      setErrorMsg("Unable to sync active bookings registry with the server. Please check your network connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardBookings();
    if (sessionStorage.getItem("sb_new_customer") === "true") {
      setShowWelcomeBanner(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDismissBanner = () => {
    sessionStorage.removeItem("sb_new_customer");
    setShowWelcomeBanner(false);
  };

  if (showWelcomeBanner) {
    return (
      <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
        <div className="bg-white rounded-[2.5rem] max-w-2xl w-full p-8 md:p-10 shadow-2xl relative border border-slate-100 overflow-hidden my-8">
          <div className="absolute -top-24 -right-24 h-48 w-48 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-48 w-48 bg-accent/10 rounded-full blur-3xl" />
          
          <div className="text-center space-y-4 relative">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[2rem] bg-green-50 border border-green-100 text-primary animate-bounce">
              <Sparkles className="h-8 w-8 text-primary fill-primary/10" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-black text-slate-800 leading-tight">
                Account Successfully Setup! 🎉
              </h2>
              <p className="text-sm font-semibold text-slate-500 max-w-md mx-auto leading-relaxed">
                Welcome to SkillBridge, Nigeria&apos;s premier artisan platform. Here is how to get the most out of your experience:
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 pt-6 text-left">
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-2.5">
                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-black">1</div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Browse Trades</h3>
                <p className="text-[10px] font-semibold text-slate-500 leading-normal">
                  Find verified carpenters, electricians, plumbers, and more in your city.
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-2.5">
                <div className="h-8 w-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center text-xs font-black">2</div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Secure Escrow</h3>
                <p className="text-[10px] font-semibold text-slate-500 leading-normal">
                  Book a job and pay securely. Funds are held in escrow until you&apos;re satisfied.
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-2.5">
                <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-black">3</div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Review & Release</h3>
                <p className="text-[10px] font-semibold text-slate-500 leading-normal">
                  Artisan finishes, you verify the quality, and release the funds with one tap.
                </p>
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={handleDismissBanner}
                className="w-full sm:w-auto rounded-2xl bg-primary hover:bg-primary-dark px-10 py-4 text-xs font-black text-white transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30"
              >
                Explore Services Now
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* SECTION 1: GREETING HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase text-primary tracking-wider flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-accent fill-accent" />
            Nigeria&apos;s Premium Informal Market
          </span>
          <h1 className="text-xl md:text-2xl font-black text-slate-800">
            Good morning, {user?.full_name?.split(" ")[0]} 👋
          </h1>
          <p className="text-xs font-semibold text-slate-500">
            You have {activeBookings.length} active service bookings underway.
          </p>
        </div>
        <Link
          href="/browse"
          className="rounded-xl bg-primary hover:bg-primary-dark text-white px-5 py-3 text-xs font-black shadow-sm flex items-center justify-center gap-1.5 self-start md:self-auto"
        >
          Book New Artisan
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-3 items-start">
        
        {/* LEFT COLUMN: ACTIVE BOOKINGS & SEARCH SHORTCUTS */}
        <div className="lg:col-span-2 space-y-8">
          
          {errorMsg && (
            <div className="rounded-3xl bg-amber-50/50 border border-amber-100 p-4 flex gap-3 text-xs font-semibold text-amber-800 leading-normal">
              <span className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 shrink-0 animate-pulse"></span>
              <p>{errorMsg}</p>
            </div>
          )}
          
          {/* Active Bookings section */}
          <div className="space-y-4">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-4.5 w-4.5 text-primary" />
              Active Timelines
            </h2>

            {loading ? (
              <div className="h-32 bg-slate-200 animate-pulse rounded-3xl"></div>
            ) : activeBookings.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500 space-y-2">
                <p className="text-xs font-semibold">No active bookings found.</p>
                <Link href="/browse" className="text-xs font-black text-primary hover:underline">
                  Browse workers and book one now!
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {activeBookings.map((b) => (
                  <div key={b.id} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                      <div>
                        <strong className="text-xs font-black text-slate-800 block leading-tight">{b.worker_name}</strong>
                        <span className="text-[9px] text-slate-400 font-extrabold uppercase mt-1 block">ID: {b.id.slice(-6).toUpperCase()}</span>
                      </div>
                      <div className="flex gap-2">
                        <BookingStatusBadge status={b.status} />
                        <span className="rounded-full bg-green-50 border border-green-100 text-green-700 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
                          {b.payment_status}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs font-semibold text-slate-500 space-y-1">
                      <p className="italic leading-normal text-slate-600">&quot;{b.job_description}&quot;</p>
                      <p className="pt-2 text-[10px] font-bold text-primary flex items-center gap-1">
                        <Wrench className="h-3.5 w-3.5" />
                        Address: {b.address}
                      </p>
                    </div>

                    <div className="border-t border-slate-50 pt-3 flex items-center justify-between">
                      <span className="text-xs font-black text-slate-700">₦{Number(b.quoted_amount).toLocaleString()}</span>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => setChatBooking(b)}
                          className="rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100 p-2.5 text-slate-600 transition-colors"
                          title="Open Chat"
                        >
                          <MessageSquare className="h-4.5 w-4.5" />
                        </button>
                        <Link
                          href={`/bookings/${b.id}`}
                          className="rounded-xl bg-primary text-white hover:bg-primary-dark px-4 py-2 text-xs font-black transition-all"
                        >
                          Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick categories navigation */}
          <div className="space-y-4">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Quick shortcuts</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { name: "Plumbing", slug: "plumbing" },
                { name: "Electrical", slug: "electrical" },
                { name: "Cleaning", slug: "cleaning" },
                { name: "Carpentry", slug: "carpentry" }
              ].map((c) => (
                <Link
                  key={c.slug}
                  href={`/browse?category=${c.slug}`}
                  className="rounded-2xl border border-slate-100 bg-white p-4 text-center hover:border-slate-300 hover:shadow-sm transition-all"
                >
                  <strong className="text-xs font-black text-slate-800 block">{c.name}</strong>
                </Link>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: RECENT HISTORY & CHAT POPUPS */}
        <aside className="space-y-8">
          
          {/* Chat Panel Box popup */}
          {chatBooking && (
            <ChatPanel 
              bookingId={chatBooking.id}
              workerName={chatBooking.worker_name}
              onClose={() => setChatBooking(null)}
            />
          )}

          {/* Past bookings list */}
          <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle className="h-4.5 w-4.5 text-primary" />
              Recent History
            </h3>

            {loading ? (
              <div className="h-20 bg-slate-100 animate-pulse rounded-2xl"></div>
            ) : pastBookings.length === 0 ? (
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center py-4">No completed history.</p>
            ) : (
              <div className="space-y-3">
                {pastBookings.slice(0, 3).map((b) => (
                  <div key={b.id} className="text-xs font-semibold border-b border-slate-50 pb-3 last:border-b-0 last:pb-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-800">{b.worker_name}</strong>
                      <BookingStatusBadge status={b.status} />
                    </div>
                    <p className="text-slate-500 font-medium text-[10px]">{b.address}</p>
                    <span className="text-[10px] text-slate-400 font-black block mt-0.5">₦{Number(b.quoted_amount).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </aside>

      </div>

    </div>
  );
}
