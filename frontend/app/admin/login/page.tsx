"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { adminLogin, requestAdminPasswordReset, confirmAdminPasswordReset } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { Shield, KeyRound, Phone, ArrowRight, AlertTriangle, Sparkles, CheckCircle2, Lock, ArrowLeft } from "lucide-react";


export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isResetting, setIsResetting] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const cleanPhone = (val: string) => val.replace(/\D/g, "").slice(0, 11);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
      setError("Please enter a valid Nigerian phone number.");
      return;
    }
    if (!password) {
      setError("Please enter your admin credentials password.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await adminLogin(phone, password);
      setSuccess("Authentication successful! Loading Operations Control...");
      setTimeout(() => {
        login({
          id: res.user.id,
          phone: res.user.phone,
          full_name: res.user.full_name,
          role: res.user.role,
          is_onboarded: true,
        });
      }, 1000);
    } catch (err: any) {
      setError(
        err?.message || "Invalid admin credentials. Please verify your phone and password."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
      setError("Please enter a valid Nigerian phone number.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await requestAdminPasswordReset(phone);
      setSuccess(res.dev_otp ? `Verification code sent! (dev code: ${res.dev_otp})` : "Verification code sent to your registered phone.");
      setResetStep(2);
    } catch (err: any) {
      setError(err?.message || "Failed to send reset code. Verify your phone number.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode) {
      setError("Please enter the verification code.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await confirmAdminPasswordReset(phone, resetCode, newPassword);
      setSuccess("Password updated successfully! Logging you in...");
      const res = await adminLogin(phone, newPassword);
      setTimeout(() => {
        login({
          id: res.user.id,
          phone: res.user.phone,
          full_name: res.user.full_name,
          role: res.user.role,
          is_onboarded: true,
        });
      }, 1000);
    } catch (err: any) {
      setError(err?.message || "Password reset failed. Verify your code and try again.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-950 flex font-sans antialiased text-slate-200">
      {/* ── Left panel — Operations control branding ── */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-slate-900 via-slate-950 to-[#0e1626] flex-col justify-between p-12 relative overflow-hidden border-r border-slate-900">
        {/* Background accents */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 80% 20%, #f5a623 0%, transparent 50%), radial-gradient(circle at 10% 80%, #3b82f6 0%, transparent 40%)",
          }}
        />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 relative z-10">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 shadow-xl shadow-black/40">
            <Shield className="h-5 w-5 text-[#f5a623]" />
          </span>
          <div>
            <span className="text-xl font-black text-white block leading-none tracking-tight">
              SkillBridge
            </span>
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 block mt-0.5">
              Operations Control
            </span>
          </div>
        </Link>

        {/* Hero copy */}
        <div className="relative z-10 space-y-6">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/80 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#f5a623] border border-slate-800">
              <Sparkles className="h-3 w-3" /> Secure Admin Access
            </span>
            <h2 className="text-3xl font-black text-white leading-tight">
              SkillBridge<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-[#f5a623]">
                Operations Portal
              </span>
            </h2>
            <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-sm">
              Authorized personnel only. Access system-wide statistics, approve worker KYC verifications, manage service categories, and monitor active booking pipelines.
            </p>
          </div>

          {/* Quick instructions / guidelines */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 backdrop-blur-md space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">
              Access Guidelines
            </h4>
            <div className="space-y-3">
              {[
                "Password credentials are required. One-time codes are not valid for staff access.",
                "Ensure you are logging in from a registered workstation or securely configured environment.",
                "All administrative actions and configuration changes are fully logged for compliance.",
              ].map((text, idx) => (
                <div key={idx} className="flex gap-2.5 items-start">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#f5a623] mt-1.5 shrink-0" />
                  <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-[10px] text-slate-500 font-medium relative z-10">
          © 2026 SkillBridge Operations Center.
        </p>
      </div>

      {/* ── Right panel — login form ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-slate-950">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden text-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800">
                <Shield className="h-5 w-5 text-[#f5a623]" />
              </span>
              <span className="text-xl font-black text-white tracking-tight">
                SkillBridge Admin
              </span>
            </Link>
          </div>

          {!isResetting ? (
            <>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">
                  Administrative Login
                </h1>
                <p className="text-sm text-slate-400 font-medium mt-1.5">
                  Provide phone and password credentials to proceed.
                </p>
              </div>

              {/* Feedback states */}
              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 flex gap-3 text-red-400 animate-shake">
                  <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold leading-relaxed">{error}</p>
                </div>
              )}

              {success && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex gap-3 text-emerald-400 animate-fade-in">
                  <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold leading-relaxed">{success}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Phone input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">Phone Number</label>
                  <div className="relative flex items-center">
                    <div className="absolute left-0 flex items-center h-full pl-4">
                      <span className="text-xs font-black text-slate-500 border-r border-slate-800 pr-3">+234</span>
                    </div>
                    <input
                      id="admin-phone-input"
                      type="tel"
                      inputMode="numeric"
                      value={phone}
                      onChange={(e) => setPhone(cleanPhone(e.target.value))}
                      placeholder="080 1234 5678"
                      maxLength={11}
                      required
                      disabled={loading}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 py-4 pl-16 pr-4 text-sm font-semibold text-white placeholder:text-slate-600 outline-none focus:border-[#f5a623] focus:ring-2 focus:ring-[#f5a623]/10 transition-all disabled:opacity-55"
                    />
                    <Phone className="absolute right-4 h-4.5 w-4.5 text-slate-600" />
                  </div>
                </div>

                {/* Password input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 block">System Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsResetting(true);
                        setResetStep(1);
                        setError("");
                        setSuccess("");
                      }}
                      className="text-xs font-bold text-[#f5a623] hover:underline bg-transparent border-none cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      id="admin-password-input"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      disabled={loading}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 py-4 px-4 pr-12 text-sm font-semibold text-white placeholder:text-slate-600 outline-none focus:border-[#f5a623] focus:ring-2 focus:ring-[#f5a623]/10 transition-all disabled:opacity-55"
                    />
                    <Lock className="absolute right-4 h-4.5 w-4.5 text-slate-600" />
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#f5a623] text-slate-950 py-4 px-4 text-sm font-black transition-all hover:bg-[#e0931b] hover:shadow-lg hover:shadow-[#f5a623]/15 active:scale-[0.98] disabled:opacity-55"
                >
                  {loading ? "Authenticating..." : "Access Operations"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </>
          ) : (
            <>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetting(false);
                      setError("");
                      setSuccess("");
                    }}
                    className="p-1.5 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  Reset Admin Password
                </h1>
                <p className="text-sm text-slate-400 font-medium mt-1.5">
                  {resetStep === 1
                    ? "Enter your registered administrator phone number to request a reset code."
                    : "Enter the code sent to your phone and specify a new secure password."}
                </p>
              </div>

              {/* Feedback states */}
              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 flex gap-3 text-red-400 animate-shake">
                  <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold leading-relaxed">{error}</p>
                </div>
              )}

              {success && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex gap-3 text-emerald-400 animate-fade-in">
                  <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold leading-relaxed">{success}</p>
                </div>
              )}

              {resetStep === 1 ? (
                <form onSubmit={handleRequestReset} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 block">Phone Number</label>
                    <div className="relative flex items-center">
                      <div className="absolute left-0 flex items-center h-full pl-4">
                        <span className="text-xs font-black text-slate-500 border-r border-slate-800 pr-3">+234</span>
                      </div>
                      <input
                        type="tel"
                        inputMode="numeric"
                        value={phone}
                        onChange={(e) => setPhone(cleanPhone(e.target.value))}
                        placeholder="080 1234 5678"
                        maxLength={11}
                        required
                        disabled={loading}
                        className="w-full rounded-xl border border-slate-800 bg-slate-900 py-4 pl-16 pr-4 text-sm font-semibold text-white placeholder:text-slate-600 outline-none focus:border-[#f5a623] focus:ring-2 focus:ring-[#f5a623]/10 transition-all disabled:opacity-55"
                      />
                      <Phone className="absolute right-4 h-4.5 w-4.5 text-slate-600" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || phone.length < 10}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#f5a623] text-slate-950 py-4 px-4 text-sm font-black transition-all hover:bg-[#e0931b] hover:shadow-lg hover:shadow-[#f5a623]/15 active:scale-[0.98] disabled:opacity-55"
                  >
                    {loading ? "Sending Code..." : "Send Verification Code"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleConfirmReset} className="space-y-5">
                  {/* OTP Code */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 block">Verification Code</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="123456"
                      maxLength={6}
                      required
                      disabled={loading}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 py-4 px-4 text-sm font-semibold text-white placeholder:text-slate-600 outline-none focus:border-[#f5a623] focus:ring-2 focus:ring-[#f5a623]/10 transition-all disabled:opacity-55"
                    />
                  </div>

                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 block">New System Password</label>
                    <div className="relative flex items-center">
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 8 characters"
                        required
                        disabled={loading}
                        className="w-full rounded-xl border border-slate-800 bg-slate-900 py-4 px-4 pr-12 text-sm font-semibold text-white placeholder:text-slate-600 outline-none focus:border-[#f5a623] focus:ring-2 focus:ring-[#f5a623]/10 transition-all disabled:opacity-55"
                      />
                      <Lock className="absolute right-4 h-4.5 w-4.5 text-slate-600" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || resetCode.length < 6 || newPassword.length < 8}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#f5a623] text-slate-950 py-4 px-4 text-sm font-black transition-all hover:bg-[#e0931b] hover:shadow-lg hover:shadow-[#f5a623]/15 active:scale-[0.98] disabled:opacity-55"
                  >
                    {loading ? "Updating Password..." : "Update Password & Login"}
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setResetStep(1);
                      setError("");
                      setSuccess("");
                    }}
                    className="w-full py-3 text-center text-xs font-bold text-slate-400 hover:text-white transition-colors"
                  >
                    Request New Reset Code
                  </button>
                </form>
              )}
            </>
          )}

          {/* Links back to general portal */}
          <div className="text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
            >
              <KeyRound className="h-3.5 w-3.5" />
              Sign in with mobile OTP code instead
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
