import Anthropic from '@anthropic-ai/sdk'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Always load .env from project root — overrides any inherited shell/parent env vars
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), '.env')
    const text = readFileSync(envPath, 'utf8')
    for (const line of text.split('\n')) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
      if (m) process.env[m[1]] = m[2].trim()
    }
  } catch { /* .env optional */ }
}
loadEnv()

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

export const SIGNALS: Record<string, { prompt: string; noLabel: string }> = {
  Fencing: {
    prompt:
      'First: is this a residential property (house/yard/lot)? If not, {"detected":true,"confidence":99,"notes":"Not a residential property — skip"}. ' +
      'If residential: is there perimeter fencing (wood, chain link, vinyl, masonry)? JSON only, confidence 0-100: {"detected":boolean,"confidence":number,"notes":"one sentence"}',
    noLabel: 'No fencing detected',
  },
  'Pool Builders': {
    prompt:
      'First: is this a residential property? If not, {"detected":true,"confidence":99,"notes":"Not a residential property — skip"}. ' +
      'If residential: is there a swimming pool visible? JSON only, confidence 0-100: {"detected":boolean,"confidence":number,"notes":"one sentence"}',
    noLabel: 'No pool detected',
  },
  Solar: {
    prompt:
      'First: is this a residential property? If not, {"detected":true,"confidence":99,"notes":"Not a residential property — skip"}. ' +
      'If residential: are solar panels installed on the roof? JSON only, confidence 0-100: {"detected":boolean,"confidence":number,"notes":"one sentence"}',
    noLabel: 'No solar panels detected',
  },
  Roofing: {
    prompt:
      'First: is this a residential property? If not, {"detected":true,"confidence":99,"notes":"Not a residential property — skip"}. ' +
      'If residential: does the roof show visible age, wear, or damage? JSON only, confidence 0-100: {"detected":boolean,"confidence":number,"notes":"one sentence"}',
    noLabel: 'Roof shows age or wear',
  },
  Landscaping: {
    prompt:
      'First: is this a residential property? If not, {"detected":true,"confidence":99,"notes":"Not a residential property — skip"}. ' +
      'If residential: does the property have established mature landscaping? JSON only, confidence 0-100: {"detected":boolean,"confidence":number,"notes":"one sentence"}',
    noLabel: 'Minimal landscaping detected',
  },
  HVAC: {
    prompt:
      'First: is this a residential property? If not, {"detected":true,"confidence":99,"notes":"Not a residential property — skip"}. ' +
      'If residential: are multiple HVAC units visible suggesting an older/large system? JSON only, confidence 0-100: {"detected":boolean,"confidence":number,"notes":"one sentence"}',
    noLabel: 'Single/aging HVAC setup',
  },
}

export const nonResidential = (notes: string) =>
  /not a residential|commercial|highway|parking|industrial|forest|skip/i.test(notes)

export async function geocodeZip(zip: string) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(zip)}&country=US&format=json&limit=1`,
    { headers: { 'User-Agent': 'Parcel/1.0 (hello@getparcel.io)' } },
  )
  const data = (await res.json()) as any[]
  if (!data.length) throw new Error(`Zip ${zip} not found`)
  const d = data[0]
  return {
    lat: parseFloat(d.lat),
    lng: parseFloat(d.lon),
    bbox: d.boundingbox.map(Number) as [number, number, number, number],
  }
}

export async function reverseGeocode(lat: number, lng: number) {
  try {
    await new Promise((r) => setTimeout(r, 300))
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'User-Agent': 'Parcel/1.0 (hello@getparcel.io)' } },
    )
    const d = (await res.json()) as any
    const a = d.address ?? {}
    return {
      address: [a.house_number, a.road].filter(Boolean).join(' ') || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      city: [a.city ?? a.town ?? a.village, a.state].filter(Boolean).join(', '),
    }
  } catch {
    return { address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, city: '' }
  }
}

export function gridScan(bbox: [number, number, number, number], count: number) {
  const [south, north, west, east] = bbox
  const latStep = 0.00072
  const lngStep = 0.00072 / Math.cos(((south + north) / 2) * (Math.PI / 180))
  const pts: { lat: number; lng: number; tags: Record<string, string> }[] = []
  for (let lat = south + latStep / 2; lat < north; lat += latStep)
    for (let lng = west + lngStep / 2; lng < east; lng += lngStep)
      pts.push({ lat, lng, tags: {} })
  return pts.sort(() => Math.random() - 0.5).slice(0, count)
}

export async function getSatelliteImage(lat: number, lng: number): Promise<string | null> {
  const gmKey = process.env.GOOGLE_MAPS_API_KEY
  if (gmKey) {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=19&size=512x512&maptype=satellite&key=${gmKey}`,
      )
      if (res.ok && (res.headers.get('content-type') ?? '').startsWith('image'))
        return Buffer.from(await res.arrayBuffer()).toString('base64')
    } catch { /* fall through */ }
  }
  const d = 0.00028
  const bbox = `${lng - d},${lat - d},${lng + d},${lat + d}`
  try {
    const res = await fetch(
      `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${bbox}&bboxSR=4326&size=512,512&format=png&f=image`,
    )
    if (res.ok) return Buffer.from(await res.arrayBuffer()).toString('base64')
  } catch { /* none */ }
  return null
}

