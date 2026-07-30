"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMe } from "@/lib/api";

export default function NavBar() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    getMe()
      .then(() => setLoggedIn(true))
      .catch(() => setLoggedIn(false));
  }, []);

  return (
    <div className="navbar">
      <div className="nav-inner">
        <Link href="/">
          <div>
            <span className="logo-text">คั่วบ้าน</span>
            <span className="logo-sub">คั่วด้วยใจ</span>
          </div>
        </Link>
        <div className="nav-links">
          <Link href="/menu">เมนู</Link>
          <Link href="/requests">เสนอเมนู</Link>
          {loggedIn && <Link href="/menu-admin">จัดการเมนู</Link>}
          <Link href="/login" className="btn btn-primary">
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    </div>
  );
}
