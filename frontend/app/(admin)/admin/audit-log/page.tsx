"use client";

import { useEffect, useState, useCallback } from "react";
import { API_BASE_URL } from "@/lib/api";
import {
  ClipboardList,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
  Search,
  Shield,
  AlertTriangle,
  Clock,
  User,
} from "lucide-react";

type AuditEntry = {
  id: string;
  admin_name: string;
  admin_phone: string;
  action: string;
  details: string;
  created_at: string | null;
};

const ACTION_COLORS: Record<string, string> = {
  "Worker Approved": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Worker Rejected": "bg-red-100 text-red-700 border-red-200",
  "Dispute Arbitration": "bg-amber-100 text-amber-700 border-amber-200",
  "User Status Toggled": "bg-blue-100 text-blue-700 border-blue-200",
  "Settings Updated": "bg-slate-100 text-slate-600 border-slate-200",
  "Category Created": "bg-purple-100 text-purple-700 border-purple-200",
  "Category Updated": "bg-purple-100 text-purple-700 border-purple-200",
  "Category Deleted": "bg-red-100 text-red-700 border-red-200",
};

function formatDateTime(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 25;

  const fetchLogs = useCallback(
    async (p: number, quiet = false) => {
      if (!quiet) setLoading(true);
      else setRefreshing(true);
      setError("");
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/v1/admin/audit-logs/?page=${p}&page_size=${PAGE_SIZE}`,
          { credentials: "include" }
        );
        if (res.ok) {
          const data = await res.json();
          setLogs(data.results || []);
          setTotal(data.count || 0);
          setTotalPages(data.total_pages || 1);
        } else {
          setError("Failed to retrieve audit logs.");
        }
      } catch {
        setError("Network error. Could not load audit logs.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchLogs(page);
  }, [page, fetchLogs]);

  const filtered = logs.filter(
    (l) =>
      l.admin_name.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in py-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            Admin Audit Log
          </h1>
          <p className="text-xs font-semibold text-slate-500">
            Full immutable chronological record of every administrative action taken on the platform.
          </p>
        </div>
        <button
          onClick={() => fetchLogs(page, true)}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
        >
          <RefreshCcw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm space-y-1">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Total Entries</span>
          <strong className="text-2xl font-black text-slate-800">{total.toLocaleString()}</strong>
          <span className="text-[9px] text-slate-400 font-semibold block">All time actions</span>
        </div>
        <div className="rounded-3xl border border-primary/20 bg-primary/5 p-4 shadow-sm space-y-1">
          <span className="text-[9px] font-black text-primary/50 uppercase tracking-wider block">This Page</span>
          <strong className="text-2xl font-black text-primary">{filtered.length}</strong>
          <span className="text-[9px] text-slate-400 font-semibold block">Showing results</span>
        </div>
        <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm space-y-1 col-span-2 md:col-span-1">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Pagination</span>
          <strong className="text-2xl font-black text-slate-800">
            {page} / {totalPages}
          </strong>
          <span className="text-[9px] text-slate-400 font-semibold block">{PAGE_SIZE} per page</span>
        </div>
      </div>

      {/* Log Table Card */}
      <div className="rounded-[2rem] border border-slate-100 bg-white shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-50">
          <h2 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Event Log
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter logs…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-52 rounded-xl border border-slate-100 bg-slate-50 pl-8 pr-3 py-2 text-xs font-semibold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
            />
          </div>
        </div>

        {error && (
          <div className="mx-6 my-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-2 text-xs font-bold text-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <ClipboardList className="h-12 w-12 text-slate-200" />
            <p className="text-xs font-black uppercase tracking-wider">No audit log entries found</p>
            <p className="text-[10px] font-semibold">No admin actions match your filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50/60">
                  <th className="text-left px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider w-[160px]">
                    Timestamp
                  </th>
                  <th className="text-left px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider w-[140px]">
                    Admin
                  </th>
                  <th className="text-left px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider w-[160px]">
                    Action
                  </th>
                  <th className="text-left px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((log) => {
                  const actionColor =
                    ACTION_COLORS[log.action] || "bg-slate-100 text-slate-600 border-slate-200";
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-6 py-3 align-top">
                        <div className="flex items-start gap-1.5 text-slate-500 font-semibold">
                          <Clock className="h-3 w-3 shrink-0 mt-0.5 text-slate-300" />
                          <span className="text-[10px] leading-tight">
                            {formatDateTime(log.created_at)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-start gap-1.5">
                          <User className="h-3 w-3 shrink-0 mt-0.5 text-primary/40" />
                          <div>
                            <span className="font-black text-slate-800 block leading-tight">
                              {log.admin_name}
                            </span>
                            {log.admin_phone && (
                              <span className="text-[9px] text-slate-400 font-semibold">
                                {log.admin_phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span
                          className={`inline-block text-[9px] font-black px-2.5 py-1 rounded-full border whitespace-nowrap ${actionColor}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <p className="text-[10px] font-semibold text-slate-600 leading-snug max-w-md">
                          {log.details}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-50">
            <span className="text-[10px] font-bold text-slate-400">
              Page {page} of {totalPages} · {total.toLocaleString()} total entries
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-[10px] font-black text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-[10px] font-black text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
