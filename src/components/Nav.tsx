import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Logo from "./Logo";

const links: ReadonlyArray<readonly [string, string]> = [
  ["How it works", "#how"],
  ["Industries", "#industries"],
  ["Sample leads", "#preview"],
  ["Pricing", "#pricing"],
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 z-50 w-full"
    >
      <div
        className={`mx-auto mt-4 flex w-[min(1120px,calc(100%-1.5rem))] items-center justify-between rounded-2xl border px-4 py-2.5 transition-all duration-300 ${
          scrolled
            ? "border-ink-100 bg-white/85 backdrop-blur-xl shadow-[0_8px_30px_-12px_rgba(12,15,23,0.12)]"
            : "border-transparent bg-white/40 backdrop-blur-md"
        }`}
      >
        <a href="#top" className="flex items-center gap-2">
          <Logo className="h-7 w-7" />
          <span className="text-[17px] font-semibold tracking-tight text-ink-900">
            Parcel
          </span>
        </a>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="rounded-full px-3.5 py-1.5 text-sm text-ink-600 transition hover:bg-ink-50 hover:text-ink-900"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="#preview"
            className="hidden rounded-lg px-3 py-1.5 text-sm text-ink-600 transition hover:text-ink-900 sm:inline-flex"
          >
            Sign in
          </a>
          <a
            href="#preview"
            className="group inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-ink-800"
          >
            Get access
            <ArrowRight
              size={14}
              strokeWidth={2.5}
              className="transition group-hover:translate-x-0.5"
            />
          </a>
        </div>
      </div>
    </motion.header>
  );
}
