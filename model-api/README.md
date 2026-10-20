# model-api

บริการพยากรณ์ปริมาณน้ำฝนรายจังหวัด เรียกแบบจำลอง Random Forest จากไฟล์ `.pkl.gz` โดยตรง

## การติดตั้ง

1. วางไฟล์ `rf_rainfall_model.pkl` ที่ได้จากสมุดบันทึกไว้ในโฟลเดอร์นี้
2. ติดตั้งไลบรารี

```bash
pip install -r requirements.txt
```

3. รันเซิร์ฟเวอร์

```bash
python app.py
```

เปิด http://localhost:8000 เพื่อทดสอบผ่านหน้าเว็บ

## ปลายทางที่ให้บริการ

| วิธี | เส้นทาง | คำอธิบาย |
|---|---|---|
| GET | `/` | หน้าเว็บทดสอบ |
| GET | `/provinces` | รายชื่อจังหวัดทั้งหมดที่มีแบบจำลอง |
| POST | `/predict` | พยากรณ์ปริมาณน้ำฝน |

### ตัวอย่างการเรียก

ระบุเดือนเอง

```bash
curl -X POST http://localhost:8000/predict \
  -H 'Content-Type: application/json' \
  -d '{"province":"ขอนแก่น","months":[10,11,12]}'
```

ให้ระบบคำนวณเดือนถัดไปให้เอง จากเดือนล่าสุดที่มีข้อมูลจริง

```bash
curl -X POST http://localhost:8000/predict \
  -H 'Content-Type: application/json' \
  -d '{"province":"ขอนแก่น","last_actual_month":9}'
```

## สำคัญ

รุ่นของ scikit-learn ที่ใช้รันต้องตรงกับรุ่นที่ใช้ตอนบันทึกไฟล์ `.pkl.gz`
ซึ่งเก็บไว้ในคีย์ `sklearn_version` ภายในไฟล์

## การนำขึ้นโฮสต์แยก (Render)

ไฟล์ `render.yaml` เตรียมไว้แล้ว ใช้ `gunicorn` แทนเซิร์ฟเวอร์ทดสอบของ Flask

1. push โฟลเดอร์นี้ขึ้น GitHub
2. ที่ Render เลือก New > Web Service แล้วชี้มาที่ repo
3. อัปโหลดไฟล์ `rf_rainfall_model.pkl` ผ่าน Render Disk หรือ commit เข้า repo
   (ไฟล์ 26.3 MB ยังอยู่ในขีดจำกัดของ GitHub ที่ 100 MB ต่อไฟล์)

แผนฟรีของ Render จะพักเครื่องเมื่อไม่มีการเรียกใช้ คำขอแรกหลังพักจะใช้เวลา 30-60 วินาที

## การเรียกจาก Next.js

เรียกจากฝั่งเซิร์ฟเวอร์เท่านั้น จะได้ไม่ต้องตั้งค่า CORS

```js
const res = await fetch(process.env.MODEL_API_URL + '/predict', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ province: 'ขอนแก่น', last_actual_month: 9 }),
  next: { revalidate: 600 },
});
```

ถ้าจำเป็นต้องเรียกจากเบราว์เซอร์โดยตรง ให้เพิ่ม `flask-cors` แล้วใส่ `CORS(app)` ใน `app.py`
