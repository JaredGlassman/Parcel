#!/usr/bin/env node
/**
 * Parcel — Fencing Lead Generator (standalone CLI)
 *
 * Usage:
 *   node scripts/generate-fencing-leads.mjs [zip] [options]
 *
 * Examples:
 *   node scripts/generate-fencing-leads.mjs 78704
 *   node scripts/generate-fencing-leads.mjs 85254 --limit 20 --out ~/Desktop/leads.csv
 *
 * Environment (set in .env or export before running):
 *   ANTHROPIC_API_KEY=sk-ant-...         (required)
 *   GOOGLE_MAPS_API_KEY=AIza...          (optional, better imagery)
 *
 * Output: JSON + CSV file saved to current directory.
 */

import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ── Load .env ────────────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.resolve(__dirname, '..', '.env')
  if (!fs.existsSync(envPath)) return
  const lines = fs.readFileSync(envPath, 'utf8').split('\n')
  for (const line of lines) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/)
    if (m) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
  }
}
loadEnv()

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── CLI args ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const zip = args.find(a => /^\d{5}$/.test(a)) ?? '78704'
const limitFlag = args.indexOf('--limit')
const outFlag = args.indexOf('--out')
const LIMIT = limitFlag !== -1 ? parseInt(args[limitFlag + 1], 10) : 15
const OUT_PATH = outFlag !== -1 ? args[outFlag + 1] : null
const INDUSTRY = 'Fencing'

const SIGNAL_PROMPT =
  'First, is this image showing a residential property (house, yard, lot)? If not a residential property, respond with {"detected":true,"confidence":99,"notes":"Not a residential property — skip"}. ' +
  'If it is residential: is there perimeter fencing (wood, chain link, vinyl, masonry, or any boundary enclosure)? ' +
  'JSON only, confidence as integer 0-100: {"detected":boolean,"confidence":number,"notes":"one sentence"}'

const log = (msg) => console.log(`[${new Date().toLocaleTimeString()}] ${msg}`)

