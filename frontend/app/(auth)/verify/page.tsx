"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { verifyOtp, requestOtp } from "@/lib/api";
import { KeyRound, AlertTriangle, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function VerifyPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("customer");
  const [fullName, setFullName] = useState("");
  
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [cooldown, setCooldown] = useState(60);

  const code = digits.join("");

  useEffect(() => {
    const tempEmail = localStorage.getItem("sb_temp_email");
    const tempRole = localStorage.getItem("sb_temp_role");
    const tempName = localStorage.getItem("sb_temp_name");

    if (!tempEmail) {
      router.replace("/login");
    } else {
      setEmail(tempEmail);
      setRole(tempRole || "customer");
      setFullName(tempName || "");
      setCooldown(60);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Countdown timer for Resend button
  useEffect(() => {
    if (cooldown === 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Handle digit change
  const handleChange = (index: number, val: string) => {
    const cleanVal = val.replace(/[^0-9]/g, "");
    if (!cleanVal) {
      const newDigits = [...digits];
      newDigits[index] = "";
      setDigits(newDigits);
      return;
    }

    const newDigits = [...digits];
    const digitList = cleanVal.split("").slice(0, 6 - index);
    digitList.forEach((char, idx) => {
      newDigits[index + idx] = char;
    });
    setDigits(newDigits);

    // Auto-advance focus
    const nextIndex = Math.min(index + digitList.length, 5);
    if (nextIndex !== index) {
      inputRefs.current[nextIndex]?.focus();
    }
  };

  // Handle Backspace and key navigation
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[index] === "") {
        const prevIndex = Math.max(index - 1, 0);
        const newDigits = [...digits];
        newDigits[prevIndex] = "";
        setDigits(newDigits);
        inputRefs.current[prevIndex]?.focus();
      } else {
        const newDigits = [...digits];
        newDigits[index] = "";
        setDigits(newDigits);
      }
      e.preventDefault();
    } else if (e.key === "ArrowLeft") {
      const prevIndex = Math.max(index - 1, 0);
      inputRefs.current[prevIndex]?.focus();
    } else if (e.key === "ArrowRight") {
      const nextIndex = Math.min(index + 1, 5);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  // Clipboard paste support
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6);
    if (pastedData.length > 0) {
      const newDigits = [...digits];
      pastedData.split("").forEach((char, idx) => {
        newDigits[idx] = char;
      });
      setDigits(newDigits);
      const nextFocus = Math.min(pastedData.length, 5);
      inputRefs.current[nextFocus]?.focus();
    }
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (code.length < 6) {
      setErrorMsg("Please enter the 6-digit verification code.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await verifyOtp(email, code, fullName || undefined, role || undefined);
      
      const loggedUser = {
        id: res.user.id,
        email: res.user.email,
        phone: res.user.phone,
        full_name: res.user.full_name || fullName || "Demo User",
        role: res.user.role || role,
        is_onboarded: res.user.is_onboarded,
      };

      setSuccessMsg("Successfully verified!");
      
      localStorage.removeItem("sb_temp_email");
      localStorage.removeItem("sb_temp_role");
      localStorage.removeItem("sb_temp_name");

      setTimeout(() => {
        login(loggedUser);
      }, 1000);

    } catch (err: any) {
      setErrorMsg("Incorrect code or code has expired.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    if (code.length === 6 && !loading && !successMsg) {
      handleVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const handleResend = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await requestOtp(email);
      setSuccessMsg(res.dev_otp ? `Code Resent! Dev Code: ${res.dev_otp}` : `Code resent to ${email}`);
      setCooldown(60);
    } catch {
      setErrorMsg("Resend failed. Try again.");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Back Link */}
      <Link
        href="/login"
        className="inline-flex items-center gap-1 text-[10px] font-black text-slate-400 hover:text-primary transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Change Email
      </Link>

      <div className="text-center space-y-3">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 border border-amber-100 text-amber-500">
          <KeyRound className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-black text-slate-800">Enter OTP Code</h2>
          <p className="text-[10px] font-semibold text-slate-500">
            We sent a 6-digit code to <span className="text-primary font-black">{email}</span>
          </p>
        </div>
      </div>

      <div className="space-y-4">
        
        {/* 6-box OTP inputs */}
        <div className="flex justify-between gap-2.5">
          {Array(6).fill(0).map((_, idx) => (
            <input
              key={idx}
              ref={(el) => { inputRefs.current[idx] = el; }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digits[idx]}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              onPaste={handlePaste}
              className={`w-12 h-14 text-center font-mono text-xl font-black rounded-xl border-2 outline-none transition-all duration-200 ${
                errorMsg
                  ? "border-red-300 focus:border-red-500 bg-red-50/50"
                  : successMsg
                  ? "border-green-300 focus:border-green-500 bg-green-50/50"
                  : "border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white"
              }`}
            />
          ))}
        </div>

        {/* Feedback alerts */}
        {errorMsg && (
          <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-[10px] font-extrabold text-red-600 flex items-start gap-1.5 leading-4">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="rounded-xl bg-green-50 border border-green-100 p-3 text-[10px] font-extrabold text-green-700 flex items-start gap-1.5 leading-4">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Actions Button */}
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0}
            className="w-1/3 rounded-xl border border-slate-200 py-3.5 text-xs font-black text-slate-500 hover:bg-slate-50 disabled:opacity-60 transition-colors"
          >
            {cooldown > 0 ? `Resend (${cooldown}s)` : "Resend"}
          </button>
          <button
            type="button"
            onClick={() => handleVerify()}
            disabled={loading || code.length < 6}
            className="w-2/3 rounded-xl bg-primary py-3.5 text-center text-xs font-black text-white hover:bg-primary-dark shadow-md shadow-primary/10 disabled:opacity-60 transition-all"
          >
            {loading ? "Verifying..." : "Verify Code"}
          </button>
        </div>

      </div>

    </div>
  );
}
