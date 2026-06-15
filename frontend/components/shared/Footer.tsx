import Link from "next/link";
import { Sparkle, Mail, Phone, MapPin, Twitter, Instagram, Linkedin, Facebook } from "lucide-react";

const SERVICES = ["Plumbing", "Electrical", "Carpentry", "AC Repair", "Cleaning", "Painting", "Tailoring", "Catering", "Welding", "Tiling"];
const CITIES = ["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Kano", "Enugu", "Benin City"];

export function Footer() {
  return (
    <footer className="bg-slate-900 text-white">
      {/* Main grid */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 grid gap-12 md:grid-cols-2 lg:grid-cols-4">
        {/* Brand */}
        <div className="space-y-4 lg:col-span-1">
          <Link href="/" className="flex items-center gap-2.5 group w-fit">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[#0f3d26] shadow-lg group-hover:scale-105 transition-transform">
              <Sparkle className="h-5 w-5 text-amber-400 fill-amber-400" />
            </span>
            <span className="text-xl font-black tracking-tight">SkillBridge</span>
          </Link>
          <p className="text-sm text-slate-400 font-medium leading-6 max-w-xs">
            Nigeria&apos;s most trusted platform for hiring KYC-verified skilled workers — from Lagos to Kano.
          </p>
          {/* Contact */}
          <div className="space-y-2 pt-2">
            <a href="mailto:hello@skillbridge.ng" className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors font-medium">
              <Mail className="h-3.5 w-3.5 text-primary-light" />
              hello@skillbridge.ng
            </a>
            <a href="tel:+2348001234567" className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors font-medium">
              <Phone className="h-3.5 w-3.5 text-primary-light" />
              +234 800 123 4567
            </a>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <MapPin className="h-3.5 w-3.5 text-primary-light shrink-0" />
              Victoria Island, Lagos State
            </div>
          </div>
          {/* Social */}
          <div className="flex items-center gap-3 pt-2">
            {[
              { icon: Twitter, label: "Twitter", href: "#" },
              { icon: Instagram, label: "Instagram", href: "#" },
              { icon: Facebook, label: "Facebook", href: "#" },
              { icon: Linkedin, label: "LinkedIn", href: "#" },
            ].map(({ icon: Icon, label, href }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 hover:bg-primary transition-colors text-slate-400 hover:text-white"
              >
                <Icon className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
        </div>

        {/* Services */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Services</h3>
          <ul className="space-y-2">
            {SERVICES.map(s => (
              <li key={s}>
                <Link
                  href={`/browse?category=${s.toLowerCase()}`}
                  className="text-sm text-slate-400 hover:text-white transition-colors font-medium"
                >
                  {s}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Cities */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Available Cities</h3>
          <ul className="space-y-2">
            {CITIES.map(c => (
              <li key={c}>
                <Link
                  href={`/browse?city=${c}`}
                  className="text-sm text-slate-400 hover:text-white transition-colors font-medium"
                >
                  {c}
                </Link>
              </li>
            ))}
          </ul>
          <div className="pt-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">Company</h3>
            <ul className="space-y-2">
              {["About Us", "How It Works", "Blog", "Careers"].map(l => (
                <li key={l}>
                  <Link href="#" className="text-sm text-slate-400 hover:text-white transition-colors font-medium">{l}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTA Newsletter */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Get the App</h3>
          <p className="text-sm text-slate-400 font-medium leading-6">
            SkillBridge mobile app coming soon on Android & iOS. Drop your email to be notified first.
          </p>
          <form className="space-y-2" onSubmit={e => e.preventDefault()}>
            <input
              type="email"
              placeholder="your@email.com"
              className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-xs font-semibold text-white placeholder:text-slate-500 outline-none focus:border-primary transition-colors"
            />
            <button
              type="submit"
              className="w-full rounded-xl bg-primary hover:bg-primary-dark py-3 text-xs font-black text-white transition-all"
            >
              Notify Me
            </button>
          </form>

          <div className="pt-4 space-y-3 border-t border-slate-800">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">For Workers</h3>
            <Link
              href="/register?role=worker"
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-colors px-4 py-2.5 text-xs font-black"
            >
              Apply as an Artisan →
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500 font-medium">
            © 2026 SkillBridge Nigeria Ltd. All rights reserved. Nigeria-first • Pan-African Vision.
          </p>
          <div className="flex items-center gap-5">
            {["Privacy Policy", "Terms of Service", "Help Centre"].map(l => (
              <Link key={l} href="#" className="text-xs text-slate-500 hover:text-slate-300 transition-colors font-medium">
                {l}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
