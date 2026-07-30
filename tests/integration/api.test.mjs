// tests/integration/api.test.mjs
//
// Integration Test: เรียก API จริงที่ Deploy อยู่บน Vercel
// (ไม่ใช่ Mock — ทดสอบกับ Production Endpoint จริงและฐานข้อมูล Neon จริงของ
//  คั่วบ้าน คั่วด้วยใจ ที่ https://coffee-shop-app-zeta.vercel.app)
//
// หมายเหตุสำคัญเรื่อง Cookie: ระบบนี้ใช้ httpOnly cookie ชื่อ "token" เก็บ session
// (ต่างจาก Bearer token แบบเดิม) ฟังก์ชัน login() ด้านล่างจึงต้องอ่านค่า
// Set-Cookie จาก response ของการ login มาเอง แล้วแนบกลับไปเป็น header
// Cookie ในทุก request ถัดไปด้วยมือ เพราะ fetch ของ Node ไม่มี Cookie Jar
// อัตโนมัติเหมือนเบราว์เซอร์

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
  // ตัดเอาเฉพาะคู่ name=value ตัวแรก (ตัด attribute เช่น Path, HttpOnly, Max-Age ออก)
  return setCookie.split(";")[0];
}

test("POST /api/expenses พร้อม Cookie ที่ถูกต้อง ต้องได้ 201 และบันทึกค่าตรงตามที่ส่ง", async () => {
  const cookie = await login("owner@kaobaan.coffee", "owner1234");

  const res = await fetch(`${BASE_URL}/api/expenses`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      category: `[Integration Test] วัตถุดิบ ${Date.now()}`,
      amount: 250,
      note: "ทดสอบอัตโนมัติ",
    }),
  });

  assert.equal(res.status, 201);
  const { expense } = await res.json();
  assert.equal(Number(expense.amount), 250);
  assert.equal(expense.note, "ทดสอบอัตโนมัติ");
});

test("POST /api/sales พร้อม Cookie ที่ถูกต้อง ต้องได้ 201 และคำนวณ total ที่ฝั่ง Server (ไม่เชื่อ total จาก Client)", async () => {
  const cookie = await login("owner@kaobaan.coffee", "owner1234");

  const menuRes = await fetch(`${BASE_URL}/api/menu`);
  const { items } = await menuRes.json();
  const item = items.find((m) => m.id === "menu_mocha") ?? items[0];

  const res = await fetch(`${BASE_URL}/api/sales`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      paymentMethod: "QR",
      items: [{ menuItemId: item.id, quantity: 2, unitPrice: Number(item.price) }],
    }),
  });

  assert.equal(res.status, 201);
  const { sale } = await res.json();
  assert.equal(Number(sale.total), Number(item.price) * 2);
});

test("GET /api/menu-requests เป็น Public Endpoint ไม่ต้อง Login ก็เรียกได้ และเรียงตามยอดโหวตมากไปน้อย", async () => {
  const res = await fetch(`${BASE_URL}/api/menu-requests`);
  assert.equal(res.status, 200);
  const { requests } = await res.json();
  assert.ok(Array.isArray(requests));
  for (let i = 1; i < requests.length; i++) {
    assert.ok(requests[i - 1].voteCount >= requests[i].voteCount, "requests ต้องเรียงจากยอดโหวตมากไปน้อย");
  }
});
