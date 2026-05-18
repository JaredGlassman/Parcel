import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { useEffect, useRef } from "react";

function AnimatedNumber({
  value,
  formatter,
}: {
  value: number;
  formatter: (v: number) => string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { duration: 1800, bounce: 0 });
  const rounded = useTransform(spring, (v) => formatter(v));

  useEffect(() => {
    if (inView) mv.set(value);
  }, [inView, mv, value]);

  return (
    <motion.span ref={ref}>
      <motion.span>{rounded}</motion.span>
    </motion.span>
  );
}

const stats = [
  {
    value: 47000,
    label: "Qualified leads generated",
    sub: "Across our partner network this year",
    formatter: (v: number) => `${Math.round(v).toLocaleString()}+`,
  },
  {
    value: 12,
    label: "Active metro markets",
    sub: "Austin, Dallas, Phoenix, Tampa, +8 more",
    formatter: (v: number) => `${Math.round(v)}`,
  },
  {
    value: 3,
    label: "ROI vs traditional sources",
    sub: "Average multiple reported in year one",
    formatter: (v: number) => `${v.toFixed(1)}x`,
  },
];

const quotes = [
  {
    quote:
      "We were spending $80 per Angi lead and closing 4%. Parcel hands us names of people who just bought half-acre lots with no pool. We close 1 in 6.",
    name: "Mark T.",
    role: "Owner · Hill Country Pools",
  },
  {
    quote:
      "The satellite layer is the unlock. We stop wasting truck-rolls on houses that already have solar.",
    name: "Daniela R.",
    role: "VP Sales · SunPath",
  },
  {
    quote:
      "Best lead source we've tested in five years. The exclusivity per territory is what sealed it.",
    name: "Jordan K.",
    role: "Founder · BlueRidge Roofing",
  },
];

export default function Stats() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="container-x">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl border border-ink-100 bg-white p-10 shadow-[0_1px_2px_rgba(12,15,23,0.04),0_24px_60px_-30px_rgba(58,93,255,0.25)] sm:p-14"
        >
          <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-brand-200/40 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-accent-400/25 blur-3xl" />

          <div className="relative grid gap-10 md:grid-cols-3 md:gap-6">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + i * 0.08, duration: 0.6 }}
                className="flex flex-col"
              >
                <div className="gradient-text text-5xl font-semibold tracking-[-0.04em] sm:text-6xl">
                  <AnimatedNumber value={s.value} formatter={s.formatter} />
                </div>
                <div className="mt-3 text-base font-medium text-ink-900">
                  {s.label}
                </div>
                <div className="mt-1 text-sm text-ink-500">{s.sub}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {quotes.map((q, i) => (
            <motion.figure
              key={q.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="card flex flex-col"
            >
              <blockquote className="text-sm leading-relaxed text-ink-700">
                &ldquo;{q.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-4 flex items-center gap-3 border-t border-ink-100 pt-4">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-400 to-accent-500" />
                <div>
                  <div className="text-xs font-medium text-ink-900">
                    {q.name}
                  </div>
                  <div className="text-[11px] text-ink-500">{q.role}</div>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
