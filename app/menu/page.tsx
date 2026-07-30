"use client";

import { useEffect, useState } from "react";
import NavBar from "@/components/NavBar";
import { getMenu, MenuItem, CATEGORY_LABELS } from "@/lib/api";

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMenu()
      .then((data) => setItems(data.items))
      .finally(() => setLoading(false));
  }, []);

  const categories = ["COFFEE_HOT", "COFFEE_ICED", "NON_CAFFEINE", "BAKERY"];

  return (
    <main>
      <NavBar />
      <div className="wrap section">
        <div className="section-head">
          <h1>เมนูทั้งหมด</h1>
          <p>รายการเมนูปัจจุบันของร้าน คั่วบ้าน คั่วด้วยใจ</p>
        </div>

        {loading && <p>กำลังโหลดเมนู...</p>}

        {!loading &&
          categories.map((cat) => {
            const catItems = items.filter((i) => i.category === cat);
            if (catItems.length === 0) return null;
            return (
              <div key={cat}>
                <div className="category-label">{CATEGORY_LABELS[cat]}</div>
                <div className="menu-grid">
                  {catItems.map((item) => (
                    <div className="menu-card" key={item.id}>
                      {item.imageUrl && (
                        <div className="menu-card-img">
                          <img src={item.imageUrl} alt={item.name} />
                        </div>
                      )}
                      <div className="menu-card-body">
                        <p className="menu-card-name">{item.name}</p>
                        <span className="menu-card-price">฿{item.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
      </div>
    </main>
  );
}
