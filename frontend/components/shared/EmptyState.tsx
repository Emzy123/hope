"use client";

import Link from "next/link";
import { type LucideIcon } from "lucide-react";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
};

export function EmptyState({ icon: Icon, title, description, ctaLabel, ctaHref, onCtaClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-200 rounded-3xl bg-white max-w-md mx-auto my-6 animate-fade-in">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/5 text-primary mb-4">
        <Icon className="h-6 w-6 stroke-[1.75]" />
      </div>
      <h3 className="text-sm font-black text-slate-800 leading-tight">{title}</h3>
      <p className="text-[11px] font-semibold text-slate-500 mt-1 max-w-xs leading-4">{description}</p>
      
      {ctaLabel && (
        onCtaClick ? (
          <button
            type="button"
            onClick={onCtaClick}
            className="mt-5 rounded-xl bg-primary text-white hover:bg-primary-dark px-5 py-2.5 text-xs font-black shadow-sm transition-all cursor-pointer"
          >
            {ctaLabel}
          </button>
        ) : ctaHref ? (
          <Link
            href={ctaHref}
            className="mt-5 rounded-xl bg-primary text-white hover:bg-primary-dark px-5 py-2.5 text-xs font-black shadow-sm transition-all"
          >
            {ctaLabel}
          </Link>
        ) : null
      )}
    </div>
  );
}
