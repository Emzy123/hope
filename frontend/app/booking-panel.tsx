"use client";

import { FormEvent, useMemo, useState } from "react";
import { createBooking, type Worker } from "@/lib/api";

type BookingPanelProps = {
  workers: Worker[];
};

export function BookingPanel({ workers }: BookingPanelProps) {
  const firstWorkerId = workers[0]?.id ?? "";
  const [workerId, setWorkerId] = useState(firstWorkerId);
  const [jobDescription, setJobDescription] = useState("Fix leaking kitchen sink");
  const [address, setAddress] = useState("12 Demo Street, Lagos");
  const [scheduledFor, setScheduledFor] = useState(() => {
    const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
  });
  const [quotedAmount, setQuotedAmount] = useState("12000.00");
  const [message, setMessage] = useState("Log in with OTP first, then create a booking.");
  const [isLoading, setIsLoading] = useState(false);

  const selectedWorker = useMemo(() => workers.find((worker) => worker.id === workerId), [workerId, workers]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    try {
      const result = await createBooking({
        workerId,
        scheduledFor: new Date(scheduledFor).toISOString(),
        quotedAmount,
        jobDescription,
        address,
      });
      setMessage(`Booking created for ${result.booking.worker_name || selectedWorker?.full_name || "worker"}. Status: ${result.booking.status}.`);
    } catch {
      setMessage("Could not create booking. Verify OTP login first and confirm the backend is running.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-green-900/5">
      <h2 className="text-2xl font-black">Create a booking</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">Submit a real booking request to the Django API using the selected worker.</p>
      <form className="mt-5 grid gap-3" onSubmit={handleSubmit}>
        <select className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1a5c38]" onChange={(event) => setWorkerId(event.target.value)} value={workerId}>
          {workers.map((worker) => (
            <option key={worker.id} value={worker.id}>{worker.full_name} — ₦{worker.hourly_rate.toLocaleString()}/hr</option>
          ))}
        </select>
        <textarea className="min-h-24 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1a5c38]" onChange={(event) => setJobDescription(event.target.value)} placeholder="Job description" value={jobDescription} />
        <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1a5c38]" onChange={(event) => setAddress(event.target.value)} placeholder="Address" value={address} />
        <div className="grid gap-3 sm:grid-cols-2">
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1a5c38]" onChange={(event) => setScheduledFor(event.target.value)} type="datetime-local" value={scheduledFor} />
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1a5c38]" onChange={(event) => setQuotedAmount(event.target.value)} placeholder="Quoted amount" value={quotedAmount} />
        </div>
        <button className="rounded-2xl bg-[#1a5c38] px-5 py-3 text-sm font-bold text-white disabled:opacity-60" disabled={isLoading || !workerId} type="submit">
          Create booking
        </button>
      </form>
      <p className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">{message}</p>
    </div>
  );
}
