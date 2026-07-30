"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";
import {
  getSales,
  getExpenses,
  getMenu,
  createSale,
  createExpense,
  logout,
  Sale,
  Expense,
  MenuItem,
} from "@/lib/api";

function isoDay(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function shortDayLabel(d: Date) {
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [menuItemId, setMenuItemId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("CASH");

  const [expCategory, setExpCategory] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expNote, setExpNote] = useState("");

  async function loadAll() {
    try {
      const [salesData, expensesData, menuData] = await Promise.all([
        getSales(),
        getExpenses(),
        getMenu(),
      ]);
      setSales(salesData.sales);
      setExpenses(expensesData.expenses);
      setMenu(menuData.items);
      if (menuData.items.length > 0) setMenuItemId(menuData.items[0].id);
    } catch (err: any) {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleAddSale(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const item = menu.find((m) => m.id === menuItemId);
    if (!item) return;
    try {
      await createSale(paymentMethod, [
        { menuItemId, quantity, unitPrice: Number(item.price) },
      ]);
      setQuantity(1);
      loadAll();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!expCategory || !expAmount) return;
    try {
      await createExpense(expCategory, Number(expAmount), expNote);
      setExpCategory("");
      setExpAmount("");
      setExpNote("");
      loadAll();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  if (loading) {
    return (
      <main>
        <NavBar />
        <div className="wrap section">กำลังโหลด...</div>
      </main>
    );
  }

  const totalSales = sales.reduce((sum, s) => sum + Number(s.total), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  function costOf(menuItemId: string, menuItem?: { cost: string }) {
    if (menuItem) return Number(menuItem.cost);
    const found = menu.find((m) => m.id === menuItemId);
    return found ? Number(found.cost) : 0;
  }

  // ---------- กราฟยอดขาย/รายจ่าย 14 วันล่าสุด ----------
  const today = new Date();
  const last14: { key: string; label: string; sales: number; expenses: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    last14.push({ key: isoDay(d), label: shortDayLabel(d), sales: 0, expenses: 0 });
  }
  const dayIndex = new Map(last14.map((d, idx) => [d.key, idx]));
  sales.forEach((s) => {
    const key = isoDay(new Date(s.createdAt));
    const idx = dayIndex.get(key);
    if (idx !== undefined) last14[idx].sales += Number(s.total);
  });
  expenses.forEach((e) => {
    const key = isoDay(new Date(e.date));
    const idx = dayIndex.get(key);
    if (idx !== undefined) last14[idx].expenses += Number(e.amount);
  });
  const chartMax = Math.max(1, ...last14.flatMap((d) => [d.sales, d.expenses]));
  const chartW = 700;
  const chartH = 180;
  const slotW = chartW / 14;
  const barW = slotW * 0.32;

  // ---------- เมนูขายดี ----------
  const bestSellerMap = new Map<string, { name: string; qty: number; revenue: number }>();
  sales.forEach((s) => {
    s.items.forEach((it) => {
      const name = it.menuItem?.name || menu.find((m) => m.id === it.menuItemId)?.name || "ไม่ทราบชื่อ";
      const prev = bestSellerMap.get(it.menuItemId) || { name, qty: 0, revenue: 0 };
      prev.qty += it.quantity;
      prev.revenue += it.quantity * Number(it.unitPrice);
      bestSellerMap.set(it.menuItemId, prev);
    });
  });
  const bestSellers = Array.from(bestSellerMap.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);
  const maxQty = Math.max(1, ...bestSellers.map((b) => b.qty));

  // ---------- ปิดยอดประจำวัน + จุดคุ้มทุน ----------
  const todayKey = isoDay(today);
  const todaySales = sales.filter((s) => isoDay(new Date(s.createdAt)) === todayKey);
  const todayExpenses = expenses.filter((e) => isoDay(new Date(e.date)) === todayKey);
  const todaySalesTotal = todaySales.reduce((sum, s) => sum + Number(s.total), 0);
  const todayExpensesTotal = todayExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const todayQty = todaySales.reduce(
    (sum, s) => sum + s.items.reduce((q, it) => q + it.quantity, 0),
    0
  );
  const todayCOGS = todaySales.reduce(
    (sum, s) =>
      sum +
      s.items.reduce((c, it) => c + it.quantity * costOf(it.menuItemId, it.menuItem), 0),
    0
  );
  const todayGrossProfit = todaySalesTotal - todayCOGS;
  const todayAvgMargin = todayQty > 0 ? todayGrossProfit / todayQty : null;

  const allQty = sales.reduce((sum, s) => sum + s.items.reduce((q, it) => q + it.quantity, 0), 0);
  const allCOGS = sales.reduce(
    (sum, s) =>
      sum +
      s.items.reduce((c, it) => c + it.quantity * costOf(it.menuItemId, it.menuItem), 0),
    0
  );
  const allAvgMargin = allQty > 0 ? (totalSales - allCOGS) / allQty : null;

  const avgMarginPerCup = todayAvgMargin ?? allAvgMargin;
  const breakEvenCups =
    avgMarginPerCup && avgMarginPerCup > 0
      ? Math.ceil(todayExpensesTotal / avgMarginPerCup)
      : null;
  const cupsToGo = breakEvenCups !== null ? Math.max(0, breakEvenCups - todayQty) : null;

  return (
    <main>
      <NavBar />
      <div className="wrap section">
        <div className="section-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1>แดชบอร์ดร้าน</h1>
            <p>สรุปยอดขายและรายจ่ายทั้งหมด</p>
          </div>
          <button className="btn btn-outline" onClick={handleLogout}>
            ออกจากระบบ
          </button>
        </div>

        {error && <div className="error-box">{error}</div>}

        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-num">฿{totalSales.toLocaleString()}</div>
            <div className="stat-label">ยอดขายรวม</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">฿{totalExpenses.toLocaleString()}</div>
            <div className="stat-label">รายจ่ายรวม</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">฿{(totalSales - totalExpenses).toLocaleString()}</div>
            <div className="stat-label">กำไรสุทธิ</div>
          </div>
        </div>

        {/* ปิดยอดประจำวัน */}
        <div className="card" style={{ marginBottom: 40 }}>
          <h3 style={{ marginTop: 0 }}>ปิดยอดประจำวัน ({today.toLocaleDateString("th-TH")})</h3>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-num">฿{todaySalesTotal.toLocaleString()}</div>
              <div className="stat-label">ยอดขายวันนี้ ({todayQty} แก้ว/ชิ้น)</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">฿{todayCOGS.toLocaleString()}</div>
              <div className="stat-label">ต้นทุนสินค้าโดยประมาณ (จากราคาต้นทุนในเมนู)</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">฿{todayExpensesTotal.toLocaleString()}</div>
              <div className="stat-label">รายจ่ายที่บันทึกเองวันนี้</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">฿{todayGrossProfit.toLocaleString()}</div>
              <div className="stat-label">กำไรขั้นต้นวันนี้ (ยอดขาย - ต้นทุนสินค้า)</div>
            </div>
          </div>
          <p className="note" style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 8 }}>
            หมายเหตุ: &quot;ต้นทุนสินค้าโดยประมาณ&quot; คำนวณจากช่อง &quot;ต้นทุน&quot; ที่ตั้งไว้ในแต่ละเมนู
            ซึ่งอาจซ้ำซ้อนกับ &quot;รายจ่ายที่บันทึกเอง&quot; หากมีการบันทึกค่าวัตถุดิบไว้ในนั้นด้วย
            ควรเลือกใช้อย่างใดอย่างหนึ่งให้สอดคล้องกันเพื่อไม่ให้นับต้นทุนซ้ำ
          </p>

          <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: "var(--cream-2)" }}>
            <strong>จุดคุ้มทุนวันนี้:</strong>{" "}
            {breakEvenCups === null ? (
              <span>ยังไม่มีข้อมูลเพียงพอในการคำนวณ (ยังไม่มีรายการขายที่มีกำไรต่อแก้วให้ใช้อ้างอิง)</span>
            ) : todayExpensesTotal === 0 ? (
              <span>วันนี้ยังไม่มีการบันทึกรายจ่าย จึงยังไม่มีจุดคุ้มทุนที่ต้องไปให้ถึง</span>
            ) : cupsToGo === 0 ? (
              <span>ขายถึงจุดคุ้มทุนของวันนี้แล้ว ✅ (คุ้มรายจ่าย ฿{todayExpensesTotal.toLocaleString()} แล้ว)</span>
            ) : (
              <span>
                ต้องขายให้ถึง {breakEvenCups} แก้ว/ชิ้น ถึงจะคุ้มรายจ่ายวันนี้ (฿{todayExpensesTotal.toLocaleString()}) —
                ขายไปแล้ว {todayQty} แก้ว/ชิ้น เหลืออีก {cupsToGo} แก้ว/ชิ้น
              </span>
            )}
          </div>
        </div>

        {/* กราฟยอดขาย/รายจ่าย 14 วัน */}
        <div className="card" style={{ marginBottom: 40, overflowX: "auto" }}>
          <h3 style={{ marginTop: 0 }}>ยอดขายเทียบรายจ่าย 14 วันล่าสุด</h3>
          <svg width={chartW} height={chartH + 30} style={{ minWidth: chartW }}>
            {last14.map((d, i) => {
              const x = i * slotW;
              const salesH = (d.sales / chartMax) * chartH;
              const expH = (d.expenses / chartMax) * chartH;
              return (
                <g key={d.key}>
                  <rect
                    x={x + slotW * 0.12}
                    y={chartH - salesH}
                    width={barW}
                    height={salesH}
                    fill="#C89452"
                    rx={2}
                  />
                  <rect
                    x={x + slotW * 0.12 + barW + 3}
                    y={chartH - expH}
                    width={barW}
                    height={expH}
                    fill="#7A5233"
                    rx={2}
                  />
                  <text
                    x={x + slotW / 2}
                    y={chartH + 16}
                    fontSize={9}
                    textAnchor="middle"
                    fill="#6B5A4B"
                  >
                    {d.label}
                  </text>
                </g>
              );
            })}
          </svg>
          <div style={{ display: "flex", gap: 16, fontSize: 13, marginTop: 4 }}>
            <span><span style={{ display: "inline-block", width: 10, height: 10, background: "#C89452", marginRight: 6, borderRadius: 2 }} />ยอดขาย</span>
            <span><span style={{ display: "inline-block", width: 10, height: 10, background: "#7A5233", marginRight: 6, borderRadius: 2 }} />รายจ่าย</span>
          </div>
        </div>

        {/* เมนูขายดี */}
        <div className="card" style={{ marginBottom: 40 }}>
          <h3 style={{ marginTop: 0 }}>เมนูขายดี (5 อันดับแรก จากยอดขายทั้งหมด)</h3>
          {bestSellers.length === 0 ? (
            <p>ยังไม่มีข้อมูลการขาย</p>
          ) : (
            bestSellers.map((b, i) => (
              <div key={b.name + i} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 4 }}>
                  <span>{i + 1}. {b.name}</span>
                  <span>{b.qty} แก้ว/ชิ้น · ฿{b.revenue.toLocaleString()}</span>
                </div>
                <div style={{ background: "var(--cream-2)", borderRadius: 8, height: 8 }}>
                  <div
                    style={{
                      width: `${(b.qty / maxQty) * 100}%`,
                      background: "var(--gold)",
                      height: 8,
                      borderRadius: 8,
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 40 }}>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>บันทึกยอดขาย</h3>
            <form onSubmit={handleAddSale}>
              <div className="field">
                <label>เมนู</label>
                <select value={menuItemId} onChange={(e) => setMenuItemId(e.target.value)}>
                  {menu.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (฿{m.price})
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>จำนวน</label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </div>
              <div className="field">
                <label>ช่องทางชำระเงิน</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="CASH">เงินสด</option>
                  <option value="QR">QR พร้อมเพย์</option>
                  <option value="CARD">บัตร</option>
                </select>
              </div>
              <button type="submit" className="btn btn-gold" style={{ width: "100%" }}>
                บันทึกยอดขาย
              </button>
            </form>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>บันทึกรายจ่าย</h3>
            <form onSubmit={handleAddExpense}>
              <div className="field">
                <label>หมวดหมู่</label>
                <input
                  type="text"
                  placeholder="เช่น วัตถุดิบ, ค่าเช่า"
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value)}
                />
              </div>
              <div className="field">
                <label>จำนวนเงิน</label>
                <input
                  type="number"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                />
              </div>
              <div className="field">
                <label>หมายเหตุ</label>
                <input
                  type="text"
                  value={expNote}
                  onChange={(e) => setExpNote(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
                บันทึกรายจ่าย
              </button>
            </form>
          </div>
        </div>

        <h3>ยอดขายล่าสุด</h3>
        <table className="list-table" style={{ marginBottom: 40 }}>
          <thead>
            <tr>
              <th>เวลา</th>
              <th>ช่องทางชำระเงิน</th>
              <th>ยอดรวม</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id}>
                <td>{new Date(s.createdAt).toLocaleString("th-TH")}</td>
                <td>{s.paymentMethod}</td>
                <td>฿{s.total}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3>รายจ่ายล่าสุด</h3>
        <table className="list-table">
          <thead>
            <tr>
              <th>วันที่</th>
              <th>หมวดหมู่</th>
              <th>หมายเหตุ</th>
              <th>จำนวนเงิน</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e.id}>
                <td>{new Date(e.date).toLocaleString("th-TH")}</td>
                <td>{e.category}</td>
                <td>{e.note}</td>
                <td>฿{e.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
