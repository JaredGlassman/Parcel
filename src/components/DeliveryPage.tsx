import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Download, ExternalLink, CheckCircle, Loader2, ArrowLeft } from "lucide-react";
import Logo from "./Logo";

type Lead = {
  address: string;
  city: string;
  lat: number;
  lng: number;
  signal: string;
  analysis: string;
  score: number;
  mapsUrl: string;
};

type DeliveryResponse = {
  zip: string;
  industry: string;
  count: number;
  sessionId: string;
  leads: Lead[];
  error?: string;
};

function ScoreRing({ score }: { score: number }) {
  const r = 16;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="40" height="40" viewBox="0 0 40 40" className="-rotate-90">
        <circle cx="20" cy="20" r={r} stroke="rgba(12,15,23,0.08)" strokeWidth="3" fill="none" />
        <circle cx="20" cy="20" r={r} stroke="url(#del-score-grad)" strokeWidth="3" fill="none"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
        <defs>
          <linearGradient id="del-score-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3a5dff" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute text-[11px] font-semibold text-ink-900">{score}</span>
    </div>
  );
}

function downloadCSV(leads: Lead[], industry: string, zip: string) {
  const header = "Address,City,Lat,Lng,Signal,Score,Analysis,Maps URL";
  const rows = leads.map((l) =>
    [l.address, l.city, l.lat, l.lng, l.signal, l.score, `"${l.analysis}"`, l.mapsUrl].join(",")
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `leads-${industry.replace(/\s+/g, "-").toLowerCase()}-${zip}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DeliveryPage() {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id") ?? "";
  const zip = params.get("zip") ?? "78704";
  const industry = params.get("industry") ?? "Fencing";

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [data, setData] = useState<DeliveryResponse | null>(null);
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(
          `/api/delivery?session_id=${sessionId}&zip=${encodeURIComponent(zip)}&industry=${encodeURIComponent(industry)}`
        );
        const json: DeliveryResponse = await res.json();
        if (!res.ok || json.error) {
          setErrMsg(json.error ?? `Error ${res.status}`);
          setStatus("error");
        } else {
          setData(json);
          setStatus("success");
        }
      } catch {
        setErrMsg("Network error. Please refresh the page.");
        setStatus("error");
      }
    };
    load();
  }, [sessionId, zip, industry]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-white text-ink-700 antialiased">
      <div className="pointer-events-none fixed inset-0 z-0 bg-noise opacity-[0.4]" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 sm:px-10">
        <Logo />
        <a href="/" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900 transition">
          <ArrowLeft size={14} /> Back to home
        </a>
      </nav>

      <main className="relative z-10 mx-auto max-w-4xl px-6 pb-24 pt-8">
        {status === "loading" && (
          <div className="flex flex-col items-center justify-center gap-4 py-32 text-center">
            <Loader2 size={36} className="animate-spin text-brand-500" />
            <p className="text-lg font-medium text-ink-900">Running full satellite analysis…</p>
            <p className="text-sm text-ink-500">
              Scanning {zip} · {industry} · This takes about 30–60 seconds
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center justify-center gap-4 py-32 text-center">
            <p className="text-lg font-semibold text-red-600">{errMsg}</p>
            <p className="text-sm text-ink-500">
              If payment was successful, email us at hello@getparcel.io and we'll deliver manually.
            </p>
            <a href="/" className="mt-2 text-sm text-brand-600 hover:underline">← Back to home</a>
          </div>
        )}

        {status === "success" && data && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {/* Header */}
            <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={20} className="text-green-500" />
                  <h1 className="text-xl font-semibold text-ink-900">
                    Payment confirmed — your leads are ready
                  </h1>
                </div>
                <p className="mt-1 text-sm text-ink-500">
                  {data.count} {industry} leads in {zip} · satellite-verified
                </p>
              </div>
              <button
                onClick={() => downloadCSV(data.leads, industry, zip)}
                className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(58,93,255,0.3)] transition hover:bg-brand-700"
              >
                <Download size={14} />
                Download CSV
              </button>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm">
              <div className="hidden grid-cols-12 gap-3 border-b border-ink-100 px-5 py-2.5 text-[10px] font-medium uppercase tracking-wider text-ink-500 md:grid">
                <div className="col-span-5">Address</div>
                <div className="col-span-4">Signal</div>
                <div className="col-span-2">Analysis</div>
                <div className="col-span-1 text-right">Score</div>
              </div>

              <div className="divide-y divide-ink-100">
                {data.leads.map((l, i) => (
                  <motion.div
                    key={`${l.lat}-${l.lng}`}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="grid grid-cols-12 items-center gap-3 px-5 py-4 text-sm transition hover:bg-ink-50/50"
                  >
                    <div className="col-span-12 min-w-0 md:col-span-5">
                      <div className="truncate font-medium text-ink-900">{l.address}</div>
                      <div className="flex items-center gap-1 truncate text-xs text-ink-500">
                        {l.city}
                        <a href={l.mapsUrl} target="_blank" rel="noopener noreferrer"
                          className="ml-1 inline-flex items-center gap-0.5 text-brand-600 hover:text-brand-700">
                          <ExternalLink size={10} strokeWidth={2.5} />
                        </a>
                      </div>
                    </div>
                    <div className="col-span-8 md:col-span-4">
                      <span className="rounded-md border border-ink-100 bg-ink-50 px-1.5 py-0.5 text-[10px] text-ink-700">
                        {l.signal}
                      </span>
                    </div>
                    <div className="col-span-12 text-[11px] text-ink-500 md:col-span-2">{l.analysis}</div>
                    <div className="col-span-4 flex justify-end md:col-span-1">
                      <ScoreRing score={l.score} />
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-ink-100 bg-ink-50/40 px-5 py-3 text-[11px] text-ink-500">
                <span>{data.count} leads delivered</span>
                <button onClick={() => downloadCSV(data.leads, industry, zip)}
                  className="inline-flex items-center gap-1 font-medium text-brand-600 hover:text-brand-700">
                  <Download size={11} /> Download CSV
                </button>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-ink-400">
              Questions? Email us at hello@getparcel.io — we replace leads that don't convert.
            </p>
          </motion.div>
        )}
      </main>
    </div>
  );
}
