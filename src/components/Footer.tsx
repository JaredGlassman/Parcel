import { ArrowRight } from "lucide-react";
import Logo from "./Logo";

const cols: ReadonlyArray<{
  title: string;
  links: ReadonlyArray<readonly [string, string]>;
}> = [
  {
    title: "Product",
    links: [
      ["How it works", "#how"],
      ["Industries", "#industries"],
      ["Sample leads", "#preview"],
      ["Pricing", "#pricing"],
    ],
  },
  {
    title: "Company",
    links: [
      ["About", "#"],
      ["Markets", "#"],
      ["Careers", "#"],
      ["Contact", "mailto:hello@getparcel.io"],
    ],
  },
  {
    title: "Legal",
    links: [
      ["Data sources", "#"],
      ["Privacy", "#"],
      ["Terms", "#"],
      ["CCPA / GDPR", "#"],
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-ink-100 pt-20 pb-12">
      <div className="container-x">
        {/* CTA banner */}
        <div className="relative mb-20 overflow-hidden rounded-3xl border border-ink-100 bg-gradient-to-br from-ink-900 via-ink-900 to-ink-800 px-8 py-12 text-center sm:px-16 sm:py-16">
          <div className="absolute -right-32 -top-32 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 h-72 w-72 rounded-full bg-accent-500/20 blur-3xl" />
          <h3 className="relative text-balance text-3xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">
            Stop chasing.
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(110deg, #bbcdff 0%, #5e83ff 45%, #22d3ee 100%)",
              }}
            >
              Start closing.
            </span>
          </h3>
          <p className="relative mx-auto mt-5 max-w-xl text-balance text-base text-ink-300 sm:text-lg">
            Get a free sample of qualified leads in your market. No credit card,
            no calls — just the data.
          </p>
          <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#preview"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-base font-medium text-ink-900 transition hover:-translate-y-0.5 hover:bg-ink-50"
            >
              See leads in your market
              <ArrowRight
                size={16}
                strokeWidth={2.5}
                className="transition group-hover:translate-x-0.5"
              />
            </a>
            <a
              href="mailto:hello@getparcel.io"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3.5 text-base font-medium text-white backdrop-blur transition hover:border-white/30 hover:bg-white/10"
            >
              Talk to founders
            </a>
          </div>
        </div>

        <div className="grid gap-10 md:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div>
            <a href="#top" className="inline-flex items-center gap-2">
              <Logo className="h-7 w-7" />
              <span className="text-[17px] font-semibold tracking-tight text-ink-900">
                Parcel
              </span>
            </a>
            <p className="mt-4 max-w-xs text-sm text-ink-500">
              Public records + satellite imagery, delivered weekly as qualified
              leads for home services teams.
            </p>
            <div className="mt-5 text-xs text-ink-500">
              <a
                href="mailto:hello@getparcel.io"
                className="hover:text-ink-900"
              >
                hello@getparcel.io
              </a>
            </div>
          </div>
          {cols.map((col) => (
            <div key={col.title}>
              <div className="text-xs font-semibold uppercase tracking-wider text-ink-700">
                {col.title}
              </div>
              <ul className="mt-4 space-y-2.5">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <a
                      href={href}
                      className="text-sm text-ink-500 transition hover:text-ink-900"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-ink-100 pt-8 text-xs text-ink-500 sm:flex-row sm:items-center">
          <div>
            © {new Date().getFullYear()} Parcel Data, Inc. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span>
              Built with public records and high-res satellite imagery.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
