import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, ChevronDown, Loader2, MapPin,
  ExternalLink, Lock, Mail, Download, User, Building2, Phone,
} from "lucide-react";

type ApiLead = {
  address: string;
  city: string;
  lat: number;
  lng: number;
  signal: string;
  analysis: string;
  score: number;
  mapsUrl: string;
  ownerName?: string;
  mailingAddress?: string;
  salePrice?: number;
  saleDate?: string;
  yearBuilt?: string;
  bedrooms?: string;
  bathrooms?: string;
  lotSize?: string;
  livingArea?: string;
  apn?: string;
  daysSinceSale?: number | null;
  priceVariance?: number | null;
  neighborhoodAvgPrice?: number;
};

const INDUSTRIES = ["Fencing", "Pool Builders", "Solar", "Roofing", "Landscaping", "HVAC"];
const PREVIEW_LIMIT = 3;
const FULL_LIMIT = 10;

function fmt(n: number | string | undefined, suffix = "") {
  if (!n || n === "0" || n === 0) return null;
  return `${Number(n).toLocaleString()}${suffix}`;
}
function fmtPrice(n: number | undefined) {
  if (!n || n === 0) return null;
  return n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${Math.round(n / 1000)}K`;
}
function fmtAcres(sqft: string | undefined) {
  if (!sqft || sqft === "0") return null;
  const ac = parseFloat(sqft) / 43560;
  return ac >= 0.1 ? `${ac.toFixed(2)} ac` : `${parseInt(sqft).toLocaleString()} sqft lot`;
}
function fmtAge(days: number | null | undefined) {
  if (days == null) return null;
  if (days < 14) return `Sold ${days}d ago`;
  if (days < 60) return `Sold ${Math.round(days / 7)}wk ago`;
  if (days < 365) return `Sold ${Math.round(days / 30)}mo ago`;
  return `Sold ${Math.round(days / 365)}yr ago`;
}

function verticalStats(l: ApiLead, industry: string): string[] {
  const price = fmtPrice(l.salePrice);
  const variance = l.priceVariance != null
    ? `${l.priceVariance > 0 ? "+" : ""}${l.priceVariance}% vs. neighborhood`
    : null;
  const sold = fmtAge(l.daysSinceSale);
  const sqft = fmt(l.livingArea, " sqft");
  const acres = fmtAcres(l.lotSize);
  const built = l.yearBuilt ? `Built ${l.yearBuilt}` : null;
  const beds = l.bedrooms && l.bathrooms ? `${l.bedrooms}bd / ${l.bathrooms}ba` : null;

  switch (industry) {
    case "Fencing":
      return [acres, sold, price, variance].filter(Boolean) as string[];
    case "Pool Builders":
      return [acres, price, variance, sold].filter(Boolean) as string[];
    case "Solar":
      return [sqft, built, price, variance].filter(Boolean) as string[];
    case "Roofing":
      return [sqft, built, sold, price].filter(Boolean) as string[];
    case "Landscaping":
      return [acres, built, price, variance].filter(Boolean) as string[];
    case "HVAC":
      return [sqft, beds, built, price].filter(Boolean) as string[];
    default:
      return [price, sold, built].filter(Boolean) as string[];
  }
}

function ScoreRing({ score }: { score: number }) {
  const r = 16, circ = 2 * Math.PI * r, dash = (score / 100) * circ;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="40" height="40" viewBox="0 0 40 40" className="-rotate-90">
        <circle cx="20" cy="20" r={r} stroke="rgba(12,15,23,0.08)" strokeWidth="3" fill="none" />
        <circle cx="20" cy="20" r={r} stroke="url(#sg)" strokeWidth="3" fill="none"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
        <defs>
          <linearGradient id="sg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3a5dff" /><stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute text-[11px] font-semibold text-ink-900">{score}</span>
    </div>
  );
}

function LeadRow({ l, i, industry }: { l: ApiLead; i: number; industry: string }) {
  const stats = verticalStats(l, industry);
  return (
    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: i * 0.06 }}
      className="px-5 py-4 text-sm transition hover:bg-ink-50/50">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-medium text-ink-900">{l.address}</span>
            {l.ownerName && (
              <span className="text-xs text-ink-400 shrink-0">{l.ownerName}</span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-ink-500 mt-0.5">
            <span className="truncate">{l.city}</span>
            <a href={l.mapsUrl} target="_blank" rel="noopener noreferrer"
              className="ml-1 inline-flex items-center text-brand-600 hover:text-brand-700">
              <ExternalLink size={10} strokeWidth={2.5} />
            </a>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="rounded-md border border-ink-200 bg-ink-50 px-1.5 py-0.5 text-[10px] font-medium text-ink-700">
              {l.signal}
            </span>
            {stats.map((s, si) => (
              <span key={si} className="rounded-md border border-ink-100 bg-white px-1.5 py-0.5 text-[10px] text-ink-500">
                {s}
              </span>
            ))}
          </div>
          {l.analysis && (
            <p className="mt-1.5 text-[11px] text-ink-400 italic">{l.analysis}</p>
          )}
        </div>
        <div className="shrink-0 pt-0.5"><ScoreRing score={l.score} /></div>
      </div>
    </motion.div>
  );
}

function LockedRows({ count, onUnlock }: { count: number; onUnlock: () => void }) {
  return (
    <div className="relative">
      {Array.from({ length: Math.min(count, 4) }).map((_, i) => (
        <div key={i} className="px-5 py-4"
          style={{ filter: "blur(4px)", opacity: Math.max(0.05, 0.35 - i * 0.08) }}>
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="h-3.5 w-36 rounded bg-ink-200" />
              <div className="h-3.5 w-24 rounded bg-ink-100" />
            </div>
            <div className="flex gap-1.5">
              <div className="h-5 w-20 rounded-md bg-ink-100" />
              <div className="h-5 w-16 rounded-md bg-ink-100" />
              <div className="h-5 w-24 rounded-md bg-ink-100" />
            </div>
          </div>
        </div>
      ))}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-white/50 via-white/90 to-white px-6 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100">
          <Lock size={18} className="text-brand-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-ink-900">{count} more qualified leads waiting</p>
          <p className="mt-0.5 text-xs text-ink-500">Real addresses · satellite-verified · free with your contact info</p>
        </div>
        <button onClick={onUnlock}
          className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(58,93,255,0.35)] transition hover:bg-brand-700">
          Get all {count + PREVIEW_LIMIT} leads — free
          <ArrowRight size={14} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

function CaptureModal({
  zip, industry, onClose, onDelivered,
}: {
  zip: string; industry: string;
  onClose: () => void;
  onDelivered: (leads: ApiLead[], analyzed: number) => void;
}) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) { setErr("Enter a valid email address."); return; }
    if (phone.replace(/\D/g, "").length < 10) { setErr("Enter a valid US phone number."); return; }
    setLoading(true); setErr("");
    try {
      const res = await fetch("/api/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone, name, company, zip, industry }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setErr(data.error ?? "Something went wrong."); setLoading(false); return; }
      onDelivered(data.leads, data.analyzed);
    } catch {
      setErr("Network error — make sure the dev server is running.");
      setLoading(false);
    }
  };

  const fields = [
    { icon: Mail, placeholder: "you@company.com", value: email, set: setEmail, type: "email", label: "Work email *" },
    { icon: Phone, placeholder: "(555) 000-0000", value: phone, set: setPhone, type: "tel", label: "Phone number *" },
    { icon: User, placeholder: "Your name", value: name, set: setName, type: "text", label: "Name" },
    { icon: Building2, placeholder: "Company", value: company, set: setCompany, type: "text", label: "Company" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 px-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        <div className="text-center">
          <div className="text-lg font-semibold text-ink-900">Unlock your {FULL_LIMIT} free leads</div>
          <div className="mt-1 text-sm text-ink-500">{industry} · {zip} · satellite-verified</div>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-3">
          {fields.map(({ icon: Icon, placeholder, value, set, type, label }) => (
            <div key={label}>
              <label className="block text-xs font-medium text-ink-700">{label}</label>
              <div className="relative mt-1">
                <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <input type={type} value={value} onChange={(e) => set(e.target.value)}
                  placeholder={placeholder}
                  className="w-full rounded-xl border border-ink-200 bg-white py-3 pl-9 pr-4 text-sm text-ink-900 placeholder:text-ink-400 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" />
              </div>
            </div>
          ))}

          {err && <p className="text-xs text-red-500">{err}</p>}

          <button type="submit" disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 py-3 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(58,93,255,0.3)] transition hover:bg-brand-700 disabled:opacity-60">
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? "Running satellite analysis…" : `Get my ${FULL_LIMIT} free leads →`}
          </button>
          <p className="text-center text-[11px] text-ink-400">No spam. No payment. Leads delivered instantly.</p>
        </form>
        <button onClick={onClose} className="mt-3 w-full text-center text-xs text-ink-400 hover:text-ink-600">Cancel</button>
      </motion.div>
    </div>
  );
}

function downloadCSV(leads: ApiLead[], industry: string, zip: string) {
  const header = "Address,City,Owner,Mailing Address,Sale Price,Sale Date,Days Since Sale,Price vs Neighborhood,Year Built,Beds,Baths,Lot Size (sqft),Living Area (sqft),Signal,Score,Analysis,Maps URL";
  const rows = leads.map((l) => [
    l.address, l.city, l.ownerName ?? "", l.mailingAddress ?? "",
    l.salePrice ?? "", l.saleDate ?? "",
    l.daysSinceSale ?? "", l.priceVariance != null ? `${l.priceVariance}%` : "",
    l.yearBuilt ?? "", l.bedrooms ?? "", l.bathrooms ?? "",
    l.lotSize ?? "", l.livingArea ?? "",
    l.signal, l.score, `"${l.analysis}"`, l.mapsUrl,
  ].join(","));
  const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `leads-${industry.replace(/\s+/g, "-").toLowerCase()}-${zip}.csv` });
  a.click(); URL.revokeObjectURL(a.href);
}

export default function LeadPreview() {
  const [industry, setIndustry] = useState("Fencing");
  const [zip, setZip] = useState("");
  const [scanning, setScanning] = useState(false);
  const [preview, setPreview] = useState<ApiLead[] | null>(null);
  const [fullLeads, setFullLeads] = useState<ApiLead[] | null>(null);
  const [analyzed, setAnalyzed] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const displayZip = zip.trim() || "78704";

  const onScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setScanning(true); setErr(null); setPreview(null); setFullLeads(null);
    try {
      const res = await fetch(`/api/leads?zip=${displayZip}&industry=${encodeURIComponent(industry)}&limit=${PREVIEW_LIMIT}`);
      const data = await res.json();
      if (!res.ok || data.error) { setErr(data.error ?? `Error ${res.status}`); }
      else { setPreview(data.leads); setAnalyzed(data.analyzed ?? 0); }
    } catch { setErr("Network error — run `npm run dev` to start the local server."); }
    finally { setScanning(false); }
  };

  const onDelivered = (leads: ApiLead[], analyzedCount: number) => {
    setFullLeads(leads); setAnalyzed(analyzedCount); setShowModal(false);
  };

  const leads = fullLeads ?? preview ?? [];
  const isDelivered = !!fullLeads;
  const lockedCount = isDelivered ? 0 : (preview ? FULL_LIMIT - preview.length : 0);

  return (
    <>
      {showModal && (
        <CaptureModal zip={displayZip} industry={industry}
          onClose={() => setShowModal(false)} onDelivered={onDelivered} />
      )}

      <section id="preview" className="relative py-24 sm:py-32">
        <div className="absolute inset-0 -z-10 mesh-bg opacity-70" />
        <div className="container-x">
          <div className="mx-auto max-w-2xl text-center">
            <span className="chip">See it live</span>
            <h2 className="mt-4 text-balance text-4xl font-semibold tracking-[-0.03em] text-ink-900 sm:text-5xl">
              Preview leads in your <span className="gradient-text">market.</span>
            </h2>
            <p className="mt-4 text-balance text-lg text-ink-500">
              Real satellite analysis. Get {FULL_LIMIT} qualified leads free — just enter your contact info.
            </p>
          </div>

          <div className="mt-14 grid items-start gap-6 lg:grid-cols-[320px_1fr]">
            {/* Form */}
            <motion.form onSubmit={onScan}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.6 }} className="card">
              <div className="text-sm font-semibold text-ink-900">
                {isDelivered ? "Your leads are ready" : "Get free leads"}
              </div>
              <div className="mt-1 text-xs text-ink-500">
                {isDelivered ? `${fullLeads!.length} leads delivered · ${analyzed} properties scanned` : "Live satellite analysis · no credit card"}
              </div>

              <label className="mt-6 block text-xs font-medium text-ink-700">Industry</label>
              <div className="relative mt-2">
                <select value={industry} onChange={(e) => { setIndustry(e.target.value); setPreview(null); setFullLeads(null); }}
                  className="w-full appearance-none rounded-xl border border-ink-200 bg-white px-4 py-3 pr-10 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100">
                  {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-400" />
              </div>

              <label className="mt-5 block text-xs font-medium text-ink-700">Zip code</label>
              <input value={zip} onChange={(e) => setZip(e.target.value.replace(/[^0-9]/g, "").slice(0, 5))}
                placeholder="78704" inputMode="numeric"
                className="mt-2 w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100" />

              {!isDelivered && (
                <button type="submit" disabled={scanning}
                  className="group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-ink-800 disabled:opacity-60">
                  {scanning ? <><Loader2 size={14} className="animate-spin" />Scanning…</> : <>Preview {PREVIEW_LIMIT} leads <ArrowRight size={14} strokeWidth={2.5} className="transition group-hover:translate-x-0.5" /></>}
                </button>
              )}

              {preview && !isDelivered && (
                <button type="button" onClick={() => setShowModal(true)}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(58,93,255,0.3)] transition hover:bg-brand-700">
                  Get all {FULL_LIMIT} leads free →
                </button>
              )}

              {isDelivered && (
                <>
                  <button type="button" onClick={() => downloadCSV(fullLeads!, industry, displayZip)}
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(58,93,255,0.3)] transition hover:bg-brand-700">
                    <Download size={14} /> Download CSV
                  </button>
                  <button type="submit" disabled={scanning}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-ink-200 px-4 py-2.5 text-sm text-ink-600 transition hover:bg-ink-50">
                    Rescan different zip
                  </button>
                </>
              )}

              <p className="mt-4 text-[11px] leading-relaxed text-ink-400">
                Powered by Google Maps satellite imagery and Claude vision.
              </p>
            </motion.form>

            {/* Results panel */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}
              className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-[0_1px_2px_rgba(12,15,23,0.04),0_20px_60px_-30px_rgba(58,93,255,0.25)]">

              <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-brand-100 px-2 py-0.5 text-[10px] font-semibold text-brand-700">{industry}</span>
                  <span className="text-xs text-ink-500">{displayZip} · {isDelivered ? "full delivery" : "live scan"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-brand-600">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
                  </span>
                  {scanning ? "Scanning…" : isDelivered ? `${leads.length} leads delivered` : `${leads.length} preview`}
                </div>
              </div>

              <AnimatePresence mode="wait">
                {scanning && (
                  <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center gap-3 px-5 py-16 text-center">
                    <Loader2 size={28} className="animate-spin text-brand-500" />
                    <p className="text-sm text-ink-500">Running satellite analysis…</p>
                    <p className="text-xs text-ink-400">Usually 15–30 seconds</p>
                  </motion.div>
                )}
                {err && !scanning && (
                  <motion.div key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="px-5 py-12 text-center">
                    <p className="text-sm font-medium text-red-600">{err}</p>
                    <p className="mt-1 text-xs text-ink-400">Run <code className="font-mono text-ink-600">npm run dev</code> then try again.</p>
                  </motion.div>
                )}
                {!scanning && !err && leads.length === 0 && (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center gap-3 px-5 py-16 text-center">
                    <MapPin size={28} className="text-ink-300" />
                    <p className="text-sm text-ink-400">Enter a zip code and click "Preview leads".</p>
                  </motion.div>
                )}
                {!scanning && leads.length > 0 && (
                  <motion.div key="leads" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="divide-y divide-ink-100">
                      {leads.map((l, i) => <LeadRow key={`${l.lat}-${l.lng}-${i}`} l={l} i={i} industry={industry} />)}
                    </div>
                    {lockedCount > 0 && (
                      <div className="border-t border-ink-100">
                        <LockedRows count={lockedCount} onUnlock={() => setShowModal(true)} />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between border-t border-ink-100 bg-ink-50/40 px-5 py-3 text-[11px] text-ink-500">
                <span>{isDelivered ? `${leads.length} leads · CSV ready` : `${FULL_LIMIT} total leads available`}</span>
                {!isDelivered && (
                  <button onClick={() => preview && setShowModal(true)}
                    className="inline-flex items-center gap-1 font-medium text-brand-600 hover:text-brand-700">
                    Get free leads <ArrowRight size={12} strokeWidth={2.5} />
                  </button>
                )}
                {isDelivered && (
                  <button onClick={() => downloadCSV(fullLeads!, industry, displayZip)}
                    className="inline-flex items-center gap-1 font-medium text-brand-600 hover:text-brand-700">
                    <Download size={11} /> Download CSV
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
