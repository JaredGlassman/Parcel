import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ChevronDown, ChevronRight, Download,
  RefreshCw, ArrowLeft, ExternalLink,
} from "lucide-react";
import Logo from "./Logo";

type ContactStatus = "new" | "contacted" | "converted" | "not_interested";

interface ContactSummary {
  email: string;
  name: string;
  company: string;
  status: ContactStatus;
  createdAt: string;
  scanCount: number;
  lastScanAt: string;
  lastIndustry: string;
  lastZip: string;
}

interface Lead {
  address: string;
  city: string;
  lat: number;
  lng: number;
  signal: string;
  score: number;
  mapsUrl: string;
}

interface Delivery {
  id: string;
  zip: string;
  industry: string;
  leadCount: number;
  analyzed: number;
  createdAt: string;
  leads?: Lead[];
}

interface ContactDetail extends ContactSummary {
  notes: string;
  deliveries: Delivery[];
}

const STATUS_STYLES: Record<ContactStatus, string> = {
  new: "bg-blue-50 text-blue-700 border-blue-100",
  contacted: "bg-amber-50 text-amber-700 border-amber-100",
  converted: "bg-green-50 text-green-700 border-green-100",
  not_interested: "bg-ink-50 text-ink-500 border-ink-100",
};

const STATUS_LABELS: Record<ContactStatus, string> = {
  new: "New",
  contacted: "Contacted",
  converted: "Converted",
  not_interested: "Not interested",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function exportCSV(contacts: ContactSummary[]) {
  const header = "Email,Name,Company,Status,Scans,Last Industry,Last Zip,Created";
  const rows = contacts.map((c) =>
    [c.email, c.name, c.company, c.status, c.scanCount, c.lastIndustry, c.lastZip, fmt(c.createdAt)].join(",")
  );
  const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "parcel-contacts.csv" });
  a.click(); URL.revokeObjectURL(a.href);
}

function StatusBadge({ status }: { status: ContactStatus }) {
  return (
    <span className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function StatusSelect({ value, onChange }: { value: ContactStatus; onChange: (s: ContactStatus) => void }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value as ContactStatus)}
        className="appearance-none rounded-lg border border-ink-200 bg-white py-1.5 pl-3 pr-8 text-[12px] font-medium text-ink-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100">
        {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
      <ChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
    </div>
  );
}

