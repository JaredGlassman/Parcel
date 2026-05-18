/**
 * GET /api/delivery?session_id=cs_xxx&zip=78704&industry=Fencing
 * Verifies Stripe payment, re-runs lead scan, returns full lead list + CSV.
 */
import Stripe from 'stripe'
import Anthropic from '@anthropic-ai/sdk'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const anthropic = new Anthropic()

// ── Re-use the same signal/imagery/analysis helpers ──────────────────────────
const SIGNALS: Record<string, { prompt: string; noLabel: string }> = {
  Fencing: {
    prompt:
      'First check: is this a residential property (house/yard/lot)? If not, respond {"detected":true,"confidence":99,"notes":"Not a residential property — skip"}. ' +
      'If residential: is there perimeter fencing (wood, chain link, vinyl, masonry)? ' +
      'JSON only, confidence 0-100: {"detected":boolean,"confidence":number,"notes":"one sentence"}',
    noLabel: 'No fencing detected',
  },
  'Pool Builders': {
    prompt:
      'First check: is this a residential property? If not, {"detected":true,"confidence":99,"notes":"Not a residential property — skip"}. ' +
      'If residential: is there a swimming pool? JSON only, confidence 0-100: {"detected":boolean,"confidence":number,"notes":"one sentence"}',
    noLabel: 'No pool detected',
  },
  Solar: {
    prompt:
      'First check: is this a residential property? If not, {"detected":true,"confidence":99,"notes":"Not a residential property — skip"}. ' +
      'If residential: are solar panels installed on the roof? JSON only, confidence 0-100: {"detected":boolean,"confidence":number,"notes":"one sentence"}',
    noLabel: 'No solar panels detected',
  },
  Roofing: {
    prompt:
      'First check: is this a residential property? If not, {"detected":true,"confidence":99,"notes":"Not a residential property — skip"}. ' +
      'If residential: does the roof show visible age, wear, or damage? JSON only, confidence 0-100: {"detected":boolean,"confidence":number,"notes":"one sentence"}',
    noLabel: 'Roof shows age or wear',
  },
  Landscaping: {
    prompt:
      'First check: is this a residential property? If not, {"detected":true,"confidence":99,"notes":"Not a residential property — skip"}. ' +
      'If residential: does the property have established mature landscaping? JSON only, confidence 0-100: {"detected":boolean,"confidence":number,"notes":"one sentence"}',
    noLabel: 'Minimal landscaping detected',
  },
  HVAC: {
    prompt:
      'First check: is this a residential property? If not, {"detected":true,"confidence":99,"notes":"Not a residential property — skip"}. ' +
      'If residential: are multiple HVAC units visible, suggesting an older/large system? JSON only, confidence 0-100: {"detected":boolean,"confidence":number,"notes":"one sentence"}',
    noLabel: 'Single/aging HVAC setup',
  },
}

async function geocodeZip(zip: string) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(zip)}&country=US&format=json&limit=1`,
    { headers: { 'User-Agent': 'Parcel/1.0 (hello@getparcel.io)' } }
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

function gridScan(bbox: [number, number, number, number], count = 300) {
  const [south, north, west, east] = bbox
  const latStep = 0.00072
  const lngStep = 0.00072 / Math.cos(((south + north) / 2) * (Math.PI / 180))
  const pts: { lat: number; lng: number }[] = []
  for (let lat = south + latStep / 2; lat < north; lat += latStep)
    for (let lng = west + lngStep / 2; lng < east; lng += lngStep)
      pts.push({ lat, lng })
  return pts.sort(() => Math.random() - 0.5).slice(0, count)
}

async function getImage(lat: number, lng: number): Promise<string | null> {
  const gmKey = process.env.GOOGLE_MAPS_API_KEY
  if (gmKey) {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=19&size=512x512&maptype=satellite&key=${gmKey}`
      )
      if (res.ok && (res.headers.get('content-type') ?? '').startsWith('image')) {
        return Buffer.from(await res.arrayBuffer()).toString('base64')
      }
    } catch { /* fall through */ }
  }
  const d = 0.00028
  const bbox = `${lng - d},${lat - d},${lng + d},${lat + d}`
  try {
    const res = await fetch(
      `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${bbox}&bboxSR=4326&size=512,512&format=png&f=image`
    )
    if (res.ok) return Buffer.from(await res.arrayBuffer()).toString('base64')
  } catch { /* none */ }
  return null
}

async function reverseGeocode(lat: number, lng: number) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'User-Agent': 'Parcel/1.0 (hello@getparcel.io)' } }
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

const nonResidential = (notes: string) =>
  /not a residential|commercial|highway|parking|industrial|forest|skip/i.test(notes)

function toCSV(leads: any[]) {
  const header = 'Address,City,Lat,Lng,Signal,Score,Analysis,Maps URL'
  return [header, ...leads.map(l =>
    [l.address, l.city, l.lat, l.lng, l.signal, l.score, `"${l.analysis}"`, l.mapsUrl].join(',')
  )].join('\n')
}

export default async function handler(req: Request): Promise<Response> {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  }

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })

  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get('session_id')
  const zip = searchParams.get('zip') ?? '78704'
  const industry = searchParams.get('industry') ?? 'Fencing'
  const format = searchParams.get('format') ?? 'json'

  if (!sessionId) return Response.json({ error: 'Missing session_id' }, { status: 400, headers: cors })

  // Verify payment
  let session: Stripe.Checkout.Session
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId)
  } catch {
    return Response.json({ error: 'Invalid session ID' }, { status: 400, headers: cors })
  }

  if (session.payment_status !== 'paid') {
    return Response.json({ error: 'Payment not completed' }, { status: 402, headers: cors })
  }

  // Run full lead scan
  const limit = parseInt(session.metadata?.limit ?? '15', 10)
  const signal = SIGNALS[industry] ?? SIGNALS['Fencing']

  const geo = await geocodeZip(zip)
  const candidates = gridScan(geo.bbox, limit * 8)

  const leads: any[] = []
  for (const pt of candidates) {
    if (leads.length >= limit) break
    const img = await getImage(pt.lat, pt.lng)
    if (!img) continue

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/png', data: img } },
          { type: 'text', text: signal.prompt },
        ],
      }],
    })

    const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : ''
    let result = { detected: true, confidence: 60, notes: '' }
    try {
      result = JSON.parse(raw.replace(/^```json?\n?|```\n?$/g, '').trim())
      if (result.confidence <= 1) result.confidence = Math.round(result.confidence * 100)
    } catch { continue }

    if (result.detected || nonResidential(result.notes)) continue

    const { address, city } = await reverseGeocode(pt.lat, pt.lng)
    leads.push({
      address, city, lat: pt.lat, lng: pt.lng,
      signal: signal.noLabel,
      analysis: result.notes,
      score: result.confidence,
      mapsUrl: `https://www.google.com/maps/@${pt.lat},${pt.lng},150m/data=!3m1!1e3`,
    })
  }

  if (format === 'csv') {
    return new Response(toCSV(leads), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="leads-${industry.replace(/\s+/g, '-').toLowerCase()}-${zip}.csv"`,
        'Access-Control-Allow-Origin': '*',
      },
    })
  }

  return Response.json(
    { zip, industry, count: leads.length, sessionId, leads },
    { status: 200, headers: cors }
  )
}

export const config = { path: '/api/delivery' }
