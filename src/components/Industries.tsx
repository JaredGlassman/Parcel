import { motion } from "framer-motion";
import {
  Waves,
  Sun,
  Home,
  Trees,
  Wind,
  Fence,
  ShieldCheck,
  FileText,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";

type Industry = {
  name: string;
  signal: string;
  icon: LucideIcon;
  tint: string;
  iconColor: string;
};

const industries: Industry[] = [
  { name: "Pool Builders", signal: "No pool · 0.25ac+ flat lot", icon: Waves, tint: "bg-cyan-50", iconColor: "text-cyan-600" },
  { name: "Solar Installers", signal: "South roof · no panels detected", icon: Sun, tint: "bg-amber-50", iconColor: "text-amber-600" },
  { name: "Roofing", signal: "Roof age 18yrs+", icon: Home, tint: "bg-rose-50", iconColor: "text-rose-600" },
  { name: "Landscaping", signal: "Bare yard post-move", icon: Trees, tint: "bg-emerald-50", iconColor: "text-emerald-600" },
  { name: "HVAC", signal: "Unit age + climate match", icon: Wind, tint: "bg-sky-50", iconColor: "text-sky-600" },
  { name: "Fencing", signal: "Unfenced lot · pets or kids", icon: Fence, tint: "bg-yellow-50", iconColor: "text-yellow-700" },
  { name: "Home Security", signal: "New owner · high-value home", icon: ShieldCheck, tint: "bg-violet-50", iconColor: "text-violet-600" },
  { name: "Insurance", signal: "Recent purchase trigger", icon: FileText, tint: "bg-teal-50", iconColor: "text-teal-600" },
];

export default function Industries() {
  return (
    <section id="industries" className="relative py-24 sm:py-32 bg-ink-50/50">
      <div className="container-x">
        <div className="mx-auto max-w-2xl text-center">
          <span className="chip">Built for</span>
          <h2 className="mt-4 text-balance text-4xl font-semibold tracking-[-0.03em] text-ink-900 sm:text-5xl">
            Tuned for how{" "}
            <span className="gradient-text">your industry</span> finds work.
          </h2>
          <p className="mt-4 text-balance text-lg text-ink-500">
            Each vertical gets its own scoring model. You only see homes that
            match what you actually sell.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {industries.map((it, i) => {
            const Ico = it.icon;
            return (
              <motion.div
                key={it.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.04 }}
                className="card-interactive group relative overflow-hidden"
              >
                <div
                  className={`absolute -right-8 -top-8 h-28 w-28 rounded-full ${it.tint} opacity-70 blur-2xl transition group-hover:opacity-100`}
                />
                <div
                  className={`relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-ink-100 ${it.tint}`}
                >
                  <Ico size={18} className={it.iconColor} strokeWidth={1.8} />
                </div>
                <div className="relative mt-4 text-base font-semibold text-ink-900">
                  {it.name}
                </div>
                <div className="relative mt-1 text-xs text-ink-500">
                  {it.signal}
                </div>
                <div className="relative mt-4 inline-flex items-center gap-1 text-[11px] font-medium text-brand-600 opacity-0 transition group-hover:opacity-100">
                  See sample lead
                  <ArrowUpRight size={12} strokeWidth={2.5} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
