// POST /api/report — a viewer flags a wish. 3 different visitors → hidden. One report per visitor per krathong.
import { SB, sbHeaders, json, ipHash } from '../lib/shared.mjs';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export default async (req, context) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  let b; try { b = await req.json(); } catch { return json({ error: 'bad json' }, 400); }
  if (!UUID.test(b.id || '')) return json({ error: 'id' }, 400);
  const rh = await ipHash(context.ip);
  try { await fetch(`${SB}/rest/v1/rpc/report_krathong_v2`, { method: 'POST', headers: sbHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify({ kid: b.id, rh }) }); } catch (e) { return json({ error: 'busy' }, 503); }
  return json({ ok: true }, 200, { 'Cache-Control': 'no-store' });
};
export const config = { path: '/api/report' };
