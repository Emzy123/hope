"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import {
  Users,
  Search,
  Plus,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
  ShieldCheck,
  User,
  Shield,
  Smartphone,
  Mail,
  UserCheck,
  X,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from "lucide-react";

type UserRecord = {
  id: string;
  phone: string;
  full_name: string;
  email: string | null;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string | null;
};

export default function AdminUsersDashboard() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");
  
  // New User Form State
  const [newPhone, setNewPhone] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("customer");
  const [newPassword, setNewPassword] = useState("");

  const cleanPhone = (val: string) => val.replace(/\D/g, "").slice(0, 11);

  // Fetch Users
  useEffect(() => {
    async function loadUsers() {
      setLoading(true);
      setErrorMsg("");
      try {
        const queryParams = new URLSearchParams();
        if (roleFilter !== "all") queryParams.append("role", roleFilter);
        if (search) queryParams.append("search", search);

        const res = await fetch(`${API_BASE_URL}/api/v1/auth/admin/users/?${queryParams.toString()}`, {
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          setUsers(data.results || []);
        } else {
          setErrorMsg("Failed to fetch users registry from database.");
        }
      } catch {
        setErrorMsg("Network connection error. Failed to retrieve users list.");
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, [search, roleFilter, refreshTrigger]);

  // Toggle Active Status
  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    setErrorMsg("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/admin/users/${userId}/toggle-active/`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, is_active: !currentStatus } : u))
        );
      } else {
        const errData = await res.json();
        setErrorMsg(errData.detail || "Could not toggle user status.");
      }
    } catch {
      setErrorMsg("Network error. Failed to toggle user status.");
    }
  };

  // Submit Create User Form
  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPhone.length < 10) {
      setModalError("Please enter a valid Nigerian phone number.");
      return;
    }
    if (newRole === "admin" && newPassword.length < 8) {
      setModalError("Admin passwords must be at least 8 characters long.");
      return;
    }

    setModalLoading(true);
    setModalError("");
    setModalSuccess("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/admin/users/`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: newPhone,
          full_name: newFullName,
          email: newEmail || undefined,
          role: newRole,
          password: newRole === "admin" ? newPassword : undefined,
        }),
      });

      if (res.ok) {
        setModalSuccess(`Successfully created new ${newRole}!`);
        // Reset states
        setNewPhone("");
        setNewFullName("");
        setNewEmail("");
        setNewPassword("");
        setNewRole("customer");
        setTimeout(() => {
          setShowCreateModal(false);
          setRefreshTrigger((prev) => prev + 1);
        }, 1200);
      } else {
        const errData = await res.json();
        setModalError(errData.detail || "Could not create user account.");
      }
    } catch {
      setModalError("Network failure. Verify the Django server is online.");
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Users Management Portal
          </h1>
          <p className="text-xs font-semibold text-slate-500">
            Create staff credentials, inspect customer records, and handle artisan statuses
          </p>
        </div>
        
        <button
          onClick={() => {
            setModalError("");
            setModalSuccess("");
            setShowCreateModal(true);
          }}
          className="rounded-2xl bg-primary hover:bg-primary-dark text-white px-4 py-3 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-primary/20 hover:scale-[1.02]"
        >
          <Plus className="h-4.5 w-4.5" />
          Create User Account
        </button>
      </div>

      {errorMsg && (
        <div className="rounded-[2rem] border border-red-200 bg-red-50 p-5 flex items-start gap-3 shadow-sm animate-fade-in">
          <ShieldAlert className="h-5 w-5 text-red-650 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <strong className="text-xs font-black text-red-800 block">System Connection Alert</strong>
            <p className="text-[10.5px] font-semibold text-red-755 leading-tight">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Control bar */}
      <div className="flex flex-col md:flex-row gap-3 justify-between items-center bg-white p-3 rounded-[2rem] border border-slate-100 shadow-sm">
        {/* Search */}
        <div className="relative w-full md:max-w-xs flex items-center">
          <input
            type="text"
            placeholder="Search name, phone, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border border-slate-100 bg-slate-50/50 outline-none focus:border-primary focus:bg-white transition-all text-slate-800"
          />
          <Search className="absolute left-3 h-4 w-4 text-slate-400" />
        </div>

        {/* Role Filters */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-0.5 self-stretch md:self-auto overflow-x-auto">
          {[
            { id: "all", label: "All Users" },
            { id: "customer", label: "Customers" },
            { id: "worker", label: "Artisans" },
            { id: "admin", label: "Admins" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRoleFilter(tab.id)}
              className={`rounded-lg px-3.5 py-2.5 text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                roleFilter === tab.id
                  ? "bg-white text-primary shadow-sm"
                  : "text-slate-500 hover:bg-white/40"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users table */}
      {loading ? (
        <div className="grid gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-3xl" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-[2.5rem] border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
          <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <strong className="text-xs font-black text-slate-700 block">No matching users found</strong>
          <span className="text-[10px] font-medium text-slate-400 mt-1 block">
            Try adjusting your search criteria or role filters
          </span>
        </div>
      ) : (
        <div className="grid gap-3">
          {users.map((u) => {
            const isSelf = u.phone === "08099999999";
            return (
              <div
                key={u.id}
                className={`rounded-3xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  u.is_active ? "border-slate-100" : "border-red-100 bg-red-50/5"
                }`}
              >
                {/* User avatar & info */}
                <div className="flex items-center gap-3">
                  <div
                    className={`h-11 w-11 rounded-2xl flex items-center justify-center font-black text-sm relative shrink-0 ${
                      u.role === "admin"
                        ? "bg-[#f5a623]/10 text-[#f5a623]"
                        : u.role === "worker"
                        ? "bg-primary/10 text-primary"
                        : "bg-blue-500/10 text-blue-500"
                    }`}
                  >
                    {u.full_name ? u.full_name.charAt(0).toUpperCase() : "?"}
                    {u.is_verified && (
                      <span className="absolute -bottom-1 -right-1 bg-emerald-500 border-2 border-white rounded-full p-0.5">
                        <CheckCircle2 className="h-2.5 w-2.5 text-white fill-emerald-500" />
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <strong className="text-xs font-black text-slate-800 leading-tight">
                        {u.full_name || "Uncompleted Registration"}
                      </strong>
                      <span
                        className={`rounded-lg px-2 py-0.5 text-[8px] font-black uppercase tracking-wider leading-none ${
                          u.role === "admin"
                            ? "bg-[#f5a623]/10 text-[#f5a623]"
                            : u.role === "worker"
                            ? "bg-primary/10 text-primary"
                            : "bg-blue-500/10 text-blue-500"
                        }`}
                      >
                        {u.role}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[10px] text-slate-400 font-semibold flex-wrap">
                      <span className="flex items-center gap-1">
                        <Smartphone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        {u.phone}
                      </span>
                      {u.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          {u.email}
                        </span>
                      )}
                      {u.created_at && (
                        <span className="text-[9px] text-slate-400/80">
                          Joined {new Date(u.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions: toggle active & status badges */}
                <div className="flex items-center justify-between md:justify-end gap-5 shrink-0 border-t border-slate-50 pt-3 md:pt-0 md:border-0">
                  <div className="text-left md:text-right">
                    <span
                      className={`text-[9px] font-extrabold uppercase tracking-widest block ${
                        u.is_active ? "text-emerald-500" : "text-red-500"
                      }`}
                    >
                      {u.is_active ? "Active Account" : "Suspended"}
                    </span>
                    <span className="text-[8px] font-semibold text-slate-400 block mt-0.5">
                      {isSelf ? "Current Staff Account" : "Toggle status to change access"}
                    </span>
                  </div>

                  <button
                    disabled={isSelf}
                    onClick={() => handleToggleActive(u.id, u.is_active)}
                    className={`transition-opacity transition-transform active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed`}
                    title={isSelf ? "You cannot suspend your own account." : ""}
                  >
                    {u.is_active ? (
                      <ToggleRight className="h-8.5 w-8.5 text-primary shrink-0" />
                    ) : (
                      <ToggleLeft className="h-8.5 w-8.5 text-slate-300 shrink-0" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE USER DIALOG MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-[2.5rem] p-6 shadow-2xl border border-slate-100 relative overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Header decoration */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-[#f5a623] to-blue-500" />
            
            {/* Close button */}
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 rounded-xl p-1 hover:bg-slate-50 transition-all"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-800 flex items-center gap-1.5">
                  <UserCheck className="h-5 w-5 text-primary" />
                  Add User Account
                </h3>
                <p className="text-[10px] font-semibold text-slate-400">
                  Fill in credentials to register a user.
                </p>
              </div>

              {/* Feedback */}
              {modalError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 flex gap-2 text-red-500 text-[10px] font-semibold">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  {modalError}
                </div>
              )}
              {modalSuccess && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 flex gap-2 text-emerald-500 text-[10px] font-semibold">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                  {modalSuccess}
                </div>
              )}

              <form onSubmit={handleCreateUserSubmit} className="space-y-4 text-slate-700">
                {/* Full name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block uppercase">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kolawole Davies"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-xs font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/5"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block uppercase">Phone Number</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-[10px] font-black text-slate-400 border-r border-slate-200 pr-2">+234</span>
                    <input
                      type="tel"
                      required
                      placeholder="080 1234 5678"
                      value={newPhone}
                      onChange={(e) => setNewPhone(cleanPhone(e.target.value))}
                      maxLength={11}
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-14 pr-3 text-xs font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/5"
                    />
                  </div>
                </div>

                {/* Email (Optional) */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block uppercase">Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="e.g. name@domain.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-xs font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/5"
                  />
                </div>

                {/* Role selection */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block uppercase">Account Role</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "customer", label: "Customer" },
                      { id: "worker", label: "Artisan" },
                      { id: "admin", label: "Admin" },
                    ].map((role) => (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setNewRole(role.id)}
                        className={`rounded-xl px-2 py-2.5 text-[9px] font-black transition-all border capitalize leading-tight ${
                          newRole === role.id
                            ? "bg-primary border-primary text-white shadow-md shadow-primary/20"
                            : "bg-white border-slate-200 text-slate-500 hover:border-primary/30 hover:bg-primary/5"
                        }`}
                      >
                        {role.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Password (if admin) */}
                {newRole === "admin" && (
                  <div className="space-y-1 animate-slide-down">
                    <label className="text-[10px] font-bold text-[#f5a623] block uppercase flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      Assign Admin Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Minimum 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-xs font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/5"
                    />
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-dark text-white py-3 px-4 text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 mt-2"
                >
                  {modalLoading ? (
                    <>
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Confirm Account Creation"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
