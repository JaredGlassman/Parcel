import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";

const tiers = [
  {
    name: "Single Territory",
    price: "$1,200",
    cadence: "/mo",
    blurb:
      "One zip cluster, one industry. Perfect for owner-operators testing the channel.",
    features: [
      "Up to 75 qualified leads / month",
      "Weekly Monday delivery",
      "CSV + email",
      "Replace any non-contactable lead",
      "Email support",
    ],
    cta: "Start single territory",
    highlight: false,
  },
  {
    name: "Metro",
    price: "$3,500",
    cadence: "/mo",
    blurb:
      "Full metro coverage with priority scoring. Most popular for growing teams.",
    features: [
      "Up to 300 qualified leads / month",
      "Twice-weekly delivery",
      "CRM sync (HubSpot, Salesforce)",
      "Custom signal tuning",
      "Lead replacement guarantee",
      "Dedicated success manager",
    ],
    cta: "Lock in your metro",
    highlight: true,
  },
  {
    name: "Multi-Market",
    price: "Custom",
    cadence: "",
    blurb:
      "Multiple metros, custom verticals, and exclusivity windows for established operators.",
    features: [
      "Unlimited leads",
      "Daily webhook delivery",
      "Exclusive territory rights",
      "Custom vision model training",
      "API access",
      "White-glove onboarding",
    ],
    cta: "Talk to founders",
    highlight: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="relative py-24 sm:py-32 bg-ink-50/50">
      <div className="container-x">
        <div className="mx-auto max-w-2xl text-center">
          <span className="chip">Pricing</span>
          <h2 className="mt-4 text-balance text-4xl font-semibold tracking-[-0.03em] text-ink-900 sm:text-5xl">
            Simple,{" "}
            <span className="gradient-text">territory-exclusive</span> pricing.
          </h2>
          <p className="mt-4 text-balance text-lg text-ink-500">
            One flat monthly rate per territory. No per-lead fees, no long
            contracts. Replace any lead that doesn't reach a real person.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {tiers.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className={`relative flex flex-col rounded-2xl border p-7 transition ${
                t.highlight
                  ? "border-brand-300 bg-white shadow-[0_2px_4px_rgba(58,93,255,0.06),0_24px_60px_-20px_rgba(58,93,255,0.35)]"
                  : "border-ink-100 bg-white shadow-[0_1px_2px_rgba(12,15,23,0.04)]"
              }`}
            >
              {t.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-brand-300 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                  Most popular
                </div>
              )}
              <div className="text-sm font-medium text-ink-900">{t.name}</div>
              <div className="mt-4 flex items-baseline gap-1">
                <span
                  className={`text-5xl font-semibold tracking-[-0.04em] ${
                    t.highlight ? "gradient-text" : "text-ink-900"
                  }`}
                >
                  {t.price}
                </span>
                <span className="text-base text-ink-500">{t.cadence}</span>
              </div>
              <p className="mt-3 text-sm text-ink-500">{t.blurb}</p>

              <ul className="mt-6 space-y-3 text-sm">
                {t.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5 text-ink-700"
                  >
                    <Check
                      size={16}
                      strokeWidth={2.5}
                      className="mt-0.5 shrink-0 text-brand-600"
                    />
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href="#preview"
                className={`group mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-medium transition ${
                  t.highlight
                    ? "bg-ink-900 text-white hover:bg-ink-800"
                    : "border border-ink-200 bg-white text-ink-900 hover:border-ink-300"
                }`}
              >
                {t.cta}
                <ArrowRight
                  size={14}
                  strokeWidth={2.5}
                  className="transition group-hover:translate-x-0.5"
                />
              </a>
            </motion.div>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-ink-500">
          Month-to-month · 14-day money-back guarantee on your first delivery
        </p>
      </div>
    </section>
  );
}
