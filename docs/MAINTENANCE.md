# คู่มือดูแลระบบ - คั่วบ้าน คั่วด้วยใจ

เอกสารนี้สำหรับทีมพัฒนาที่ต้องดูแลระบบต่อในอนาคต อ้างอิงจากโครงสร้างจริงของโปรเจกต์ ณ วันที่ 30 กรกฎาคม 2569

## Endpoint ทั้งหมด

| Endpoint | Method | ต้อง Login | คำอธิบาย |
|---|---|---|---|
| /api/auth/login | POST | ไม่ต้อง | ล็อกอิน คืน JWT ผ่าน httpOnly cookie ชื่อ token (อายุ 7 วัน) |
| /api/auth/logout | POST | ต้อง | ล้าง cookie token |
| /api/menu | GET | ไม่ต้อง | รายการเมนูทั้งหมดของร้าน |
| /api/menu-requests | GET | ไม่ต้อง | รายการคำขอเมนูใหม่ เรียงตามยอดโหวต |
| /api/menu-requests | POST | ไม่ต้อง | ลูกค้าเสนอเมนูใหม่ ต้องส่ง { shopId, name } |
| /api/menu-requests/[id]/vote | POST | ไม่ต้อง | โหวตเพิ่มให้คำขอเมนู |
| /api/sales | GET | ต้อง | รายการยอดขาย |
| /api/sales | POST | ต้อง | บันทึกยอดขายใหม่ คำนวณ total จาก quantity คูณ unitPrice ฝั่ง server |
| /api/expenses | GET | ต้อง | รายการรายจ่าย |
| /api/expenses | POST | ต้อง | บันทึกรายจ่ายใหม่ |

## วิธีรัน Migration ใหม่

โปรเจกต์นี้ไม่ได้ใช้ prisma migrate deploy อัตโนมัติบน Vercel เพราะไม่มีตัวแปร DIRECT_URL ตั้งไว้ ทุกครั้งที่แก้ schema.prisma ต้องรัน SQL ที่สอดคล้องกันเองผ่าน Neon SQL Editor (console.neon.tech) โดยตรง แล้วค่อย push โค้ดที่แก้ Prisma Client ตาม

## วิธีเพิ่มตัวแปรสภาพแวดล้อม

Vercel Dashboard > coffee-shop-app > Settings > Environment Variables ปัจจุบันมี 2 ตัวคือ DATABASE_URL และ JWT_SECRET ทั้งคู่ตั้งเป็น Sensitive และ scope Production and Preview เพิ่มตัวแปรใหม่แล้วต้อง Redeploy จึงจะมีผลกับ deployment ที่รันอยู่

## วิธีตรวจสอบ Logs เมื่อเกิดปัญหา

ไปที่ Vercel Dashboard > Logs ดู request แบบ real-time ได้ทันที หรือเปิด Deployments คลิกที่ deployment ที่ต้องการ แล้วดู Build Logs (ตอน build) หรือ Runtime Logs (ตอนรันจริง) แต่ละ deployment เก็บ log แยกกัน

## Function Region

โปรเจกต์นี้ต้องตั้งเป็น Singapore (sin1) เท่านั้น ตามมาตรฐานของทุกโปรเจกต์ในหนังสือเล่มนี้ เคยพบว่าตั้งผิดเป็น iad1 มาตั้งแต่สร้างโปรเจกต์ (ดูบทที่ 18) ควรตรวจสอบ Settings > Functions > Function Region เป็นระยะ และยืนยันด้วย header x-vercel-id ทุกครั้งหลัง redeploy

## Deployment ที่เคยล้มเหลวจริง

commit eb9b838 (Add expense API with authentication) และ 5c18a8d (Implement sales API with GET and POST methods) เคย Build Failed ด้วย npm run build exited with 1 เพราะโค้ดใน app/api/sales/route.ts ซ้ำกันเอง แก้สำเร็จในอีก commit ถัดมา (94a63c1 Fix duplicate content in sales route.ts) ควรตรวจสอบว่าไฟล์ route.ts ไม่มีการประกาศ export ซ้ำก่อน push ทุกครั้ง
