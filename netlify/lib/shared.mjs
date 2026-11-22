// Shared helpers for Loy Krathong 2569 functions (server-side only — keys never reach the browser)
// tolerate common paste mistakes: spaces, quotes, trailing "/" or "/rest/v1"
const tidy = (v) => String(v || '').trim().replace(/^['"]|['"]$/g, '');
export const SB = tidy(process.env.SUPABASE_URL).replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const KEY = tidy(process.env.SUPABASE_SERVICE_KEY);
// New Supabase keys (sb_secret_...) must go ONLY in the apikey header (they are not JWTs).
// Legacy service_role JWT keys also need Authorization: Bearer.
export const sbHeaders = (extra = {}) =>
  String(KEY || '').startsWith('sb_')
    ? { apikey: KEY, ...extra }
    : { apikey: KEY, Authorization: `Bearer ${KEY}`, ...extra };
export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers } });

// Words that are masked before saving (extend as needed)
const BAD = ['เหี้ย', 'สัส', 'ควย', 'เย็ด', 'ระยำ', 'ชาติหมา', 'ไอ้สัตว์', 'อีดอก', 'แม่ง', 'เงี่ยน', 'fuck', 'shit', 'bitch', 'kuy'];
export const clean = (t, max) => {
  let s = String(t ?? '').replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, max);
  for (const w of BAD) s = s.split(w).join('*'.repeat(Math.min(w.length, 4)));
  return s;
};
export const looksLikeSpam = (t) => /(https?:\/\/|www\.|\.com|line\.me|@\w{3,}|\d{9,})/i.test(t);

const HEX = /^#[0-9a-fA-F]{6}$/;
const ID = /^[a-z0-9_]{1,20}$/;
export const cleanCfg = (c, type) => {
  if (!c || typeof c !== 'object') return null;
  if (type === 'lantern') return {
    shape: ID.test(c.shape) ? c.shape : 'classic', color: HEX.test(c.color) ? c.color : '#fff1d6',
    pattern: ID.test(c.pattern) ? c.pattern : 'none', qty: Math.max(1, Math.min(9, parseInt(c.qty) || 1)), seed: (+c.seed || 0) % 100,
  };
  return {
    base: ID.test(c.base) ? c.base : 'leaf',
    flowers: (Array.isArray(c.flowers) ? c.flowers : []).filter((x) => ID.test(x)).slice(0, 4),
    accent: HEX.test(c.accent) ? c.accent : '#ff4fd8', candle: HEX.test(c.candle) ? c.candle : '#ffe7a3',
    incense: !!c.incense, lights: ID.test(c.lights) ? c.lights : 'off', cstyle: ID.test(c.cstyle) ? c.cstyle : 'classic',
    topper: ID.test(c.topper) ? c.topper : 'none', seed: (+c.seed || 0) % 100,
  };
};
export const ipHash = async (ip) => {
  const data = new TextEncoder().encode((process.env.IP_SALT || 'loykrathong2569') + '|' + (ip || 'x'));
  const d = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(d)].slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('');
};
