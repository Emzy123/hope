"use client";

import { normalizeStatus, getStatusColor } from "@/lib/utils";

type BookingStatusBadgeProps = {
  status: string;
};

const labels: Record<string, string> = {
  pending: "Awaiting Response",
  accepted: "Confirmed",
  in_progress: "In Progress",
  done: "Completed",
  disputed: "Under Review",
  cancelled: "Cancelled",
  expired: "Expired",
};

export function BookingStatusBadge({ status }: BookingStatusBadgeProps) {
  const normStatus = normalizeStatus(status);
  const color = getStatusColor(normStatus);
  const label = labels[normStatus] || status;

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${color.bg} ${color.border} ${color.text}`}>
      {label}
    </span>
  );
}
