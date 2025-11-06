# 🌐 i18n Documentation

เอกสารทั้งหมดเกี่ยวกับระบบ Internationalization สำหรับโปรเจค Muay Thai

---

## 📚 เอกสารทั้งหมด

### 🎯 เริ่มต้นที่นี่
**[I18N_INDEX.md](./I18N_INDEX.md)** - ศูนย์รวมเอกสารทั้งหมด

### 📖 เอกสารหลัก (5 ไฟล์)

| # | ไฟล์ | วัตถุประสงค์ | สำหรับใคร |
|---|------|-------------|----------|
| 1 | [I18N_README.md](./I18N_README.md) | เอกสารหลัก, ภาพรวมทั้งหมด | ทุกคน |
| 2 | [I18N_QUICK_REFERENCE.md](./I18N_QUICK_REFERENCE.md) | คู่มืออ้างอิงด่วน | นักพัฒนา |
| 3 | [I18N_STRUCTURE.md](./I18N_STRUCTURE.md) | โครงสร้างแบบละเอียด | นักพัฒนา/สถาปนิก |
| 4 | [I18N_TEMPLATE.md](./I18N_TEMPLATE.md) | Template สำหรับเพิ่มคำแปล | นักพัฒนา/แปล |
| 5 | [I18N_KEYS_OVERVIEW.md](./I18N_KEYS_OVERVIEW.md) | รายการคำแปลทั้งหมด | ทุกคน |

---

## 🚀 Quick Start

### ถ้าคุณเป็น...

#### 👨‍💻 นักพัฒนาใหม่
```
1. อ่าน I18N_README.md
2. ดู I18N_QUICK_REFERENCE.md
3. เริ่มใช้งาน!
```

#### 🎨 นักพัฒนาที่มีประสบการณ์
```
1. ดู I18N_QUICK_REFERENCE.md
2. ดู I18N_KEYS_OVERVIEW.md
3. ใช้ I18N_TEMPLATE.md ตามต้องการ
```

#### ✍️ ผู้แปล
```
1. อ่าน I18N_STRUCTURE.md
2. ใช้ I18N_TEMPLATE.md
3. รัน validation script
```

#### 🏗️ สถาปนิก
```
1. อ่าน I18N_README.md
2. ศึกษา I18N_STRUCTURE.md
3. ดู I18N_KEYS_OVERVIEW.md
```

---

## 📊 ข้อมูลโปรเจค

```
ภาษาที่รองรับ:       3 ภาษา (ไทย, อังกฤษ, ญี่ปุ่น)
จำนวน Keys:          83 keys ต่อภาษา
การแปลทั้งหมด:      249 translations
ไฟล์แปล:            messages/th.json, en.json, jp.json
Validation Script:   scripts/validate-i18n.js
สถานะ:              ✅ ผ่านการตรวจสอบทั้งหมด
```

---

## 🎯 Use Cases

### ต้องการเพิ่มคำแปลใหม่?
→ [I18N_TEMPLATE.md](./I18N_TEMPLATE.md)

### ต้องการใช้คำแปลในโค้ด?
→ [I18N_QUICK_REFERENCE.md](./I18N_QUICK_REFERENCE.md)

### ต้องการดูรายการคำแปล?
→ [I18N_KEYS_OVERVIEW.md](./I18N_KEYS_OVERVIEW.md)

### ต้องการเข้าใจระบบ?
→ [I18N_README.md](./I18N_README.md)

### ต้องการโครงสร้างละเอียด?
→ [I18N_STRUCTURE.md](./I18N_STRUCTURE.md)

---

## 🛠️ Validation Script

ตรวจสอบความถูกต้องของไฟล์แปล:

```bash
node scripts/validate-i18n.js
```

ผลลัพธ์:
```
============================================================
  🌐 I18n Validation Script
============================================================

📂 กำลังอ่านไฟล์แปล...
   ✓ อ่านไฟล์เสร็จสิ้น

🔍 กำลังตรวจสอบ keys...
   📝 TH keys: 83
   📝 EN keys: 83
   📝 JP keys: 83

🔎 ตรวจสอบความสอดคล้องของ keys...
   ✓ Keys ทั้งหมดตรงกัน

🔎 ตรวจสอบค่าว่าง...
   ✓ ไม่มีค่าว่าง

🔎 ตรวจสอบ JSON format...
   ✓ JSON format ถูกต้องทั้งหมด

============================================================
  ✅ ผ่านการตรวจสอบทั้งหมด!
============================================================
```

---

## 📝 ตัวอย่างการใช้งาน

### ใช้งานพื้นฐาน
```tsx
import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations();
  
  return (
    <div>
      <h1>{t('navigation.home')}</h1>
      <button>{t('common.buttons.save')}</button>
    </div>
  );
}
```

