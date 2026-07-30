// tests/security/security.test.mjs
//
// ทดสอบด้านความปลอดภัยและกรณีขอบเขต (Edge Case) เบื้องต้น กับ API จริงบน Production
// ของ คั่วบ้าน คั่วด้วยใจ (https://coffee-shop-app-zeta.vercel.app)
//
// เคสที่ 3 และ 4 ในไฟล์นี้ **ไม่ใช่การพิสูจน์ว่าโค้ดถูกต้อง** แต่เป็นการบันทึก
// พฤติกรรมจริงที่เจอ (ซึ่งเป็นช่องโหว่) ไว้อย่างตรงไปตรงมา ดูรายละเอียดในหัวข้อ 17.4

import test from "node:test";
import assert from "node:assert/strict";

const BASE_URL = "https://coffee-shop-app-zeta.vercel.app";

async function login(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const setCookie = res.headers.get("set-cookie");
  if (res.status !== 200 || !setCookie) {
    throw new Error(`login failed: status ${res.status}`);
  }
  return setCookie.split(";")[0];
}

test("เรียก GET /api/sales โดยไม่แนบ Cookie เลย ต้องถูกปฏิเสธด้วย 401", async () => {
  const res = await fetch(`${BASE_URL}/api/sales`);
  assert.equal(res.status, 401);
});

test("Login ด้วยรหัสผ่านผิด ต้องถูกปฏิเสธด้วย 401 ไม่ใช่ 500", async () => {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "owner@kaobaan.coffee", password: "wrong-password-xyz" }),
  });
  assert.equal(res.status, 401);
});

test("[ช่องโหว่จริงที่พบ] POST /api/expenses ด้วยจำนวนเงินติดลบ กลับได้ 201 แทนที่จะถูกปฏิเสธ", async () => {
  const cookie = await login("owner@kaobaan.coffee", "owner1234");
  const res = await fetch(`${BASE_URL}/api/expenses`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      category: `[Security Test] จำนวนติดลบ ${Date.now()}`,
      amount: -500,
      note: "amount ติดลบ ไม่ควรถูกยอมรับ",
    }),
  });
  // เอกสารพฤติกรรมจริง (ไม่ใช่พฤติกรรมที่ถูกต้อง) — ดูคำอธิบายเต็มในหัวข้อ 17.4
  assert.equal(res.status, 201);
  const { expense } = await res.json();
  assert.equal(Number(expense.amount), -500);
});

test("[ช่องโหว่จริงที่พบ] POST /api/sales ด้วยจำนวนสินค้าติดลบ กลับได้ 201 และทำให้ total ติดลบ", async () => {
  const cookie = await login("owner@kaobaan.coffee", "owner1234");
  const res = await fetch(`${BASE_URL}/api/sales`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      paymentMethod: "CASH",
      items: [{ menuItemId: "menu_mocha", quantity: -3, unitPrice: 70 }],
    }),
  });
  assert.equal(res.status, 201);
  const { sale } = await res.json();
  // total ติดลบ แปลว่ายอดขายรวมทั้งร้านจะถูกหักลบไปโดยไม่ตั้งใจถ้ามีการกรอกผิดหรือถูกโจมตี
  assert.ok(Number(sale.total) < 0);
});

test("คอมเมนต์/หมายเหตุที่มี <script> tag ถูกบันทึกตามที่พิมพ์ (raw) แต่ฝั่ง React จะ escape ตอนแสดงผลเสมอ", async () => {
  const cookie = await login("owner@kaobaan.coffee", "owner1234");
  const payload = '<script>alert("xss")</script>';
  const res = await fetch(`${BASE_URL}/api/expenses`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ category: `[Security Test] XSS ${Date.now()}`, amount: 10, note: payload }),
  });
  assert.equal(res.status, 201);
  const { expense } = await res.json();
  // Backend ไม่ได้ sanitize เนื้อหาก่อนบันทึก (เก็บ raw string ตามที่ส่งมา)
  assert.equal(expense.note, payload);
  // ความปลอดภัยจริงเกิดขึ้นตอนแสดงผลฝั่ง React ({expense.note} ใน JSX)
  // ซึ่ง React escape string ให้อัตโนมัติเสมอ ไม่ render เป็น HTML จริง จึงไม่เกิด XSS
  // แม้ Backend จะไม่ได้ sanitize ก็ตาม
});
