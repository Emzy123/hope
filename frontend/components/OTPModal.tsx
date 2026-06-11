"use client";

import { useState } from "react";
import { X, Mail, KeyRound, Sparkles, CheckCircle2, UserCheck } from "lucide-react";
import { requestOtp, verifyOtp } from "@/lib/api";

type OTPModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: { id: string; email: string; phone?: string | null; full_name: string; role: string }) => void;
};

const preseededAccounts = [
  { role: "customer", email: "chioma@demo.skillbridge.ng", label: "Demo Customer 1 (Active)", desc: "Chioma Okafor" },
  { role: "customer", email: "ibrahim@demo.skillbridge.ng", label: "Demo Customer 2 (New)", desc: "Ibrahim Musa" },
  { role: "worker", email: "adewale@demo.skillbridge.ng", label: "Demo Worker (Plumber)", desc: "Adewale Plumbing Pro" },
  { role: "worker", email: "zainab@demo.skillbridge.ng", label: "Demo Worker (Electrician)", desc: "Zainab Electricals" },
];

export function OTPModal({ isOpen, onClose, onLoginSuccess }: OTPModalProps) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("customer");
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  async function handleSendOTP(emailAddress: string, userRole: string) {
    setIsLoading(true);
    setIsError(false);
    setMessage("");
    try {
      const actualEmail = emailAddress || email;
      const res = await requestOtp(actualEmail);
      setStep("otp");
      setMessage(res.dev_otp ? `OTP Sent! Dev Code: ${res.dev_otp}` : res.detail);
    } catch {
      setIsError(true);
      setMessage("Failed to request OTP. Ensure your backend is running.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyOTP() {
    setIsLoading(true);
    setIsError(false);
    setMessage("");
    try {
      const res = await verifyOtp(email, otpCode, fullName || undefined, role);
      const loggedUser = {
        id: res.user.id,
        email: res.user.email,
        phone: res.user.phone,
        full_name: res.user.full_name || fullName || "Demo User",
        role: res.user.role || role,
      };

      onLoginSuccess(loggedUser);
      setIsError(false);
      setMessage("Successfully signed in!");
      setTimeout(() => {
        onClose();
        resetForm();
      }, 1000);
    } catch {
      setIsError(true);
      setMessage("Verification failed. Please double-check your code.");
    } finally {
      setIsLoading(false);
    }
  }

  function selectBypass(account: typeof preseededAccounts[number]) {
    setEmail(account.email);
    setRole(account.role);
    setFullName(account.desc);
    handleSendOTP(account.email, account.role);
  }

  function resetForm() {
    setEmail("");
    setFullName("");
    setRole("customer");
    setOtpCode("");
    setStep("email");
    setMessage("");
    setIsError(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-white/95 p-6 shadow-2xl backdrop-blur-md">

        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0f3a22]/10 text-[#0f3a22]">
              <Sparkles className="h-4.5 w-4.5 text-amber-500" />
            </span>
            <div>
              <h3 className="text-base font-black text-slate-800">Email Authentication</h3>
              <p className="text-[10px] font-medium text-slate-500">Verify with a one-time code</p>
            </div>
          </div>
          <button
            onClick={() => { onClose(); resetForm(); }}
            className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5">
          {step === "email" ? (
            <div className="grid gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1.5">Enter Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-2xl border border-slate-200 py-3 pl-10 pr-4 text-sm font-medium outline-none focus:border-[#0f3a22] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1.5">Full Name (New Accounts)</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Chioma Okafor"
                  className="w-full rounded-2xl border border-slate-200 py-3 px-4 text-sm font-medium outline-none focus:border-[#0f3a22] transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1.5">Register / Login As</label>
                <div className="grid grid-cols-2 gap-2">
                  {["customer", "worker"].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`rounded-2xl py-2 text-xs font-bold capitalize border transition-all ${
                        role === r
                          ? "bg-[#0f3a22] border-[#0f3a22] text-white"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleSendOTP(email, role)}
                disabled={isLoading || !email}
                className="w-full mt-2 rounded-2xl bg-[#0f3a22] py-3.5 text-center text-sm font-bold text-white hover:bg-[#154e2f] shadow-lg shadow-green-900/10 disabled:opacity-60 transition-all"
              >
                {isLoading ? "Requesting OTP..." : "Send Verification OTP"}
              </button>

              <div className="mt-3 border-t border-dashed border-slate-200 pt-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <UserCheck className="h-3.5 w-3.5 text-amber-600" />
                  <span className="text-[10px] font-extrabold text-amber-700 tracking-wide uppercase">Dev Bypass Credentials</span>
                </div>
                <div className="grid gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {preseededAccounts.map((acct) => (
                    <button
                      key={acct.email}
                      type="button"
                      onClick={() => selectBypass(acct)}
                      className="flex items-center justify-between text-left rounded-xl border border-amber-200/50 bg-amber-50/50 hover:bg-amber-50 p-2 text-[10px] transition-colors"
                    >
                      <div>
                        <strong className="text-slate-700 block font-bold">{acct.label}</strong>
                        <span className="text-slate-500 font-medium">{acct.desc}</span>
                      </div>
                      <span className="font-mono bg-white border border-amber-100 rounded px-1.5 py-0.5 font-bold text-amber-700">{acct.email}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <KeyRound className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800">Verify Email Address</h4>
                <p className="text-[11px] font-semibold text-slate-500 mt-1">We sent an OTP code to {email}</p>
              </div>

              <div className="relative mt-2">
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  className="w-full text-center tracking-[0.6em] font-mono text-lg font-black rounded-2xl border border-slate-200 py-3.5 outline-none focus:border-[#0f3a22] transition-colors"
                />
              </div>

              <div className="flex gap-2.5 mt-2">
                <button
                  onClick={() => setStep("email")}
                  className="w-1/3 rounded-2xl border border-slate-200 py-3.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleVerifyOTP}
                  disabled={isLoading || otpCode.length < 4}
                  className="w-2/3 rounded-2xl bg-[#0f3a22] py-3.5 text-sm font-bold text-white hover:bg-[#154e2f] shadow-lg shadow-green-900/10 disabled:opacity-60 transition-all"
                >
                  {isLoading ? "Verifying..." : "Verify Code"}
                </button>
              </div>
            </div>
          )}

          {message && (
            <div className={`mt-4 flex items-start gap-2 rounded-2xl p-3 text-xs leading-5 font-semibold ${
              isError
                ? "bg-red-50 text-red-700 border border-red-100"
                : message.includes("success")
                ? "bg-green-50 text-green-700 border border-green-100"
                : "bg-slate-50 text-slate-600 border border-slate-100"
            }`}>
              {!isError && <CheckCircle2 className="h-4.5 w-4.5 text-green-600 shrink-0 mt-0.5" />}
              <span>{message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
