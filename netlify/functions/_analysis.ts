import Anthropic from '@anthropic-ai/sdk'

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

interface AttomProperty {
  lat: number
  lng: number
  address: string
  city: string
  apn: string
  ownerName: string
  mailingAddress: string
  salePrice: number
  saleDate: string
  yearBuilt: string
  bedrooms: string
  bathrooms: string
  lotSize: string
  livingArea: string
}

export async function fetchAttomProperties(zip: string, need: number): Promise<AttomProperty[]> {
  const attomKey = process.env.ATTOM_API_KEY
  if (!attomKey) throw new Error('ATTOM_API_KEY not configured')

  const results: AttomProperty[] = []
  const pageSize = 100

  for (let page = 1; results.length < need; page++) {
    const url = new URL('https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/expandedprofile')
    url.searchParams.set('postalcode', zip)
    url.searchParams.set('page', String(page))
    url.searchParams.set('pagesize', String(pageSize))

    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json', apikey: attomKey },
    })
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`ATTOM ${res.status}: ${body.slice(0, 300)}`)
    }

    const data = (await res.json()) as { property?: any[] }
    const props = data.property || []
    if (!props.length) break

    for (const p of props) {
      const loc = p.location || {}
      const addr = p.address || {}
      const lat = parseFloat(loc.latitude)
      const lng = parseFloat(loc.longitude)
      if (!lat || !lng) continue

      const street = addr.line1 || addr.oneLine || ''
      const city = [addr.locality, addr.countrySubd].filter(Boolean).join(', ')
      const apn = p.identifier?.apn || String(p.identifier?.attomId || '')

      const owner = p.assessment?.owner || {}
      const ownerName = [owner.owner1?.fullName, owner.owner2?.fullName].filter(Boolean).join(' & ')
      const mailingAddress = owner.mailingAddressOneLine || ''

      const sale = p.sale || {}
      const salePrice = sale.amount?.saleAmt || 0
      const saleDate = sale.saleSearchDate || sale.saleTransDate || ''

      const summary = p.summary || {}
      const building = p.building || {}
      const lot = p.lot || {}

      results.push({
        lat, lng,
        address: street,
        city,
        apn,
        ownerName,
        mailingAddress,
        salePrice,
        saleDate,
        yearBuilt: String(summary.yearBuilt || ''),
        bedrooms: String(building.rooms?.beds || ''),
        bathrooms: String(building.rooms?.bathsTotal || ''),
        lotSize: String(lot.lotSize2 || ''),
        livingArea: String(building.size?.livingSize || building.size?.universalSize || ''),
      })
    }

    if (props.length < pageSize) break
  }

  return results
}

export async function getSatelliteImage(lat: number, lng: number): Promise<string | null> {
  const gmKey = process.env.GOOGLE_MAPS_API_KEY
  if (gmKey) {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=20&size=512x512&maptype=satellite&key=${gmKey}`,
      )
      if (res.ok && (res.headers.get('content-type') ?? '').startsWith('image'))
        return Buffer.from(await res.arrayBuffer()).toString('base64')
    } catch { /* fall through to ESRI */ }
  }
  // ESRI World Imagery fallback (free, no key)
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
  ownerName: string
  mailingAddress: string
  salePrice: number
  saleDate: string
  yearBuilt: string
  bedrooms: string
  bathrooms: string
  lotSize: string
  livingArea: string
  apn: string
}

export async function runLeadScan(zip: string, industry: string, limit: number): Promise<{ leads: Lead[]; analyzed: number }> {
  const signal = SIGNALS[industry] ?? SIGNALS['Fencing']

  const candidates = await fetchAttomProperties(zip, limit * 3)
  const pool = candidates.sort(() => Math.random() - 0.5).slice(0, limit * 3)

  const results = await Promise.all(
    pool.map(async (prop) => {
      const img = await getSatelliteImage(prop.lat, prop.lng)
      if (!img) return null
      const result = await analyzeImage(img, industry)
      if (result.detected || nonResidential(result.notes)) return null
      const analysis = result.notes || signal.noLabel
      return {
        address: prop.address,
        city: prop.city,
        lat: prop.lat,
        lng: prop.lng,
        signal: signal.noLabel,
        analysis,
        score: result.confidence,
        mapsUrl: `https://www.google.com/maps/@${prop.lat},${prop.lng},150m/data=!3m1!1e3`,
        ownerName: prop.ownerName,
        mailingAddress: prop.mailingAddress,
        salePrice: prop.salePrice,
        saleDate: prop.saleDate,
        yearBuilt: prop.yearBuilt,
        bedrooms: prop.bedrooms,
        bathrooms: prop.bathrooms,
        lotSize: prop.lotSize,
        livingArea: prop.livingArea,
        apn: prop.apn,
      } as Lead
    }),
  )

  const leads = results.filter((l): l is Lead => l !== null).slice(0, limit)
  return { leads, analyzed: pool.length }
}
