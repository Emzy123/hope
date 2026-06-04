"use client";
 
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { getMyWorkerProfile, updateMyWorkerProfile, updateMyProfile, uploadWorkerAvatar, API_BASE_URL } from "@/lib/api";
import { User, ShieldAlert, Phone, Camera, Bell, Sparkles, Image as ImageIcon, Briefcase } from "lucide-react";
 
export default function WorkerProfileEditor() {
  const { user, refreshSession } = useAuth();
  
  const [activeTab, setActiveTab] = useState("about");
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [city, setCity] = useState("Lagos");
  const [bio, setBio] = useState("");
  const [rate, setRate] = useState(6500);
  const [specialty, setSpecialty] = useState("Plumbing");
  const [isAvailable, setIsAvailable] = useState(true);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setErrorMsg("");
    setSuccess(false);

    try {
      const res = await uploadWorkerAvatar(file);
      setAvatarUrl(res.avatar_url);
      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload avatar image.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await getMyWorkerProfile();
        if (data && data.profile) {
          setFullName(data.profile.full_name || user?.full_name || "");
          setCity(data.profile.city || "Lagos");
          setBio(data.profile.bio || "");
          setRate(data.profile.hourly_rate || 0);
          setIsAvailable(data.profile.is_available);
          setAvatarUrl(data.profile.avatar_url || "");
          if (data.profile.categories && data.profile.categories.length > 0) {
            const firstCatName = data.profile.categories[0].name;
            setSpecialty(firstCatName || "Plumbing");
          }
        }
      } catch (err) {
        setErrorMsg("Failed to load worker profile details from database.");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setErrorMsg("");

    try {
      if (fullName !== user?.full_name) {
        await updateMyProfile({ full_name: fullName });
      }

      await updateMyWorkerProfile({
        bio,
        city,
        hourly_rate: Number(rate),
        is_available: isAvailable,
        categories: [specialty.toLowerCase()],
      });

      await refreshSession();
      setSuccess(true);
    } catch (err: any) {
      setErrorMsg("Failed to update profile console details.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto py-12 animate-pulse space-y-6">
        <div className="h-10 w-48 bg-slate-200 rounded-xl"></div>
        <div className="h-60 bg-slate-200 rounded-[2.5rem]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-fade-in py-6">
      <div className="space-y-1">
        <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Artisan Profile Console</h1>
        <p className="text-xs font-semibold text-slate-500">Manage bio descriptions, transparent rates, portfolio project catalog and online statuses</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 bg-slate-100 rounded-2xl p-1 w-full shrink-0">
        {[
          { id: "about", label: "About Bio" },
          { id: "portfolio", label: "Portfolio Catalog" },
          { id: "rates", label: "Rates & Status" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-xl py-2.5 text-[10px] font-black uppercase tracking-wider transition-all ${
              activeTab === tab.id
                ? "bg-white text-primary shadow-sm"
                : "text-slate-500 hover:bg-white/40"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* TAB 1: ABOUT */}
        {activeTab === "about" && (
          <div className="rounded-[2.5rem] border border-slate-100 bg-white p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-4 border-b border-slate-50 pb-4">
              <div className="relative h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-slate-100 overflow-hidden">
                {uploadingAvatar ? (
                  <span className="h-5 w-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                ) : avatarUrl ? (
                  <img
                    src={avatarUrl.startsWith("http") ? avatarUrl : `${API_BASE_URL}${avatarUrl}`}
                    alt={user?.full_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-6 w-6 text-primary" />
                )}
                
                <input
                  type="file"
                  id="avatar-file-input"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  disabled={uploadingAvatar}
                />
                <label
                  htmlFor="avatar-file-input"
                  className="absolute bottom-0 right-0 h-5 w-5 rounded-lg bg-primary flex items-center justify-center text-white border border-white cursor-pointer hover:bg-primary-dark transition-colors"
                >
                  <Camera className="h-3 w-3" />
                </label>
              </div>
              <div>
                <strong className="text-sm font-black text-slate-800 block leading-tight">{user?.full_name}</strong>
                <span className="text-[9px] text-[#f5a623] font-extrabold uppercase mt-1 block tracking-wider">Level 1 Checked Worker</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">Display Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-3.5 px-4 text-xs font-semibold outline-none focus:border-primary bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">Operating City</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-3.5 px-4 text-xs font-semibold outline-none focus:border-primary bg-white"
                >
                  <option value="Lagos">Lagos</option>
                  <option value="Abuja">Abuja</option>
                  <option value="Port Harcourt">Port Harcourt</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">Bio Description</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={500}
                  className="w-full min-h-20 rounded-xl border border-slate-200 p-4 text-xs font-semibold outline-none focus:border-primary bg-white leading-normal"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PORTFOLIO */}
        {activeTab === "portfolio" && (
          <div className="rounded-[2.5rem] border border-slate-100 bg-white p-6 shadow-sm space-y-6">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="h-4.5 w-4.5 text-primary" />
              Project Portfolio
            </h3>
            
            <div className="grid grid-cols-3 gap-3">
              {[1, 2].map((i) => (
                <div key={i} className="aspect-square rounded-2xl bg-slate-50 border border-slate-200/50 flex flex-col justify-between p-3 relative hover:scale-[1.02] transition-transform">
                  <span className="text-[9px] font-black text-slate-400">Mockup #{i}</span>
                  <button className="absolute top-2 right-2 text-slate-350 hover:text-red-500 font-bold text-xs bg-white rounded-lg p-1 border border-slate-100 leading-none">✕</button>
                </div>
              ))}
              <div className="aspect-square rounded-2xl border-2 border-dashed border-slate-250 hover:border-primary/50 flex items-center justify-center cursor-pointer transition-colors bg-slate-50/20">
                <span className="text-[10px] font-black text-slate-400">Add Photo</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RATES & STATUS */}
        {activeTab === "rates" && (
          <div className="rounded-[2.5rem] border border-slate-100 bg-white p-6 shadow-sm space-y-6">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="h-4.5 w-4.5 text-primary" />
              Specialty, Rates &amp; Status
            </h3>

            <div className="space-y-5">
              {/* Core Trade Specialty */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-600 block uppercase">Core Trade Specialty</label>
                <p className="text-[9px] text-slate-400 font-semibold">Select the primary service trade that best represents your skills. This shows on your public profile.</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    "Plumbing", "Electrical", "Cleaning",
                    "Carpentry", "AC Repair", "Painting",
                    "Welding", "Tiling", "Tailoring",
                    "Catering", "Mechanic", "Tutoring"
                  ].map((trade) => {
                    const active = specialty === trade;
                    return (
                      <button
                        key={trade}
                        type="button"
                        onClick={() => setSpecialty(trade)}
                        className={`rounded-xl px-2 py-2.5 text-[9px] font-black transition-all border capitalize leading-tight ${
                          active
                            ? "bg-primary border-primary text-white shadow-md shadow-primary/20"
                            : "bg-white border-slate-200 text-slate-500 hover:border-primary/30 hover:bg-primary/5"
                        }`}
                      >
                        {trade}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">Hourly rate (₦/hr)</label>
                <input
                  type="number"
                  required
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 py-3.5 px-4 text-xs font-semibold outline-none focus:border-primary bg-white"
                />
              </div>

              <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                <div className="space-y-0.5 max-w-[80%]">
                  <strong className="text-xs font-black text-slate-700 block leading-none">Console Available Toggles</strong>
                  <span className="text-[10px] text-slate-450 font-semibold block leading-tight mt-1">Keep active to automatically display your artisan profile in client search browser queries</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAvailable(!isAvailable)}
                  className={`relative inline-flex h-5.5 w-10 items-center rounded-full transition-colors focus:outline-none shrink-0 ${
                    isAvailable ? "bg-primary" : "bg-slate-200"
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isAvailable ? "translate-x-5" : "translate-x-1"
                  }`} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Feedback alerts */}
        {errorMsg && (
          <p className="text-xs font-bold text-red-650 bg-red-50 p-2.5 rounded-xl border border-red-100 leading-normal">{errorMsg}</p>
        )}
        {success && (
          <p className="text-xs font-bold text-green-600 bg-green-50 p-2.5 rounded-xl border border-green-100 leading-normal">Artisan profile console details saved successfully!</p>
        )}

        {/* Action Save button */}
        {activeTab !== "portfolio" && (
          <button
            type="submit"
            disabled={saving || (fullName === user?.full_name && activeTab === "about")}
            className="w-full rounded-xl bg-primary hover:bg-primary-dark py-3.5 text-center text-xs font-black text-white shadow-md shadow-primary/10 disabled:opacity-60 transition-all"
          >
            {saving ? "Saving Changes..." : "Save Console Settings"}
          </button>
        )}

      </form>
    </div>
  );
}
