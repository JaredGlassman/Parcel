/**
 * GET /api/leads?zip=78704&industry=Fencing&limit=3
 * Returns a quick preview scan (up to 8 leads).
 * Uses the shared runLeadScan pipeline (Overpass → grid fallback → ESRI + Claude).
 */
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
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '5', 10), 8)

  try {
    const { leads, analyzed } = await runLeadScan(zip, industry, limit)
    return Response.json({ zip, industry, count: leads.length, analyzed, leads }, { status: 200, headers: cors })
  } catch (err: any) {
    return Response.json({ error: err.message ?? 'Lead scan failed.' }, { status: 500, headers: cors })
  }
}

export const config = { path: '/api/leads' }
