export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        fontFamily: "sans-serif",
        background: "#FBF4E9",
        color: "#2A1B12",
        padding: "2rem",
      }}
    >
      <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>คั่วบ้าน</h1>
      <p style={{ fontSize: "1.1rem", color: "#6B5A4B" }}>
        ระบบจัดการรายรับ-รายจ่ายร้านกาแฟ — กำลังพัฒนา
      </p>
    </main>
  );
}
