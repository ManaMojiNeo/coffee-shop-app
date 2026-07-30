import NavBar from "@/components/NavBar";
import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <NavBar />
      <div className="hero">
        <div className="hero-inner">
          <h1>คั่วบ้าน คั่วด้วยใจ</h1>
          <p>
            ร้านกาแฟเล็กๆ ที่คั่วเมล็ดเองทุกสัปดาห์ ดูเมนูทั้งหมดของเรา
            หรือเสนอเมนูที่อยากให้มีได้เลย
          </p>
          <div className="hero-actions">
            <Link href="/menu" className="btn btn-gold">
              ดูเมนู
            </Link>
            <Link href="/requests" className="btn btn-outline" style={{ color: "#fff", borderColor: "rgba(255,255,255,0.55)" }}>
              เสนอเมนูใหม่
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
