"use client";

import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { User, ShieldAlert, Phone, Camera, Bell, AlertCircle, Check } from "lucide-react";
import { updateMyProfile } from "@/lib/api";

export default function CustomerProfileSettings() {
  const { user, refreshSession } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [smsNotify, setSmsNotify] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setErrorMsg("");

    try {
      await updateMyProfile({ full_name: fullName });
      await refreshSession();
      setSuccess(true);
    } catch (err: any) {
      setErrorMsg("Failed to update profile settings. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-fade-in py-6">
      <div className="space-y-1">
        <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Account Settings</h1>
        <p className="text-xs font-semibold text-slate-500">Edit legal contact profile names and notifications templates preferences</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Profile Card details */}
        <div className="rounded-[2.5rem] border border-slate-100 bg-white p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-4 border-b border-slate-50 pb-4">
            <div className="relative h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-slate-100">
              <User className="h-6 w-6 text-primary" />
              <span className="absolute bottom-0 right-0 h-5 w-5 rounded-lg bg-primary flex items-center justify-center text-white border border-white cursor-pointer hover:scale-105 transition-transform">
                <Camera className="h-3 w-3" />
              </span>
            </div>
            <div>
              <strong className="text-sm font-black text-slate-800 block leading-tight">{user?.full_name}</strong>
              <span className="text-[9px] text-slate-400 font-extrabold uppercase mt-1 block tracking-wider">Level 1 Authenticated</span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-1">Legal Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-3.5 px-4 text-xs font-semibold outline-none focus:border-primary bg-white"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-1">Phone Number (Read-only)</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-350" />
                <input
                  type="text"
                  disabled
                  value={user?.phone || ""}
                  className="w-full rounded-xl border border-slate-100 bg-slate-50/50 py-3.5 pl-10 pr-4 text-xs font-semibold text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notifications toggles */}
        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Bell className="h-4.5 w-4.5 text-primary" />
            Notification Settings
          </h3>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 max-w-[80%]">
              <strong className="text-xs font-black text-slate-700 block leading-tight">SMS Notifications</strong>
              <span className="text-[10px] text-slate-400 font-semibold block leading-tight">Receive instant alerts regarding confirmed booking transitions and complete reviews</span>
            </div>
            <button
              type="button"
              onClick={() => setSmsNotify(!smsNotify)}
              className={`relative inline-flex h-5.5 w-10 items-center rounded-full transition-colors focus:outline-none shrink-0 ${
                smsNotify ? "bg-primary" : "bg-slate-200"
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                smsNotify ? "translate-x-5" : "translate-x-1"
              }`} />
            </button>
          </div>
        </div>

        {/* Action feedback */}
        {success && (
          <p className="text-xs font-bold text-green-600 bg-green-50 p-2.5 rounded-xl border border-green-100 leading-normal flex items-center gap-1.5">
            <Check className="h-4 w-4" />
            Profile settings saved successfully!
          </p>
        )}

        {errorMsg && (
          <p className="text-xs font-bold text-red-650 bg-red-50 p-2.5 rounded-xl border border-red-100 leading-normal flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4" />
            {errorMsg}
          </p>
        )}

        {/* Save button */}
        <button
          type="submit"
          disabled={saving || fullName === user?.full_name}
          className="w-full rounded-xl bg-primary hover:bg-primary-dark py-3.5 text-center text-xs font-black text-white shadow-md shadow-primary/10 disabled:opacity-60 transition-all"
        >
          {saving ? "Saving Changes..." : "Save Settings Changes"}
        </button>

        {/* Danger zone */}
        <div className="rounded-[2rem] border border-red-100 bg-red-50/20 p-6 shadow-sm space-y-3">
          <strong className="text-xs font-black text-red-700 uppercase tracking-wider flex items-center gap-1">
            <ShieldAlert className="h-4 w-4 text-red-600" />
            Danger Zone
          </strong>
          <p className="text-[10px] font-semibold text-slate-500 leading-normal">Deleting your customer profile removes bookings history records permanently. This action is irreversible.</p>
          <button
            type="button"
            className="rounded-xl border border-red-200 hover:bg-red-50 text-red-600 px-4 py-2.5 text-[10px] font-black tracking-wider uppercase transition-colors"
          >
            Delete Account Profile
          </button>
        </div>

      </form>
    </div>
  );
}
