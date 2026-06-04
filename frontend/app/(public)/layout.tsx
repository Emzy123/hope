"use client";

import { AppNavbar } from "@/components/shared/AppNavbar";
import { Footer } from "@/components/shared/Footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <AppNavbar />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
}
