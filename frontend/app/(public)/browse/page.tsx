"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getCategories, getWorkers, type Category, type Worker } from "@/lib/api";
import { WorkerCard } from "@/components/shared/WorkerCard";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Search, SlidersHorizontal, X, Star, MapPin, Zap,
  Wrench, Hammer, Paintbrush, Wind, Scissors, ChefHat,
  Shirt, Layers, ArrowUpDown, CheckCircle
} from "lucide-react";

const CATEGORY_ICONS: Record<string, any> = {
  plumbing: Wrench,
  electrical: Zap,
  carpentry: Hammer,
  painting: Paintbrush,
  cleaning: Layers,
  "ac repair": Wind,
  hvac: Wind,
  tailoring: Shirt,
  catering: ChefHat,
  hairdressing: Scissors,
};

const SORT_OPTIONS = [
  { value: "rating", label: "Highest Rated" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "reviews", label: "Most Reviewed" },
];

const CITIES = ["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Kano", "Enugu", "Benin City"];

const DEMO_WORKERS: Worker[] = [
  { id: "w1", full_name: "Adewale Babatunde", bio: "Expert plumber with 8 years experience in pipe repairs, bathroom fittings & kitchen plumbing in Lagos.", city: "Lagos", state: "Lagos", hourly_rate: 6500, rating_avg: 4.9, rating_count: 64, is_available: true, is_approved: true, categories: [{ name: "Plumbing", slug: "plumbing" }] },
  { id: "w2", full_name: "Zainab Usman", bio: "Certified electrical engineer offering home wiring, generator installations and solar panel setup.", city: "Abuja", state: "FCT", hourly_rate: 8500, rating_avg: 4.7, rating_count: 38, is_available: true, is_approved: true, categories: [{ name: "Electrical", slug: "electrical" }] },
  { id: "w3", full_name: "Tunde Lawal", bio: "Deep cleaning expert — post-construction, move-in/out and office disinfection across Lekki.", city: "Lagos", state: "Lagos", hourly_rate: 5000, rating_avg: 4.8, rating_count: 21, is_available: true, is_approved: true, categories: [{ name: "Cleaning", slug: "cleaning" }] },
  { id: "w4", full_name: "Chukwuemeka Eze", bio: "Custom furniture carpenter. Wardrobe, cabinets, bed frames and doors — precision woodwork.", city: "Port Harcourt", state: "Rivers", hourly_rate: 7000, rating_avg: 4.6, rating_count: 17, is_available: false, is_approved: true, categories: [{ name: "Carpentry", slug: "carpentry" }] },
  { id: "w5", full_name: "Funke Adeyemi", bio: "Professional makeup artist for weddings, birthdays and events across Lagos and Abuja.", city: "Lagos", state: "Lagos", hourly_rate: 12000, rating_avg: 5.0, rating_count: 89, is_available: true, is_approved: true, categories: [{ name: "Makeup", slug: "makeup" }] },
  { id: "w6", full_name: "Ibrahim Garba", bio: "AC installation and maintenance specialist — all brands, split and central units.", city: "Kano", state: "Kano", hourly_rate: 9000, rating_avg: 4.5, rating_count: 12, is_available: true, is_approved: true, categories: [{ name: "AC Repair", slug: "ac repair" }] },
];

