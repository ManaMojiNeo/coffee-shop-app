import Link from "next/link";

export default function NavBar() {
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
          <Link href="/menu-admin">จัดการเมนู</Link>
          <Link href="/login" className="btn btn-primary">
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    </div>
  );
}
