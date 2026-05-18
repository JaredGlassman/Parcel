import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Building2, ChevronDown, Loader2, Mail, MapPin, X } from "lucide-react";

const INDUSTRIES = ["Fencing", "Pool Builders", "Solar", "Roofing", "Landscaping", "HVAC"];

const PLAN_INFO = {
  starter: { label: "Single Territory", price: "$1,200/mo", blurb: "1 zip code · 75 leads/month · exclusive territory" },
  metro: { label: "Metro", price: "$3,500/mo", blurb: "Full metro coverage · 300 leads/month · exclusive" },
};

export default function CheckoutModal({
  plan,
  defaultIndustry = "Fencing",
  onClose,
}: {
  plan: "starter" | "metro";
  defaultIndustry?: string;
  onClose: () => void;
}) {
  const info = PLAN_INFO[plan];
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [zip, setZip] = useState("");
  const [industry, setIndustry] = useState(defaultIndustry);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) { setErr("Valid email required."); return; }
    if (zip.length !== 5) { setErr("Enter a 5-digit zip code."); return; }
    setLoading(true); setErr("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, zip, industry, email, company }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setErr(data.error ?? "Something went wrong."); setLoading(false); return; }
      window.location.href = data.url;
    } catch {
      setErr("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 px-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="text-lg font-semibold text-ink-900">{info.label}</div>
            <div className="mt-0.5 text-sm text-ink-500">{info.blurb}</div>
          </div>
          <button onClick={onClose} className="ml-4 rounded-full p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-600">
            <X size={16} />
          </button>
        </div>

        <div className="mt-3 inline-block rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">
          {info.price}
        </div>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <div>
            <label className="block text-xs font-medium text-ink-700">Work email *</label>
            <div className="relative mt-1">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com"
                className="w-full rounded-xl border border-ink-200 bg-white py-3 pl-9 pr-4 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-700">Company name</label>
            <div className="relative mt-1">
              <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder="Acme Fencing Co."
                className="w-full rounded-xl border border-ink-200 bg-white py-3 pl-9 pr-4 text-sm outline-none focus:border-brand-500 focus:ring-brand-100 focus:ring-4" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink-700">Zip code *</label>
              <div className="relative mt-1">
                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <input type="text" inputMode="numeric" value={zip}
                  onChange={e => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
                  placeholder="78704"
                  className="w-full rounded-xl border border-ink-200 bg-white py-3 pl-9 pr-4 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-700">Industry *</label>
              <div className="relative mt-1">
                <select value={industry} onChange={e => setIndustry(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-ink-200 bg-white py-3 pl-3 pr-8 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100">
                  {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
              </div>
            </div>
          </div>

          {err && <p className="text-xs text-red-500">{err}</p>}

          <button type="submit" disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 py-3 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(58,93,255,0.3)] transition hover:bg-brand-700 disabled:opacity-60">
            {loading ? <><Loader2 size={14} className="animate-spin" />Redirecting to checkout…</> : <>Lock in {info.label} <ArrowRight size={14} strokeWidth={2.5} /></>}
          </button>
          <p className="text-center text-[11px] text-ink-400">Powered by Stripe · cancel anytime</p>
        </form>
      </motion.div>
    </div>
  );
}
