"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, Settings, Bell, Check, AlertCircle } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

export default function AdminSettings() {
  const [commission, setCommission] = useState(12);
  const [initialCommission, setInitialCommission] = useState(12);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/admin/settings/`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setCommission(data.commission_rate);
          setInitialCommission(data.commission_rate);
        } else {
          setError("Failed to fetch settings from server.");
        }
      } catch (err) {
        setError("Network error. Failed to load settings.");
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/admin/settings/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commission_rate: commission }),
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setCommission(data.commission_rate);
        setInitialCommission(data.commission_rate);
        setSuccess(true);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.detail || "Failed to save settings changes.");
      }
    } catch (err) {
      setError("Network error. Failed to save settings changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto py-12 animate-pulse space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded-xl"></div>
        <div className="h-64 bg-slate-200 rounded-[2.5rem]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-fade-in py-6">
      <div className="space-y-1">
        <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Platform Settings</h1>
        <p className="text-xs font-semibold text-slate-500">Configure global transaction fees, customize notification alerts, and manage database seeder commands</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Commission settings */}
        <div className="rounded-[2.5rem] border border-slate-100 bg-white p-6 shadow-sm space-y-6">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-3">
            <Settings className="h-4.5 w-4.5 text-primary" />
            Global Escrow Margins
          </h3>

          <div>
            <label className="text-[10px] font-bold text-slate-600 block mb-1">Platform Commission Rate (%)</label>
            <div className="relative">
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">%</span>
              <input
                type="number"
                required
                value={commission}
                onChange={(e) => setCommission(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 py-3.5 px-4 text-xs font-semibold outline-none focus:border-primary bg-white"
              />
            </div>
            <span className="text-[9px] text-slate-400 font-semibold block mt-1 leading-normal">This percentage will be automatically held and escrowed as platform fee cut upon job completion.</span>
          </div>
        </div>

        {/* SMS template guidelines */}
        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Bell className="h-4.5 w-4.5 text-primary" />
            Notification SMS Templates
          </h3>
          
          <div className="space-y-3 font-semibold text-slate-550 leading-relaxed text-xs">
            <div className="rounded-xl border border-slate-50 p-3 bg-slate-50/20">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">OTP PIN Message Template</span>
              <code className="text-[10px] font-mono font-bold text-primary block leading-normal">&quot;Your SkillBridge verification code is [Code]. Valid for 10 minutes.&quot;</code>
            </div>
            <div className="rounded-xl border border-slate-50 p-3 bg-slate-50/20">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Booking Confirmation Template</span>
              <code className="text-[10px] font-mono font-bold text-primary block leading-normal">&quot;Hello [Name], your booking request ID [ID] has been placed successfully in escrow.&quot;</code>
            </div>
          </div>
        </div>

        {/* Action feedback */}
        {success && (
          <p className="text-xs font-bold text-green-600 bg-green-50 p-2.5 rounded-xl border border-green-100 leading-normal flex items-center gap-1.5">
            <Check className="h-4 w-4" />
            Commission adjustments saved successfully!
          </p>
        )}

        {error && (
          <p className="text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100 leading-normal flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4" />
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={saving || commission === initialCommission}
          className="w-full rounded-xl bg-primary hover:bg-primary-dark py-3.5 text-center text-xs font-black text-white shadow-md shadow-primary/10 disabled:opacity-60 transition-all"
        >
          {saving ? "Saving changes..." : "Save Settings Changes"}
        </button>

        {/* Danger zone seeders */}
        <div className="rounded-[2rem] border border-red-100 bg-red-50/20 p-6 shadow-sm space-y-3">
          <strong className="text-xs font-black text-red-700 uppercase tracking-wider flex items-center gap-1">
            <ShieldAlert className="h-4 w-4 text-red-650" />
            Danger Zone Operations
          </strong>
          
          <p className="text-[10px] font-semibold text-slate-500 leading-normal">
            Database seeding is active. To re-seed fresh, clean platform datasets, use the local terminal virtual environment python CLI script:
          </p>
          <code className="text-[9px] font-mono font-bold block bg-slate-900 text-green-300 p-2.5 rounded-xl border border-slate-950 select-all">
            python manage.py seed_demo
          </code>
        </div>

      </form>
    </div>
  );
}
