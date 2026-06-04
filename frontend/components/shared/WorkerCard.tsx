"use client";

import { Star, MapPin, ShieldCheck, Award, ArrowUpRight } from "lucide-react";
import { type Worker, API_BASE_URL } from "@/lib/api";
import Link from "next/link";

type WorkerCardProps = {
  worker: Worker;
  onBook?: () => void;
};

export function WorkerCard({ worker, onBook }: WorkerCardProps) {
  const rating = worker.rating_avg || 0;
  const ratingCount = worker.rating_count || 0;

  // Render filled, half, and empty stars
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.4;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<Star key={i} className="h-3.5 w-3.5 fill-amber-500 stroke-amber-500" />);
      } else if (i === fullStars + 1 && hasHalf) {
        stars.push(
          <div key={i} className="relative">
            <Star className="h-3.5 w-3.5 text-slate-200" />
            <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
              <Star className="h-3.5 w-3.5 fill-amber-500 stroke-amber-500" />
            </div>
          </div>
        );
      } else {
        stars.push(<Star key={i} className="h-3.5 w-3.5 text-slate-200" />);
      }
    }
    return stars;
  };

  return (
    <article className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between animate-fade-in">
      <div>
        {/* Header row: Avatar & Stars */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary font-black text-sm relative overflow-hidden shrink-0">
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
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-success border-2 border-white z-10" title="Available now"></span>
              )}
            </span>
            <div>
              <div className="flex items-center gap-1">
                <strong className="text-xs font-black text-slate-800 leading-tight">
                  {worker.full_name}
                </strong>
                {worker.rating_avg >= 4.7 ? (
                  <span title="Top Rated Artisan"><Award className="h-4 w-4 text-amber-500 stroke-[2.5]" /></span>
                ) : (
                  <span title="KYC Verified"><ShieldCheck className="h-4 w-4 text-primary stroke-[2]" /></span>
                )}
              </div>
              <span className="text-[9px] font-extrabold text-[#1a5c38] uppercase tracking-wider block mt-0.5 flex items-center gap-1">
                <MapPin className="h-3 w-3 stroke-[2]" />
                {worker.city}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-amber-500 bg-amber-500/5 px-2.5 py-1 rounded-xl border border-amber-500/10 text-xs font-extrabold">
            <Star className="h-3.5 w-3.5 fill-amber-500 stroke-amber-500" />
            {rating.toFixed(1)}
          </div>
        </div>

        {/* Bio */}
        <p className="text-xs leading-5 text-slate-600 font-semibold mt-4 min-h-[48px] line-clamp-3">
          {worker.bio || "Approved independent skilled worker offering trusted local services."}
        </p>

        {/* Category badge */}
        {worker.categories && worker.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {worker.categories.map((c: any, index: number) => {
              const name = typeof c === "string" ? c : c.name || "";
              return (
                <span key={index} className="rounded-full bg-primary-light text-primary px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider">
                  {name}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer rates & action */}
      <div className="border-t border-slate-50 mt-5 pt-4 flex items-center justify-between">
        <div>
          <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Hourly Rate</span>
          <strong className="text-sm font-black text-slate-800">
            ₦{Number(worker.hourly_rate).toLocaleString()}
            <span className="text-[10px] font-medium text-slate-400">/hr</span>
          </strong>
        </div>

        {onBook ? (
          <button
            onClick={onBook}
            disabled={!worker.is_available}
            className={`rounded-2xl px-4 py-2.5 text-xs font-black text-white shadow-md transition-all flex items-center gap-1 ${
              worker.is_available 
                ? "bg-primary hover:bg-primary-dark shadow-primary/10" 
                : "bg-slate-300 cursor-not-allowed shadow-none"
            }`}
          >
            {worker.is_available ? "Book Now" : "Unavailable"}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        ) : (
          <Link
            href={`/workers/${worker.id}`}
            className="rounded-2xl bg-primary hover:bg-primary-dark px-4 py-2.5 text-xs font-black text-white shadow-md shadow-primary/10 transition-all flex items-center gap-1"
          >
            View Profile
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </article>
  );
}
