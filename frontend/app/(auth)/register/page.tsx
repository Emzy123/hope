"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { requestOtp } from "@/lib/api";
import {
  User, Mail, ArrowRight, AlertTriangle, CheckCircle2,
  Sparkles, Shield, Briefcase, Star, UserCheck
} from "lucide-react";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get("role") === "worker" ? "worker" : "customer";

  const [role, setRole] = useState<"customer" | "worker">(defaultRole);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || fullName.trim().length < 2) {
      setError("Please enter your full name (at least 2 characters).");
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await requestOtp(email);
      localStorage.setItem("sb_temp_email", email);
      localStorage.setItem("sb_temp_name", fullName.trim());
      localStorage.setItem("sb_temp_role", role);
      setSuccess(res.dev_otp ? `OTP sent! (dev: ${res.dev_otp})` : `Verification code sent to ${email}`);
      setTimeout(() => router.push("/verify"), 1000);
    } catch {
      setError("Could not send OTP. Please check your email and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* ── Left branding ── */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-[#0f3d26] via-[#1a5c38] to-[#0a2e1c] flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 80%, #f5a623 0%, transparent 50%)" }} />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full translate-x-1/2 -translate-y-1/2" />

        <Link href="/" className="flex items-center gap-3 relative z-10">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 border border-white/20">
            <Sparkles className="h-5 w-5 text-amber-400" />
          </span>
          <div>
            <span className="text-xl font-black text-white block leading-none">SkillBridge</span>
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-primary-light block mt-0.5">Nigeria First</span>
          </div>
        </Link>

        <div className="relative z-10 space-y-6">
          <div className="space-y-3">
            <h2 className="text-3xl font-black text-white leading-tight">
              Join Nigeria&apos;s<br />
              <span className="text-amber-400">Fastest Growing</span><br />
              Artisan Network
            </h2>
            <p className="text-primary-light text-sm font-medium leading-relaxed max-w-xs">
              Create your free account in minutes and start booking or earning today.
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-3">
            {[
              { icon: Shield, text: "Safe escrow payments — funds protected until job done" },
              { icon: Star, text: "Transparent reviews build your reputation automatically" },
              { icon: UserCheck, text: "KYC verification gives customers instant trust in you" },
              { icon: Briefcase, text: "Workers set their own rates, no price wars" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-white/15">
                  <Icon className="h-3.5 w-3.5 text-amber-400" />
                </span>
                <p className="text-sm text-white/80 font-medium leading-5">{text}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-white/10 border border-white/10 p-5 space-y-2 backdrop-blur-sm">
            <p className="text-xs font-black text-amber-400 uppercase tracking-wider">Already on SkillBridge</p>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-black text-white">12K+</p>
                <p className="text-[9px] text-primary-light uppercase tracking-wider font-semibold">Users</p>
              </div>
              <div className="h-10 w-px bg-white/20" />
              <div className="text-center">
                <p className="text-2xl font-black text-white">850+</p>
                <p className="text-[9px] text-primary-light uppercase tracking-wider font-semibold">Artisans</p>
              </div>
              <div className="h-10 w-px bg-white/20" />
              <div className="text-center">
                <p className="text-2xl font-black text-white">60+</p>
                <p className="text-[9px] text-primary-light uppercase tracking-wider font-semibold">Services</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-primary-light font-medium relative z-10">
          © 2026 SkillBridge Nigeria Ltd.
        </p>
      </div>

      {/* ── Right: form ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-7">
          {/* Mobile logo */}
          <div className="lg:hidden text-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary">
                <Sparkles className="h-5 w-5 text-amber-400" />
              </span>
              <span className="text-xl font-black text-primary">SkillBridge</span>
            </Link>
          </div>

          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create your account</h1>
            <p className="text-sm text-slate-500 font-medium mt-1.5">
              Free to join. No credit card required.
            </p>
          </div>

          {/* Role toggle */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">I want to…</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole("customer")}
                className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all ${
                  role === "customer"
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <User className={`h-6 w-6 ${role === "customer" ? "text-primary" : "text-slate-400"}`} />
                <div>
                  <p className={`text-xs font-black ${role === "customer" ? "text-primary" : "text-slate-700"}`}>Hire Workers</p>
                  <p className="text-[9px] text-slate-400 font-medium mt-0.5">Book skilled artisans</p>
                </div>
                {role === "customer" && (
                  <span className="rounded-full bg-primary text-white text-[9px] font-black px-2 py-0.5">Selected</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setRole("worker")}
                className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all ${
                  role === "worker"
                    ? "border-amber-500 bg-amber-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <Briefcase className={`h-6 w-6 ${role === "worker" ? "text-amber-600" : "text-slate-400"}`} />
                <div>
                  <p className={`text-xs font-black ${role === "worker" ? "text-amber-700" : "text-slate-700"}`}>Offer Services</p>
                  <p className="text-[9px] text-slate-400 font-medium mt-0.5">Earn as an artisan</p>
                </div>
                {role === "worker" && (
                  <span className="rounded-full bg-amber-500 text-white text-[9px] font-black px-2 py-0.5">Selected</span>
                )}
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                <input
                  id="full-name-input"
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Chioma Okafor"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white py-4 pl-11 pr-4 text-sm font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                <input
                  id="email-register-input"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white py-4 pl-11 pr-4 text-sm font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
              <p className="text-[10px] text-slate-400 font-medium">We&apos;ll send a one-time code to verify your email.</p>
            </div>

            {/* Error / success */}
            {error && (
              <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 p-3.5 text-xs font-semibold text-red-600">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}
            {success && (
              <div className="flex items-start gap-2.5 rounded-xl bg-green-50 border border-green-100 p-3.5 text-xs font-semibold text-green-700">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                {success}
              </div>
            )}

            {/* Terms */}
            <p className="text-[10px] text-slate-400 font-medium leading-4">
              By creating an account, you agree to our{" "}
              <Link href="#" className="text-primary font-bold hover:underline">Terms of Service</Link>{" "}
              and{" "}
              <Link href="#" className="text-primary font-bold hover:underline">Privacy Policy</Link>.
            </p>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !fullName.trim() || !email}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-dark disabled:opacity-50 py-4 text-sm font-black text-white shadow-lg shadow-primary/20 transition-all"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Sending Code...
                </span>
              ) : (
                <>Create Account &amp; Verify <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 font-medium">
            Already have an account?{" "}
            <Link href="/login" className="font-black text-primary hover:text-primary-dark transition-colors">
              Sign in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterContent />
    </Suspense>
  );
}
