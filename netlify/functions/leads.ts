/**
 * GET /api/leads?zip=78704&industry=Fencing&limit=3
 * Preview scan — returns leads with contactsLocked:true (no real phone/email).
 * Checks zip+industry exclusivity before scanning.
 */
import { getStore } from '@netlify/blobs'
import { runLeadScan } from './_analysis.ts'

export default async function handler(req: Request): Promise<Response> {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not configured.' }, { status: 500, headers: cors })
  }

  const { searchParams } = new URL(req.url)
  const zip = searchParams.get('zip') ?? '78704'
  const industry = searchParams.get('industry') ?? 'Fencing'
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '3', 10), 8)

  // Exclusivity check
  try {
    const store = getStore('parcel-crm')
    const raw = await store.get(`exclusive:${zip}:${industry}`)
    if (raw) {
      const { companyName } = JSON.parse(raw as string)
      return Response.json({
        exclusive: true,
        message: `This area is exclusively served by ${companyName}. Please choose a different zip code.`,
      }, { status: 423, headers: cors })
    }
  } catch { /* don't block on blob errors */ }

  try {
    const { leads, analyzed } = await runLeadScan(zip, industry, limit)
    // Preview: strip real contact info and signal that it's locked
    const preview = leads.map(l => ({ ...l, phones: [], emails: [], contactsLocked: true }))
    return Response.json({ zip, industry, count: preview.length, analyzed, leads: preview }, { status: 200, headers: cors })
  } catch (err: any) {
    return Response.json({ error: err.message ?? 'Lead scan failed.' }, { status: 500, headers: cors })
  }
}

export const config = { path: '/api/leads' }
