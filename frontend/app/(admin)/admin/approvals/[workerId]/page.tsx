"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL, type Worker } from "@/lib/api";
import { ChevronLeft, User, ShieldCheck, MapPin, Award, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

export default function WorkerApprovalDetail({ params }: { params: { workerId: string } }) {
  const router = useRouter();
  const [worker, setWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [actionDone, setActionDone] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [rejectReason, setRejectReason] = useState("ID document unclear");
  const [showRejectForm, setShowRejectForm] = useState(false);

  useEffect(() => {
    async function loadWorker() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/workers/`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          const found = (data.results || []).find((w: Worker) => w.id === params.workerId);
          if (found) {
            setWorker(found);
          } else {
            throw new Error("Not found");
          }
        }
      } catch {
        // Fallbacks
        setWorker({
          id: params.workerId,
          full_name: "Tunde Cleaners",
          bio: "Deep home and office disinfection cleaning specialist.",
          city: "Lagos",
          state: "Lagos",
          hourly_rate: 5000,
          rating_avg: 4.9,
          rating_count: 14,
          is_available: true,
          is_approved: false
        });
      } finally {
        setLoading(false);
      }
    }
    loadWorker();
  }, [params.workerId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 animate-pulse space-y-6">
        <div className="h-10 w-24 bg-slate-200 rounded-xl"></div>
        <div className="h-60 bg-slate-200 rounded-[2.5rem]"></div>
      </div>
    );
  }

  if (!worker) return null;

  const handleDecision = async (decision: "approve" | "reject") => {
    setActionDone(true);
    setFeedbackMsg("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/workers/${params.workerId}/${decision}/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          reason: rejectReason
        })
      });
      if (res.ok) {
        setFeedbackMsg(decision === "approve" ? "Worker application approved successfully!" : "Worker application rejected.");
        setTimeout(() => {
          router.replace("/admin/approvals");
        }, 1500);
      } else {
        const errData = await res.json().catch(() => ({}));
        setFeedbackMsg(`Error: ${errData.detail || "Action failed."}`);
        setActionDone(false);
      }
    } catch {
      setFeedbackMsg("Network error. Failed to execute decision.");
      setActionDone(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      
      {/* Back Header */}
      <Link 
        href="/admin/approvals"
        className="inline-flex items-center gap-1 text-xs font-black text-slate-500 hover:text-primary transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Approvals registry
      </Link>

      <div className="grid gap-8 lg:grid-cols-3 items-start">
        
        {/* LEFT COLUMN: WORKER SPEC DETAILS */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Info Card */}
          <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-black text-lg">
                {worker.full_name.charAt(0)}
              </div>
              
              <div>
                <strong className="text-sm font-black text-slate-800 block leading-tight">{worker.full_name}</strong>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase mt-1 block flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  {worker.city}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 font-semibold italic leading-normal border-t border-slate-50 pt-3">
              &quot;{worker.bio || "No bio description provided."}&quot;
            </p>
          </div>

          {/* Identity NIN slip card mockup */}
          <div className="rounded-[2rem] border border-slate-100 bg-white p-6 space-y-4 shadow-sm">
            <h3 className="text-xs font-black text-slate-850 uppercase tracking-wider">Identity Document (NIN slip)</h3>
            
            <div className="h-44 rounded-2xl border border-slate-200 bg-slate-50 relative flex items-center justify-center overflow-hidden">
              <div className="text-center space-y-2 z-10">
                <User className="h-8 w-8 text-primary mx-auto" />
                <strong className="text-[10px] font-black text-slate-800 block">NIN Slip Preview Box</strong>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">ID Ref: NIN-840840-LGS</span>
              </div>
              <div className="absolute inset-0 bg-primary/5"></div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: DECISIONS */}
        <aside className="rounded-[2.5rem] border border-slate-100 bg-white p-6 shadow-md space-y-6">
          <div className="space-y-1.5 border-b border-slate-50 pb-4">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">KYC Level 1 Application</span>
            <strong className="text-sm font-black text-slate-800 block leading-tight">Audit Checklist Decisions</strong>
          </div>

          {feedbackMsg && (
            <div className="rounded-xl bg-green-50 border border-green-100 p-3 text-[10px] font-extrabold text-green-700 leading-normal flex items-start gap-1.5 animate-scale-up">
              <CheckCircle2 className="h-4.5 w-4.5 text-green-600 shrink-0" />
              <span>{feedbackMsg}</span>
            </div>
          )}

          {!actionDone && (
            <div className="space-y-3">
              
              <button
                onClick={() => handleDecision("approve")}
                className="w-full rounded-2xl bg-primary hover:bg-primary-dark py-3.5 text-center text-xs font-black text-white shadow-md shadow-primary/10 flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="h-4.5 w-4.5" />
                Approve Worker
              </button>

              <button
                onClick={() => setShowRejectForm(!showRejectForm)}
                className="w-full rounded-2xl border border-red-200 hover:bg-red-50 py-3.5 text-center text-xs font-black text-red-650 transition-all flex items-center justify-center gap-1.5"
              >
                <XCircle className="h-4.5 w-4.5" />
                Reject Application
              </button>

              {showRejectForm && (
                <div className="space-y-2 border-t border-slate-50 pt-4 animate-fade-in">
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Rejection Reason</label>
                  <select
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-2.5 outline-none bg-white"
                  >
                    <option value="ID document unclear">ID document unclear</option>
                    <option value="Unable to verify identity">Unable to verify identity</option>
                    <option value="Incomplete profile bio details">Incomplete profile bio details</option>
                    <option value="Duplicate account profile">Duplicate account profile</option>
                  </select>
                  <button
                    onClick={() => handleDecision("reject")}
                    className="w-full rounded-xl bg-red-650 hover:opacity-90 py-2.5 text-center text-[10px] font-black text-white uppercase tracking-wider shadow-md"
                  >
                    Confirm Rejection
                  </button>
                </div>
              )}

            </div>
          )}

        </aside>

      </div>

    </div>
  );
}
