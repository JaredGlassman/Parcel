/**
 * POST /api/capture
 * Body: { email, name?, company?, zip, industry }
 * Runs full 10-lead scan, stores contact in CRM, returns leads immediately.
 */
import { getStore } from '@netlify/blobs'
import { runLeadScan } from './_analysis.ts'

export interface Contact {
  id: string
  email: string
  name: string
  company: string
  status: 'new' | 'contacted' | 'converted' | 'not_interested'
  notes: string
  createdAt: string
  deliveries: DeliverySummary[]
}

export interface DeliverySummary {
  id: string
  zip: string
  industry: string
  leadCount: number
  analyzed: number
  createdAt: string
}

export interface Delivery {
  id: string
  contactEmail: string
  zip: string
  industry: string
  leads: any[]
  analyzed: number
  createdAt: string
}

const LEAD_LIMIT = 10

export default async function handler(req: Request): Promise<Response> {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405, headers: cors })

  let email = '', name = '', company = '', zip = '78704', industry = 'Fencing', phone = ''
  try {
    const body = await req.json()
    email = (body.email ?? '').trim().toLowerCase()
    name = (body.name ?? '').trim()
    company = (body.company ?? '').trim()
    zip = (body.zip ?? zip).trim()
    industry = body.industry ?? industry
    phone = (body.phone ?? '').replace(/\D/g, '').slice(-10)
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400, headers: cors })
  }

  if (!email.includes('@')) {
    return Response.json({ error: 'Valid email required' }, { status: 400, headers: cors })
  }
  if (phone.length < 10) {
    return Response.json({ error: 'Valid US phone number required' }, { status: 400, headers: cors })
  }

  // Block phone numbers that already claimed free leads
  const store = getStore('parcel-crm')
  const phoneUsed = await store.get(`phone:${phone}`)
  if (phoneUsed) {
    return Response.json({ error: 'Free leads already claimed for this phone number. Upgrade for more.' }, { status: 409, headers: cors })
  }

  // Run lead scan
  const { leads, analyzed } = await runLeadScan(zip, industry, LEAD_LIMIT)

  // Store in CRM
  try {
    const now = new Date().toISOString()
    const deliveryId = crypto.randomUUID()

    // Upsert contact
    const existing = await store.get(`contact:${email}`, { type: 'json' }) as Contact | null
    const contact: Contact = existing ?? {
      id: crypto.randomUUID(),
      email,
      name,
      company,
      status: 'new',
      notes: '',
      createdAt: now,
      deliveries: [],
    }
    if (name && !contact.name) contact.name = name
    if (company && !contact.company) contact.company = company
    const summary: DeliverySummary = { id: deliveryId, zip, industry, leadCount: leads.length, analyzed, createdAt: now }
    contact.deliveries.push(summary)
    await store.set(`contact:${email}`, JSON.stringify(contact))

    // Store full delivery
    const delivery: Delivery = { id: deliveryId, contactEmail: email, zip, industry, leads, analyzed, createdAt: now }
    await store.set(`delivery:${deliveryId}`, JSON.stringify(delivery))

    // Update index
    const indexRaw = await store.get('index', { type: 'json' }) as any[] | null
    const index: any[] = indexRaw ?? []
    const existingIdx = index.findIndex((c) => c.email === email)
    const indexEntry = { email, name: contact.name, company: contact.company, status: contact.status, createdAt: contact.createdAt, scanCount: contact.deliveries.length, lastScanAt: now, lastIndustry: industry, lastZip: zip }
    if (existingIdx >= 0) index[existingIdx] = indexEntry
    else index.unshift(indexEntry)
    await store.set('index', JSON.stringify(index))
    // Lock phone so it can't claim free leads again
    await store.set(`phone:${phone}`, JSON.stringify({ email, claimedAt: now }))
  } catch (err) {
    // Don't block lead delivery if CRM write fails
    console.error('CRM write failed:', err)
  }

  return Response.json({ zip, industry, count: leads.length, analyzed, leads }, { status: 200, headers: cors })
}

export const config = { path: '/api/capture' }
