// POST /api/float — save one krathong/lantern. Validates, masks bad words, rate-limits per visitor.
import { SB, sbHeaders, json, clean, cleanCfg, ipHash, looksLikeSpam } from '../lib/shared.mjs';
const CATS = ['general', 'love', 'work', 'money', 'health', 'family', 'study'];

export default async (req, context) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  let b; try { b = await req.json(); } catch { return json({ error: 'bad json' }, 400); }
  const type = b.type === 'lantern' ? 'lantern' : 'krathong';
  const cfg = cleanCfg(b.cfg, type); if (!cfg) return json({ error: 'cfg' }, 400);
  const pub = !!b.pub;
  let wish = pub ? clean(b.wish, 140) : '';
  if (looksLikeSpam(wish)) wish = ''; // no links / phone numbers in public wishes
  const name = clean(b.name, 30).replace(/(https?:\/\/|www\.)\S*/gi, '');
  const cat = CATS.includes(b.cat) ? b.cat : 'general';
  const ip_hash = await ipHash(context.ip);

  try {
  // rate limit: max 5 per visitor per minute
  const since = new Date(Date.now() - 60_000).toISOString();
  const rl = await fetch(`${SB}/rest/v1/krathongs?select=id&ip_hash=eq.${ip_hash}&created_at=gte.${since}`, {
    headers: sbHeaders({ Prefer: 'count=exact', Range: '0-0' }),
  });
  const cnt = parseInt((rl.headers.get('content-range') || '*/0').split('/')[1]) || 0;
  if (cnt >= 5) return json({ error: 'slow down' }, 429);

  const r = await fetch(`${SB}/rest/v1/krathongs?select=id`, {
    method: 'POST',
    headers: sbHeaders({ 'Content-Type': 'application/json', Prefer: 'return=representation' }),
    body: JSON.stringify({ type, name, wish, cat, cfg, public: pub, ip_hash }),
  });
  if (!r.ok) return json({ error: 'save failed' }, 500);
  const [row] = await r.json();
  return json({ id: row?.id }, 200, { 'Cache-Control': 'no-store' });
  } catch (e) {
    // database busy / network blip: tell the browser to keep the krathong locally, never crash
    return json({ error: 'busy' }, 503, { 'Cache-Control': 'no-store' });
  }
};
export const config = { path: '/api/float' };
