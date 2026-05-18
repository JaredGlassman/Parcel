/**
 * GET  /api/crm              — list all contacts (requires ?pw=CRM_PASSWORD)
 * GET  /api/crm?email=x      — get contact + all deliveries
 * PATCH /api/crm             — update contact { email, status?, notes? }
 */
import { getStore } from '@netlify/blobs'

function authOk(req: Request): boolean {
  const { searchParams } = new URL(req.url)
  const pw = searchParams.get('pw') ?? req.headers.get('x-crm-password') ?? ''
  return pw === (process.env.CRM_PASSWORD ?? 'parcel-admin')
}

export default async function handler(req: Request): Promise<Response> {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })

  if (!authOk(req)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers: cors })
  }

  const store = getStore('parcel-crm')
  const { searchParams } = new URL(req.url)

  // ── PATCH: update contact status / notes ─────────────────────────────────
  if (req.method === 'PATCH') {
    const { email, status, notes } = await req.json()
    const contact = await store.get(`contact:${email}`, { type: 'json' }) as any
    if (!contact) return Response.json({ error: 'Contact not found' }, { status: 404, headers: cors })
    if (status) contact.status = status
    if (notes !== undefined) contact.notes = notes
    await store.set(`contact:${email}`, JSON.stringify(contact))

    // Sync status to index
    const index = (await store.get('index', { type: 'json' }) as any[] | null) ?? []
    const idx = index.findIndex((c) => c.email === email)
    if (idx >= 0) index[idx].status = contact.status
    await store.set('index', JSON.stringify(index))

    return Response.json({ ok: true, contact }, { status: 200, headers: cors })
  }

  // ── GET single contact with deliveries ───────────────────────────────────
  const email = searchParams.get('email')
  if (email) {
    const contact = await store.get(`contact:${email}`, { type: 'json' }) as any
    if (!contact) return Response.json({ error: 'Not found' }, { status: 404, headers: cors })

    // Hydrate deliveries
    const deliveries = await Promise.all(
      (contact.deliveries ?? []).map(async (s: any) => {
        const d = await store.get(`delivery:${s.id}`, { type: 'json' })
        return d ?? s
      }),
    )
    return Response.json({ ...contact, deliveries }, { status: 200, headers: cors })
  }

  // ── GET index (all contacts) ─────────────────────────────────────────────
  const index = (await store.get('index', { type: 'json' }) as any[] | null) ?? []
  return Response.json({ count: index.length, contacts: index }, { status: 200, headers: cors })
}

export const config = { path: '/api/crm' }
