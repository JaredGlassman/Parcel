export default async function handler(_req: Request): Promise<Response> {
  return Response.json({ ok: true, time: new Date().toISOString() })
}
export const config = { path: '/api/ping' }
