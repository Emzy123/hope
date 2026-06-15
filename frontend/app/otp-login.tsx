"use client";

import { FormEvent, useState } from "react";
import { requestOtp, verifyOtp } from "@/lib/api";

export function OtpLogin() {
  const [email, setEmail] = useState("chioma@demo.skillbridge.ng");
  const [code, setCode] = useState("");
  const [fullName, setFullName] = useState("Demo Customer");
  const [message, setMessage] = useState("Check your console or email for the OTP code.");
  const [isLoading, setIsLoading] = useState(false);

  async function handleRequestOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    try {
      const result = await requestOtp(email);
      setMessage(result.detail);
    } catch {
      setMessage("Could not request OTP. Confirm the backend server is running.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyOtp() {
    setIsLoading(true);
    try {
      const result = await verifyOtp(email, code, fullName);
      setMessage(`Logged in as ${result.user.full_name || result.user.email}.`);
    } catch {
      setMessage("Could not verify OTP. Check the code and backend server.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-green-900/5">
      <h2 className="text-2xl font-black">Try email login</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">Request and verify an OTP against the Django backend.</p>
      <form className="mt-5 grid gap-3" onSubmit={handleRequestOtp}>
        <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1a5c38]" onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" type="email" value={email} />
        <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1a5c38]" onChange={(event) => setFullName(event.target.value)} placeholder="Full name" value={fullName} />
        <button className="rounded-2xl bg-[#1a5c38] px-5 py-3 text-sm font-bold text-white disabled:opacity-60" disabled={isLoading} type="submit">
          Request OTP
        </button>
      </form>
      <div className="mt-3 grid gap-3">
        <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1a5c38]" onChange={(event) => setCode(event.target.value)} placeholder="123456" value={code} />
        <button className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-bold text-slate-900 disabled:opacity-60" disabled={isLoading} onClick={handleVerifyOtp} type="button">
          Verify OTP
        </button>
      </div>
      <p className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">{message}</p>
    </div>
  );
}
