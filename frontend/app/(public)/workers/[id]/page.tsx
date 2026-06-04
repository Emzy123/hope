"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getWorkers, type Worker, API_BASE_URL } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { Star, MapPin, ShieldCheck, Award, ChevronLeft, ArrowRight, ShieldAlert, AlertTriangle, MessageSquare } from "lucide-react";
import Link from "next/link";

type Review = {
  id: string;
  customer_name: string;
  rating: number;
  comment: string;
  created_at?: string | null;
};

function ReviewsSection({ workerId, ratingCount }: { workerId: string; ratingCount: number }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/reviews/worker/${workerId}/`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setReviews(data.results || []);
        }
      } catch {
        // silently fail — show empty state
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [workerId]);

  function formatDate(dateStr?: string | null) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="rounded-[2rem] border border-slate-100 bg-white p-6 space-y-5">
      <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-primary" />
        Customer Reviews ({ratingCount})
      </h2>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider text-center py-6">
          No reviews yet — be the first to review this artisan.
        </p>
      ) : (
        <div className="space-y-4 divide-y divide-slate-50">
          {reviews.map((rev) => (
            <div key={rev.id} className="pt-4 first:pt-0 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <strong className="text-xs font-black text-slate-800">{rev.customer_name}</strong>
                  <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                    {formatDate(rev.created_at)}
                  </span>
                </div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
                        i < rev.rating
                          ? "fill-amber-400 stroke-amber-400"
                          : "fill-slate-200 stroke-slate-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
              {rev.comment && (
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">&quot;{rev.comment}&quot;</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function WorkerPublicProfile({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const [worker, setWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadWorker() {
      try {
        const res = await getWorkers();
        const found = res.results.find((w) => w.id === params.id);
        if (found) {
          setWorker(found);
        } else {
          setError("Artisan profile not found.");
        }
      } catch {
        setError("Network error. Failed to retrieve artisan profiles.");
      } finally {
        setLoading(false);
      }
    }
    loadWorker();
  }, [params.id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 animate-pulse space-y-6">
        <div className="h-48 rounded-[2rem] bg-slate-200"></div>
        <div className="h-10 w-48 bg-slate-200 rounded-xl"></div>
        <div className="h-32 bg-slate-200 rounded-[2rem]"></div>
      </div>
    );
  }

  if (error && !worker) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-6">
        <Link 
          href="/browse"
          className="inline-flex items-center gap-1 text-xs font-black text-slate-500 hover:text-primary transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to artisans
        </Link>
        <div className="rounded-[2.5rem] border border-red-100 bg-red-50 p-8 text-center text-red-750 space-y-3">
          <AlertTriangle className="h-8 w-8 text-red-650 mx-auto" />
          <strong className="text-sm font-black block">Failed to load artisan profile</strong>
          <p className="text-xs font-semibold text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!worker) return null;

  const handleBookNow = () => {
    if (!user) {
      router.push("/login?redirect=" + encodeURIComponent(`/book/${worker.id}`));
    } else {
      router.push(`/book/${worker.id}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 lg:px-8 space-y-8 animate-fade-in">
      
      {/* Back button */}
      <Link 
        href="/browse"
        className="inline-flex items-center gap-1 text-xs font-black text-slate-500 hover:text-primary transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to search
      </Link>

      <div className="grid gap-8 lg:grid-cols-3 items-start">
        
        {/* LEFT COLUMN: ABOUT, SKILLS, PORTFOLIO, REVIEWS */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Header Card */}
          <div className="rounded-[2.5rem] border border-slate-100 bg-white shadow-sm overflow-hidden">
            {/* Cover image area */}
            <div className="h-40 bg-gradient-to-r from-primary/80 to-primary-dark relative">
              <span className="absolute top-4 right-4 bg-white/10 backdrop-blur-md rounded-full px-3 py-1 text-[8px] font-black uppercase text-white tracking-wider border border-white/15">
                KYC Level 1 Active
              </span>
            </div>
            
            {/* Avatar overlapping layout */}
            <div className="px-6 pb-6 relative">
              <div className="absolute -top-12 left-6 h-24 w-24 rounded-3xl bg-white p-1 shadow-md border border-slate-100">
                <span className="flex h-full w-full items-center justify-center rounded-2xl bg-primary/10 text-primary font-black text-3xl relative overflow-hidden">
                  {worker.avatar_url ? (
                    <img
                      src={worker.avatar_url.startsWith("http") ? worker.avatar_url : `${API_BASE_URL}${worker.avatar_url}`}
                      alt={worker.full_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    worker.full_name.charAt(0)
                  )}
                  {worker.is_available && (
                    <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-success border-2 border-white z-10" title="Available now"></span>
                  )}
                </span>
              </div>
              
              <div className="pt-16 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-black text-slate-800">{worker.full_name}</h1>
                  {worker.rating_avg >= 4.7 ? (
                    <span className="rounded-full bg-accent/10 border border-accent/25 px-2.5 py-0.5 text-[9px] font-black text-amber-700 uppercase tracking-wider flex items-center gap-1">
                      <Award className="h-3.5 w-3.5 fill-accent stroke-accent" />
                      Top Rated
                    </span>
                  ) : (
                    <span className="rounded-full bg-primary-light border border-primary/20 px-2.5 py-0.5 text-[9px] font-black text-primary uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                      Verified
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-primary" />
                    {worker.city}, Nigeria
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    {worker.rating_avg.toFixed(1)} ({worker.rating_count} reviews)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* About Bio block */}
          <div className="rounded-[2rem] border border-slate-100 bg-white p-6 md:p-8 space-y-3">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">About this artisan</h2>
            <p className="text-xs md:text-sm leading-relaxed text-slate-600 font-semibold">
              {worker.bio || "This registered SkillBridge professional is fully certified, KYC-checked, and approved by our operations managers. Offering expert, reliable services across multiple service projects."}
            </p>
          </div>

          {/* Services Offered block */}
          {worker.categories && worker.categories.length > 0 && (
            <div className="rounded-[2rem] border border-slate-100 bg-white p-6 space-y-3">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Services Offered</h2>
              <div className="flex flex-wrap gap-2">
                {worker.categories.map((c: any, index: number) => {
                  const name = typeof c === "string" ? c : c.name || "";
                  return (
                    <span key={index} className="rounded-full bg-primary-light border border-primary/10 text-primary px-3.5 py-1 text-xs font-black uppercase tracking-wider">
                      {name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Portfolio Grid Mock block */}
          <div className="rounded-[2rem] border border-slate-100 bg-white p-6 space-y-4">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Previous Project Portfolio</h2>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-square bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-bold border border-slate-200/50 hover:scale-[1.02] transition-transform">
                  Project {i}
                </div>
              ))}
            </div>
          </div>

          {/* Reviews list */}
          <ReviewsSection workerId={worker.id} ratingCount={worker.rating_count} />

        </div>

        {/* RIGHT COLUMN: STICKY BOOKING CARD */}
        <aside className="lg:sticky lg:top-24 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-md space-y-6">
          <div className="space-y-2 border-b border-slate-50 pb-4">
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 block">Project Hourly Rate</span>
            <div className="flex items-baseline gap-1.5">
              <strong className="text-2xl font-black text-slate-800">₦{Number(worker.hourly_rate).toLocaleString()}</strong>
              <span className="text-xs font-medium text-slate-400">/ hour</span>
            </div>
            
            {/* Available alert */}
            {worker.is_available ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 border border-success/20 px-3 py-1 text-[9px] font-black uppercase text-success tracking-wider mt-2">
                <span className="h-2 w-2 rounded-full bg-success animate-pulse"></span>
                Available for Bookings
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-100 px-3 py-1 text-[9px] font-black uppercase text-red-600 tracking-wider mt-2">
                Currently Offline
              </span>
            )}
          </div>

          <button
            onClick={handleBookNow}
            disabled={!worker.is_available}
            className={`w-full rounded-2xl py-3.5 text-center text-xs font-black text-white shadow-md transition-all flex items-center justify-center gap-2 ${
              worker.is_available
                ? "bg-primary hover:bg-primary-dark shadow-primary/10"
                : "bg-slate-300 cursor-not-allowed shadow-none"
            }`}
          >
            Initiate Booking Request
            <ArrowRight className="h-4 w-4" />
          </button>

          {/* Secure details list */}
          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100/50 space-y-3">
            {[
              { icon: ShieldAlert, text: "Paystack Escrow Protection Active" },
              { icon: ShieldCheck, text: "Admin Vetted Artisan KYC" },
              { icon: Star, text: "Verified Reviews & Satisfaction Guarantee" }
            ].map((det, i) => {
              const Icon = det.icon;
              return (
                <div key={i} className="flex gap-2.5 items-start text-[10px] font-extrabold text-slate-500 leading-none">
                  <Icon className="h-4 w-4 text-primary shrink-0" />
                  <span className="leading-tight">{det.text}</span>
                </div>
              );
            })}
          </div>
        </aside>

      </div>

    </div>
  );
}
