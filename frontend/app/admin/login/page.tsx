"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  adminLogin,
  requestAdminPasswordReset,
  confirmAdminPasswordReset,
} from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import {
  Shield,
  KeyRound,
  Mail,
  ArrowRight,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Eye,
  EyeOff,
  Fingerprint,
} from "lucide-react";

type LoginStep = "credentials" | "phrase";
type Mode = "login" | "reset";

export default function AdminLoginPage() {
  const { login } = useAuth();

  // ── Login state ──────────────────────────────────────────────
  const [step, setStep] = useState<LoginStep>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secretPhrase, setSecretPhrase] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPhrase, setShowPhrase] = useState(false);

  // ── Reset state ──────────────────────────────────────────────
  const [mode, setMode] = useState<Mode>("login");
  const [resetStep, setResetStep] = useState(1);
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // ── Shared UI state ──────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ── Helpers ───────────────────────────────────────────────────
  function clearFeedback() {
    setError("");
    setSuccess("");
  }

  function isValidEmail(val: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  }

  // ── Step 1: validate credentials, advance to Step 2 ──────────
  const handleCredentialsNext = (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();
    if (!email || !isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter your admin password.");
      return;
    }
    setStep("phrase");
  };

  // ── Step 2: submit all three fields ──────────────────────────
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();
    if (!secretPhrase.trim()) {
      setError("Please enter the secret admin phrase.");
      return;
    }

    setLoading(true);
    try {
      const res = await adminLogin(email, password, secretPhrase);
      setSuccess("Authentication successful! Loading Operations Control...");
      setTimeout(() => {
        login({
          id: res.user.id,
          email: res.user.email,
          phone: res.user.phone,
          full_name: res.user.full_name,
          role: res.user.role,
          is_onboarded: true,
        });
      }, 900);
    } catch (err: any) {
      setError(
        err?.message ||
          "Invalid credentials or secret phrase. Please verify and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Password reset ────────────────────────────────────────────
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    clearFeedback();
    try {
      await requestAdminPasswordReset(email);
      setSuccess("Verification code sent to your registered email.");
      setResetStep(2);
    } catch (err: any) {
      setError(err?.message || "Failed to send reset code. Verify your email.");
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
      setError("New password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    clearFeedback();
    try {
      await confirmAdminPasswordReset(email, resetCode, newPassword);
      setSuccess("Password updated! Logging you in...");
      const res = await adminLogin(email, newPassword, secretPhrase);
      setTimeout(() => {
        login({
          id: res.user.id,
          email: res.user.email,
          phone: res.user.phone,
          full_name: res.user.full_name,
          role: res.user.role,
          is_onboarded: true,
        });
      }, 900);
    } catch (err: any) {
      setError(err?.message || "Password reset failed. Check your code and try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Shared feedback banners ───────────────────────────────────
  const ErrorBanner = () =>
    error ? (
      <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 flex gap-3 text-red-400 animate-shake">
        <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
        <p className="text-xs font-semibold leading-relaxed">{error}</p>
      </div>
    ) : null;

  const SuccessBanner = () =>
    success ? (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex gap-3 text-emerald-400 animate-fade-in">
        <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
        <p className="text-xs font-semibold leading-relaxed">{success}</p>
      </div>
    ) : null;

  // ── Input class helper ────────────────────────────────────────
  const inputCls =
    "w-full rounded-xl border border-slate-800 bg-slate-900 py-4 pl-4 pr-12 text-sm font-semibold text-white placeholder:text-slate-600 outline-none focus:border-[#f5a623] focus:ring-2 focus:ring-[#f5a623]/10 transition-all disabled:opacity-55";

  const submitBtnCls =
    "w-full flex items-center justify-center gap-2 rounded-xl bg-[#f5a623] text-slate-950 py-4 px-4 text-sm font-black transition-all hover:bg-[#e0931b] hover:shadow-lg hover:shadow-[#f5a623]/15 active:scale-[0.98] disabled:opacity-55";

  // ── Step indicator ────────────────────────────────────────────
  const StepIndicator = () =>
    mode === "login" ? (
      <div className="flex items-center gap-2">
        {(["credentials", "phrase"] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                step === s
                  ? "w-6 bg-[#f5a623]"
                  : i === 0 && step === "phrase"
                  ? "w-2 bg-slate-600"
                  : "w-2 bg-slate-800"
              }`}
            />
          </div>
        ))}
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
          {step === "credentials" ? "Step 1 of 2" : "Step 2 of 2"}
        </span>
      </div>
    ) : null;

  return (
    <div className="min-h-screen bg-slate-950 flex font-sans antialiased text-slate-200">
      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-slate-900 via-slate-950 to-[#0e1626] flex-col justify-between p-12 relative overflow-hidden border-r border-slate-900">
        {/* Background glow accents */}
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
              SkillBridge
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-[#f5a623]">
                Operations Portal
              </span>
            </h2>
            <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-sm">
              Authorized personnel only. Three-factor verification required to
              access system-wide stats, KYC approvals, and booking pipelines.
            </p>
          </div>

          {/* Security steps */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 backdrop-blur-md space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">
              Authentication Layers
            </h4>
            <div className="space-y-3">
              {[
                {
                  icon: Mail,
                  label: "Email & Password",
                  desc: "Your registered admin account credentials.",
                },
                {
                  icon: Fingerprint,
                  label: "Secret Admin Phrase",
                  desc: "A shared passphrase known only to administrators.",
                },
                {
                  icon: Shield,
                  label: "Full Audit Trail",
                  desc: "All actions are logged for compliance review.",
                },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex gap-3 items-start">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-800 border border-slate-700">
                    <Icon className="h-3 w-3 text-[#f5a623]" />
                  </span>
                  <div>
                    <p className="text-[11px] font-black text-slate-300">{label}</p>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-[10px] text-slate-500 font-medium relative z-10">
          © 2026 SkillBridge Operations Center.
        </p>
      </div>

      {/* ── Right form panel ── */}
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

          {/* ── LOGIN FLOW ── */}
          {mode === "login" && (
            <>
              {/* ── Step 1: Credentials ── */}
              {step === "credentials" && (
                <>
                  <div className="space-y-1">
                    <StepIndicator />
                    <h1 className="text-2xl font-black text-white tracking-tight mt-2">
                      Administrative Login
                    </h1>
                    <p className="text-sm text-slate-400 font-medium">
                      Enter your admin email and system password.
                    </p>
                  </div>

                  <ErrorBanner />
                  <SuccessBanner />

                  <form onSubmit={handleCredentialsNext} className="space-y-5">
                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 block">
                        Email Address
                      </label>
                      <div className="relative flex items-center">
                        <input
                          id="admin-email-input"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="admin@skillbridge.ng"
                          required
                          disabled={loading}
                          className={inputCls}
                        />
                        <Mail className="absolute right-4 h-4.5 w-4.5 text-slate-600 pointer-events-none" />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-300 block">
                          System Password
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setMode("reset");
                            setResetStep(1);
                            clearFeedback();
                          }}
                          className="text-xs font-bold text-[#f5a623] hover:underline bg-transparent border-none cursor-pointer"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative flex items-center">
                        <input
                          id="admin-password-input"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                          required
                          disabled={loading}
                          className={inputCls}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-4 text-slate-600 hover:text-slate-400 transition-colors"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className={submitBtnCls}
                    >
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </form>
                </>
              )}

              {/* ── Step 2: Secret Phrase ── */}
              {step === "phrase" && (
                <>
                  <div className="space-y-1">
                    <StepIndicator />
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setStep("credentials");
                          clearFeedback();
                        }}
                        className="p-1.5 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-colors"
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </button>
                      <h1 className="text-2xl font-black text-white tracking-tight">
                        Secret Admin Phrase
                      </h1>
                    </div>
                    <p className="text-sm text-slate-400 font-medium pl-1">
                      Enter the confidential passphrase issued to administrators.
                    </p>
                  </div>

                  {/* Context pill showing who we're logging in */}
                  <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3 flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-[#f5a623]">
                      <Mail className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Signing in as
                      </p>
                      <p className="text-xs font-semibold text-white truncate">{email}</p>
                    </div>
                  </div>

                  <ErrorBanner />
                  <SuccessBanner />

                  <form onSubmit={handleFinalSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 block">
                        Admin Secret Phrase
                      </label>
                      <div className="relative flex items-center">
                        <input
                          id="admin-secret-phrase-input"
                          type={showPhrase ? "text" : "password"}
                          value={secretPhrase}
                          onChange={(e) => setSecretPhrase(e.target.value)}
                          placeholder="Enter the secret admin phrase…"
                          required
                          disabled={loading}
                          autoFocus
                          className={inputCls}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPhrase((v) => !v)}
                          className="absolute right-4 text-slate-600 hover:text-slate-400 transition-colors"
                          tabIndex={-1}
                        >
                          {showPhrase ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium pl-1">
                        This phrase is separate from your password. Contact your platform administrator if you don't have it.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !secretPhrase.trim()}
                      className={submitBtnCls}
                    >
                      {loading ? "Authenticating…" : "Access Operations"}
                      <Lock className="h-4 w-4" />
                    </button>
                  </form>
                </>
              )}
            </>
          )}

          {/* ── RESET FLOW ── */}
          {mode === "reset" && (
            <>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setStep("credentials");
                      setResetStep(1);
                      clearFeedback();
                    }}
                    className="p-1.5 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  Reset Admin Password
                </h1>
                <p className="text-sm text-slate-400 font-medium mt-1.5 pl-1">
                  {resetStep === 1
                    ? "Enter your registered administrator email to receive a reset code."
                    : "Enter the code sent to your email and your new password."}
                </p>
              </div>

              <ErrorBanner />
              <SuccessBanner />

              {resetStep === 1 ? (
                <form onSubmit={handleRequestReset} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 block">
                      Email Address
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@skillbridge.ng"
                        required
                        disabled={loading}
                        className={inputCls}
                      />
                      <Mail className="absolute right-4 h-4.5 w-4.5 text-slate-600 pointer-events-none" />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !email}
                    className={submitBtnCls}
                  >
                    {loading ? "Sending Code…" : "Send Verification Code"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleConfirmReset} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 block">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={resetCode}
                      onChange={(e) =>
                        setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      placeholder="123456"
                      maxLength={6}
                      required
                      disabled={loading}
                      className={inputCls.replace("pr-12", "pr-4")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 block">
                      New System Password
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 8 characters"
                        required
                        disabled={loading}
                        className={inputCls}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-4 text-slate-600 hover:text-slate-400 transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={
                      loading || resetCode.length < 6 || newPassword.length < 8
                    }
                    className={submitBtnCls}
                  >
                    {loading ? "Updating Password…" : "Update Password & Login"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setResetStep(1);
                      clearFeedback();
                    }}
                    className="w-full py-3 text-center text-xs font-bold text-slate-400 hover:text-white transition-colors"
                  >
                    Request New Reset Code
                  </button>
                </form>
              )}
            </>
          )}

          {/* Link back to public portal */}
          <div className="text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
            >
              <KeyRound className="h-3.5 w-3.5" />
              Sign in with email OTP code instead
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
