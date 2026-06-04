"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCategories, getWorkers, type Category, type Worker } from "@/lib/api";
import { WorkerCard } from "@/components/shared/WorkerCard";
import { 
  Sparkles, Wrench, Zap, Sparkle, Hammer, ShieldCheck, MapPin, 
  Clock, ArrowUpRight, Search, Calendar, Star, Shield, Wallet,
  Heart, CheckCircle
} from "lucide-react";

const iconMap: Record<string, any> = {
  wrench: Wrench,
  zap: Zap,
  sparkles: Sparkle,
  hammer: Hammer,
};

export default function LandingPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [catsRes, workersRes] = await Promise.all([getCategories(), getWorkers()]);
        setCategories((catsRes.results || []).slice(0, 4));
        setWorkers((workersRes.results || []).slice(0, 3));
      } catch {
        // Fallbacks
        setCategories([
          { id: "plumbing", name: "Plumbing", slug: "plumbing", description: "Water leaks, bathroom fittings, tap repairs.", is_active: true, icon: "wrench" },
          { id: "electrical", name: "Electrical", slug: "electrical", description: "Generator repair, home wiring, sockets installation.", is_active: true, icon: "zap" },
          { id: "cleaning", name: "Cleaning", slug: "cleaning", description: "Complete home and office cleaning professionals.", is_active: true, icon: "sparkles" },
          { id: "carpentry", name: "Carpentry", slug: "carpentry", description: "Doors hanging, cabinet fixes, sofa assembly.", is_active: true, icon: "hammer" },
        ]);
        setWorkers([
          { id: "demo-worker-1", full_name: "Adewale Plumbing Pro", bio: "Available for urgent plumbing pipe repairs and kitchen sink installations around Lagos.", city: "Lagos", state: "Lagos", hourly_rate: 6500, rating_avg: 4.8, rating_count: 42, is_available: true, is_approved: true },
          { id: "demo-worker-2", full_name: "Zainab Electricals", bio: "Certified electrician offering safe home and office sockets wiring installations.", city: "Abuja", state: "FCT", hourly_rate: 7500, rating_avg: 4.6, rating_count: 28, is_available: true, is_approved: true },
          { id: "demo-worker-3", full_name: "Tunde Cleaners", bio: "Post-construction deep cleaning and home disinfection expert in Lekki.", city: "Lagos", state: "Lagos", hourly_rate: 5000, rating_avg: 4.9, rating_count: 14, is_available: true, is_approved: true },
        ]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-20 pb-16 animate-fade-in">
      
      {/* SECTION 1: HERO */}
      <section className="relative bg-gradient-to-br from-[#0f3d26] to-[#1a5c38] text-white overflow-hidden py-16 md:py-24 px-6 md:px-12 lg:px-24">
        {/* Visual background accents */}
        <div className="absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent opacity-60 pointer-events-none"></div>
        <div className="absolute left-0 bottom-0 h-40 w-40 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto grid gap-12 lg:grid-cols-2 items-center relative z-10">
          <div className="space-y-6 max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/20 border border-accent/20 px-3.5 py-1 text-[10px] font-black uppercase tracking-wider text-accent">
              <Sparkles className="h-3.5 w-3.5 fill-accent" />
              Connecting Nigeria&apos;s Finest Artisans
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight">
              Find Trusted <span className="text-accent">Skilled Workers</span> in Nigeria — Instantly
            </h1>
            <p className="text-xs md:text-sm text-primary-light font-semibold leading-6 max-w-lg">
              Book verified plumbers, electricians, cleaners and 20+ service categories. Safe Paystack escrow guarantees your funds are held until the job is done — then released.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link 
                href="/browse"
                className="rounded-2xl bg-accent hover:bg-amber-400 px-8 py-4 text-center text-xs font-black text-slate-900 shadow-lg shadow-accent/15 transition-all"
              >
                Find a Worker
              </Link>
              <Link 
                href="/login"
                className="rounded-2xl border border-white/20 bg-white/5 hover:bg-white/10 px-8 py-4 text-center text-xs font-black text-white transition-all"
              >
                Apply as a Worker
              </Link>
            </div>

            {/* Trust Chips */}
            <div className="flex flex-wrap items-center gap-3 text-[10px] font-black text-primary-light/80 pt-4">
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3.5 w-3.5 text-accent" /> KYC Verified Workers
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3.5 w-3.5 text-accent" /> Paystack Escrow
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3.5 w-3.5 text-accent" /> Live Chat &amp; SMS Alerts
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3.5 w-3.5 text-accent" /> Real Verified Reviews
              </span>
            </div>
          </div>

          {/* Right column representation */}
          <div className="hidden lg:block relative">
            <div className="aspect-[4/3] rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white/10 bg-slate-900/10 backdrop-blur-sm relative">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
              <div className="absolute bottom-6 left-6 z-20 text-white space-y-1">
                <span className="bg-primary/80 backdrop-blur-md rounded-full px-3 py-1 text-[8px] font-black uppercase tracking-wider">Lekki, Lagos</span>
                <h3 className="text-sm font-black">Emeka James</h3>
                <p className="text-[10px] text-slate-200 font-semibold">Verified HVAC Technician • 127 Jobs Done</p>
              </div>
              {/* Cover visual overlay gradient backdrop */}
              <div className="w-full h-full bg-gradient-to-tr from-primary to-accent opacity-30"></div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: HOW IT WORKS */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">How SkillBridge Works</h2>
          <p className="text-xs font-semibold text-slate-500 leading-5">Simple three-step secure transaction model designed to eliminate pricing conflict and build customer-worker trust.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {[
            { step: "01", icon: Search, title: "Search Service or City", desc: "Browse through sixty distinct trades filtered by rating, pricing ranges and verified cities." },
            { step: "02", icon: Calendar, title: "Book & Pay Securely", desc: "Select comfortable calendar timeslots and initiate secure escrow hold deposits via Paystack." },
            { step: "03", icon: ShieldCheck, title: "Verify & Release Funds", desc: "Review complete works, release funds directly to the worker's wallet, and rate their service." }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col items-center text-center space-y-4 hover:shadow-md transition-shadow relative overflow-hidden">
                <span className="absolute top-4 right-6 text-3xl font-black text-slate-100">{item.step}</span>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-light text-primary">
                  <Icon className="h-5 w-5 stroke-[2]" />
                </span>
                <strong className="text-sm font-black text-slate-800 block">{item.title}</strong>
                <p className="text-xs font-semibold text-slate-500 leading-5 max-w-xs">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 3: SERVICE CATEGORIES */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 space-y-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Artisan Categories</h2>
            <p className="text-xs font-semibold text-slate-500">Pick top-level categories to browse local trades</p>
          </div>
          <Link 
            href="/browse"
            className="flex items-center gap-1 text-xs font-black text-primary hover:text-primary-dark transition-colors border-b border-primary/20 pb-0.5"
          >
            Browse all services
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const Icon = iconMap[cat.icon || ""] || Wrench;
            return (
              <Link
                key={cat.id}
                href={`/browse?category=${cat.slug}`}
                className="rounded-3xl border border-slate-100 bg-white p-6 text-center hover:border-slate-300 hover:shadow-md transition-all flex flex-col items-center space-y-3 group"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-light text-primary group-hover:scale-105 transition-transform">
                  <Icon className="h-5 w-5 stroke-[2]" />
                </span>
                <strong className="text-xs font-black text-slate-800 group-hover:text-primary transition-colors block">{cat.name}</strong>
                <p className="text-[10px] leading-4 text-slate-400 font-semibold line-clamp-2">{cat.description}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* SECTION 4: FEATURED WORKERS */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 space-y-12">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Star className="h-6 w-6 text-accent fill-accent" />
            Top Rated on SkillBridge
          </h2>
          <p className="text-xs font-semibold text-slate-500">Highly reliable and vetted local professional artisans</p>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-56 rounded-3xl bg-slate-200 animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {workers.map((worker) => (
              <WorkerCard key={worker.id} worker={worker} />
            ))}
          </div>
        )}
      </section>

      {/* SECTION 5: TRUST STATS BANNER */}
      <section className="bg-primary text-white py-12 px-6">
        <div className="max-w-7xl mx-auto grid gap-8 grid-cols-2 md:grid-cols-4 text-center items-center">
          {[
            { icon: Shield, label: "Admin-Verified", desc: "KYC Workers" },
            { icon: Star, label: "Real Reviews", desc: "Verified ratings" },
            { icon: Wallet, label: "Escrow Protected", desc: "Paystack escrow" },
            { icon: Clock, label: "Live Chat & SMS", desc: "Instant updates" }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="space-y-1.5 animate-scale-up">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 mx-auto text-accent">
                  <Icon className="h-5 w-5 fill-accent stroke-[1]" />
                </span>
                <strong className="text-sm md:text-lg font-black block leading-none">{item.label}</strong>
                <span className="text-[10px] text-primary-light font-bold block uppercase tracking-wider">{item.desc}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 6: TESTIMONIALS */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-1">
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Artisan Success Stories</h2>
          <p className="text-xs font-semibold text-slate-500">Read stories of verified workers growing their income with SkillBridge</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {[
            { name: "Segun Electricals", category: "Certified Electrician", quote: "SkillBridge has completely removed the stress of haggling for me. I get paid precisely my rate, and having funds escrowed before work gives me total peace of mind.", location: "Ikeja, Lagos", rating: 5 },
            { name: "Fatima Aliyu", category: "Professional Makeup Artist", quote: "My portfolio and real reviews are visible to everyone. Customers in Abuja find me, book immediately, and Paystack escrow releases automatically once complete. Amazing!", location: "Maitama, Abuja", rating: 5 }
          ].map((test, idx) => (
            <div key={idx} className="rounded-[2rem] bg-accent-light/50 border border-amber-100 p-8 space-y-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-1 text-accent">
                {Array.from({ length: test.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-accent stroke-accent" />
                ))}
              </div>
              <p className="text-xs md:text-sm font-semibold italic text-slate-700 leading-relaxed">&quot;{test.quote}&quot;</p>
              <div className="flex items-center justify-between border-t border-amber-200/55 pt-4">
                <div>
                  <strong className="text-xs font-black text-slate-800 block leading-none">{test.name}</strong>
                  <span className="text-[9px] text-slate-400 font-extrabold block uppercase tracking-wider mt-1">{test.category}</span>
                </div>
                <span className="rounded-xl bg-white border border-amber-200 px-3 py-1 text-[9px] font-extrabold text-amber-700 tracking-wider uppercase">{test.location}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 7: WORKER CTA BANNER */}
      <section className="max-w-5xl mx-auto px-6">
        <div className="rounded-[3rem] bg-accent-light border border-accent/20 p-8 md:p-12 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-md">
            <h2 className="text-xl md:text-2xl font-black text-slate-800">Are you a skilled worker?</h2>
            <p className="text-xs font-semibold text-slate-500 leading-5">Join verified plumbers, electricians, carpenters and more. Set your rate, accept bookings, and get paid securely through Paystack escrow — with SMS alerts every step of the way.</p>
          </div>
          <Link
            href="/login?role=worker"
            className="rounded-2xl bg-primary text-white hover:bg-primary-dark px-8 py-4 text-xs font-black shadow-lg shadow-primary/10 transition-all whitespace-nowrap"
          >
            Apply to Join Today
          </Link>
        </div>
      </section>

    </div>
  );
}
