import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { Database, Satellite, Inbox } from "lucide-react";

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

type Step = {
  n: string;
  icon: ReactNode;
  title: string;
  body: string;
  chip: string;
  visual: ReactNode;
};

const steps: Step[] = [
  {
    n: "01",
    icon: <Database size={16} />,
    title: "We scan public records",
    body: "Every week we ingest county deed transfers, building permits, and MLS feeds across your target market — the moment a home changes hands, it's in our pipeline.",
    chip: "Sales · Permits · Tax records",
    visual: (
      <div className="relative h-full w-full overflow-hidden rounded-xl border border-ink-100 bg-ink-50/60 p-4">
        <div className="space-y-1.5 font-mono text-[11px] leading-relaxed text-ink-600">
          {[
            ["DEED", "8421 Maple Dr", "$842,000"],
            ["DEED", "112 Oak Ridge Ln", "$1.2M"],
            ["PERMIT", "44 Cedar Ct", "Pool — new"],
            ["DEED", "907 Lakeshore Blvd", "$675K"],
            ["PERMIT", "29 Sunset Way", "Roof replace"],
            ["DEED", "5510 Ash St", "$510K"],
          ].map(([type, addr, val], i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-2"
            >
              <span
                className={`rounded px-1.5 py-0.5 text-[9px] font-semibold tracking-wider ${
                  type === "DEED"
                    ? "bg-brand-100 text-brand-700"
                    : "bg-accent-400/20 text-accent-600"
                }`}
              >
                {type}
              </span>
              <span className="truncate text-ink-900">{addr}</span>
              <span className="ml-auto text-ink-500">{val}</span>
            </motion.div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-ink-50 via-ink-50/80 to-transparent" />
      </div>
    ),
  },
  {
    n: "02",
    icon: <Satellite size={16} />,
    title: "We analyze from above",
    body: "Satellite imagery reveals what's missing — no pool, no solar panels, aging roof, bare yard. A vision model flags exactly the homes that match what you sell.",
    chip: "Computer vision · 30cm imagery",
    visual: (
      <div className="relative h-full w-full overflow-hidden rounded-xl border border-ink-100 bg-[radial-gradient(120%_100%_at_30%_20%,#eef4ff_0%,#dde6f7_60%,#cfd9ee_100%)]">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 300 200"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden
        >
          {/* roof outline */}
          <polygon
            points="80,80 220,80 220,150 80,150"
            fill="rgba(255,255,255,0.7)"
            stroke="rgba(12,15,23,0.18)"
          />
          <polygon
            points="80,80 150,40 220,80"
            fill="rgba(255,255,255,0.55)"
            stroke="rgba(12,15,23,0.14)"
          />
          {/* yard */}
          <rect
            x="40"
            y="150"
            width="220"
            height="40"
            fill="rgba(163,230,53,0.18)"
            stroke="rgba(132,204,22,0.5)"
            strokeDasharray="3 3"
          />
          {/* driveway */}
          <rect x="125" y="150" width="40" height="40" fill="rgba(255,255,255,0.55)" />
        </svg>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="absolute left-3 top-3 rounded-md border border-brand-200 bg-white/90 px-2 py-1 text-[10px] font-medium text-brand-700 backdrop-blur"
        >
          ✓ No pool detected
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="absolute right-3 top-3 rounded-md border border-amber-300 bg-white/90 px-2 py-1 text-[10px] font-medium text-amber-700 backdrop-blur"
        >
          ⚠ Roof age 19y
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.7 }}
          className="absolute bottom-3 left-3 right-3 rounded-md border border-ink-100 bg-white/95 px-2 py-1.5 text-[10px] text-ink-700 backdrop-blur"
        >
          Lot 0.34ac · backyard fits 14×28 pool
        </motion.div>
      </div>
    ),
  },
  {
    n: "03",
    icon: <Inbox size={16} />,
    title: "You get qualified leads",
    body: "Name, address, property value, and what they need. Delivered to your inbox or CRM every Monday — ready for your sales team to dial.",
    chip: "CSV · CRM sync · Webhook",
    visual: (
      <div className="relative h-full w-full overflow-hidden rounded-xl border border-ink-100 bg-white">
        <div className="border-b border-ink-100 bg-ink-50/60 px-4 py-2 text-[10px] text-ink-500">
          parcel.app — Weekly delivery
        </div>
        <div className="space-y-2 p-4">
          {[
            { n: "Sarah Chen", a: "112 Oak Ridge Ln", s: "94" },
            { n: "Marcus Webb", a: "44 Cedar Ct", s: "91" },
            { n: "Lin family", a: "907 Lakeshore Blvd", s: "88" },
          ].map((l, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 + i * 0.1 }}
              className="flex items-center gap-3 rounded-lg border border-ink-100 bg-ink-50/40 px-3 py-2"
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-400 to-accent-500" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-medium text-ink-900">
                  {l.n}
                </div>
                <div className="truncate text-[10px] text-ink-500">{l.a}</div>
              </div>
              <div className="rounded-md bg-brand-100 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
                {l.s}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="relative py-24 sm:py-32">
      <div className="container-x">
        <div className="mx-auto max-w-2xl text-center">
          <span className="chip">How it works</span>
          <h2 className="mt-4 text-balance text-4xl font-semibold tracking-[-0.03em] text-ink-900 sm:text-5xl">
            From raw records to{" "}
            <span className="gradient-text">qualified leads.</span>
          </h2>
          <p className="mt-4 text-balance text-lg text-ink-500">
            Three steps. Zero cold-calling. Your sales team only talks to
            homeowners who actually need what you sell.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: easeOut }}
              className="card-interactive group relative flex flex-col"
            >
              <div className="aspect-[4/3] w-full">{s.visual}</div>
              <div className="mt-5 flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-ink-900 text-white">
                  {s.icon}
                </span>
                <span className="font-mono text-xs text-ink-500">{s.n}</span>
                <span className="ml-auto rounded-full border border-ink-100 bg-ink-50 px-2 py-0.5 text-[10px] text-ink-600">
                  {s.chip}
                </span>
              </div>
              <h3 className="mt-3 text-xl font-semibold text-ink-900">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">
                {s.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
