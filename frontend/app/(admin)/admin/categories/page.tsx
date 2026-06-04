"use client";

import { useEffect, useState } from "react";
import { getCategories, type Category, API_BASE_URL } from "@/lib/api";
import { LayoutGrid, Plus, ChevronRight, Check, AlertTriangle } from "lucide-react";

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);

  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function loadCats() {
      try {
        const res = await getCategories();
        if (res.results) {
          setCategories(res.results || []);
        } else {
          setError("Failed to retrieve categories registry.");
        }
      } catch {
        setError("Network error. Failed to connect to categories server.");
      } finally {
        setLoading(false);
      }
    }
    loadCats();
  }, []);

  const handleEditClick = (cat: Category) => {
    setSelectedCat(cat);
    setCatName(cat.name);
    setCatSlug(cat.slug);
    setIsActive(cat.is_active);
    setSaved(false);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCat) return;

    setSaved(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/categories/${selectedCat.id}/admin-update/`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: catName,
          slug: catSlug,
          is_active: isActive,
        }),
      });

      if (res.ok) {
        const listRes = await getCategories();
        setCategories(listRes.results || []);
        setSelectedCat(null);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.detail || "Failed to update category.");
      }
    } catch {
      alert("Network error. Failed to save category.");
    } finally {
      setSaved(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Category Manager</h1>
        <p className="text-xs font-semibold text-slate-500">Configure service category tree paths, toggle visibility controls, and register new subcategories</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3 items-start">
        
        {/* LEFT COLUMN: TREE LIST */}
        <div className="lg:col-span-2 rounded-[2.5rem] border border-slate-100 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <LayoutGrid className="h-4.5 w-4.5 text-primary" />
              Service Categories
            </h3>
            <button className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1 text-xs font-bold">
              <Plus className="h-4 w-4 text-primary" />
              Add Category
            </button>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-xs font-bold text-red-750 flex items-center gap-1.5 animate-fade-in mb-4">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-650" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="h-32 bg-slate-100 animate-pulse rounded-2xl"></div>
          ) : (
            <div className="grid gap-2 shadow-inner rounded-2xl border border-slate-50 bg-slate-50/20 p-4">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleEditClick(cat)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100/50 text-xs font-black text-slate-650 hover:border-slate-350 transition-all"
                >
                  <span className="capitalize">{cat.name}</span>
                  <div className="flex items-center gap-3 text-slate-400">
                    <span className={`h-2 w-2 rounded-full ${cat.is_active ? "bg-success" : "bg-slate-300"}`}></span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: EDIT PROPERTIES FORM */}
        <aside>
          {selectedCat ? (
            <form onSubmit={handleSaveCategory} className="rounded-[2.5rem] border border-slate-100 bg-white p-6 shadow-md space-y-5 animate-scale-up">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-3">
                Edit Properties
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Category Name</label>
                  <input
                    type="text"
                    required
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 py-3 px-4 text-xs font-semibold outline-none focus:border-primary bg-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">URL Slug</label>
                  <input
                    type="text"
                    required
                    value={catSlug}
                    onChange={(e) => setCatSlug(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 py-3 px-4 text-xs font-semibold outline-none focus:border-primary bg-white"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                  <div className="space-y-0.5">
                    <strong className="text-xs font-black text-slate-700 block leading-tight">Active status</strong>
                    <span className="text-[9px] text-slate-400 font-semibold block leading-tight">Displayed in client pickers</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none shrink-0 ${
                      isActive ? "bg-primary" : "bg-slate-200"
                    }`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      isActive ? "translate-x-4.5" : "translate-x-1"
                    }`} />
                  </button>
                </div>
              </div>

              {saved && (
                <p className="text-xs font-bold text-green-600 bg-green-50 p-2.5 rounded-xl border border-green-100 leading-normal">Category specifications updated!</p>
              )}

              <button
                type="submit"
                disabled={saved}
                className="w-full rounded-xl bg-primary hover:bg-primary-dark py-3.5 text-center text-xs font-black text-white shadow-md shadow-primary/10 transition-all"
              >
                Save Category Updates
              </button>

            </form>
          ) : (
            <div className="rounded-[2rem] border border-slate-100 bg-[#0f3a22]/5 p-5 border-dashed text-slate-550 leading-relaxed text-xs">
              <strong className="text-xs font-black text-primary uppercase block tracking-wider mb-2">Category controls</strong>
              Select any service category from the left tree list to view properties, customize active URL slug paths, or toggle visibility active toggles.
            </div>
          )}
        </aside>

      </div>

    </div>
  );
}
