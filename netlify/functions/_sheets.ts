/**
 * Append leads to the "AI Leads" Google Sheet via Apps Script webhook.
 * Set GOOGLE_SHEETS_WEBHOOK_URL in Netlify env vars.
 * Setup: Extensions → Apps Script in your sheet, paste the doPost code below,
 * Deploy → New deployment → Web app → "Anyone" access → copy URL.
 *
 * Apps Script code:
 * function doPost(e) {
 *   const data = JSON.parse(e.postData.contents);
 *   const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
 *   if (sheet.getLastRow() === 0) {
 *     sheet.appendRow(['Date','Client Email','Client Name','Zip','Industry',
 *       'Address','City','Owner','Phones','Emails','Sale Price','Sale Date',
 *       'Year Built','Living Area (sqft)','Lot Size (sqft)','Score','Analysis','Maps URL']);
 *   }
 *   data.rows.forEach(r => sheet.appendRow(r));
 *   return ContentService.createTextOutput(JSON.stringify({ok:true}))
 *     .setMimeType(ContentService.MimeType.JSON);
 * }
 */

export interface SheetLead {
  address: string; city: string; ownerName: string;
  phones: string[]; emails: string[];
  salePrice: number; saleDate: string; yearBuilt: string;
  livingArea: string; lotSize: string; score: number;
  analysis: string; mapsUrl: string;
}

export async function appendLeadsToSheet(
  leads: SheetLead[],
  meta: { zip: string; industry: string; email: string; name: string },
): Promise<void> {
  const url = process.env.GOOGLE_SHEETS_WEBHOOK_URL
  if (!url || !leads.length) return
  const now = new Date().toISOString()
  const rows = leads.map(l => [
    now, meta.email, meta.name, meta.zip, meta.industry,
    l.address, l.city, l.ownerName,
    (l.phones ?? []).join(', '), (l.emails ?? []).join(', '),
    l.salePrice, l.saleDate, l.yearBuilt, l.livingArea, l.lotSize,
    l.score, l.analysis, l.mapsUrl,
  ])
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows }),
    })
  } catch { /* best-effort */ }
}
