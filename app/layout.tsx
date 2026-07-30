import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "คั่วบ้าน คั่วด้วยใจ",
  description: "ระบบจัดการรายรับ-รายจ่ายร้านกาแฟ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
