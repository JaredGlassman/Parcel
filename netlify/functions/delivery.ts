/**
 * GET /api/delivery?session_id=cs_xxx&zip=78704&industry=Fencing
 * Verifies Stripe payment, runs full lead scan via shared pipeline, returns leads + CSV.
 */
import Stripe from 'stripe'
import { runLeadScan } from './_analysis.ts'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

const FULL_LIMIT = 15

function toCSV(leads: any[]) {
  const header = 'Address,City,Lat,Lng,Signal,Score,Analysis,Maps URL'
  return [header, ...leads.map(l =>
    [l.address, l.city, l.lat, l.lng, l.signal, l.score, `"${l.analysis}"`, l.mapsUrl].join(',')
  )].join('\n')
}

export default async function handler(req: Request): Promise<Response> {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })

  if (!process.env.STRIPE_SECRET_KEY) {
    return Response.json({ error: 'Stripe not configured.' }, { status: 500, headers: cors })
  }

  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get('session_id')
  const zip = searchParams.get('zip') ?? '78704'
  const industry = searchParams.get('industry') ?? 'Fencing'
  const format = searchParams.get('format') ?? 'json'

  if (!sessionId) return Response.json({ error: 'Missing session_id' }, { status: 400, headers: cors })

  let session: Stripe.Checkout.Session
  try {
    session = await getStripe().checkout.sessions.retrieve(sessionId)
  } catch {
    return Response.json({ error: 'Invalid session ID' }, { status: 400, headers: cors })
  }

  if (session.payment_status !== 'paid') {
    return Response.json({ error: 'Payment not completed' }, { status: 402, headers: cors })
  }

  const limit = parseInt(session.metadata?.limit ?? String(FULL_LIMIT), 10)
  const { leads, analyzed } = await runLeadScan(zip, industry, limit)

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

  return Response.json({ zip, industry, count: leads.length, analyzed, sessionId, leads }, { status: 200, headers: cors })
}

export const config = { path: '/api/delivery' }
