"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { API_BASE_URL, type Booking, getMyWorkerProfile, toggleWorkerAvailability } from "@/lib/api";
import {
  Sparkles, Check, X, ShieldCheck, MapPin, Calendar, Wallet, Star,
  Briefcase, ChevronRight, MessageSquare, Edit3, Eye, Award, TrendingUp,
  Clock, ArrowUpRight, CheckCircle2, User, Paintbrush, ShieldAlert
} from "lucide-react";
import Link from "next/link";
import { BookingStatusBadge } from "@/components/shared/BookingStatusBadge";
import { ChatPanel } from "@/components/shared/ChatPanel";

// Predefined premium themes for worker self-branding
const PRESETS = [
  { id: "emerald", name: "Lagos Emerald", primary: "bg-[#1a5c38]", border: "border-[#1a5c38]/20", text: "text-[#1a5c38]", bgLight: "bg-[#1a5c38]/5", gradient: "from-[#0f3d26] to-[#1a5c38]" },
  { id: "amber", name: "Gold Luxury", primary: "bg-[#d97706]", border: "border-[#d97706]/20", text: "text-[#d97706]", bgLight: "bg-[#d97706]/5", gradient: "from-[#92400e] to-[#d97706]" },
  { id: "teal", name: "Ocean Teal", primary: "bg-[#0d9488]", border: "border-[#0d9488]/20", text: "text-[#0d9488]", bgLight: "bg-[#0d9488]/5", gradient: "from-[#115e59] to-[#0d9488]" },
  { id: "indigo", name: "Indigo Tech", primary: "bg-[#4f46e5]", border: "border-[#4f46e5]/20", text: "text-[#4f46e5]", bgLight: "bg-[#4f46e5]/5", gradient: "from-[#3730a3] to-[#4f46e5]" }
];

