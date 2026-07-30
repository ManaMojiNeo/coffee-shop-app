"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";
import {
  getMenu,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  logout,
  MenuItem,
  CATEGORY_LABELS,
} from "@/lib/api";

const CATEGORIES = ["COFFEE_HOT", "COFFEE_ICED", "NON_CAFFEINE", "BAKERY"];

export default function MenuAdminPage() {
  const router = useRouter();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [category, setCategory] = useState("COFFEE_HOT");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [story, setStory] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCost, setEditCost] = useState("");
  const [editCategory, setEditCategory] = useState("COFFEE_HOT");
  const [editStory, setEditStory] = useState("");

  async function load() {
    try {
      const data = await getMenu();
      setItems(data.items);
    } catch (err: any) {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name || !price) return;
    try {
      await createMenuItem({
        name,
        category,
        price: Number(price),
        cost: Number(cost || 0),
        story,
      });
      setName("");
      setPrice("");
      setCost("");
      setStory("");
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  function startEdit(item: MenuItem) {
    setEditingId(item.id);
    setEditName(item.name);
    setEditPrice(item.price);
    setEditCost(item.cost);
    setEditCategory(item.category);
    setEditStory(item.story || "");
  }

  async function saveEdit(id: string) {
    setError("");
    try {
      await updateMenuItem(id, {
        name: editName,
        category: editCategory,
        price: Number(editPrice),
        cost: Number(editCost),
        story: editStory,
      });
      setEditingId(null);
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("ซ่อนเมนูนี้จากลูกค้าใช่ไหม? (กู้คืนได้ภายหลัง)")) return;
    try {
      await deleteMenuItem(id);
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleRestore(id: string) {
    try {
      await updateMenuItem(id, { isActive: true });
      load();
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

  return (
    <main>
      <NavBar />
      <div className="wrap section">
        <div
          className="section-head"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
        >
          <div>
            <h1>จัดการเมนู</h1>
            <p>เพิ่ม แก้ไข หรือลบเมนูของร้าน</p>
          </div>
          <button className="btn btn-outline" onClick={handleLogout}>
            ออกจากระบบ
          </button>
        </div>

        {error && <div className="error-box">{error}</div>}

        <div className="card" style={{ marginBottom: 32 }}>
          <h3 style={{ marginTop: 0 }}>เพิ่มเมนูใหม่</h3>
          <form onSubmit={handleAdd}>
            <div className="field">
              <label>ชื่อเมนู</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="field">
              <label>หมวดหมู่</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>ราคาขาย</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div className="field">
              <label>ต้นทุน</label>
              <input type="number" value={cost} onChange={(e) => setCost(e.target.value)} />
            </div>
            <div className="field">
              <label>เรื่องราวของเมนู (ไม่บังคับ)</label>
              <input type="text" value={story} onChange={(e) => setStory(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-gold" style={{ width: "100%" }}>
              เพิ่มเมนู
            </button>
          </form>
        </div>

        <table className="list-table">
          <thead>
            <tr>
              <th>ชื่อเมนู</th>
              <th>หมวดหมู่</th>
              <th>ราคา</th>
              <th>ต้นทุน</th>
              <th>สถานะ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                {editingId === item.id ? (
                  <>
                    <td>
                      <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} />
                    </td>
                    <td>
                      <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)}>
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {CATEGORY_LABELS[c]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        style={{ width: 70 }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={editCost}
                        onChange={(e) => setEditCost(e.target.value)}
                        style={{ width: 70 }}
                      />
                    </td>
                    <td>{item.isActive ? "แสดงอยู่" : "ซ่อนอยู่"}</td>
                    <td>
                      <button className="vote-btn" onClick={() => saveEdit(item.id)}>
                        บันทึก
                      </button>{" "}
                      <button className="vote-btn" onClick={() => setEditingId(null)}>
                        ยกเลิก
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{item.name}</td>
                    <td>{CATEGORY_LABELS[item.category]}</td>
                    <td>฿{item.price}</td>
                    <td>฿{item.cost}</td>
                    <td>{item.isActive ? "แสดงอยู่" : "ซ่อนอยู่"}</td>
                    <td>
                      <button className="vote-btn" onClick={() => startEdit(item)}>
                        แก้ไข
                      </button>{" "}
                      {item.isActive ? (
                        <button className="vote-btn" onClick={() => handleDelete(item.id)}>
                          ลบ
                        </button>
                      ) : (
                        <button className="vote-btn" onClick={() => handleRestore(item.id)}>
                          กู้คืน
                        </button>
                      )}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
