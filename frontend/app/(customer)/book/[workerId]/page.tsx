"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getWorkers, createBooking, initiatePayment, simulatePaymentSuccess, type Worker } from "@/lib/api";
import { Calendar as CalendarIcon, MapPin, Wrench, ShieldCheck, CreditCard, ChevronLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";

export default function BookWorker({ params }: { params: { workerId: string } }) {
  const router = useRouter();
  
  const [worker, setWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Wizard state
  const [step, setStep] = useState(1);
  const [jobDescription, setJobDescription] = useState("");
  const [address, setAddress] = useState("");
  const [scheduledDate, setScheduledDate] = useState(() => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return tomorrow.toISOString().slice(0, 10);
  });
  const [scheduledTime, setScheduledTime] = useState("10:00");
  const [estimatedHours, setEstimatedHours] = useState(2);
  const [isPaying, setIsPaying] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function loadWorker() {
      try {
        const res = await getWorkers();
        const found = res.results.find((w) => w.id === params.workerId);
        if (found) {
          setWorker(found);
        } else {
          throw new Error("Worker profile not found");
        }
      } catch {
        // Mock fallback
        setWorker({ id: params.workerId, full_name: "Adewale Plumbing Pro", bio: "Urgent plumbing and leak repairs.", city: "Lagos", state: "Lagos", hourly_rate: 6500, rating_avg: 4.8, rating_count: 42, is_available: true, is_approved: true });
      } finally {
        setLoading(false);
      }
    }
    loadWorker();
  }, [params.workerId]);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto py-12 animate-pulse space-y-6">
        <div className="h-10 bg-slate-200 rounded-xl"></div>
        <div className="h-40 bg-slate-200 rounded-[2rem]"></div>
      </div>
    );
  }

  if (!worker) return null;

  const rate = Number(worker.hourly_rate);
  const subtotal = rate * estimatedHours;
  const platformFee = Math.round(subtotal * 0.12);
  const totalAmount = subtotal + platformFee;

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => s - 1);

  const handleConfirmAndPay = async () => {
    setIsPaying(true);
    setErrorMsg("");

    try {
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}:00`);
      
      // Save booking in real backend
      const bookingRes = await createBooking({
        workerId: worker.id,
        scheduledFor: scheduledDateTime.toISOString(),
        quotedAmount: totalAmount.toFixed(2),
        jobDescription,
        address,
      });

      const bookingId = bookingRes.booking.id;

      // Initiate payment
      const paymentRes = await initiatePayment(bookingId);

      if (paymentRes.is_mock) {
        // Automatically simulate success in mock/sandbox environment
        await simulatePaymentSuccess(bookingId, paymentRes.paystack_reference);

        // Confetti splash
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#1a5c38", "#f5a623", "#16a34a", "#3b82f6"]
        });

        setStep(4);
      } else {
        // Redirect browser to Paystack checkout page
        window.location.href = paymentRes.authorization_url;
      }
    } catch (err: any) {
      setErrorMsg("Failed to initiate secure escrow hold. Ensure you are signed in.");
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-fade-in py-6">
      
      {/* Wizard Progress header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-[9px] font-black uppercase text-slate-400 tracking-wider">
          <span>Booking Wizard</span>
          <span>Step {step} of 4</span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* STEP 1: JOB DETAILS */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="text-center space-y-1">
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-wider">Job Details</h2>
            <p className="text-[10px] font-semibold text-slate-500">Provide details of work required to be completed</p>
          </div>

          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-1">
            <strong className="text-xs font-black text-slate-850 block">{worker.full_name}</strong>
            <span className="text-[10px] text-slate-400 font-bold block uppercase">{worker.city} • ₦{rate.toLocaleString()}/hr</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-1">Describe The Job</label>
              <div className="relative">
                <Wrench className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                <textarea
                  required
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="e.g. Repair bathroom tap leakage, bring replacement washers..."
                  className="w-full min-h-20 rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-xs font-semibold outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-1">Job Location Address</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 12 Adeola St, Victoria Island, Lagos"
                  className="w-full rounded-xl border border-slate-200 py-3.5 pl-10 pr-4 text-xs font-semibold outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleNext}
            disabled={!jobDescription || !address}
            className="w-full rounded-xl bg-primary hover:bg-primary-dark py-3.5 text-xs font-black text-white transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            Continue to Schedule
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* STEP 2: SCHEDULE */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="text-center space-y-1">
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-wider">Project Schedule</h2>
            <p className="text-[10px] font-semibold text-slate-500">Pick comfortable date and estimated project hours</p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">Target Date</label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-xs font-semibold outline-none focus:border-primary bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">Time Slot</label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-3 px-4 text-xs font-semibold outline-none focus:border-primary bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-1">Estimated Hours</label>
              <input
                type="number"
                min={1}
                max={24}
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 py-3.5 px-4 text-xs font-semibold outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleBack}
              className="w-1/3 rounded-xl border border-slate-200 py-3.5 text-xs font-black text-slate-500 hover:bg-slate-50"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              className="w-2/3 rounded-xl bg-primary hover:bg-primary-dark py-3.5 text-xs font-black text-white transition-all flex items-center justify-center gap-1.5"
            >
              Review Booking
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: REVIEW & CONFIRM */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="text-center space-y-1">
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-wider">Review Booking</h2>
            <p className="text-[10px] font-semibold text-slate-500">Confirm project details and pricing specifications before payment</p>
          </div>

          {/* Pricing summary list */}
          <div className="rounded-3xl border border-slate-100 bg-white p-5 space-y-4 shadow-sm">
            <div className="grid gap-2.5 text-xs font-semibold text-slate-500">
              <div className="flex justify-between">
                <span>Artisan Name:</span>
                <span className="text-slate-800 font-bold">{worker.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span>Service:</span>
                <span className="text-slate-800 font-bold">Plumbing repair</span>
              </div>
              <div className="flex justify-between">
                <span>Location:</span>
                <span className="text-slate-800 font-bold">{address}</span>
              </div>
              <div className="flex justify-between">
                <span>Timeline:</span>
                <span className="text-slate-800 font-bold">{scheduledDate} @ {scheduledTime} ({estimatedHours} hrs)</span>
              </div>
              
              <div className="border-t border-slate-50 pt-2.5 space-y-2">
                <div className="flex justify-between text-[11px]">
                  <span>Base artisan rates:</span>
                  <span className="text-slate-800 font-black">₦{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>SkillBridge Fee (12%):</span>
                  <span className="text-slate-800 font-black">₦{platformFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs font-black text-slate-900 border-t border-slate-100 pt-2.5">
                  <span>Total escrow hold:</span>
                  <span className="text-primary font-black text-sm">₦{totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Escrow note warning banner */}
          <div className="rounded-2xl bg-amber-50/50 border border-amber-100 p-4 flex gap-2.5">
            <ShieldCheck className="h-5 w-5 text-accent shrink-0" />
            <div>
              <span className="text-[10px] font-black text-amber-700 uppercase tracking-wide">Secure Escrow Routing</span>
              <p className="text-[9px] text-slate-500 leading-3.5 mt-0.5">Your payment is held safely in escrow. Funds will be released only after you verify that the artisan successfully delivered the project.</p>
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100">{errorMsg}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleBack}
              disabled={isPaying}
              className="w-1/3 rounded-xl border border-slate-200 py-3.5 text-xs font-black text-slate-500 hover:bg-slate-50"
            >
              Back
            </button>
            <button
              onClick={handleConfirmAndPay}
              disabled={isPaying}
              className="w-2/3 rounded-xl bg-primary hover:bg-primary-dark py-3.5 text-center text-xs font-black text-white shadow-md shadow-primary/10 flex items-center justify-center gap-1.5"
            >
              {isPaying ? "Processing..." : `Confirm & Pay ₦${totalAmount.toLocaleString()}`}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: SUCCESS */}
      {step === 4 && (
        <div className="text-center py-8 space-y-6 animate-scale-up">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[2rem] bg-green-50 text-green-600 border border-green-100">
            <CheckCircle2 className="h-9 w-9 text-green-600" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-lg font-black text-slate-800">Booking Confirmed!</h2>
            <p className="text-xs font-semibold text-slate-500 leading-relaxed max-w-sm mx-auto">
              Your payment of <strong className="text-slate-800">₦{totalAmount.toLocaleString()}</strong> has been securely held in Paystack escrow. Zainab has been notified to start the project.
            </p>
          </div>

          <div className="flex flex-col gap-2 max-w-xs mx-auto pt-4">
            <Link
              href="/dashboard"
              className="rounded-2xl bg-primary hover:bg-primary-dark py-3 text-center text-xs font-black text-white"
            >
              Track booking dashboard
            </Link>
            <Link
              href="/browse"
              className="rounded-2xl border border-slate-200 py-3 text-center text-xs font-black text-slate-600 hover:bg-slate-50"
            >
              Browse more services
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}
