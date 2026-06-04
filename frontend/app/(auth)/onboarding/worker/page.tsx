"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getCategories, createWorkerProfile, updateMyProfile, type Category } from "@/lib/api";
import Image from "next/image";
import { Sparkles, User, Camera, ArrowRight, ArrowLeft, Upload, CheckCircle2, ShieldCheck, Hourglass, X } from "lucide-react";

export default function WorkerOnboarding() {
  const router = useRouter();
  const { user, refreshSession } = useAuth();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Form Fields State
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [city, setCity] = useState("Lagos");
  const [bio, setBio] = useState("");
  const [rate, setRate] = useState(2500);
  const [categories, setCategories] = useState<string[]>([]);
  
  // File upload state & refs
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);

  const [portfolioPhotos, setPortfolioPhotos] = useState<string[]>([]);
  const portfolioInputRef = useRef<HTMLInputElement>(null);

  const [idPhoto, setIdPhoto] = useState<string | null>(null);
  const idPhotoInputRef = useRef<HTMLInputElement>(null);

  const [confirmTerms, setConfirmTerms] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);

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
      .catch((err) => {
        console.error("Failed to load categories:", err);
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

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => s - 1);

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePortfolioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileList = Array.from(files);
      fileList.forEach((file) => {
        if (portfolioPhotos.length >= 6) return;
        const reader = new FileReader();
        reader.onloadend = () => {
          setPortfolioPhotos((prev) => [...prev, reader.result as string].slice(0, 6));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removePortfolioPhoto = (index: number) => {
    setPortfolioPhotos((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleIdPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setIdPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 1. Create worker profile on backend
      await createWorkerProfile({
        bio,
        city,
        state: "Lagos",
        hourly_rate: Number(rate),
        category_slugs: categories,
        portfolio_urls: [], // In-memory previews for now, persistent urls in future phase
      });

      // 2. Update user name and is_onboarded = true
      await updateMyProfile({
        full_name: fullName,
        is_onboarded: true,
      });

      // 3. Sync state with sessionStorage so worker home page knows it was an onboarding submission
      sessionStorage.setItem("sb_new_worker", "true");

      // 4. Refresh session to populate is_onboarded update in context
      await refreshSession();

      setLoading(false);
      setIsSubmitted(true);
    } catch (err) {
      console.error(err);
      setLoading(false);
      alert("Failed to submit profile. Please check details and try again.");
    }
  };

  const handleToggleCategory = (cat: string) => {
    setCategories((prev) => 
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  if (isSubmitted) {
    return (
      <div className="text-center py-6 space-y-6 animate-scale-up">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[2rem] bg-amber-50 text-accent border border-amber-100">
          <Hourglass className="h-8 w-8 text-accent animate-spin" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-lg font-black text-slate-800">Application Submitted!</h2>
          <p className="text-xs font-semibold text-slate-500 leading-relaxed max-w-sm mx-auto">
            Our team will review your profile credentials and ID document within 24–48 hours. You will receive an SMS and active account access once approved.
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4 text-[10px] font-extrabold max-w-xs mx-auto text-slate-500 leading-4">
          Feel free to browse around the marketplace services and available workers while you wait!
        </div>

        <button
          onClick={() => router.replace("/")}
          className="rounded-2xl bg-primary hover:bg-primary-dark px-8 py-3.5 text-xs font-black text-white transition-all"
        >
          Browse Platform
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Wizard Progress Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-[9px] font-black uppercase text-slate-400 tracking-wider">
          <span>Worker Registration</span>
          <span>Step {step} of 4</span>
        </div>
        <div className="flex items-center justify-between relative px-2">
          <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-0.5 bg-slate-100 -z-10" />
          <div 
            className="absolute left-2 top-1/2 -translate-y-1/2 h-0.5 bg-primary -z-10 transition-all duration-300"
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          />
          {[1, 2, 3, 4].map((num) => (
            <div
              key={num}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-all ${
                num < step
                  ? "bg-primary border-primary text-white"
                  : num === step
                  ? "bg-white border-primary text-primary shadow-sm shadow-primary/20"
                  : "bg-white border-slate-200 text-slate-400"
              }`}
            >
              {num}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Personal Info */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="text-center space-y-1">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Personal Profile Details</h3>
            <p className="text-[10px] font-semibold text-slate-500">Provide legal name and profile details for identification</p>
          </div>

          <div className="flex flex-col items-center justify-center">
            <input
              type="file"
              accept="image/*"
              ref={profilePhotoInputRef}
              onChange={handleProfilePhotoChange}
              className="hidden"
            />
            <div 
              onClick={() => profilePhotoInputRef.current?.click()}
              className="relative h-20 w-20 rounded-[2rem] bg-slate-100 flex items-center justify-center border-2 border-slate-200 cursor-pointer overflow-hidden group hover:border-primary transition-colors"
            >
              {profilePhoto ? (
                <Image src={profilePhoto} alt="Profile preview" width={80} height={80} className="w-full h-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-slate-400" />
              )}
              <span className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary flex items-center justify-center text-white border border-white">
                <Camera className="h-3.5 w-3.5" />
              </span>
            </div>
            <span className="text-[9px] text-slate-400 font-extrabold uppercase mt-2">Legal Headshot (Required)</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-1">Your Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Chioma Okafor"
                className="w-full rounded-xl border border-slate-200 py-3.5 px-4 text-xs font-semibold outline-none focus:border-primary"
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

          <button
            onClick={handleNext}
            disabled={!fullName || !profilePhoto}
            className="w-full mt-2 rounded-xl bg-primary hover:bg-primary-dark py-3.5 text-xs font-black text-white disabled:opacity-60 transition-all flex items-center justify-center gap-1.5"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Step 2: Services & Rate */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="text-center space-y-1">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Services & Rates</h3>
            <p className="text-[10px] font-semibold text-slate-500">Pick service trades and set your transparent hourly price</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-1.5">Select Trades Offered (Min 1)</label>
              <div className="flex flex-wrap gap-1.5">
                {availableCategories.length === 0 ? (
                  <p className="text-[10px] text-slate-400">Loading trades...</p>
                ) : (
                  availableCategories.map((cat) => {
                    const active = categories.includes(cat.slug);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleToggleCategory(cat.slug)}
                        className={`rounded-full px-4 py-2 text-[10px] font-black capitalize border transition-all ${
                          active
                            ? "bg-primary border-primary text-white"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {cat.name}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-1">Hourly rate (₦/hr)</label>
              <input
                type="number"
                min={500}
                max={50000}
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 py-3.5 px-4 text-xs font-semibold outline-none focus:border-primary"
              />
              <span className="text-[9px] text-slate-400 font-semibold block mt-1">Average market rates range from ₦1,500 to ₦5,000 /hr</span>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-bold text-slate-600 block">Bio Description</label>
                <span className="text-[9px] text-slate-400 font-bold">{bio.length}/500</span>
              </div>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={500}
                placeholder="Describe your skills and job experiences to customers..."
                className="w-full min-h-20 rounded-xl border border-slate-200 py-3 px-4 text-xs font-semibold outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={handleBack}
              className="w-1/3 rounded-xl border border-slate-200 py-3.5 text-xs font-black text-slate-500 hover:bg-slate-50"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={categories.length === 0 || !bio}
              className="w-2/3 rounded-xl bg-primary hover:bg-primary-dark py-3.5 text-xs font-black text-white disabled:opacity-60 transition-all flex items-center justify-center gap-1.5"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Portfolio */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="text-center space-y-1">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Job Portfolio Showcase</h3>
            <p className="text-[10px] font-semibold text-slate-500">Add photos of previous completed works (Optional)</p>
          </div>

          <input
            type="file"
            multiple
            accept="image/*"
            ref={portfolioInputRef}
            onChange={handlePortfolioChange}
            className="hidden"
          />

          <div 
            onClick={() => portfolioInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-3xl p-6 text-center space-y-3 cursor-pointer hover:bg-slate-50 hover:border-primary transition-all"
          >
            <Upload className="h-8 w-8 text-primary mx-auto stroke-[1.5]" />
            <div>
              <span className="text-xs font-black text-slate-800 block">Click to Upload Portfolio Photos</span>
              <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">Maximum 6 photos (JPG, PNG, max 2MB each)</span>
            </div>
          </div>

          {portfolioPhotos.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-2">
              {portfolioPhotos.map((photo, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-100 group bg-slate-50">
                  <Image src={photo} alt={`Portfolio preview ${idx + 1}`} width={100} height={100} className="w-full h-full object-cover" />
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removePortfolioPhoto(idx);
                    }}
                    className="absolute top-1 right-1 h-5 w-5 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2.5">
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
              {portfolioPhotos.length === 0 ? "Skip & Continue" : "Continue"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: ID Verification */}
      {step === 4 && (
        <div className="space-y-5">
          <div className="text-center space-y-1">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">KYC Identity Check</h3>
            <p className="text-[10px] font-semibold text-slate-500">Upload NIN slip, Voter&apos;s card or Driver&apos;s licence for review</p>
          </div>

          <div className="space-y-4">
            <input
              type="file"
              accept="image/*,.pdf"
              ref={idPhotoInputRef}
              onChange={handleIdPhotoChange}
              className="hidden"
            />

            <div 
              onClick={() => idPhotoInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-6 text-center space-y-2 cursor-pointer transition-all ${
                idPhoto 
                  ? "border-green-200 bg-green-50/20" 
                  : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-primary"
              }`}
            >
              {idPhoto ? (
                <div className="space-y-2">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600 border border-green-100">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 block">ID Document Attached</span>
                  <button 
                    type="button" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIdPhoto(null);
                    }}
                    className="text-[9px] font-black text-red-500 uppercase hover:underline"
                  >
                    Remove Document
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-primary mx-auto stroke-[1.5]" />
                  <span className="text-xs font-black text-slate-800 block">Upload ID Document (PDF/JPG)</span>
                  <span className="text-[9px] text-slate-400 font-semibold block">NIN, Voter&apos;s Card, or Driver&apos;s License</span>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setConfirmTerms(!confirmTerms)}
              className="flex gap-3 text-left items-start text-xs font-semibold text-slate-500 leading-tight pt-2"
            >
              <span className={`h-4.5 w-4.5 rounded border mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                confirmTerms ? "bg-primary border-primary text-white" : "border-slate-300 bg-white"
              }`}>
                {confirmTerms && "✓"}
              </span>
              <span>I confirm that the submitted identity card details belong exclusively to me and are fully authentic and valid.</span>
            </button>
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={handleBack}
              disabled={loading}
              className="w-1/3 rounded-xl border border-slate-200 py-3.5 text-xs font-black text-slate-500 hover:bg-slate-50"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !confirmTerms || !idPhoto}
              className="w-2/3 rounded-xl bg-primary hover:bg-primary-dark py-3.5 text-xs font-black text-white disabled:opacity-60 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-primary/10"
            >
              {loading ? "Registering..." : "Submit Application"}
              <ShieldCheck className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