function BrowseContent() {
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [workers, setWorkers] = useState<Worker[]>(DEMO_WORKERS);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [selectedCity, setSelectedCity] = useState(searchParams.get("city") || "");
  const [maxPrice, setMaxPrice] = useState(50000);
  const [minRating, setMinRating] = useState(0);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sortBy, setSortBy] = useState("rating");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [catsRes, workersRes] = await Promise.all([getCategories(), getWorkers()]);
        setCategories(catsRes.results || []);
        if ((workersRes.results || []).length > 0) setWorkers(workersRes.results);
      } catch {
        setCategories([
          { id: "plumbing", name: "Plumbing", slug: "plumbing", is_active: true, icon: "wrench" },
          { id: "electrical", name: "Electrical", slug: "electrical", is_active: true, icon: "zap" },
          { id: "cleaning", name: "Cleaning", slug: "cleaning", is_active: true, icon: "layers" },
          { id: "carpentry", name: "Carpentry", slug: "carpentry", is_active: true, icon: "hammer" },
          { id: "painting", name: "Painting", slug: "painting", is_active: true, icon: "paintbrush" },
          { id: "ac-repair", name: "AC Repair", slug: "ac repair", is_active: true, icon: "wind" },
        ]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = workers
    .filter(w => {
      const q = query.toLowerCase();
      const matchQ = !q || w.full_name.toLowerCase().includes(q) || (w.bio || "").toLowerCase().includes(q);
      const matchCat = !selectedCategory ||
        (w.categories && w.categories.some((c: any) =>
          (typeof c === "string" ? c : c.slug || "").toLowerCase().includes(selectedCategory.toLowerCase())
        )) ||
        (w.bio || "").toLowerCase().includes(selectedCategory.toLowerCase());
      const matchCity = !selectedCity || w.city.toLowerCase() === selectedCity.toLowerCase();
      const matchPrice = Number(w.hourly_rate) <= maxPrice;
      const matchRating = w.rating_avg >= minRating;
      const matchAvail = !availableOnly || w.is_available;
      return matchQ && matchCat && matchCity && matchPrice && matchRating && matchAvail;
    })
    .sort((a, b) => {
      if (sortBy === "rating") return b.rating_avg - a.rating_avg;
      if (sortBy === "price_asc") return a.hourly_rate - b.hourly_rate;
      if (sortBy === "price_desc") return b.hourly_rate - a.hourly_rate;
      if (sortBy === "reviews") return b.rating_count - a.rating_count;
      return 0;
    });

  const clearAll = () => {
    setQuery(""); setSelectedCategory(""); setSelectedCity("");
    setMaxPrice(50000); setMinRating(0); setAvailableOnly(false);
  };

  const activeFilterCount = [
    selectedCategory, selectedCity, minRating > 0, availableOnly, maxPrice < 50000
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Hero Search Banner ── */}
      <div className="bg-gradient-to-br from-[#0f3d26] via-[#1a5c38] to-[#0f3d26] py-14 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
              Find Your Perfect <span className="text-amber-400">Skilled Worker</span>
            </h1>
            <p className="text-primary-light text-sm font-semibold mt-2">
              Browse {workers.length}+ KYC-verified artisans across Nigeria
            </p>
          </div>
          {/* Search bar */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="e.g. plumber, electrician, makeup artist, cleaner..."
              className="w-full rounded-2xl bg-white border-2 border-white/80 shadow-xl py-4 pl-12 pr-14 text-sm font-semibold text-slate-700 placeholder:text-slate-400 outline-none focus:border-amber-400 transition-colors"
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Category quick-pills */}
          <div className="flex flex-wrap justify-center gap-2 pt-1">
            {(categories.length ? categories : [
              { id: "all", name: "All", slug: "", is_active: true },
              { id: "plumbing", name: "Plumbing", slug: "plumbing", is_active: true },
              { id: "electrical", name: "Electrical", slug: "electrical", is_active: true },
              { id: "cleaning", name: "Cleaning", slug: "cleaning", is_active: true },
              { id: "carpentry", name: "Carpentry", slug: "carpentry", is_active: true },
              { id: "painting", name: "Painting", slug: "painting", is_active: true },
            ]).map(cat => {
              const Icon = CATEGORY_ICONS[cat.slug] || Layers;
              const active = selectedCategory === cat.slug;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(active ? "" : cat.slug)}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-black transition-all border ${
                    active
                      ? "bg-amber-400 border-amber-400 text-slate-900 shadow-md"
                      : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                  }`}
                >
                  {cat.slug && <Icon className="h-3.5 w-3.5" />}
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Content Area ── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Toolbar row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-sm font-black text-slate-800 leading-none">
              {loading ? "Loading artisans..." : `${filtered.length} artisan${filtered.length !== 1 ? "s" : ""} found`}
            </h2>
            {(selectedCategory || selectedCity || query) && (
              <p className="text-xs text-slate-500 font-medium mt-1">
                {[selectedCategory, selectedCity, query].filter(Boolean).join(" • ")}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Sort */}
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2">
              <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="text-xs font-bold text-slate-700 outline-none bg-transparent cursor-pointer"
              >
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold border transition-all ${
                showFilters ? "bg-primary text-white border-primary" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-black ${showFilters ? "bg-white text-primary" : "bg-primary text-white"}`}>
                  {activeFilterCount}
                </span>
              )}
            </button>
            {activeFilterCount > 0 && (
              <button onClick={clearAll} className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors">
                Clear all
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-6 items-start">
          {/* ── Filter Panel ── */}
          {showFilters && (
            <aside className="w-72 shrink-0 rounded-2xl border border-slate-200 bg-white p-6 space-y-6 shadow-sm animate-fade-in sticky top-20">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-800">Filter Artisans</h3>
                <button onClick={clearAll} className="text-[10px] font-black text-primary hover:underline">Reset</button>
              </div>

              {/* City */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> City
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CITIES.map(c => (
                    <button
                      key={c}
                      onClick={() => setSelectedCity(selectedCity === c ? "" : c)}
                      className={`rounded-lg px-2.5 py-1 text-[10px] font-bold border transition-all ${
                        selectedCity === c ? "bg-primary text-white border-primary" : "bg-slate-50 text-slate-600 border-slate-200 hover:border-primary/50"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Min Rating */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Star className="h-3 w-3" /> Minimum Rating
                </label>
                <div className="flex gap-1.5">
                  {[0, 3, 4, 4.5].map(r => (
                    <button
                      key={r}
                      onClick={() => setMinRating(r)}
                      className={`flex-1 rounded-lg py-1.5 text-[10px] font-black border transition-all ${
                        minRating === r ? "bg-primary text-white border-primary" : "bg-slate-50 text-slate-600 border-slate-200 hover:border-primary/50"
                      }`}
                    >
                      {r === 0 ? "Any" : `★ ${r}+`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Max Rate (₦/hr)</label>
                  <span className="text-xs font-black text-primary">₦{maxPrice.toLocaleString()}</span>
                </div>
                <input
                  type="range" min={1000} max={50000} step={500}
                  value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-semibold">
                  <span>₦1,000</span><span>₦50,000</span>
                </div>
              </div>

              {/* Available only */}
              <button
                onClick={() => setAvailableOnly(v => !v)}
                className="flex items-center gap-2.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-xs font-bold text-slate-700 hover:border-primary/40 transition-all"
              >
                <span className={`flex h-4.5 w-4.5 items-center justify-center rounded-md border transition-colors ${availableOnly ? "bg-primary border-primary" : "border-slate-300"}`}>
                  {availableOnly && <CheckCircle className="h-3 w-3 text-white" />}
                </span>
                Available Now Only
              </button>
            </aside>
          )}

          {/* ── Worker Grid ── */}
          <section className="flex-1">
            {loading ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-64 rounded-3xl bg-slate-200 animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No Matching Artisans"
                description="Try adjusting your search or filter criteria to see more results."
                ctaLabel="Clear All Filters"
                onCtaClick={clearAll}
              />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map(worker => (
                  <WorkerCard key={worker.id} worker={worker} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense>
      <BrowseContent />
    </Suspense>
  );
}
