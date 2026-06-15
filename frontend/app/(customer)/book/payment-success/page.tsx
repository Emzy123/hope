"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { verifyPayment } from "@/lib/api";
import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";

/**
 * /book/payment-success
 * Paystack redirects here after checkout with:
 *   ?reference=<paystack_reference>&trxref=<same_reference>
 *
 * We also pass booking_id in the callback URL we build.
 * This page calls the backend to verify the payment, then shows
 * a success or failure state.
 */
export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference") || searchParams.get("trxref") || "";
  const bookingId = searchParams.get("booking_id") || "";

  const [status, setStatus] = useState<"verifying" | "success" | "failed">("verifying");
  const [errorDetail, setErrorDetail] = useState("");

  useEffect(() => {
    if (!reference) {
      setErrorDetail("No payment reference found in the URL. Please check your bookings.");
      setStatus("failed");
      return;
    }

    let cancelled = false;

    async function verify() {
      try {
        const res = await verifyPayment(reference);
        if (cancelled) return;

        if (res.status === "success") {
          setStatus("success");
          confetti({
            particleCount: 160,
            spread: 80,
            origin: { y: 0.6 },
            colors: ["#1a5c38", "#f5a623", "#16a34a", "#3b82f6"],
          });
        } else {
          setStatus("failed");
          setErrorDetail("Payment was not completed. You have not been charged.");
        }
      } catch (err: any) {
        if (cancelled) return;
        setStatus("failed");
        setErrorDetail(
          err?.message || "Could not verify your payment. Please check your bookings or contact support."
        );
      }
    }

    verify();
    return () => { cancelled = true; };
  }, [reference]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Verifying state */}
        {status === "verifying" && (
          <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-10 text-center space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[2rem] bg-primary/5">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-800">Confirming Payment…</h1>
              <p className="text-xs text-slate-500 font-medium mt-1.5">
                We're verifying your payment with Paystack. This takes just a moment.
              </p>
            </div>
          </div>
        )}

        {/* Success state */}
        {status === "success" && (
          <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-10 text-center space-y-6 animate-scale-up">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[2rem] bg-green-50 border border-green-100">
              <CheckCircle2 className="h-9 w-9 text-green-600" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-black text-slate-800">Booking Confirmed!</h1>
              <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                Your payment has been verified and held securely in escrow.
                The artisan has been notified and will confirm the booking shortly.
              </p>
            </div>

            {/* Escrow info pill */}
            <div className="rounded-2xl bg-green-50 border border-green-100 px-4 py-3 text-xs font-semibold text-green-800 leading-relaxed">
              Funds will only be released to the artisan after you confirm
              that the job has been completed to your satisfaction.
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <Link
                href={bookingId ? `/bookings/${bookingId}` : "/bookings"}
                className="rounded-2xl bg-primary hover:bg-primary-dark py-3.5 text-center text-xs font-black text-white transition-all shadow-md shadow-primary/10"
              >
                Track My Booking
              </Link>
              <Link
                href="/browse"
                className="rounded-2xl border border-slate-200 py-3.5 text-center text-xs font-black text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Browse More Services
              </Link>
            </div>
          </div>
        )}

        {/* Failed state */}
        {status === "failed" && (
          <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-10 text-center space-y-6 animate-scale-up">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[2rem] bg-red-50 border border-red-100">
              <AlertTriangle className="h-9 w-9 text-red-500" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-black text-slate-800">Payment Unsuccessful</h1>
              <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                {errorDetail || "Your payment could not be confirmed. You have not been charged."}
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <Link
                href="/bookings"
                className="rounded-2xl bg-primary hover:bg-primary-dark py-3.5 text-center text-xs font-black text-white transition-all"
              >
                View My Bookings
              </Link>
              <Link
                href="/browse"
                className="rounded-2xl border border-slate-200 py-3.5 text-center text-xs font-black text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Go Back to Browse
              </Link>
            </div>

            <p className="text-[10px] text-slate-400 font-medium">
              If you were charged and this is an error, please contact support with reference:{" "}
              <span className="font-black text-slate-600 break-all">{reference || "N/A"}</span>
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
