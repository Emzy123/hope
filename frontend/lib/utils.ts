export function normalizeStatus(status: string): string {
  if (!status) return "pending";
  return status.trim().toLowerCase();
}

export function getStatusColor(status: string): { bg: string; border: string; text: string } {
  const norm = normalizeStatus(status);
  switch (norm) {
    case "pending":
      return { bg: "bg-amber-50", border: "border-amber-100", text: "text-amber-700" };
    case "accepted":
      return { bg: "bg-blue-50", border: "border-blue-100", text: "text-blue-700" };
    case "in_progress":
      return { bg: "bg-purple-50", border: "border-purple-100", text: "text-purple-700" };
    case "done":
      return { bg: "bg-green-50", border: "border-green-100", text: "text-green-700" };
    case "disputed":
      return { bg: "bg-orange-50", border: "border-orange-100", text: "text-orange-700" };
    case "cancelled":
      return { bg: "bg-red-50", border: "border-red-100", text: "text-red-700" };
    case "expired":
      return { bg: "bg-slate-100", border: "border-slate-200", text: "text-slate-500" };
    default:
      return { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-700" };
  }
}
