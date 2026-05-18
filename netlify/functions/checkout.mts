/**
 * POST /api/checkout
 * Body: { zip, industry, email, previewCount }
 * Returns: { url } — Stripe Checkout redirect URL
 */
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const PRICE_CENTS = 4900 // $49
const FULL_LIMIT = 15

export default async function handler(req: Request): Promise<Response> {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405, headers: cors })

  if (!process.env.STRIPE_SECRET_KEY) {
    return Response.json({ error: 'Stripe not configured.' }, { status: 500, headers: cors })
  }

  let zip = '78704', industry = 'Fencing', email: string | undefined

  try {
    const body = await req.json()
    zip = body.zip ?? zip
    industry = body.industry ?? industry
    email = body.email
  } catch { /* ignore */ }

  const origin = req.headers.get('origin') ?? 'https://getparcel.io'

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    customer_email: email,
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: `${industry} Leads — ${zip}`,
          description: `${FULL_LIMIT} qualified ${industry.toLowerCase()} leads in zip code ${zip}, identified by satellite analysis.`,
        },
        unit_amount: PRICE_CENTS,
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${origin}/?delivery=1&session_id={CHECKOUT_SESSION_ID}&zip=${encodeURIComponent(zip)}&industry=${encodeURIComponent(industry)}`,
    cancel_url: `${origin}/#preview`,
    metadata: { zip, industry, limit: String(FULL_LIMIT) },
  })

  return Response.json({ url: session.url }, { status: 200, headers: cors })
}

export const config = { path: '/api/checkout' }
