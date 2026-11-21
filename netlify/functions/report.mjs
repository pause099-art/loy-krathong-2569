// POST /api/report — a viewer flags a wish. 3 reports hide it automatically.
import { SB, sbHeaders, json } from '../lib/shared.mjs';
const UUID = /^[0-9a-f-]{36}$/i;
export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  let b; try { b = await req.json(); } catch { return json({ error: 'bad json' }, 400); }
  if (!UUID.test(b.id || '')) return json({ error: 'id' }, 400);
  try { await fetch(`${SB}/rest/v1/rpc/report_krathong`, { method: 'POST', headers: sbHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify({ kid: b.id }) }); } catch (e) { return json({ error: 'busy' }, 503); }
  return json({ ok: true }, 200, { 'Cache-Control': 'no-store' });
};
export const config = { path: '/api/report' };