export async function analyzeImage(
  imageB64: string,
  industry: string,
): Promise<{ detected: boolean; confidence: number; notes: string }> {
  const signal = SIGNALS[industry] ?? SIGNALS['Fencing']
  const msg = await getAnthropic().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/png', data: imageB64 } },
        { type: 'text', text: signal.prompt },
      ],
    }],
  })
  const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : ''
  try {
    const parsed = JSON.parse(raw.replace(/^```json?\n?|```\n?$/g, '').trim())
    // Normalize alternate key names the model sometimes uses
    const confidence = parsed.confidence ?? parsed.confidence_score ?? parsed.score ?? 60
    const notes = parsed.notes ?? parsed.note ?? parsed.analysis ?? parsed.reasoning ?? ''
    const detected = parsed.detected ?? parsed.has_signal ?? false
    const conf = confidence <= 1 ? Math.round(confidence * 100) : Math.round(confidence)
    return { detected: Boolean(detected), confidence: conf, notes: String(notes) }
  } catch {
    return { detected: false, confidence: 60, notes: 'Vision analysis inconclusive' }
  }
}

export interface Lead {
  address: string
  city: string
  lat: number
  lng: number
  signal: string
  analysis: string
  score: number
  mapsUrl: string
}

export async function runLeadScan(zip: string, industry: string, limit: number): Promise<{ leads: Lead[]; analyzed: number }> {
  const signal = SIGNALS[industry] ?? SIGNALS['Fencing']
  const geo = await geocodeZip(zip)

  // Try Overpass first, fall back to grid
  let candidates: { lat: number; lng: number; tags: Record<string, string> }[] = []
  try {
    const mirrors = [
      'https://overpass-api.de/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter',
      'https://overpass.openstreetmap.ru/api/interpreter',
    ]
    const [south, north, west, east] = geo.bbox
    const query = `[out:json][timeout:20];(way["building"~"^(house|residential|detached|bungalow|terrace)$"](${south},${west},${north},${east});node["addr:housenumber"]["addr:street"](${south},${west},${north},${east}););out center tags 60;`
    for (const url of mirrors) {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `data=${encodeURIComponent(query)}` })
      const ct = res.headers.get('content-type') ?? ''
      if (!res.ok || !ct.includes('json')) continue
      const data = (await res.json()) as { elements: any[] }
      candidates = (data.elements || [])
        .filter((e: any) => e.center?.lat || e.lat)
        .map((e: any) => ({ lat: e.center?.lat ?? e.lat, lng: e.center?.lng ?? e.lon, tags: e.tags || {} }))
      if (candidates.length) break
    }
  } catch { /* fall through to grid */ }

  if (!candidates.length) candidates = gridScan(geo.bbox, limit * 8)

  // Analyze candidates in parallel — take limit*3 max to stay within timeout
  const pool = candidates.sort(() => Math.random() - 0.5).slice(0, limit * 3)

  const results = await Promise.all(
    pool.map(async (prop) => {
      const img = await getSatelliteImage(prop.lat, prop.lng)
      if (!img) return null
      const result = await analyzeImage(img, industry)
      if (result.detected || nonResidential(result.notes)) return null
      const t = prop.tags
      let address: string, city: string
      if (t['addr:housenumber'] && t['addr:street']) {
        address = `${t['addr:housenumber']} ${t['addr:street']}`
        city = [t['addr:city'] ?? t['addr:town'], t['addr:state']].filter(Boolean).join(', ')
      } else {
        const rev = await reverseGeocode(prop.lat, prop.lng)
        address = rev.address; city = rev.city
      }
      const analysis = result.notes || signal.noLabel
      return { address, city, lat: prop.lat, lng: prop.lng, signal: signal.noLabel, analysis, score: result.confidence, mapsUrl: `https://www.google.com/maps/@${prop.lat},${prop.lng},150m/data=!3m1!1e3` } as Lead
    }),
  )

  const leads = results.filter((l): l is Lead => l !== null).slice(0, limit)
  return { leads, analyzed: pool.length }
}
