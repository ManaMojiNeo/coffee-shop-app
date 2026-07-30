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
