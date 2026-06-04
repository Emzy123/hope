"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { AppNavbar } from "@/components/shared/AppNavbar";

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && !user.is_onboarded) {
      router.replace("/onboarding/worker");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50/50">
        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        <span className="text-xs font-black text-slate-500 mt-3 uppercase tracking-widest">Verifying Worker Session...</span>
      </div>
    );
  }

  if (!user || user.role.toLowerCase() !== "worker" || !user.is_onboarded) {
    return null; // Let redirection handle it
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <AppNavbar />
      <main className="flex-grow max-w-none w-full mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs font-black text-slate-400">
        SkillBridge Nigeria Worker Portal © 2026.
      </footer>
    </div>
  );
}
