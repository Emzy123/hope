import type { Metadata } from "next";
import { AuthProvider } from "@/lib/AuthContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "SkillBridge — Find Trusted Skilled Workers in Nigeria",
  description: "Book verified plumbers, electricians, carpenters and 60+ more services. Secure escrow payments via Paystack. Nigeria-first, Pan-African Vision.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

