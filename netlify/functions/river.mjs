// GET /api/river — latest krathongs + totals. Cached on Netlify's CDN for 15s so
// 10,000 visitors cost the database only ~4 queries per minute.
import { SB, sbHeaders, json } from '../lib/shared.mjs';

export default async () => {
  try {
    const q = `${SB}/rest/v1/krathongs?select=id,type,name,wish,cat,cfg,created_at&hidden=eq.false&order=created_at.desc&limit=24`;
    const [items, stats] = await Promise.all([
      fetch(q, { headers: sbHeaders() }).then((r) => r.json()),
      fetch(`${SB}/rest/v1/rpc/river_stats`, { method: 'POST', headers: sbHeaders({ 'Content-Type': 'application/json' }), body: '{}' }).then((r) => r.json()),
    ]);
    return json({ items: Array.isArray(items) ? items : [], total: stats?.total ?? 0, totalL: stats?.total_l ?? 0 }, 200, {
      'Cache-Control': 'public, max-age=0, must-revalidate',
      'Netlify-CDN-Cache-Control': 'public, durable, s-maxage=15, stale-while-revalidate=60',
    });
  } catch (e) {
    return json({ items: [], total: 0, totalL: 0, error: 'unavailable' }, 503, { 'Cache-Control': 'no-store' });
  }
};
export const config = { path: '/api/river' };