function ContactRow({ contact, pw, onUpdated }: {
  contact: ContactSummary;
  pw: string;
  onUpdated: (c: ContactSummary) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState<ContactDetail | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const loadDetail = async () => {
    if (detail) return;
    const res = await fetch(`/api/crm?email=${encodeURIComponent(contact.email)}&pw=${encodeURIComponent(pw)}`);
    const data = await res.json();
    setDetail(data);
    setNotes(data.notes ?? "");
  };

  const toggle = () => {
    setExpanded((e) => !e);
    if (!expanded) loadDetail();
  };

  const updateStatus = async (status: ContactStatus) => {
    const res = await fetch("/api/crm", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-crm-password": pw },
      body: JSON.stringify({ email: contact.email, status }),
    });
    if (res.ok) onUpdated({ ...contact, status });
  };

  const saveNotes = async () => {
    setSaving(true);
    await fetch("/api/crm", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-crm-password": pw },
      body: JSON.stringify({ email: contact.email, notes }),
    });
    setSaving(false);
  };

  return (
    <div className="border-b border-ink-100 last:border-0">
      <div className="flex cursor-pointer items-center gap-3 px-5 py-4 hover:bg-ink-50/50 transition"
        onClick={toggle}>
        <ChevronRight size={14} className={`shrink-0 text-ink-400 transition-transform ${expanded ? "rotate-90" : ""}`} />

        <div className="min-w-0 flex-1 grid grid-cols-12 items-center gap-3 text-sm">
          <div className="col-span-12 md:col-span-4 min-w-0">
            <div className="truncate font-medium text-ink-900">{contact.email}</div>
            {(contact.name || contact.company) && (
              <div className="truncate text-xs text-ink-500">
                {[contact.name, contact.company].filter(Boolean).join(" · ")}
              </div>
            )}
          </div>
          <div className="col-span-6 md:col-span-2">
            <StatusBadge status={contact.status} />
          </div>
          <div className="col-span-6 md:col-span-2 text-xs text-ink-500">
            {contact.scanCount} scan{contact.scanCount !== 1 ? "s" : ""}
          </div>
          <div className="col-span-6 md:col-span-2 text-xs text-ink-500">
            {contact.lastIndustry} · {contact.lastZip}
          </div>
          <div className="col-span-6 md:col-span-2 text-xs text-ink-400">
            {fmt(contact.createdAt)}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-ink-100 bg-ink-50/30">
            <div className="px-8 py-5 space-y-5">
              {/* Status + Notes */}
              <div className="flex flex-wrap items-start gap-6">
                <div>
                  <label className="block text-xs font-medium text-ink-700 mb-1.5">Pipeline status</label>
                  <StatusSelect value={contact.status} onChange={updateStatus} />
                </div>
                <div className="flex-1 min-w-48">
                  <label className="block text-xs font-medium text-ink-700 mb-1.5">Notes</label>
                  <div className="flex gap-2">
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                      placeholder="Add a note about this contact…"
                      className="flex-1 rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 resize-none" />
                    <button onClick={saveNotes} disabled={saving}
                      className="rounded-xl border border-ink-200 bg-white px-3 py-2 text-xs font-medium text-ink-700 hover:bg-ink-50 transition disabled:opacity-50">
                      {saving ? "Saving…" : "Save"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Deliveries */}
              {detail?.deliveries?.length ? (
                <div>
                  <p className="text-xs font-medium text-ink-700 mb-3">Scan history</p>
                  {detail.deliveries.map((d) => (
                    <div key={d.id} className="mb-4">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="rounded-md bg-brand-100 px-2 py-0.5 text-[10px] font-semibold text-brand-700">{d.industry}</span>
                        <span className="text-xs text-ink-500">{d.zip} · {d.leadCount} leads · {fmt(d.createdAt)}</span>
                      </div>
                      {d.leads && (
                        <div className="rounded-xl border border-ink-100 bg-white overflow-hidden">
                          {d.leads.slice(0, 5).map((l, i) => (
                            <div key={i} className={`flex items-center gap-3 px-4 py-2.5 text-xs ${i < d.leads!.length - 1 && i < 4 ? "border-b border-ink-100" : ""}`}>
                              <div className="flex-1 min-w-0">
                                <span className="font-medium text-ink-900 truncate">{l.address}</span>
                                <span className="text-ink-400 ml-1.5">{l.city}</span>
                              </div>
                              <span className="shrink-0 rounded-md border border-ink-100 bg-ink-50 px-1.5 py-0.5 text-[10px] text-ink-600">{l.signal}</span>
                              <span className="shrink-0 text-ink-400">score {l.score}</span>
                              <a href={l.mapsUrl} target="_blank" rel="noopener noreferrer"
                                className="shrink-0 text-brand-600 hover:text-brand-700">
                                <ExternalLink size={11} />
                              </a>
                            </div>
                          ))}
                          {d.leads.length > 5 && (
                            <div className="px-4 py-2 text-center text-xs text-ink-400">+{d.leads.length - 5} more leads</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : !detail ? (
                <p className="text-xs text-ink-400">Loading deliveries…</p>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CRMDashboard() {
  const [pw, setPw] = useState("");
  const [authed, setAuthed] = useState(false);
  const [contacts, setContacts] = useState<ContactSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContactStatus | "all">("all");

  const load = async (password: string) => {
    setLoading(true); setErr("");
    const res = await fetch(`/api/crm?pw=${encodeURIComponent(password)}`);
    const data = await res.json();
    if (!res.ok || data.error) { setErr("Wrong password."); setLoading(false); return; }
    setContacts(data.contacts ?? []);
    setAuthed(true);
    setLoading(false);
  };

  const onUpdated = (updated: ContactSummary) => {
    setContacts((cs) => cs.map((c) => (c.email === updated.email ? updated : c)));
  };

  const filtered = contacts.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.email.includes(q) || c.name?.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q);
    }
    return true;
  });

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
          <Logo />
          <h1 className="mt-5 text-lg font-semibold text-ink-900">CRM Access</h1>
          <form onSubmit={(e) => { e.preventDefault(); load(pw); }} className="mt-4 space-y-3">
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)}
              placeholder="Password" autoFocus
              className="w-full rounded-xl border border-ink-200 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" />
            {err && <p className="text-xs text-red-500">{err}</p>}
            <button type="submit" disabled={loading}
              className="w-full rounded-full bg-ink-900 py-3 text-sm font-medium text-white hover:bg-ink-800 transition disabled:opacity-60">
              {loading ? "Checking…" : "Enter"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-50/50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-ink-100 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Logo />
          <span className="text-xs text-ink-400">CRM</span>
          <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
            {contacts.length} contacts
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => load(pw)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-ink-50 transition">
            <RefreshCw size={12} /> Refresh
          </button>
          <button onClick={() => exportCSV(contacts)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-ink-50 transition">
            <Download size={12} /> Export CSV
          </button>
          <a href="/"
            className="inline-flex items-center gap-1.5 rounded-lg bg-ink-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-ink-800 transition">
            <ArrowLeft size={12} /> Back to site
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
          {(["all", "new", "contacted", "converted"] as const).map((s) => {
            const count = s === "all" ? contacts.length : contacts.filter((c) => c.status === s).length;
            return (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`rounded-2xl border p-4 text-left transition ${statusFilter === s ? "border-brand-300 bg-brand-50" : "border-ink-100 bg-white hover:border-ink-200"}`}>
                <div className="text-2xl font-semibold text-ink-900">{count}</div>
                <div className="mt-0.5 text-xs text-ink-500 capitalize">{s === "all" ? "Total contacts" : STATUS_LABELS[s]}</div>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search email, name, or company…"
              className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-9 pr-4 text-sm text-ink-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" />
          </div>
          <div className="relative">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}
              className="appearance-none rounded-xl border border-ink-200 bg-white py-2.5 pl-4 pr-8 text-sm text-ink-700 outline-none focus:border-brand-500">
              <option value="all">All statuses</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-400" />
          </div>
        </div>

        {/* Contacts table */}
        <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm">
          {/* Column headers */}
          <div className="hidden md:grid grid-cols-12 gap-3 border-b border-ink-100 px-5 py-2.5 text-[10px] font-medium uppercase tracking-wider text-ink-500">
            <div className="col-span-1" />
            <div className="col-span-4">Contact</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Scans</div>
            <div className="col-span-2">Last scan</div>
            <div className="col-span-1">Joined</div>
          </div>

          {filtered.length === 0 ? (
            <div className="px-5 py-16 text-center text-sm text-ink-400">
              {contacts.length === 0 ? "No contacts yet — they appear here when someone submits their email." : "No contacts match your filters."}
            </div>
          ) : (
            filtered.map((c) => (
              <ContactRow key={c.email} contact={c} pw={pw} onUpdated={onUpdated} />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
