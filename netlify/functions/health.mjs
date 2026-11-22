// GET /api/health — self-check that explains (in Thai) what is missing. Never shows the secret key itself.
import { SB, sbHeaders, json } from '../lib/shared.mjs';

export default async () => {
  const key = process.env.SUPABASE_SERVICE_KEY || '';
  const out = {
    '1_function_running': '✅ ฟังก์ชันหลังบ้านทำงาน (โฟลเดอร์ netlify อัปขึ้นถูกต้อง)',
    '2_SUPABASE_URL': SB ? (/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(SB) ? '✅ มีค่า: ' + SB : '⚠️ มีค่าแต่รูปแบบแปลก: ' + SB + ' (ควรเป็น https://xxxx.supabase.co)') : '❌ ไม่พบ SUPABASE_URL ใน Netlify',
    '3_SUPABASE_SERVICE_KEY': !key ? '❌ ไม่พบ SUPABASE_SERVICE_KEY ใน Netlify'
      : key.startsWith('sb_secret_') ? '✅ เป็น Secret key แบบใหม่'
      : key.startsWith('sb_publishable_') ? '❌ ใส่ผิดตัว: นี่คือ Publishable key ต้องใช้ Secret key (sb_secret_...)'
      : key.startsWith('eyJ') ? '✅ เป็น key แบบเก่า (JWT) ใช้ได้ถ้าเป็น service_role'
      : '⚠️ รูปแบบ key ไม่คุ้นเคย ตรวจว่าคัดลอกครบ',
  };
  if (!SB || !key) {
    out['4_database'] = '⏸️ ยังตรวจไม่ได้ ใส่ค่าใน Netlify ให้ครบ แล้วกด Trigger deploy ใหม่';
    return json(out, 200, { 'Cache-Control': 'no-store' });
  }
  try {
    const r = await fetch(`${SB.replace(/\/$/, '')}/rest/v1/krathongs?select=id&limit=1`, { headers: sbHeaders() });
    const t = await r.text();
    if (r.ok) out['4_database'] = '✅ ต่อฐานข้อมูลได้ และพบตาราง krathongs — ระบบพร้อมใช้งาน';
    else if (r.status === 401 || r.status === 403) out['4_database'] = `❌ key ไม่ถูกต้องหรือไม่มีสิทธิ์ (HTTP ${r.status}) — คัดลอก Secret key ใหม่จาก Supabase แล้ววางใน Netlify`;
    else if (r.status === 404 || /relation|does not exist|PGRST205|schema cache/i.test(t)) out['4_database'] = `❌ ไม่พบตาราง krathongs — ยังไม่ได้รัน supabase.sql ใน Supabase → SQL Editor (HTTP ${r.status})`;
    else out['4_database'] = `❌ ฐานข้อมูลตอบกลับผิดปกติ (HTTP ${r.status}): ${t.slice(0, 160)}`;
    const s = await fetch(`${SB.replace(/\/$/, '')}/rest/v1/rpc/river_stats`, { method: 'POST', headers: sbHeaders({ 'Content-Type': 'application/json' }), body: '{}' });
    out['5_river_stats'] = s.ok ? '✅ ฟังก์ชันนับยอดรวมทำงาน: ' + (await s.text()) : `❌ ฟังก์ชันนับยอดรวมไม่ทำงาน (HTTP ${s.status}) — รัน supabase.sql ใหม่ทั้งไฟล์`;
  } catch (e) {
    out['4_database'] = '❌ ติดต่อ Supabase ไม่ได้ — ตรวจ SUPABASE_URL หรือโปรเจกต์ Supabase ถูกพัก (Paused) อยู่: ' + e.message;
  }
  return json(out, 200, { 'Cache-Control': 'no-store' });
};
export const config = { path: '/api/health' };
