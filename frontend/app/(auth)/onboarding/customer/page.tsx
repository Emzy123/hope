"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { updateMyProfile, getCategories, type Category } from "@/lib/api";
import Image from "next/image";
import { Sparkles, User, Camera, ArrowRight, ArrowLeft, Heart, CheckCircle2 } from "lucide-react";

export default function CustomerOnboarding() {
  const router = useRouter();
  const { user, refreshSession } = useAuth();

  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [city, setCity] = useState("Lagos");
  const [email, setEmail] = useState("");
  const [preferences, setPreferences] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Profile image upload preview state
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (user) {
      if (user.full_name) {
        setFullName(user.full_name);
      }
      if (user.email) {
        setEmail(user.email);
      }
    }
  }, [user]);

  useEffect(() => {
    getCategories()
      .then((res) => {
        if (res && res.results && res.results.length > 0) {
          setAvailableCategories(res.results.filter((c) => c.is_active));
        } else {
          setAvailableCategories([
            { id: "1", name: "Plumbing", slug: "plumbing", is_active: true },
            { id: "2", name: "Electrical", slug: "electrical", is_active: true },
            { id: "3", name: "Cleaning", slug: "cleaning", is_active: true },
            { id: "4", name: "Carpentry", slug: "carpentry", is_active: true },
            { id: "5", name: "Mechanic", slug: "mechanic", is_active: true },
            { id: "6", name: "Tutor", slug: "tutor", is_active: true },
          ]);
        }
      })
      .catch(() => {
        setAvailableCategories([
          { id: "1", name: "Plumbing", slug: "plumbing", is_active: true },
          { id: "2", name: "Electrical", slug: "electrical", is_active: true },
          { id: "3", name: "Cleaning", slug: "cleaning", is_active: true },
          { id: "4", name: "Carpentry", slug: "carpentry", is_active: true },
          { id: "5", name: "Mechanic", slug: "mechanic", is_active: true },
          { id: "6", name: "Tutor", slug: "tutor", is_active: true },
        ]);
      });
  }, []);

  const handleNext = () => setStep(2);
  const handleBack = () => setStep(1);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTogglePreference = (slug: string) => {
    setPreferences((prev) =>
      prev.includes(slug) ? prev.filter((p) => p !== slug) : [...prev, slug]
    );
  };

  const handleSubmit = async (skip = false) => {
    setLoading(true);
    try {
      // Calls PATCH /api/v1/auth/me/ to update user details
      await updateMyProfile({
        full_name: fullName.trim(),
        email: skip ? undefined : email.trim() || undefined,
        is_onboarded: true,
      });

      // Write session flag to trigger dashboard welcome banner
      if (!skip) {
        sessionStorage.setItem("sb_new_customer", "true");
      }

      await refreshSession();
      setLoading(false);
      router.replace("/dashboard");
    } catch (err) {
      console.error(err);
      setLoading(false);
      alert("Failed to save profile. Please check details and try again.");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-accent border border-amber-100">
          <Sparkles className="h-6 w-6 text-accent fill-accent" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-black text-slate-800">Welcome to SkillBridge! 👋</h2>
          <p className="text-[10px] font-semibold text-slate-500">
            {step === 1 ? "Just a few quick details to set up your account" : "Customize your marketplace preferences"}
          </p>
        </div>
      </div>

      {/* Progress Dots */}
      <div className="flex items-center justify-center gap-1.5 py-1">
        <div className={`h-2 w-2 rounded-full transition-all duration-300 ${step === 1 ? "bg-primary w-5" : "bg-slate-200"}`} />
        <div className={`h-2 w-2 rounded-full transition-all duration-300 ${step === 2 ? "bg-primary w-5" : "bg-slate-200"}`} />
      </div>

      {step === 1 ? (
        <div className="space-y-5">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center justify-center">
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handlePhotoChange}
              className="hidden"
            />
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center border-2 border-slate-200 cursor-pointer overflow-hidden hover:border-primary transition-colors group"
            >
              {profilePhoto ? (
                <Image src={profilePhoto} alt="Avatar preview" width={80} height={80} className="w-full h-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-slate-400" />
              )}
              <span className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary flex items-center justify-center text-white border border-white group-hover:scale-105 transition-transform">
                <Camera className="h-3.5 w-3.5" />
              </span>
            </div>
            <span className="text-[9px] text-slate-400 font-extrabold uppercase mt-2">Upload Profile Photo</span>
          </div>

          {/* Full Name */}
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-1">Your Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Chioma Okafor"
                className="w-full rounded-xl border border-slate-200 py-3.5 px-4 text-xs font-semibold outline-none focus:border-primary transition-colors bg-white"
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
                <option value="Kano">Kano</option>
                <option value="Ibadan">Ibadan</option>
              </select>
            </div>
          </div>

          {/* Continue Button */}
          <button
            onClick={handleNext}
            disabled={!fullName.trim()}
            className="w-full rounded-xl bg-primary hover:bg-primary-dark py-3.5 text-center text-xs font-black text-white shadow-md shadow-primary/10 disabled:opacity-60 transition-all flex items-center justify-center gap-1.5"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Step 2 Form */}
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full rounded-xl border border-slate-200 py-3.5 px-4 text-xs font-semibold outline-none focus:border-primary transition-colors bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-1.5">What services do you need? (Optional)</label>
              <div className="flex flex-wrap gap-1.5">
                {availableCategories.map((cat) => {
                  const active = preferences.includes(cat.slug);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleTogglePreference(cat.slug)}
                      className={`rounded-full px-4 py-2 text-[10px] font-black capitalize border transition-all ${
                        active
                          ? "bg-primary border-primary text-white"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={handleBack}
                className="w-1/3 rounded-xl border border-slate-200 py-3.5 text-xs font-black text-slate-500 hover:bg-slate-50 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={loading}
                className="w-2/3 rounded-xl bg-primary hover:bg-primary-dark py-3.5 text-center text-xs font-black text-white shadow-md shadow-primary/10 transition-all flex items-center justify-center gap-1.5"
              >
                {loading ? "Saving Profile..." : "Complete Setup"}
                <CheckCircle2 className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={loading}
              className="w-full text-center text-[10px] font-bold text-slate-400 hover:text-primary transition-colors py-1.5"
            >
              Skip preference selection for now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