### ใช้กับ Namespace
```tsx
const t = useTranslations('auth.login');

return (
  <form>
    <h1>{t('title')}</h1>
    <input placeholder={t('email')} />
    <button>{t('button')}</button>
  </form>
);
```

### ใช้ Dynamic Values
```tsx
const t = useTranslations('validation');

<p>{t('required', { field: 'อีเมล' })}</p>
<p>{t('passwordTooShort', { min: 8 })}</p>
```

---

## 🗂️ โครงสร้างไฟล์

```
muaythai-next-postgres/
├── messages/
│   ├── th.json         # ภาษาไทย (83 keys)
│   ├── en.json         # ภาษาอังกฤษ (83 keys)
│   └── jp.json         # ภาษาญี่ปุ่น (83 keys)
│
├── src/
│   ├── i18n.ts         # คอนฟิก
│   ├── middleware.ts   # Middleware
│   └── navigation.ts   # Navigation helpers
│
├── scripts/
│   └── validate-i18n.js  # Validation script
│
└── docs/
    ├── README_I18N.md              # ไฟล์นี้
    ├── I18N_INDEX.md               # ศูนย์รวมเอกสาร
    ├── I18N_README.md              # เอกสารหลัก
    ├── I18N_QUICK_REFERENCE.md     # อ้างอิงด่วน
    ├── I18N_STRUCTURE.md           # โครงสร้างละเอียด
    ├── I18N_TEMPLATE.md            # Template คำแปล
    └── I18N_KEYS_OVERVIEW.md       # รายการคำแปล
```

---

## 🌐 ภาษาที่รองรับ

| ภาษา | Locale | Flag | URL Pattern | สถานะ |
|------|--------|------|-------------|-------|
| ไทย (เริ่มต้น) | `th` | 🇹🇭 | `/th/...` | ✅ |
| อังกฤษ | `en` | 🇬🇧 | `/en/...` | ✅ |
| ญี่ปุ่น | `jp` | 🇯🇵 | `/jp/...` | ✅ |

---

## 📋 Namespaces

1. **common** (41 keys)
   - buttons (18)
   - labels (10)
   - status (7)
   - messages (6)

2. **navigation** (13 keys)

3. **auth** (18 keys)
   - login (7)
   - signup (8)
   - forgotPassword (3)

4. **dashboard** (4 keys)

5. **validation** (5 keys)

**รวม: 83 keys**

---

## ✅ Checklist

### ก่อนเริ่มพัฒนา
- [ ] อ่าน I18N_README.md
- [ ] ดู I18N_QUICK_REFERENCE.md
- [ ] ทดลองใช้ในโค้ด

### เมื่อเพิ่มคำแปล
- [ ] เลือก namespace ที่เหมาะสม
- [ ] เพิ่มใน 3 ไฟล์พร้อมกัน
- [ ] รัน `node scripts/validate-i18n.js`
- [ ] ทดสอบในแอป
- [ ] Commit

### ก่อน Commit
- [ ] รัน validation script
- [ ] ตรวจสอบ JSON syntax
- [ ] ทดสอบทั้ง 3 ภาษา

---

## 🔗 Links

### เอกสาร
- [I18N Index](./I18N_INDEX.md)
- [I18N README](./I18N_README.md)
- [I18N Quick Reference](./I18N_QUICK_REFERENCE.md)
- [I18N Structure](./I18N_STRUCTURE.md)
- [I18N Template](./I18N_TEMPLATE.md)
- [I18N Keys Overview](./I18N_KEYS_OVERVIEW.md)

### ไฟล์แปล
- [messages/th.json](../messages/th.json)
- [messages/en.json](../messages/en.json)
- [messages/jp.json](../messages/jp.json)

### โค้ด
- [src/i18n.ts](../src/i18n.ts)
- [scripts/validate-i18n.js](../scripts/validate-i18n.js)

### ภายนอก
- [next-intl Documentation](https://next-intl-docs.vercel.app/)

---

## 💡 Tips

1. **อ้างอิงบ่อย?** → Bookmark [I18N_QUICK_REFERENCE.md](./I18N_QUICK_REFERENCE.md)
2. **เพิ่มคำแปล?** → ใช้ [I18N_TEMPLATE.md](./I18N_TEMPLATE.md)
3. **หาคำแปล?** → ดู [I18N_KEYS_OVERVIEW.md](./I18N_KEYS_OVERVIEW.md)
4. **Debug?** → รัน `node scripts/validate-i18n.js`

---

## 🎯 แนะนำ

**เริ่มต้นเลย** → [I18N_INDEX.md](./I18N_INDEX.md)

หรือ

**เริ่มใช้งาน** → [I18N_QUICK_REFERENCE.md](./I18N_QUICK_REFERENCE.md)

---

**อัปเดตล่าสุด:** 2025-11-06  
**เวอร์ชัน:** 1.0.0  
**ผู้ดูแล:** Development Team
