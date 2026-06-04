"use client";

import { useState } from "react";
import { X, Calendar, MapPin, Wrench, ShieldCheck, DollarSign, CreditCard, CheckCircle2 } from "lucide-react";
import { createBooking, type Worker } from "@/lib/api";
import confetti from "canvas-confetti";

type BookingModalProps = {
  isOpen: boolean;
  onClose: () => void;
  worker: Worker | null;
  onBookingSuccess: () => void;
};

export function BookingModal({ isOpen, onClose, worker, onBookingSuccess }: BookingModalProps) {
  const [jobDescription, setJobDescription] = useState("");
  const [address, setAddress] = useState("");
  const [hours, setHours] = useState(2);
  const [scheduledDate, setScheduledDate] = useState(() => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return tomorrow.toISOString().slice(0, 16);
  });
  const [checkoutStep, setCheckoutStep] = useState<"form" | "paystack" | "success">("form");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Paystack Mock Card States
  const [cardNumber, setCardNumber] = useState("4084 0840 8408 4081");
  const [expiry, setExpiry] = useState("12/29");
  const [cvv, setCvv] = useState("408");

  if (!isOpen || !worker) return null;

  const rate = Number(worker.hourly_rate);
  const subtotal = rate * hours;
  const platformFee = Math.round(subtotal * 0.12);
  const totalAmount = subtotal + platformFee;

  async function handleProceedToPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!jobDescription || !address) {
      setErrorMessage("Please fill in the job details.");
      return;
    }
    setErrorMessage("");
    setCheckoutStep("paystack");
  }

  async function handleConfirmPayment() {
    if (!worker) return;
    setIsLoading(true);
    setErrorMessage("");
    try {
      // 1. Send the booking to the real Django API if online, or simulate locally
      await createBooking({
        workerId: worker.id,
        scheduledFor: new Date(scheduledDate).toISOString(),
        quotedAmount: totalAmount.toFixed(2),
        jobDescription,
        address,
      });

      // 2. Simulate short checkout latency
      setTimeout(() => {
        setIsLoading(false);
        setCheckoutStep("success");
        onBookingSuccess();
        
        // 3. Trigger confetti!
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#0f3a22", "#f59e0b", "#10b981", "#3b82f6"]
        });
      }, 1500);

    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage("Failed to store booking on server. Verify your login and try again.");
    }
  }

  function handleCloseModal() {
    setJobDescription("");
    setAddress("");
    setHours(2);
    setCheckoutStep("form");
    setErrorMessage("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/20 bg-white/95 shadow-2xl backdrop-blur-md">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-[#0f3a22] text-white">
          <div>
            <h3 className="text-lg font-black">
              {checkoutStep === "paystack" ? "Secure Payment Gateway" : "Initiate Booking Request"}
            </h3>
            <p className="text-xs text-green-100 mt-0.5">
              Escrow Protection is Active
            </p>
          </div>
          <button 
            onClick={handleCloseModal}
            className="rounded-xl p-1.5 text-white/80 hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {checkoutStep === "form" && (
            <form onSubmit={handleProceedToPayment} className="grid gap-4">
              
              {/* Worker Quick Card */}
              <div className="flex items-center gap-3 rounded-2xl bg-[#0f3a22]/5 p-3 border border-[#0f3a22]/10">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0f3a22] font-black text-white">
                  {worker.full_name.charAt(0)}
                </span>
                <div>
                  <h4 className="text-sm font-black text-slate-800">{worker.full_name}</h4>
                  <p className="text-[10px] font-semibold text-slate-500">{worker.city} • ₦{rate.toLocaleString()}/hr</p>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1.5">Describe The Job</label>
                <div className="relative">
                  <Wrench className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="e.g. Fix leak under kitchen sink, replace copper pipe thread"
                    className="w-full min-h-20 rounded-2xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-[#0f3a22] transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1.5">Schedule Date & Time</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="datetime-local"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 py-3 pl-10 pr-3 text-xs outline-none focus:border-[#0f3a22]"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1.5">Estimated Hours</label>
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={hours}
                    onChange={(e) => setHours(Number(e.target.value))}
                    className="w-full rounded-2xl border border-slate-200 py-3 px-4 text-sm outline-none focus:border-[#0f3a22]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1.5">Job Location Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. 12 Victoria Island, Lagos"
                    className="w-full rounded-2xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-[#0f3a22] transition-colors"
                  />
                </div>
              </div>

              {/* Escrow Fee Breakdown */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 mt-2">
                <div className="flex items-center gap-1.5 mb-3">
                  <ShieldCheck className="h-4.5 w-4.5 text-[#0f3a22]" />
                  <span className="text-[10px] font-black text-[#0f3a22] uppercase tracking-wider">Escrow Price Details</span>
                </div>
                <div className="grid gap-2 text-xs font-semibold text-slate-600">
                  <div className="flex justify-between">
                    <span>Base Cost ({hours} hrs @ ₦{rate.toLocaleString()}/hr)</span>
                    <span className="text-slate-800">₦{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SkillBridge Escrow Fee (12%)</span>
                    <span className="text-slate-800">₦{platformFee.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-slate-200/60 my-1 pt-2 flex justify-between font-black text-slate-900 text-sm">
                    <span>Total Held Securely</span>
                    <span className="text-[#0f3a22]">₦{totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {errorMessage && (
                <p className="text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100">{errorMessage}</p>
              )}

              <button
                type="submit"
                className="w-full mt-2 rounded-2xl bg-[#0f3a22] py-3.5 text-center text-sm font-bold text-white hover:bg-[#154e2f] shadow-lg shadow-green-900/10 transition-all"
              >
                Proceed to Secure Payment
              </button>
            </form>
          )}

          {checkoutStep === "paystack" && (
            <div className="grid gap-5">
              {/* Paystack Widget Header Wrapper */}
              <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-3 flex gap-2">
                <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0" />
                <div>
                  <span className="text-[10px] font-black text-amber-700 uppercase tracking-wide">Paystack Integration Sandbox</span>
                  <p className="text-[9px] text-slate-600 leading-3 mt-0.5">Use the default test credit card to simulate genuine, instant escrow release events safely.</p>
                </div>
              </div>

              <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-inner">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4 text-[#0f3a22]" />
                    Credit/Debit Card
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Paystack Secure</span>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-xs outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Expiry Date</label>
                    <input
                      type="text"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">CVV</label>
                    <input
                      type="text"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-xs outline-none"
                    />
                  </div>
                </div>
              </div>

              {errorMessage && (
                <p className="text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100">{errorMessage}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setCheckoutStep("form")}
                  className="w-1/3 rounded-2xl border border-slate-200 py-3.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Edit Details
                </button>
                <button
                  onClick={handleConfirmPayment}
                  disabled={isLoading}
                  className="w-2/3 rounded-2xl bg-[#0f3a22] py-3.5 text-center text-sm font-bold text-white hover:bg-[#154e2f] disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                      Processing ₦{totalAmount.toLocaleString()}...
                    </>
                  ) : (
                    `Pay ₦${totalAmount.toLocaleString()}`
                  )}
                </button>
              </div>
            </div>
          )}

          {checkoutStep === "success" && (
            <div className="text-center py-6 grid gap-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-green-50 text-green-600 border border-green-100">
                <CheckCircle2 className="h-9 w-9 text-green-600 shrink-0" />
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-800">Booking Successfully Placed!</h4>
                <p className="text-xs font-semibold text-slate-500 mt-1 max-w-sm mx-auto">
                  An amount of <strong className="text-slate-800">₦{totalAmount.toLocaleString()}</strong> has been securely escrowed. The worker has been notified to accept the request.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs font-semibold max-w-xs mx-auto leading-5 text-slate-600">
                Go to <span className="font-extrabold text-[#0f3a22]">&quot;My Bookings&quot;</span> to track updates, transition the job status, or simulate messages!
              </div>

              <button
                onClick={handleCloseModal}
                className="w-2/3 mx-auto mt-4 rounded-2xl bg-[#0f3a22] py-3 text-sm font-bold text-white hover:bg-[#154e2f] transition-all"
              >
                Close Window
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
