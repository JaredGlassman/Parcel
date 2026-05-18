/**
 * GET /api/activate?session_id=cs_xxx&zip=78704&industry=Fencing
 * Called by Stripe success_url. Marks the zip+industry as exclusive.
 */
import Stripe from 'stripe'
import { getStore } from '@netlify/blobs'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

export default async function handler(req: Request): Promise<Response> {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })

  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get('session_id')
  const zip = (searchParams.get('zip') ?? '').trim()
  const industry = (searchParams.get('industry') ?? '').trim()
  const redirect = searchParams.get('redirect') ?? '1'

  if (!sessionId || !zip || !industry) {
    return Response.json({ error: 'Missing session_id, zip, or industry' }, { status: 400, headers: cors })
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return Response.json({ error: 'Stripe not configured' }, { status: 500, headers: cors })
  }

  let session: Stripe.Checkout.Session
  try {
    session = await getStripe().checkout.sessions.retrieve(sessionId, { expand: ['customer'] })
  } catch {
    return Response.json({ error: 'Invalid session' }, { status: 400, headers: cors })
  }

  if (session.payment_status !== 'paid') {
    return Response.json({ error: 'Payment not completed' }, { status: 402, headers: cors })
  }

  const customer = session.customer as Stripe.Customer | null
  const companyName = session.metadata?.company || customer?.name || session.customer_email || 'Exclusive Partner'

  const store = getStore('parcel-crm')
  await store.set(
    `exclusive:${zip}:${industry}`,
    JSON.stringify({
      companyName,
      customerId: session.customer,
      sessionId,
      zip,
      industry,
      plan: session.metadata?.plan ?? 'starter',
      since: new Date().toISOString(),
    }),
  )

  if (redirect === '1') {
    return Response.redirect(
      `${new URL(req.url).origin}/?activated=1&zip=${encodeURIComponent(zip)}&industry=${encodeURIComponent(industry)}`,
      302,
    )
  }
  return Response.json({ ok: true, zip, industry, companyName }, { status: 200, headers: cors })
}

export const config = { path: '/api/activate' }
