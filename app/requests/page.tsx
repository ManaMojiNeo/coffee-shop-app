"use client";

import { useEffect, useState } from "react";
import NavBar from "@/components/NavBar";
import { getMenuRequests, submitMenuRequest, voteMenuRequest, MenuRequest } from "@/lib/api";

export default function RequestsPage() {
  const [requests, setRequests] = useState<MenuRequest[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  function load() {
    getMenuRequests()
      .then((data) => setRequests(data.requests))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) return;
    try {
      await submitMenuRequest(name);
      setName("");
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleVote(id: string) {
    await voteMenuRequest(id);
    load();
  }

  return (
    <main>
      <NavBar />
      <div className="wrap section">
        <div className="section-head">
          <h1>เสนอเมนูใหม่</h1>
          <p>อยากให้ร้านมีเมนูอะไรเพิ่ม พิมพ์ชื่อเมนูด้านล่าง หรือกด "ฉันก็อยากได้" ให้เมนูที่มีคนเสนอไว้แล้ว</p>
        </div>

        <form onSubmit={handleSubmit} className="card" style={{ marginBottom: 32, display: "flex", gap: 12 }}>
          <input
            type="text"
            placeholder="ชื่อเมนูที่อยากได้ เช่น ชาไทยเย็น"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: 10,
              border: "1.5px solid var(--line)",
              fontSize: 14,
            }}
          />
          <button type="submit" className="btn btn-gold">
            เสนอเมนูนี้
          </button>
        </form>

        {error && <div className="error-box">{error}</div>}

        {loading && <p>กำลังโหลด...</p>}

        {!loading && (
          <table className="list-table">
            <thead>
              <tr>
                <th>ชื่อเมนู</th>
                <th>คะแนนโหวต</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.voteCount} คน</td>
                  <td>
                    <button className="vote-btn" onClick={() => handleVote(r.id)}>
                      ฉันก็อยากได้
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
