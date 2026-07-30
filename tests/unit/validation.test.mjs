// tests/unit/validation.test.mjs
//
// Unit test สำหรับ Logic ตรวจสอบความถูกต้องของฟอร์มบันทึกรายจ่าย
// Logic นี้คัดลอกมาจาก app/api/expenses/route.ts ของจริง (เงื่อนไข `if (!category || !amount)`)
// เพื่อทดสอบแบบแยกส่วน (Unit Test) โดยไม่ต้องพึ่งพา Database หรือ Network

import test from "node:test";
import assert from "node:assert/strict";

// --- Logic จริงจาก app/api/expenses/route.ts (คัดลอกมาเพื่อทดสอบแยกส่วน) ---
function validateExpenseForm({ category, amount }) {
  if (!category || !amount) {
    return { valid: false, error: "กรุณาระบุหมวดหมู่และจำนวนเงิน" };
  }
  return { valid: true, error: null };
}

test("หมวดหมู่ว่างเปล่า ต้องถูกปฏิเสธ", () => {
  const result = validateExpenseForm({ category: "", amount: 100 });
  assert.equal(result.valid, false);
});

test("จำนวนเงินเป็น 0 ต้องถูกปฏิเสธ (0 เป็นค่า falsy ใน JavaScript)", () => {
  const result = validateExpenseForm({ category: "ค่าเช่า", amount: 0 });
  assert.equal(result.valid, false);
});

test("จำนวนเงินติดลบ กลับ 'ผ่าน' การตรวจสอบ — นี่คือช่องโหว่จริงที่เจอระหว่างเขียนเทสต์ชุดนี้ (ดูหัวข้อ 17.4)", () => {
  const result = validateExpenseForm({ category: "ค่าเช่า", amount: -500 });
  assert.equal(result.valid, true);
});

test("หมวดหมู่และจำนวนเงินถูกต้องครบถ้วน ต้องผ่าน", () => {
  const result = validateExpenseForm({ category: "วัตถุดิบ", amount: 250 });
  assert.equal(result.valid, true);
  assert.equal(result.error, null);
});

test("จำนวนเงินเป็นทศนิยม (เช่น ค่ากาแฟเป็นสลึง) ต้องผ่าน", () => {
  const result = validateExpenseForm({ category: "ค่าน้ำแข็ง", amount: 45.5 });
  assert.equal(result.valid, true);
});
