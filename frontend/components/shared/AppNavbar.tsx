"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { usePathname } from "next/navigation";
import { toggleWorkerAvailability, getMyWorkerProfile, API_BASE_URL } from "@/lib/api";
import {
  Sparkles, LogOut, Search, User, Shield, Briefcase,
  Calendar, Bell, Menu, X, ChevronDown, BookOpen, Home,
  UserPlus, Settings
} from "lucide-react";

const NAV_LINKS = [
  { href: "/browse", label: "Find a Worker", icon: Search },
  { href: "/browse?category=plumbing", label: "Plumbing", icon: null },
  { href: "/browse?category=electrical", label: "Electrical", icon: null },
  { href: "/browse?category=cleaning", label: "Cleaning", icon: null },
];

export function AppNavbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const servRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Synchronize initial availability status
  useEffect(() => {
    if (user?.role === "worker") {
      getMyWorkerProfile()
        .then((res) => {
          if (res && res.profile) {
            setIsAvailable(res.profile.is_available);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  // Synchronize state changes across pages/components
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

    // Sync with other components on the page
    window.dispatchEvent(
      new CustomEvent("worker-availability-changed", {
        detail: { isAvailable: nextState },
      })
    );

    try {
      await toggleWorkerAvailability(nextState);
    } catch {
      // Rollback on failure
      setIsAvailable(isAvailable);
      window.dispatchEvent(
        new CustomEvent("worker-availability-changed", {
          detail: { isAvailable: isAvailable },
        })
      );
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/notifications/`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.results || []);
      }
    } catch {}
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/notifications/${id}/read/`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch {}
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/notifications/mark-all-read/`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Shadow on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropdownOpen(false);
      if (servRef.current && !servRef.current.contains(e.target as Node)) setServicesOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close mobile on navigate
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const rolePortalLink = user
    ? user.role === "admin" ? "/admin/dashboard"
    : user.role === "worker" ? "/home"
    : "/dashboard"
    : null;

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled ? "bg-white shadow-md shadow-slate-200/60 border-b border-slate-100" : "bg-white/95 backdrop-blur-xl border-b border-slate-100/80"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 lg:px-8 h-16">
        {/* ── Brand ── */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1a5c38] to-[#0f3d26] text-white shadow-md shadow-primary/25 group-hover:scale-105 transition-transform">
            <Sparkles className="h-4.5 w-4.5 text-amber-400" />
          </span>
          <div className="leading-none">
            <span className="text-base font-black tracking-tight text-slate-900 block">SkillBridge</span>
            <span className="text-[8px] font-extrabold uppercase tracking-[0.15em] text-slate-400 block mt-0.5">Nigeria First</span>
          </div>
        </Link>

        {/* ── Desktop Nav ── */}
        <nav className="hidden md:flex items-center gap-0.5">
          <Link
            href="/browse"
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
              pathname === "/browse" ? "bg-primary/10 text-primary" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Search className="h-3.5 w-3.5" />
            Find a Worker
          </Link>

          {/* Services dropdown */}
          <div className="relative" ref={servRef}>
            <button
              onClick={() => setServicesOpen(v => !v)}
              className="flex items-center gap-1 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all"
            >
              Services
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${servicesOpen ? "rotate-180" : ""}`} />
            </button>
            {servicesOpen && (
              <div className="absolute top-full left-0 mt-2 w-52 rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-200/60 p-2 animate-scale-up">
                {["Plumbing", "Electrical", "Carpentry", "Cleaning", "Painting", "AC Repair", "Tailoring", "Catering"].map(s => (
                  <Link
                    key={s}
                    href={`/browse?category=${s.toLowerCase()}`}
                    className="block rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors"
                  >
                    {s}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Role-specific nav items */}
          {user?.role === "customer" && (
            <>
              <Link href="/dashboard" className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${pathname === "/dashboard" ? "bg-primary/10 text-primary" : "text-slate-600 hover:bg-slate-100"}`}>
                <Home className="h-3.5 w-3.5" /> Dashboard
              </Link>
              <Link href="/bookings" className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${pathname === "/bookings" ? "bg-primary/10 text-primary" : "text-slate-600 hover:bg-slate-100"}`}>
                <BookOpen className="h-3.5 w-3.5" /> My Bookings
              </Link>
            </>
          )}
          {user?.role === "worker" && (
            <>
              <Link href="/home" className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${pathname === "/home" ? "bg-primary/10 text-primary" : "text-slate-600 hover:bg-slate-100"}`}>
                <Briefcase className="h-3.5 w-3.5" /> Console
              </Link>
              <Link href="/requests" className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${pathname === "/requests" ? "bg-primary/10 text-primary" : "text-slate-600 hover:bg-slate-100"}`}>
                <Calendar className="h-3.5 w-3.5" /> Requests
              </Link>
            </>
          )}
          {user?.role === "admin" && (
            <Link href="/admin/dashboard" className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${pathname?.startsWith("/admin") ? "bg-primary/10 text-primary" : "text-slate-600 hover:bg-slate-100"}`}>
              <Shield className="h-3.5 w-3.5" /> Admin Portal
            </Link>
          )}
        </nav>

        {/* ── Right Actions ── */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {/* Notifications bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifDropdownOpen(v => !v)}
                  className="relative rounded-2xl border border-slate-200 bg-slate-50 p-2.5 hover:bg-slate-100 transition-colors flex items-center justify-center text-slate-600"
                  aria-label="Open notifications"
                >
                  <Bell className="h-4 w-4" />
                  {notifications.filter(n => !n.is_read).length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-black text-white">
                      {notifications.filter(n => !n.is_read).length}
                    </span>
                  )}
                </button>
                
                {notifDropdownOpen && (
                  <div className="absolute right-0 top-12 w-80 rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-200/60 p-3 z-50 animate-scale-up space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                      <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Recent Alerts</span>
                      {notifications.filter(n => !n.is_read).length > 0 && (
                        <button
                          onClick={markAllNotificationsAsRead}
                          className="text-[9px] font-black text-primary uppercase hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {notifications.length === 0 ? (
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center py-6">No notifications</p>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => {
                              if (!notif.is_read) markNotificationAsRead(notif.id);
                            }}
                            className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                              notif.is_read
                                ? "bg-white border-slate-100 text-slate-500"
                                : "bg-primary/5 border-primary/10 text-slate-800 hover:bg-primary/10"
                            }`}
                          >
                            <strong className="text-xs font-black block leading-snug">{notif.title}</strong>
                            <p className="text-[10.5px] font-semibold leading-normal mt-0.5">{notif.body}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2" ref={dropRef}>
                {/* Availability Toggle (Desktop) */}
                {user.role === "worker" && (
                  <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200/60 rounded-full px-3 py-1.5 transition-colors mr-1">
                    <span className={`h-2 w-2 rounded-full ${isAvailable ? "bg-emerald-500 animate-pulse" : "bg-slate-350"}`}></span>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider hidden lg:inline">
                      {isAvailable ? "Available" : "Offline"}
                    </span>
                    <button
                      onClick={handleToggleAvailable}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none shrink-0 ${
                        isAvailable ? "bg-primary" : "bg-slate-200"
                      }`}
                      aria-label="Toggle availability"
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        isAvailable ? "translate-x-4" : "translate-x-1"
                      }`} />
                    </button>
                  </div>
                )}

                {/* Avatar Dropdown */}
                <button
                  onClick={() => setDropdownOpen(v => !v)}
                  className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-2 py-1.5 hover:bg-slate-100 transition-colors"
                >
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10 text-primary font-black text-xs">
                  {user.full_name.charAt(0).toUpperCase()}
                </span>
                <span className="hidden sm:block text-xs font-bold text-slate-700 max-w-[120px] truncate">{user.full_name}</span>
                <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform hidden sm:block ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-5 lg:right-8 top-14 w-56 rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-200/60 p-2 z-50 animate-scale-up">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Signed in as</p>
                    <p className="text-xs font-black text-slate-800 truncate">{user.full_name}</p>
                    <span className="inline-block mt-1 rounded-full bg-primary/10 text-primary text-[9px] font-black px-2 py-0.5 uppercase tracking-wider">
                      {user.role}
                    </span>
                  </div>
                  {rolePortalLink && (
                    <Link
                      href={rolePortalLink}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 w-full rounded-xl px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors"
                    >
                      <Home className="h-3.5 w-3.5" /> My Portal
                    </Link>
                  )}
                  <Link
                    href={user.role === "worker" ? "/profile/edit" : user.role === "admin" ? "/admin/settings" : "/profile"}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 w-full rounded-xl px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors"
                  >
                    <User className="h-3.5 w-3.5" /> Profile Settings
                  </Link>
                  <button
                    onClick={() => { setDropdownOpen(false); logout(); }}
                    className="flex items-center gap-2 w-full rounded-xl px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 transition-colors mt-1 border-t border-slate-100 pt-2"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-primary hover:bg-primary-dark text-white px-4 py-2 text-xs font-black shadow-sm shadow-primary/20 transition-all flex items-center gap-1.5"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Create Account
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 md:hidden transition-colors"
            aria-label="Open menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-5 py-4 space-y-1 animate-fade-in">
          <Link href="/browse" className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
            <Search className="h-4 w-4 text-primary" /> Find a Worker
          </Link>
          {user?.role === "customer" && (
            <>
              <Link href="/dashboard" className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
                <Home className="h-4 w-4 text-primary" /> Dashboard
              </Link>
              <Link href="/bookings" className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
                <BookOpen className="h-4 w-4 text-primary" /> My Bookings
              </Link>
            </>
          )}
          {user?.role === "worker" && (
            <>
              {/* Availability Toggle (Mobile) */}
              <div className="flex items-center justify-between rounded-xl px-4 py-3 bg-slate-50 border border-slate-200/60 mb-2">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${isAvailable ? "bg-emerald-500 animate-pulse" : "bg-slate-350"}`}></span>
                  <span className="text-xs font-black text-slate-750">
                    {isAvailable ? "Online & Available" : "Offline / Silent"}
                  </span>
                </div>
                <button
                  onClick={handleToggleAvailable}
                  className={`relative inline-flex h-6.5 w-12 items-center rounded-full transition-colors focus:outline-none shrink-0 ${
                    isAvailable ? "bg-primary" : "bg-slate-200"
                  }`}
                  aria-label="Toggle availability"
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    isAvailable ? "translate-x-6" : "translate-x-1"
                  }`} />
                </button>
              </div>

              <Link href="/home" className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
                <Briefcase className="h-4 w-4 text-primary" /> Worker Console
              </Link>
              <Link href="/requests" className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
                <Calendar className="h-4 w-4 text-primary" /> Requests
              </Link>
            </>
          )}
          {user?.role === "admin" && (
            <Link href="/admin/dashboard" className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
              <Shield className="h-4 w-4 text-primary" /> Admin Portal
            </Link>
          )}

          <div className="border-t border-slate-100 pt-3 mt-2">
            {user ? (
              <button
                onClick={() => { setMobileOpen(false); logout(); }}
                className="flex items-center gap-2 w-full rounded-xl px-4 py-3 text-sm font-black text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            ) : (
              <div className="space-y-2">
                <Link href="/login" className="block text-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
                  Sign In
                </Link>
                <Link href="/register" className="block text-center rounded-xl bg-primary text-white px-4 py-3 text-sm font-black hover:bg-primary-dark">
                  Create Account
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
