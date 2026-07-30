"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";
import {
  getMe,
  getMenu,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  logout,
  MenuItem,
  CATEGORY_LABELS,
} from "@/lib/api";

const CATEGORIES = ["COFFEE_HOT", "COFFEE_ICED", "NON_CAFFEINE", "BAKERY"];

const emptyForm = {
  name: "",
  category: "COFFEE_HOT",
  price: "",
  cost: "",
  story: "",
  imageUrl: "",
};

export default function MenuAdminPage() {
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  async function load() {
    try {
      await getMe();
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

  function updateField(field: keyof typeof emptyForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function startEdit(item: MenuItem) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      category: item.category,
      price: item.price,
      cost: item.cost,
      story: item.story || "",
      imageUrl: item.imageUrl || "",
    });
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name || !form.price) return;
    try {
      if (editingId) {
        await updateMenuItem(editingId, {
          name: form.name,
          category: form.category,
          price: Number(form.price),
          cost: Number(form.cost || 0),
          story: form.story,
          imageUrl: form.imageUrl,
        });
        setEditingId(null);
      } else {
        await createMenuItem({
          name: form.name,
          category: form.category,
          price: Number(form.price),
          cost: Number(form.cost || 0),
          story: form.story,
          imageUrl: form.imageUrl,
        });
      }
      setForm(emptyForm);
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("ซ่อนเมนูนี้จากลูกค้าใช่ไหม? (กู้คืนได้ภายหลัง)")) return;
    try {
      await deleteMenuItem(id);
      if (editingId === id) cancelEdit();
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

        <div className="card" style={{ marginBottom: 32 }} ref={formRef}>
          <h3 style={{ marginTop: 0 }}>
            {editingId ? `แก้ไขเมนู: ${form.name}` : "เพิ่มเมนูใหม่"}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>ชื่อเมนู</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
              />
            </div>
            <div className="field">
              <label>หมวดหมู่</label>
              <select
                value={form.category}
                onChange={(e) => updateField("category", e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>ราคาขาย</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => updateField("price", e.target.value)}
              />
            </div>
            <div className="field">
              <label>ต้นทุน</label>
              <input
                type="number"
                value={form.cost}
                onChange={(e) => updateField("cost", e.target.value)}
              />
            </div>
            <div className="field">
              <label>ลิงก์รูปภาพ (ไม่บังคับ)</label>
              <input
                type="text"
                placeholder="https://..."
                value={form.imageUrl}
                onChange={(e) => updateField("imageUrl", e.target.value)}
              />
              {form.imageUrl && (
                <div style={{ marginTop: 8 }}>
                  <img
                    src={form.imageUrl}
                    alt="ตัวอย่างรูป"
                    style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 8 }}
                    onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                  />
                </div>
              )}
            </div>
            <div className="field">
              <label>เรื่องราวของเมนู (ไม่บังคับ)</label>
              <input
                type="text"
                value={form.story}
                onChange={(e) => updateField("story", e.target.value)}
              />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" className="btn btn-gold" style={{ flex: 1 }}>
                {editingId ? "บันทึกการแก้ไข" : "เพิ่มเมนู"}
              </button>
              {editingId && (
                <button type="button" className="btn btn-outline" onClick={cancelEdit}>
                  ยกเลิก
                </button>
              )}
            </div>
          </form>
        </div>

        <table className="list-table">
          <thead>
            <tr>
              <th>รูป</th>
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
              <tr key={item.id} style={editingId === item.id ? { background: "#fff7e6" } : undefined}>
                <td>
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6 }}
                    />
                  ) : (
                    "-"
                  )}
                </td>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
