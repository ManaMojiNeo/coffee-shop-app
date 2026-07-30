// tests/e2e/daily-flow.test.mjs
//
// End-to-End Test: จำลอง Flow การใช้งานจริงทั้งสองฝั่งของแอปในหนึ่งวัน
// ฝั่งหน้าบ้าน (Public, ไม่ต้อง Login): ลูกค้าเสนอเมนูใหม่ + โหวตเมนูที่มีคนขอแล้ว
// ฝั่งหลังบ้าน (ต้อง Login): เจ้าของร้านบันทึกยอดขายและรายจ่าย แล้วตรวจว่าแดชบอร์ดรวมยอดถูกต้อง
// รันจริงกับ Production API ของ คั่วบ้าน คั่วด้วยใจ (ไม่ได้ Mock ค่าใดๆ)

import test from "node:test";
import assert from "node:assert/strict";

const BASE_URL = "https://coffee-shop-app-zeta.vercel.app";
const SHOP_ID = "shop_kaobaan";

async function login(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const setCookie = res.headers.get("set-cookie");
  if (res.status !== 200 || !setCookie) throw new Error(`login failed: ${res.status}`);
  return setCookie.split(";")[0];
}

async function getTotals(cookie) {
  const [salesRes, expRes] = await Promise.all([
    fetch(`${BASE_URL}/api/sales`, { headers: { Cookie: cookie } }),
    fetch(`${BASE_URL}/api/expenses`, { headers: { Cookie: cookie } }),
  ]);
  const { sales } = await salesRes.json();
  const { expenses } = await expRes.json();
  return {
    totalSales: sales.reduce((sum, s) => sum + Number(s.total), 0),
    totalExpenses: expenses.reduce((sum, e) => sum + Number(e.amount), 0),
  };
}

test("E2E หน้าบ้าน: ลูกค้าเสนอเมนูใหม่ → โหวตซ้ำ → เห็นยอดโหวตอัปเดตจริงบนหน้า Public", async () => {
  const menuName = `[E2E Test] ชาไทยเย็น ${Date.now()}`;

  const createRes = await fetch(`${BASE_URL}/api/menu-requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ shopId: SHOP_ID, name: menuName }),
  });
  assert.equal(createRes.status, 201);
  const { request } = await createRes.json();
  assert.equal(request.voteCount, 1);

  const voteRes = await fetch(`${BASE_URL}/api/menu-requests/${request.id}/vote`, {
    method: "POST",
  });
  assert.equal(voteRes.status, 200);

  const listRes = await fetch(`${BASE_URL}/api/menu-requests`);
  const { requests } = await listRes.json();
  const found = requests.find((r) => r.id === request.id);
  assert.ok(found, "ต้องเห็นคำขอเมนูนี้ในรายการ public โดยไม่ต้อง Login");
  assert.equal(found.voteCount, 2, "ยอดโหวตต้องเพิ่มขึ้นจริงหลังโหวต และมองเห็นได้แบบ public");
});

test("E2E หลังบ้าน: เจ้าของร้าน Login → บันทึกยอดขาย+รายจ่าย → ยอดรวมในแดชบอร์ดต้องถูกต้องตรงตามสูตรของ Frontend", async () => {
  const cookie = await login("owner@kaobaan.coffee", "owner1234");

  const before = await getTotals(cookie);

  const menuRes = await fetch(`${BASE_URL}/api/menu`);
  const { items } = await menuRes.json();
  const item = items.find((m) => m.id === "menu_mocha") ?? items[0];
  const quantity = 2;

  const saleRes = await fetch(`${BASE_URL}/api/sales`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      paymentMethod: "QR",
      items: [{ menuItemId: item.id, quantity, unitPrice: Number(item.price) }],
    }),
  });
  assert.equal(saleRes.status, 201);

  const expenseAmount = 80;
  const expRes = await fetch(`${BASE_URL}/api/expenses`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      category: `[E2E Test] ค่าแก้วกระดาษ ${Date.now()}`,
      amount: expenseAmount,
      note: "E2E daily flow",
    }),
  });
  assert.equal(expRes.status, 201);

  const after = await getTotals(cookie);

  // สูตรเดียวกับที่ app/dashboard/page.tsx ใช้จริง: sales.reduce(...) และ expenses.reduce(...)
  assert.equal(after.totalSales - before.totalSales, Number(item.price) * quantity);
  assert.equal(after.totalExpenses - before.totalExpenses, expenseAmount);
});
