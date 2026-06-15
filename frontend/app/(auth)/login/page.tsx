"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { requestOtp } from "@/lib/api";
import { Mail, ArrowRight, AlertTriangle, CheckCircle2, Sparkles, Shield, Star, Users } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      localStorage.removeItem("sb_temp_name");
      localStorage.removeItem("sb_temp_role");
      setSuccess(`Verification code sent to ${email}`);
      setTimeout(() => router.push("/verify"), 1000);
    } catch {
      setError("Could not send OTP. Please check your email address.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* ── Left panel — branding ── */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-[#0f3d26] via-[#1a5c38] to-[#0a2e1c] flex-col justify-between p-12 relative overflow-hidden">
        {/* Background accents */}
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, #f5a623 0%, transparent 50%)" }} />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full -translate-x-1/2 translate-y-1/2" />

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 relative z-10">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 border border-white/20 backdrop-blur-sm">
            <Sparkles className="h-5 w-5 text-amber-400" />
          </span>
          <div>
            <span className="text-xl font-black text-white block leading-none">SkillBridge</span>
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-primary-light block mt-0.5">Nigeria First</span>
          </div>
        </Link>

        {/* Hero copy */}
        <div className="relative z-10 space-y-6">
          <div className="space-y-3">
            <h2 className="text-3xl font-black text-white leading-tight">
              Welcome back to<br />
              <span className="text-amber-400">Nigeria&apos;s #1</span><br />
              Artisan Platform
            </h2>
            <p className="text-primary-light text-sm font-medium leading-relaxed max-w-xs">
              Sign in to book trusted skilled workers or manage your artisan profile.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Users, value: "12,000+", label: "Active Users" },
              { icon: Shield, value: "KYC", label: "Verified Workers" },
              { icon: Star, value: "4.8★", label: "Avg Rating" },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="rounded-2xl bg-white/10 border border-white/10 p-4 text-center space-y-1 backdrop-blur-sm">
                <Icon className="h-4 w-4 text-amber-400 mx-auto" />
                <p className="text-sm font-black text-white">{value}</p>
                <p className="text-[9px] text-primary-light font-semibold uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="rounded-2xl bg-white/10 border border-white/10 p-5 backdrop-blur-sm space-y-3">
            <div className="flex items-center gap-1 text-amber-400">
              {Array(5).fill(0).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-amber-400" />)}
            </div>
            <p className="text-sm text-white/85 font-medium leading-relaxed italic">
              &quot;SkillBridge paid me my rate on time, every time. No more price haggling.&quot;
            </p>
            <div>
              <p className="text-xs font-black text-white">Segun Adeleke</p>
              <p className="text-[9px] text-primary-light uppercase tracking-wider font-semibold">Certified Electrician · Ikeja</p>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-primary-light font-medium relative z-10">
          © 2026 SkillBridge Nigeria Ltd.
        </p>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
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
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sign in to your account</h1>
            <p className="text-sm text-slate-500 font-medium mt-1.5">
              Enter your email and we&apos;ll send you a verification code.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                <input
                  id="email-input"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white py-4 pl-11 pr-4 text-sm font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
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

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-dark disabled:opacity-50 py-4 text-sm font-black text-white shadow-lg shadow-primary/20 transition-all"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Sending Code...
                </span>
              ) : (
                <>Send Verification Code <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>

          {/* Create account link */}
          <div className="text-center space-y-3">
            <p className="text-sm text-slate-500 font-medium">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-black text-primary hover:text-primary-dark transition-colors">
                Create one free →
              </Link>
            </p>
            <p className="text-sm text-slate-500 font-medium">
              Want to earn as a worker?{" "}
              <Link href="/register?role=worker" className="font-black text-amber-600 hover:text-amber-700 transition-colors">
                Apply as an artisan →
              </Link>
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Secure &amp; Private</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <div className="flex items-center justify-center gap-6 text-[10px] text-slate-400 font-semibold">
            <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5 text-primary" /> KYC Verified</span>
            <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-500" /> 4.8 Rated</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Escrow Safe</span>
          </div>
        </div>
      </div>
    </div>
  );
}
