/**
 * Append leads + signups to the "Parcel" Google Sheet via Sheets API.
 *
 * Env vars (set in Netlify):
 *   PARCEL_SHEET_ID            — the spreadsheet ID
 *   GOOGLE_CLIENT_ID           — OAuth client (same one used by AI Leads scripts)
 *   GOOGLE_CLIENT_SECRET
 *   SHEETS_REFRESH_TOKEN_INFO  — refresh token (info@goodguyspools.com)
 *
 * Tabs the sheet must have:
 *   "Signups"         — one row per form submission
 *   "Leads Delivered" — one row per lead returned to that signup
 *
 * Signups header (col A..J):
 *   Created At | Email | Name | Company | Phone | Zip | Industry | Status | Stripe Customer ID | Notes
 *
 * Leads Delivered header (col A..R):
 *   Created At | Client Email | Client Name | Zip | Industry | Property Address |
 *   City | Owner | Phones | Emails | Sale Price | Sale Date | Year Built |
 *   Living Area (sqft) | Lot Size (sqft) | Score | Analysis | Maps URL
 */

import { google } from 'googleapis'

export interface SheetLead {
  address: string; city: string; ownerName: string;
  phones: string[]; emails: string[];
  salePrice: number; saleDate: string; yearBuilt: string;
  livingArea: string; lotSize: string; score: number;
  analysis: string; mapsUrl: string;
}

export interface SheetSignup {
  email: string;
  name: string;
  company: string;
  phone: string;
  zip: string;
  industry: string;
}

function getSheetsClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const refresh = process.env.SHEETS_REFRESH_TOKEN_INFO
  const sheetId = process.env.PARCEL_SHEET_ID
  if (!clientId || !clientSecret || !refresh || !sheetId) return null
  const oauth = new google.auth.OAuth2(clientId, clientSecret)
  oauth.setCredentials({ refresh_token: refresh })
  return { sheets: google.sheets({ version: 'v4', auth: oauth }), sheetId }
}

/** Append the form submission to the Signups tab. Best-effort — never throws. */
export async function appendSignupToSheet(s: SheetSignup): Promise<void> {
  const c = getSheetsClient()
  if (!c) return
  const now = new Date().toISOString()
  const row = [now, s.email, s.name, s.company, s.phone, s.zip, s.industry, 'new', '', '']
  try {
    await c.sheets.spreadsheets.values.append({
      spreadsheetId: c.sheetId,
      range: `'Signups'!A:J`,
      valueInputOption: 'RAW',
      requestBody: { values: [row] },
    })
  } catch (err) {
    console.error('appendSignupToSheet:', (err as Error).message)
  }
}

/** Append the leads delivered to that signup to the Leads Delivered tab. */
export async function appendLeadsToSheet(
  leads: SheetLead[],
  meta: { zip: string; industry: string; email: string; name: string },
): Promise<void> {
  const c = getSheetsClient()
  if (!c || !leads.length) return
  const now = new Date().toISOString()
  const rows = leads.map((l) => [
    now, meta.email, meta.name, meta.zip, meta.industry,
    l.address, l.city, l.ownerName,
    (l.phones ?? []).join(', '), (l.emails ?? []).join(', '),
    l.salePrice, l.saleDate, l.yearBuilt, l.livingArea, l.lotSize,
    l.score, l.analysis, l.mapsUrl,
  ])
  try {
    await c.sheets.spreadsheets.values.append({
      spreadsheetId: c.sheetId,
      range: `'Leads Delivered'!A:R`,
      valueInputOption: 'RAW',
      requestBody: { values: rows },
    })
  } catch (err) {
    console.error('appendLeadsToSheet:', (err as Error).message)
  }
}
