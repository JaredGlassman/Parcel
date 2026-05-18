/**
 * POST /api/checkout
 * Body: { plan: 'starter'|'metro', zip, industry, email, company? }
 * Returns: { url } — Stripe Checkout redirect URL (subscription)
 */
import Stripe from 'stripe'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

const PLANS = {
  starter: {
    name: 'Single Territory',
    description: '75 qualified leads/month · 1 zip · exclusive territory',
    amount: 120000, // $1,200/mo
    leads: 75,
  },
  metro: {
    name: 'Metro',
    description: '300 qualified leads/month · full metro · exclusive coverage',
    amount: 350000, // $3,500/mo
    leads: 300,
  },
}

export default async function handler(req: Request): Promise<Response> {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405, headers: cors })

  if (!process.env.STRIPE_SECRET_KEY) {
    return Response.json({ error: 'Stripe not configured.' }, { status: 500, headers: cors })
  }

  let plan = 'starter', zip = '78704', industry = 'Fencing', email = '', company = ''
  try {
    const body = await req.json()
    plan = body.plan ?? plan
    zip = (body.zip ?? zip).trim()
    industry = body.industry ?? industry
    email = (body.email ?? '').trim().toLowerCase()
    company = (body.company ?? '').trim()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400, headers: cors })
  }

  const tier = PLANS[plan as keyof typeof PLANS]
  if (!tier) return Response.json({ error: 'Invalid plan' }, { status: 400, headers: cors })
  if (!email.includes('@')) return Response.json({ error: 'Valid email required' }, { status: 400, headers: cors })

  const origin = new URL(req.url).origin

  const session = await getStripe().checkout.sessions.create({
    payment_method_types: ['card'],
    customer_email: email,
    line_items: [{
      price_data: {
        currency: 'usd',
        recurring: { interval: 'month' },
        product_data: {
          name: `${tier.name} — ${industry} · ${zip}`,
          description: tier.description,
        },
        unit_amount: tier.amount,
      },
      quantity: 1,
    }],
    mode: 'subscription',
    success_url: `${origin}/api/activate?session_id={CHECKOUT_SESSION_ID}&zip=${encodeURIComponent(zip)}&industry=${encodeURIComponent(industry)}&redirect=1`,
    cancel_url: `${origin}/#pricing`,
    metadata: { zip, industry, plan, company, leads: String(tier.leads) },
  })

  return Response.json({ url: session.url }, { status: 200, headers: cors })
}

export const config = { path: '/api/checkout' }