// ── API helpers ───────────────────────────────────────────────────────────────
async function geocodeZip(zip) {
  log(`Geocoding zip ${zip}...`)
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?postalcode=${zip}&country=US&format=json&limit=1`,
    { headers: { 'User-Agent': 'Parcel/1.0 (hello@getparcel.io)' } }
  )
  const data = await res.json()
  if (!data.length) throw new Error(`Zip ${zip} not found`)
  const d = data[0]
  log(`  → ${d.display_name.split(',').slice(0, 2).join(',')} (${d.lat}, ${d.lon})`)
  return {
    lat: parseFloat(d.lat),
    lng: parseFloat(d.lon),
    bbox: d.boundingbox.map(Number),
  }
}

async function getPropertiesFromOverpass(bbox) {
  const [south, north, west, east] = bbox
  const query = `[out:json][timeout:30];(
    way["building"~"^(house|residential|detached|bungalow|terrace)$"](${south},${west},${north},${east});
    node["addr:housenumber"]["addr:street"](${south},${west},${north},${east});
  );out center tags 100;`

  const mirrors = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass.openstreetmap.ru/api/interpreter',
  ]
  for (const url of mirrors) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
      })
      const ct = res.headers.get('content-type') ?? ''
      if (!res.ok || !ct.includes('json')) {
        log(`  ⚠ ${new URL(url).hostname} → ${res.status}, trying next...`)
        continue
      }
      const data = await res.json()
      return (data.elements || [])
        .filter(e => e.center?.lat || e.lat)
        .map(e => ({ lat: e.center?.lat ?? e.lat, lng: e.center?.lng ?? e.lon, tags: e.tags || {} }))
    } catch {
      log(`  ⚠ ${new URL(url).hostname} failed, trying next...`)
    }
  }
  return null // signal to fall back to grid
}

function gridScan(bbox, count = 200) {
  const [south, north, west, east] = bbox
  // ~80m grid spacing (0.00072°lat ≈ 80m; adjust lng for latitude)
  const latStep = 0.00072
  const lngStep = 0.00072 / Math.cos((south + north) / 2 * Math.PI / 180)
  const points = []
  for (let lat = south + latStep / 2; lat < north; lat += latStep) {
    for (let lng = west + lngStep / 2; lng < east; lng += lngStep) {
      points.push({ lat, lng, tags: {} })
    }
  }
  return points.sort(() => Math.random() - 0.5).slice(0, count)
}

async function getProperties(bbox) {
  log(`Fetching properties from Overpass...`)
  const results = await getPropertiesFromOverpass(bbox)
  if (results) {
    log(`  → ${results.length} OSM properties found`)
    return results
  }
  log(`  ⚠ Overpass unavailable — falling back to coordinate grid scan`)
  const grid = gridScan(bbox, 200)
  log(`  → ${grid.length} grid points generated`)
  return grid
}

async function reverseGeocode(lat, lng) {
  // Respect Nominatim's 1 req/sec limit
  await new Promise(r => setTimeout(r, 1100))
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'User-Agent': 'Parcel/1.0 (hello@getparcel.io)' } }
    )
    const d = await res.json()
    const a = d.address || {}
    return {
      address: [a.house_number, a.road].filter(Boolean).join(' ') || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      city: [a.city || a.town || a.village, a.state].filter(Boolean).join(', '),
    }
  } catch {
    return { address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, city: '' }
  }
}

async function getSatelliteImage(lat, lng) {
  const gmKey = process.env.GOOGLE_MAPS_API_KEY
  if (gmKey) {
    try {
      const url = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=19&size=512x512&maptype=satellite&key=${gmKey}`
      const res = await fetch(url)
      if (res.ok && res.headers.get('content-type')?.startsWith('image')) {
        const buf = await res.arrayBuffer()
        return Buffer.from(buf).toString('base64')
      }
    } catch {}
  }

  // ESRI fallback
  const delta = 0.00028
  const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`
  try {
    const url =
      `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export` +
      `?bbox=${bbox}&bboxSR=4326&size=512,512&format=png&f=image`
    const res = await fetch(url)
    if (res.ok) {
      const buf = await res.arrayBuffer()
      return Buffer.from(buf).toString('base64')
    }
  } catch {}
  return null
}

async function analyzeFencing(imageB64) {
  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/png', data: imageB64 } },
        { type: 'text', text: SIGNAL_PROMPT },
      ],
    }],
  })
  const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : ''
  try {
    const parsed = JSON.parse(raw.replace(/^```json?\n?|```\n?$/g, '').trim())
    // Normalize confidence to 0-100 in case model returns 0-1 float
    if (parsed.confidence <= 1) parsed.confidence = Math.round(parsed.confidence * 100)
    return parsed
  } catch {
    return { detected: false, confidence: 55, notes: 'Analysis inconclusive' }
  }
}

// ── CSV helpers ───────────────────────────────────────────────────────────────
function toCSV(leads) {
  const header = 'Address,City,Lat,Lng,Signal,Score,Notes,Maps URL'
  const rows = leads.map(l =>
    [l.address, l.city, l.lat, l.lng, l.signal, l.score, `"${l.analysis}"`, l.mapsUrl]
      .join(',')
  )
  return [header, ...rows].join('\n')
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ERROR: ANTHROPIC_API_KEY is not set. Create a .env file or export it.')
    process.exit(1)
  }

  console.log(`\n${'═'.repeat(56)}`)
  console.log(`  Parcel — Fencing Lead Generator`)
  console.log(`  Zip: ${zip}  |  Target leads: ${LIMIT}`)
  console.log(`${'═'.repeat(56)}\n`)

  const geo = await geocodeZip(zip)
  const allProperties = await getProperties(geo.bbox)

  if (!allProperties.length) {
    console.error('No residential properties found in OSM for this zip. Try a different zip.')
    process.exit(1)
  }

  // Shuffle and process sequentially to stay within API rate limits
  const candidates = allProperties.sort(() => Math.random() - 0.5)
  const leads = []
  let analyzed = 0

  for (const prop of candidates) {
    if (leads.length >= LIMIT) break
    analyzed++

    // Get address
    let address, city
    if (prop.tags['addr:housenumber'] && prop.tags['addr:street']) {
      address = `${prop.tags['addr:housenumber']} ${prop.tags['addr:street']}`
      city = [prop.tags['addr:city'], prop.tags['addr:state']].filter(Boolean).join(', ')
    } else {
      const rev = await reverseGeocode(prop.lat, prop.lng)
      address = rev.address
      city = rev.city
    }

    process.stdout.write(`  Analyzing ${address}... `)

    // Get satellite image
    const imageB64 = await getSatelliteImage(prop.lat, prop.lng)
    if (!imageB64) {
      console.log('no imagery')
      continue
    }

    // Analyze
    const result = await analyzeFencing(imageB64)
    const icon = result.detected ? '🚫' : '✅'
    console.log(`${icon} ${result.detected ? 'Has fencing' : 'No fencing'} (${result.confidence}% confident) — ${result.notes}`)

    const nonResidential = /not a residential|commercial|highway|parking|industrial|forest|skip/i.test(result.notes)
    if (!result.detected && !nonResidential) {
      leads.push({
        address,
        city,
        lat: prop.lat,
        lng: prop.lng,
        signal: 'No fencing detected',
        analysis: result.notes,
        score: result.confidence,
        mapsUrl: `https://www.google.com/maps/@${prop.lat},${prop.lng},150m/data=!3m1!1e3`,
      })
    }
  }

  console.log(`\n${'─'.repeat(56)}`)
  console.log(`  Analyzed: ${analyzed}  |  Leads found: ${leads.length}`)
  console.log(`${'─'.repeat(56)}\n`)

  if (!leads.length) {
    console.log('No leads found. Try a larger market or different zip code.')
    return
  }

  // Print table
  console.log('FENCING LEADS:')
  leads.forEach((l, i) => {
    console.log(`\n  ${i + 1}. ${l.address}, ${l.city}`)
    console.log(`     Signal: ${l.signal}  (score: ${l.score})`)
    console.log(`     ${l.analysis}`)
    console.log(`     Maps: ${l.mapsUrl}`)
  })

  // Save files
  const dateStr = new Date().toISOString().slice(0, 10)
  const baseName = `leads-fencing-${zip}-${dateStr}`

  const outDir = OUT_PATH ? path.dirname(OUT_PATH) : process.cwd()
  const csvPath = OUT_PATH || path.join(outDir, `${baseName}.csv`)
  const jsonPath = csvPath.replace(/\.csv$/, '.json')

  fs.writeFileSync(csvPath, toCSV(leads), 'utf8')
  fs.writeFileSync(jsonPath, JSON.stringify({ zip, industry: INDUSTRY, generatedAt: new Date().toISOString(), count: leads.length, leads }, null, 2), 'utf8')

  console.log(`\nSaved:`)
  console.log(`  ${csvPath}`)
  console.log(`  ${jsonPath}\n`)
}

main().catch(err => {
  console.error('Fatal:', err.message)
  process.exit(1)
})
