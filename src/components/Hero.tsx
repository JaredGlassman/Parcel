import { motion } from "framer-motion";
import { ArrowRight, Check, Radar } from "lucide-react";

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fade = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: 0.1 + i * 0.08, ease: easeOut },
  }),
};

function SatelliteVisual() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.9, delay: 0.35, ease: easeOut }}
      className="relative mx-auto mt-16 w-full max-w-5xl"
    >
      {/* halo behind */}
      <div className="absolute -inset-x-10 -top-10 -z-10 h-72 bg-gradient-to-b from-brand-200/40 via-accent-400/15 to-transparent blur-3xl" />

      <div className="relative overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-[0_30px_80px_-30px_rgba(58,93,255,0.35)]">
        {/* Browser chrome */}
        <div className="flex items-center justify-between border-b border-ink-100 bg-ink-50/60 px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-ink-200" />
            <div className="h-2.5 w-2.5 rounded-full bg-ink-200" />
            <div className="h-2.5 w-2.5 rounded-full bg-ink-200" />
          </div>
          <div className="rounded-md border border-ink-100 bg-white px-3 py-1 font-mono text-[11px] text-ink-500">
            parcel.app/scan/austin-tx
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-brand-600">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
            </span>
            live
          </div>
        </div>

        {/* Map area */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-[radial-gradient(120%_80%_at_20%_30%,#eef4ff_0%,#e6efff_50%,#dde6f7_100%)]">
          {/* grid */}
          <div className="absolute inset-0 opacity-60 bg-[linear-gradient(rgba(12,15,23,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(12,15,23,0.05)_1px,transparent_1px)] bg-[size:48px_48px]" />

          {/* fake roads */}
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 800 450" preserveAspectRatio="none" aria-hidden>
            <path d="M0,120 Q200,90 400,140 T800,180" stroke="rgba(255,255,255,0.9)" strokeWidth="22" fill="none" />
            <path d="M0,300 Q300,250 500,320 T800,300" stroke="rgba(255,255,255,0.75)" strokeWidth="18" fill="none" />
            <path d="M180,0 Q220,200 160,450" stroke="rgba(255,255,255,0.85)" strokeWidth="14" fill="none" />
            <path d="M600,0 Q560,200 640,450" stroke="rgba(255,255,255,0.75)" strokeWidth="14" fill="none" />
          </svg>

          {/* fake parcel rectangles */}
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 800 450" preserveAspectRatio="none" aria-hidden>
            {[
              [80, 60, 60, 50], [160, 70, 50, 50], [230, 60, 60, 60], [310, 70, 50, 50],
              [380, 60, 70, 60], [470, 70, 60, 50], [560, 60, 60, 60],
              [80, 200, 70, 60], [170, 210, 70, 50], [260, 200, 60, 60],
              [340, 210, 60, 50], [420, 200, 80, 60], [520, 210, 60, 50], [600, 200, 80, 60],
              [80, 350, 70, 50], [170, 340, 60, 60], [250, 350, 70, 50],
              [340, 340, 70, 60], [430, 350, 60, 50], [510, 340, 70, 60], [600, 350, 70, 50],
            ].map(([x, y, w, h], i) => (
              <rect
                key={i}
                x={x}
                y={y}
                width={w}
                height={h}
                fill="rgba(255,255,255,0.55)"
                stroke="rgba(12,15,23,0.10)"
              />
            ))}
          </svg>

          {/* highlighted leads */}
          {[
            { left: "18%", top: "26%", label: "$842K · sold 9d ago" },
            { left: "46%", top: "44%", label: "Pool · open backyard" },
            { left: "72%", top: "62%", label: "Roof · 22yrs old" },
          ].map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.95 + i * 0.22, duration: 0.5 }}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: m.left, top: m.top }}
            >
              <div className="relative">
                <div className="absolute inset-0 -m-3 animate-parcel-pulse rounded-full bg-brand-500/40 blur-sm" />
                <div className="relative h-3 w-3 rounded-full bg-brand-500 ring-4 ring-brand-500/25" />
              </div>
              <div className="absolute left-5 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md border border-ink-100 bg-white/95 px-2 py-1 text-[10px] font-medium text-ink-800 shadow-md backdrop-blur">
                {m.label}
              </div>
            </motion.div>
          ))}

          {/* scan beam */}
          <motion.div
            initial={{ y: "-20%" }}
            animate={{ y: "120%" }}
            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
            className="pointer-events-none absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-brand-400/25 to-transparent"
          />

          {/* legend */}
          <div className="absolute bottom-3 left-3 flex items-center gap-3 rounded-lg border border-ink-100 bg-white/90 px-3 py-1.5 text-[11px] text-ink-700 backdrop-blur">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-brand-500" />
              Qualified
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-ink-300" />
              Scanned
            </div>
          </div>
          <div className="absolute bottom-3 right-3 rounded-lg border border-ink-100 bg-white/90 px-3 py-1.5 font-mono text-[10px] text-ink-600 backdrop-blur">
            12,847 parcels · 3 qualified
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28"
    >
      <div className="mesh-bg absolute inset-0 -z-20" />
      <div className="grid-bg absolute inset-0 -z-10" />

      <div className="container-x">
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
          className="flex flex-col items-center text-center"
        >
          <motion.a
            variants={fade}
            href="#how"
            className="group mb-6 inline-flex items-center gap-2 rounded-full border border-ink-200/80 bg-white/70 px-3 py-1 text-xs text-ink-600 backdrop-blur transition hover:border-brand-300 hover:bg-brand-50/60"
          >
            <Radar size={12} className="text-brand-600" />
            Now scanning 12 metros — see how it works
            <ArrowRight
              size={12}
              strokeWidth={2.5}
              className="transition group-hover:translate-x-0.5"
            />
          </motion.a>

          <motion.h1
            variants={fade}
            className="text-balance text-5xl font-semibold leading-[1.02] tracking-[-0.04em] text-ink-900 sm:text-6xl md:text-7xl"
          >
            Your next customer
            <br className="hidden sm:block" />{" "}
            <span className="gradient-text">just bought a house.</span>
          </motion.h1>

          <motion.p
            variants={fade}
            className="mt-6 max-w-2xl text-balance text-lg leading-relaxed text-ink-500 sm:text-xl"
          >
            Parcel uses public home sales data and satellite imagery to find
            homeowners who need your service — before they start searching.
          </motion.p>

          <motion.div
            variants={fade}
            className="mt-9 flex flex-col items-center gap-3 sm:flex-row"
          >
            <a
              href="#preview"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-ink-900 px-6 py-3.5 text-base font-medium text-white shadow-[0_10px_30px_-8px_rgba(12,15,23,0.4)] transition hover:-translate-y-0.5 hover:bg-ink-800 hover:shadow-[0_16px_40px_-10px_rgba(58,93,255,0.5)]"
            >
              See leads in your market
              <ArrowRight
                size={16}
                strokeWidth={2.5}
                className="transition group-hover:translate-x-0.5"
              />
            </a>
            <a
              href="#how"
              className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white/70 px-6 py-3.5 text-base font-medium text-ink-900 backdrop-blur transition hover:-translate-y-0.5 hover:border-ink-300"
            >
              How it works
            </a>
          </motion.div>

          <motion.div
            variants={fade}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs text-ink-500"
          >
            {[
              "No long-term contracts",
              "Replace leads that don't convert",
              "Setup in 48 hours",
            ].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5">
                <Check size={14} strokeWidth={2.5} className="text-brand-600" />
                {t}
              </span>
            ))}
          </motion.div>
        </motion.div>

        <SatelliteVisual />
      </div>
    </section>
  );
}