export default function WorkerHome() {
  const { user } = useAuth();
  
  const [isAvailable, setIsAvailable] = useState(true);
  const [requests, setRequests] = useState<Booking[]>([]);
  const [activeJob, setActiveJob] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatBooking, setChatBooking] = useState<Booking | null>(null);
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [greeting, setGreeting] = useState("Welcome back");

  // Self-Branding States (stored in localStorage for high-fidelity persistence)
  const [tagline, setTagline] = useState("");
  const [title, setTitle] = useState("");
  const [themeId, setThemeId] = useState("emerald");
  const [selectedBadges, setSelectedBadges] = useState<string[]>(["KYC Verified"]);
  const [specialty, setSpecialty] = useState("Plumbing");
  const [isEditingBranding, setIsEditingBranding] = useState(false);

  // --- Profile Stats State ---
  const [profileStats, setProfileStats] = useState({
    netPayouts: 0,
    completedJobs: 0,
    completedThisWeek: 0,
    ratingAvg: 0.0,
    ratingCount: 0
  });
  const [hourlyRate, setHourlyRate] = useState(0);
  const [city, setCity] = useState("Lagos");
  const [stateName, setStateName] = useState("Lagos");

  const activeTheme = PRESETS.find(p => p.id === themeId) || PRESETS[0];

  useEffect(() => {
    // Load local self-branding data
    const cachedBranding = localStorage.getItem(`sb_branding_${user?.id}`);
    if (cachedBranding) {
      try {
        const parsed = JSON.parse(cachedBranding);
        setTagline(parsed.tagline || "");
        setTitle(parsed.title || "");
        setThemeId(parsed.themeId || "emerald");
        setSelectedBadges(parsed.selectedBadges || ["KYC Verified"]);
        setSpecialty(parsed.specialty || "Plumbing");
      } catch {
        // Fallback to default
      }
    } else {
      // Default initial states based on role/seeding
      setTitle("Professional Tradesman");
      setTagline("Providing reliable artisan services tailored to your needs.");
      setSpecialty("Plumbing");
    }
  }, [user]);

  const saveBranding = () => {
    localStorage.setItem(`sb_branding_${user?.id}`, JSON.stringify({
      tagline,
      title,
      themeId,
      selectedBadges,
      specialty
    }));
    setIsEditingBranding(false);
  };

  const fetchWorkerData = async () => {
    setErrorMsg("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/bookings/`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        const results: Booking[] = data.results || [];
        setRequests(results.filter((b) => b.status === "pending"));
        const active = results.find((b) => b.status === "accepted" || b.status === "in_progress");
        setActiveJob(active || null);
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
    fetchWorkerData();
    // Set time-aware greeting
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting("Good morning");
    } else if (hour < 17) {
      setGreeting("Good afternoon");
    } else {
      setGreeting("Good evening");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch initial profile details (availability and approval status)
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await getMyWorkerProfile();
        if (res && res.profile) {
          setIsAvailable(res.profile.is_available);
          setIsApproved(res.profile.is_approved);
          setHourlyRate(res.profile.hourly_rate || 0);
          setCity(res.profile.city || "Lagos");
          setStateName(res.profile.state || "Lagos");
          
          const stats = {
            netPayouts: res.profile.net_payouts || 0,
            completedJobs: res.profile.completed_jobs || 0,
            completedThisWeek: res.profile.completed_this_week || 0,
            ratingAvg: res.profile.rating_avg || 0,
            ratingCount: res.profile.rating_count || 0
          };
          setProfileStats(stats);

          if (stats.ratingCount === 0 || stats.ratingAvg < 4.5) {
            setSelectedBadges(prev => prev.filter(b => b !== "5-Star Rated"));
          }

          if (res.profile.categories && res.profile.categories.length > 0) {
            setSpecialty(res.profile.categories[0].name);
          }
        }
      } catch {
        setErrorMsg("Failed to synchronize worker profile data.");
      }
    }
    loadProfile();
  }, []);

  // Listen to availability sync events from AppNavbar
  useEffect(() => {
    function handleAvailabilityChange(e: Event) {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && typeof customEvent.detail.isAvailable === "boolean") {
        setIsAvailable(customEvent.detail.isAvailable);
      }
    }
    window.addEventListener("worker-availability-changed", handleAvailabilityChange);
    return () => {
      window.removeEventListener("worker-availability-changed", handleAvailabilityChange);
    };
  }, []);

  const handleToggleAvailable = async () => {
    const nextState = !isAvailable;
    setIsAvailable(nextState);
    
    // Sync with AppNavbar
    window.dispatchEvent(
      new CustomEvent("worker-availability-changed", {
        detail: { isAvailable: nextState },
      })
    );

    try {
      await toggleWorkerAvailability(nextState);
    } catch {
      // Rollback
      setIsAvailable(isAvailable);
      window.dispatchEvent(
        new CustomEvent("worker-availability-changed", {
          detail: { isAvailable: isAvailable },
        })
      );
    }
  };

  const handleRequestAction = async (bookingId: string, action: "accept" | "reject") => {
    const nextStatus = action === "accept" ? "accepted" : "cancelled";
    setErrorMsg("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/bookings/${bookingId}/${nextStatus}/`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        fetchWorkerData();
      } else {
        const errData = await res.json().catch(() => ({}));
        setErrorMsg(errData.detail || `Failed to execute request action: ${action}.`);
      }
    } catch {
      setErrorMsg("Network error. Failed to accept or decline request.");
    }
  };

  const toggleBadge = (badge: string) => {
    setSelectedBadges(prev =>
      prev.includes(badge) ? prev.filter(b => b !== badge) : [...prev, badge]
    );
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* ── HEADER BANNER: Sleek Gradient Hub ── */}
      <div className={`relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br ${activeTheme.gradient} text-white shadow-xl shadow-slate-900/10`}>
        {/* Vector Accent */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_120%,rgba(245,166,35,0.15),transparent_60%)]" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-x-1/3 -translate-y-1/3 blur-2xl" />

        <div className="relative z-10 px-8 py-10 md:py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Welcome Text */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/10 px-4 py-1.5 text-[9px] font-black uppercase tracking-widest">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              Executive Workspace
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-none">
              {greeting}, {user?.full_name?.split(" ")[0]} 👋
            </h1>
            <p className="text-xs font-semibold text-white/80 max-w-md">
              Core Trade Specialty: <span className="text-amber-400 font-black">{specialty}</span> • Manage availability, gigs and self-branding below.
            </p>
          </div>

          {/* Availability Control */}
          <div className="flex items-center gap-4 bg-white/10 border border-white/15 rounded-[2rem] px-5 py-3.5 backdrop-blur-md">
            <span className={`h-2.5 w-2.5 rounded-full ${isAvailable ? "bg-emerald-400 animate-pulse" : "bg-white/40"}`}></span>
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-white/55 block leading-none">Availability</span>
              <span className="text-xs font-black text-white mt-1 block">
                {isAvailable ? "Online Available" : "Offline Silent"}
              </span>
            </div>
            <button 
              onClick={handleToggleAvailable}
              className={`relative inline-flex h-6.5 w-12 items-center rounded-full transition-colors focus:outline-none shrink-0 ${
                isAvailable ? "bg-white/20" : "bg-white/10"
              }`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                isAvailable ? "translate-x-6" : "translate-x-1"
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* ── APPROVAL STATUS WARNING BANNER ── */}
      {isApproved === false && (
        <div className="rounded-[2rem] border border-amber-200 bg-amber-50/50 p-6 flex items-start gap-4 shadow-sm animate-fade-in">
          <ShieldAlert className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="text-xs font-black text-amber-800 uppercase tracking-wider block">Profile Pending Admin Approval</strong>
            <p className="text-xs font-semibold text-amber-700 leading-normal">
              Your artisan profile is currently under review by our administration team. 
              While pending approval, you will not appear in customer browser queries and cannot receive new booking requests. 
              We will verify your submitted details within 24-48 hours.
            </p>
          </div>
        </div>
      )}

      {/* ── ERROR ALERTS BANNER ── */}
      {errorMsg && (
        <div className="rounded-[2rem] border border-red-200 bg-red-50 p-5 flex items-start gap-3 shadow-sm animate-fade-in">
          <ShieldAlert className="h-5 w-5 text-red-650 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <strong className="text-xs font-black text-red-800 block">System Connection Alert</strong>
            <p className="text-[10.5px] font-semibold text-red-750 leading-tight">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* ── ANALYTICS CARDS GRID ── */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {[
          { 
            label: "Net Payouts", 
            val: `₦${profileStats.netPayouts.toLocaleString()}`, 
            icon: Wallet, 
            desc: profileStats.netPayouts === 0 ? "No earnings yet" : "Earned payouts", 
            highlight: "text-emerald-500" 
          },
          { 
            label: "Completed Jobs", 
            val: String(profileStats.completedJobs), 
            icon: ShieldCheck, 
            desc: `+${profileStats.completedThisWeek} this week`, 
            highlight: "text-blue-500" 
          },
          { 
            label: "Avg Star Rating", 
            val: profileStats.ratingCount === 0 ? "★ N/A" : `★ ${profileStats.ratingAvg.toFixed(1)}`, 
            icon: Star, 
            desc: profileStats.ratingCount === 0 ? "No reviews yet" : `Based on ${profileStats.ratingCount} reviews`, 
            highlight: "text-amber-500" 
          },
          { 
            label: "Platform Standing", 
            val: isApproved === null ? "Loading..." : isApproved ? (profileStats.completedJobs >= 10 ? "Elite" : "Standard") : "Under Review", 
            icon: Award, 
            desc: isApproved === null ? "Verifying status" : isApproved ? "NIN KYC Verified" : "Verification Pending", 
            highlight: isApproved ? "text-purple-500" : "text-amber-500" 
          }
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="rounded-3xl border border-slate-100 bg-white p-5 space-y-2 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all relative overflow-hidden">
              <span className="absolute top-4 right-4 text-slate-100">
                <Icon className="h-6 w-6 text-slate-200" />
              </span>
              <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">{stat.label}</span>
              <strong className={`text-xl font-black block leading-tight ${stat.highlight || "text-slate-800"}`}>{stat.val}</strong>
              <span className="text-[9px] font-semibold text-slate-500 block">{stat.desc}</span>
            </div>
          );
        })}
      </div>

      <div className="grid gap-8 lg:grid-cols-3 items-start">
        
        {/* ── LEFT COLUMN: ACTIVE PROJECTS & REQUESTS ── */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Active Job Alert */}
          {activeJob && (
            <div className={`rounded-[2rem] border-2 ${activeTheme.border} bg-white p-6 shadow-md relative overflow-hidden`}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-transparent to-primary/5 rounded-bl-[2rem]" />
              
              <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <strong className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">🔧 Active Project</strong>
                </div>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase">ID: {activeJob.id.slice(-6).toUpperCase()}</span>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-slate-800">{activeJob.customer_name}</h3>
                  <span className="text-base font-black text-primary">₦{Number(activeJob.quoted_amount).toLocaleString()}</span>
                </div>
                <p className="text-xs text-slate-600 font-semibold italic leading-normal bg-slate-50 rounded-2xl p-4 border border-slate-100/50">
                  &quot;{activeJob.job_description}&quot;
                </p>
                <div className="text-[10px] font-bold text-slate-500 flex flex-col sm:flex-row gap-2 sm:gap-6 pt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                    {activeJob.address}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                    Scheduled for: {new Date(activeJob.scheduled_for).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-50 pt-4 flex gap-2 justify-end">
                <button
                  onClick={() => setChatBooking(activeJob)}
                  className="rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100 p-3 text-slate-600 transition-colors"
                  title="Open Chat"
                >
                  <MessageSquare className="h-4.5 w-4.5" />
                </button>
                <Link
                  href={`/job/${activeJob.id}`}
                  className="rounded-xl bg-primary hover:bg-primary-dark text-white px-5 py-3 text-xs font-black transition-all shadow-md shadow-primary/10"
                >
                  Open Job Sheet
                </Link>
              </div>
            </div>
          )}

          {/* Incoming Requests */}
          <div className="space-y-4">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Clock className="h-4.5 w-4.5 text-primary" />
              Incoming Requests Queue
            </h2>

            {loading ? (
              <div className="h-32 bg-slate-200 animate-pulse rounded-3xl"></div>
            ) : requests.length === 0 ? (
              <div className="rounded-[2rem] border border-slate-100 bg-white p-10 text-center text-slate-500 shadow-sm space-y-2">
                <ShieldAlert className="h-8 w-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold">No pending booking requests at the moment.</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Keep online status active to get direct gigs</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {requests.map((r) => (
                  <div key={r.id} className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm space-y-4 hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="flex justify-between items-start">
                      <div>
                        <strong className="text-base font-black text-slate-800">{r.customer_name}</strong>
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase mt-1 block">ID: {r.id.slice(-6).toUpperCase()}</span>
                      </div>
                      <span className="rounded-full bg-amber-50 border border-amber-100 text-amber-700 px-3 py-1 text-[9px] font-black uppercase tracking-wider">
                        Incoming Request
                      </span>
                    </div>

                    <p className="text-xs leading-normal text-slate-500 italic font-semibold bg-slate-50/50 border border-slate-100/50 rounded-2xl p-4">&quot;{r.job_description}&quot;</p>

                    <div className="border-t border-slate-50 pt-4 flex items-center justify-between">
                      <span className="text-sm font-black text-slate-850">₦{Number(r.quoted_amount).toLocaleString()}</span>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRequestAction(r.id, "reject")}
                          className="rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2.5 text-xs font-black transition-all"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => handleRequestAction(r.id, "accept")}
                          className="rounded-xl bg-primary hover:bg-primary-dark text-white px-5 py-2.5 text-xs font-black transition-all shadow-md shadow-primary/10"
                        >
                          Accept
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* ── RIGHT COLUMN: HIGH-END SELF BRANDING CONSOLE ── */}
        <aside className="space-y-8">
          
          {/* Chat Drawer Box */}
          {chatBooking && (
            <ChatPanel 
              bookingId={chatBooking.id}
              workerName={chatBooking.customer_name}
              onClose={() => setChatBooking(null)}
            />
          )}

          {/* ── PREMIUM WORKER SELF BRANDING CARD ── */}
          <div className="rounded-[2rem] border border-slate-150 bg-white p-6 shadow-md space-y-6 relative overflow-hidden">
            
            {/* Design Icon Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                <Paintbrush className="h-4.5 w-4.5 text-primary" />
                Artisan branding
              </h3>
              
              {!isEditingBranding ? (
                <button 
                  onClick={() => setIsEditingBranding(true)}
                  className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-primary hover:underline"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Customize
                </button>
              ) : (
                <button 
                  onClick={saveBranding}
                  className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-600 hover:underline"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Save Settings
                </button>
              )}
            </div>

            {/* LIVE PREVIEW OF CUSTOMER VIEW CARD */}
            <div className="space-y-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Customer View Preview</span>
              
              {/* Mock Customer Card */}
              <div className={`rounded-3xl border ${activeTheme.border} p-5 space-y-4 bg-white hover:shadow-lg transition-shadow relative overflow-hidden`}>
                <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-3xl ${activeTheme.primary} opacity-10`} />
                
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 leading-tight">{user?.full_name}</h4>
                    <span className={`text-[10px] font-black uppercase tracking-wider ${activeTheme.text} block mt-0.5`}>
                      {specialty} • {title || "Specialty Tradesman"}
                    </span>
                  </div>
                  <span className="flex items-center gap-0.5 text-amber-500 text-xs font-black">
                    {profileStats.ratingCount === 0 ? "★ N/A" : `★ ${profileStats.ratingAvg.toFixed(1)}`}
                  </span>
                </div>

                <p className="text-[10.5px] font-semibold text-slate-500 leading-relaxed">
                  &quot;{tagline || "Top quality worker available for jobs."}&quot;
                </p>

                {/* Badges strip */}
                <div className="flex flex-wrap gap-1">
                  {selectedBadges.map((badge, bIdx) => (
                    <span 
                      key={bIdx}
                      className={`inline-flex items-center gap-0.5 rounded-full ${activeTheme.bgLight} ${activeTheme.text} px-2 py-0.5 text-[8px] font-extrabold uppercase`}
                    >
                      <ShieldCheck className="h-2.5 w-2.5 shrink-0" />
                      {badge}
                    </span>
                  ))}
                </div>

                <div className="border-t border-slate-50 pt-3 flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <span className="flex items-center gap-0.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {city}, {stateName}
                  </span>
                  <span className="text-slate-800">
                    ₦{Number(hourlyRate).toLocaleString()}/hr
                  </span>
                </div>
              </div>
            </div>

            {/* LIVE INTERACTIVE EDITING PANEL */}
            {isEditingBranding && (
              <div className="space-y-4 bg-slate-50/50 rounded-2xl p-4 border border-slate-100 animate-fade-in">
                
                {/* 1. Theme picker */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 block uppercase">Theme color preset</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {PRESETS.map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => setThemeId(preset.id)}
                        className={`h-7.5 rounded-lg text-[9px] font-bold text-white transition-all capitalize shadow-sm ${preset.primary} ${
                          themeId === preset.id ? "ring-2 ring-slate-800 ring-offset-1" : "opacity-80 hover:opacity-100"
                        }`}
                        title={preset.name}
                      >
                        {preset.name.split(" ")[1].slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 0. Core Specialty Trade */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 block uppercase">Core Trade Specialty</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      "Plumbing", "Electrical", "Cleaning",
                      "Carpentry", "AC Repair", "Painting",
                      "Welding", "Tiling", "Tailoring",
                      "Catering", "Mechanic", "Tutoring"
                    ].map((trade) => {
                      const active = specialty === trade;
                      return (
                        <button
                          key={trade}
                          type="button"
                          onClick={() => setSpecialty(trade)}
                          className={`rounded-xl px-2 py-2 text-[9px] font-black transition-all border capitalize leading-tight ${
                            active
                              ? "bg-primary border-primary text-white shadow-md shadow-primary/20"
                              : "bg-white border-slate-200 text-slate-500 hover:border-primary/30 hover:bg-primary/5"
                          }`}
                        >
                          {trade}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Professional title input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block uppercase">Professional Headline</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={32}
                    placeholder="e.g. Lagos Chief Electrician"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-semibold outline-none focus:border-primary"
                  />
                </div>

                {/* 3. Branding slogan input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block uppercase">Catchy Slogan (Tagline)</label>
                  <textarea
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    maxLength={100}
                    placeholder="Provide a compelling tagline for customers..."
                    className="w-full min-h-12 rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-semibold outline-none focus:border-primary"
                  />
                </div>

                {/* 4. Badges picker */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 block uppercase">Highlight trust badges</label>
                  <div className="flex flex-wrap gap-1">
                    {["KYC Verified", "Paystack Secured", "Emergency Pro", ...(profileStats.ratingAvg >= 4.5 && profileStats.ratingCount > 0 ? ["5-Star Rated"] : [])].map((badge, bIdx) => {
                      const active = selectedBadges.includes(badge);
                      return (
                        <button
                          key={bIdx}
                          onClick={() => toggleBadge(badge)}
                          className={`rounded-full px-2.5 py-1 text-[8.5px] font-black capitalize border transition-all ${
                            active
                              ? "bg-primary border-primary text-white"
                              : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                          }`}
                        >
                          {badge}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Action CTA */}
                <button
                  onClick={saveBranding}
                  className="w-full py-2.5 bg-primary text-white hover:bg-primary-dark font-black text-xs rounded-xl shadow-sm transition-colors"
                >
                  Apply Branding Changes
                </button>
              </div>
            )}
          </div>

          {/* Quick Console shortcuts */}
          <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Console Shortcuts</h3>
            <div className="grid gap-2">
              {[
                { label: "Earnings Ledger", href: "/earnings" },
                { label: "Requests Queue", href: "/requests" },
                { label: "Edit Profile Details", href: "/profile/edit" }
              ].map((link, i) => (
                <Link
                  key={i}
                  href={link.href}
                  className="flex items-center justify-between rounded-xl hover:bg-slate-55 p-2.5 transition-colors border border-slate-50 text-xs font-bold text-slate-600"
                >
                  {link.label}
                  <ChevronRight className="h-4 w-4 text-slate-350" />
                </Link>
              ))}
            </div>
          </div>

        </aside>

      </div>

    </div>
  );
}
