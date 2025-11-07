# i18n Quick Reference - อ้างอิงด่วน

คู่มืออ้างอิงแบบย่อสำหรับการใช้งาน i18n ในโปรเจค (ไทย, อังกฤษ, ญี่ปุ่น)

---

## 🚀 เริ่มต้นใช้งานเร็ว

### Import และใช้งานใน Component

```tsx
import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations();
  return <h1>{t('navigation.home')}</h1>;
}
```

### ใช้งานแบบระบุ Namespace

```tsx
const t = useTranslations('auth.login');
return <h1>{t('title')}</h1>;  // แทนที่จะเขียน t('auth.login.title')
```

### ใช้ Dynamic Values

```tsx
const t = useTranslations('validation');
return <p>{t('required', { field: 'อีเมล' })}</p>;
```

---

## 📁 โครงสร้างไฟล์

```
messages/
├── th.json    # ภาษาไทย (ภาษาเริ่มต้น)
├── en.json    # ภาษาอังกฤษ
└── jp.json    # ภาษาญี่ปุ่น
```

---

## 🗂️ หมวดหมู่หลัก (Namespaces)

| Namespace | รายละเอียด | จำนวน Keys |
|-----------|-----------|------------|
| `common.buttons` | ปุ่มต่างๆ | 18 |
| `common.labels` | ป้ายข้อมูล | 10 |
| `common.status` | สถานะ | 7 |
| `common.messages` | ข้อความแจ้งเตือน | 6 |
| `navigation` | เมนูนำทาง | 13 |
| `auth.login` | หน้าเข้าสู่ระบบ | 7 |
| `auth.signup` | หน้าสมัครสมาชิก | 8 |
| `auth.forgotPassword` | ลืมรหัสผ่าน | 3 |
| `dashboard` | แดชบอร์ด | 4 |
| `validation` | การตรวจสอบข้อมูล | 5 |

**รวมทั้งหมด: 66 translation keys**

---

## 🎯 Keys ที่ใช้บ่อย

### Buttons (ปุ่ม)
```tsx
t('common.buttons.save')      // บันทึก / Save / 保存
t('common.buttons.cancel')    // ยกเลิก / Cancel / キャンセル
t('common.buttons.delete')    // ลบ / Delete / 削除
t('common.buttons.edit')      // แก้ไข / Edit / 編集
t('common.buttons.confirm')   // ยืนยัน / Confirm / 確認
t('common.buttons.submit')    // ส่ง / Submit / 送信
```

### Messages (ข้อความ)
```tsx
t('common.messages.loading')       // กำลังโหลด...
t('common.messages.saving')        // กำลังบันทึก...
t('common.messages.success')       // สำเร็จ
t('common.messages.error')         // เกิดข้อผิดพลาด
t('common.messages.noData')        // ไม่มีข้อมูล
t('common.messages.confirmDelete') // คุณแน่ใจหรือไม่ที่จะลบ?
```

### Navigation (เมนู)
```tsx
t('navigation.home')       // หน้าแรก / Home / ホーム
t('navigation.gyms')       // ค่ายมวย / Gyms / ジム
t('navigation.events')     // อีเวนต์ / Events / イベント
t('navigation.dashboard')  // แดชบอร์ด / Dashboard / ダッシュボード
t('navigation.profile')    // โปรไฟล์ / Profile / プロフィール
t('navigation.logout')     // ออกจากระบบ / Logout / ログアウト
```

### Status (สถานะ)
```tsx
t('common.status.active')     // ใช้งาน / Active / アクティブ
t('common.status.inactive')   // ไม่ใช้งาน / Inactive / 非アクティブ
t('common.status.pending')    // รอดำเนินการ / Pending / 保留中
t('common.status.completed')  // เสร็จสิ้น / Completed / 完了
t('common.status.cancelled')  // ยกเลิก / Cancelled / キャンセル
```

---

## 🌐 การเปลี่ยนภาษา

### ดึงภาษาปัจจุบัน
```tsx
import { useLocale } from 'next-intl';

const locale = useLocale(); // 'th', 'en', หรือ 'jp'
```

### เปลี่ยนภาษา
```tsx
import { useLocale, usePathname } from 'next-intl';

const locale = useLocale();
const pathname = usePathname();

const switchLanguage = (newLocale: string) => {
  const pathWithoutLocale = pathname.replace(`/${locale}`, '');
  window.location.href = `/${newLocale}${pathWithoutLocale}`;
};

// ใช้งาน
switchLanguage('en'); // เปลี่ยนเป็นภาษาอังกฤษ
```

### Language Switcher Component
```tsx
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';

// ใช้งานใน Layout หรือ Navbar
<LanguageSwitcher />
```

---

## 🔧 Server Components

```tsx
import { getTranslations } from 'next-intl/server';

export default async function ServerComponent() {
  const t = await getTranslations();
  return <h1>{t('navigation.home')}</h1>;
}
```

---

## ✅ ตรวจสอบความถูกต้อง

### รันสคริปต์ Validation
```bash
node scripts/validate-i18n.js
```

หรือ

```bash
npm run validate:i18n   # (ถ้ามี script ใน package.json)
```

### ผลลัพธ์ที่คาดหวัง
```
============================================================
  🌐 I18n Validation Script
============================================================

📂 กำลังอ่านไฟล์แปล...
   ✓ อ่านไฟล์เสร็จสิ้น

🔍 กำลังตรวจสอบ keys...
   📝 TH keys: 66
   📝 EN keys: 66
   📝 JP keys: 66

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

## 📝 เพิ่มคำแปลใหม่ (Step by Step)

### 1. เลือกหมวดหมู่ที่เหมาะสม
- `common` - คำทั่วไป
- `navigation` - เมนู
- `auth` - ระบบล็อกอิน
- หรือสร้างใหม่ เช่น `booking`, `payment`

### 2. เพิ่มใน 3 ไฟล์พร้อมกัน

**messages/th.json**
```json
{
  "booking": {
    "title": "จองคอร์ส"
  }
}
```

**messages/en.json**
```json
{
  "booking": {
    "title": "Book a Course"
  }
}
```

**messages/jp.json**
```json
{
  "booking": {
    "title": "コースを予約"
  }
}
```

### 3. ตรวจสอบ
```bash
node scripts/validate-i18n.js
```

### 4. ทดสอบ
```tsx
const t = useTranslations('booking');
console.log(t('title')); // จองคอร์ส (ถ้าเป็น th)
```

---

## 🎨 Pattern ที่ใช้บ่อย

### Loading State
```tsx
const t = useTranslations('common.messages');
const [isLoading, setIsLoading] = useState(true);

if (isLoading) {
  return <div>{t('loading')}</div>;
}
```

### Form Validation
```tsx
const t = useTranslations('validation');

if (!email) {
  return t('required', { field: 'อีเมล' });
}
if (!isValidEmail(email)) {
  return t('invalidEmail');
}
```

### Confirm Dialog
```tsx
const t = useTranslations('common.messages');

const handleDelete = () => {
  if (confirm(t('confirmDelete'))) {
    // ลบข้อมูล
  }
};
```

### Button with Loading
```tsx
const t = useTranslations('common.buttons');
const [isSaving, setIsSaving] = useState(false);

<button disabled={isSaving}>
  {isSaving ? t('saving') : t('save')}
</button>
```

---

## 🎯 Best Practices

### ✅ ทำ (DO)
- ใช้ namespace ให้ชัดเจน
- ใช้ dynamic values สำหรับข้อความที่มีตัวแปร
- ตรวจสอบด้วย validation script ก่อน commit
- เพิ่มคำแปลทั้ง 3 ภาษาพร้อมกัน

### ❌ ไม่ทำ (DON'T)
- ไม่ hardcode ข้อความในภาษาใดๆ
- ไม่เพิ่มเฉพาะบางภาษา (ต้องครบทั้ง 3)
- ไม่ใช้ key ที่ยาวเกินไป
- ไม่ซ้ำ key ที่มีอยู่แล้ว

---

## 🔍 Troubleshooting

### ปัญหา: แสดง key แทนข้อความแปล
```tsx
// ผลลัพธ์: "navigation.home" แทนที่จะเป็น "หน้าแรก"
```
**วิธีแก้:**
- ตรวจสอบว่า key มีอยู่ในไฟล์แปล
- ตรวจสอบ spelling ของ key
- ตรวจสอบว่าไฟล์ JSON format ถูกต้อง

### ปัญหา: เปลี่ยนภาษาแล้วข้อความไม่เปลี่ยน
**วิธีแก้:**
- ใช้ `window.location.href` แทน router.push
- Clear browser cache
- ตรวจสอบว่า locale ใน URL ถูกต้อง

### ปัญหา: JSON syntax error
```bash
# ตรวจสอบ syntax
cat messages/th.json | jq .
```
**วิธีแก้:**
- ตรวจสอบ comma, brackets, quotes
- ใช้ editor ที่มี JSON linting
- รัน validation script

---

## 📚 เอกสารเพิ่มเติม

| เอกสาร | รายละเอียด |
|--------|-----------|
| [I18N_STRUCTURE.md](./I18N_STRUCTURE.md) | โครงสร้างและคู่มือฉบับเต็ม |
| [I18N_TEMPLATE.md](./I18N_TEMPLATE.md) | Template สำหรับเพิ่มคำแปล |
| [messages/th.json](../messages/th.json) | ไฟล์แปลภาษาไทย |
| [messages/en.json](../messages/en.json) | ไฟล์แปลภาษาอังกฤษ |
| [messages/jp.json](../messages/jp.json) | ไฟล์แปลภาษาญี่ปุ่น |
| [src/i18n.ts](../src/i18n.ts) | ไฟล์คอนฟิก |

---

## 🛠️ npm Scripts (แนะนำ)

เพิ่มใน `package.json`:
```json
{
  "scripts": {
    "validate:i18n": "node scripts/validate-i18n.js",
    "i18n:check": "node scripts/validate-i18n.js"
  }
}
```

ใช้งาน:
```bash
npm run validate:i18n
npm run i18n:check
```

---

## 🌐 URL Structure

| ภาษา | Locale Code | URL Pattern | Example |
|------|-------------|-------------|---------|
| ไทย | `th` | `/th/...` | `/th/dashboard` |
| อังกฤษ | `en` | `/en/...` | `/en/dashboard` |
| ญี่ปุ่น | `jp` | `/jp/...` | `/jp/dashboard` |

**หมายเหตุ:** ภาษาเริ่มต้นคือไทย (th)

---

## 💡 เคล็ดลับ

### 1. Type Safety (Optional)
```typescript
// types/i18n.ts
import th from '@/messages/th.json';

type Messages = typeof th;

declare global {
  interface IntlMessages extends Messages {}
}
```

### 2. Console Debug
```tsx
const locale = useLocale();
console.log('Current locale:', locale);

const t = useTranslations();
console.log('Translation:', t('navigation.home'));
```

### 3. Fallback
```tsx
// ถ้า key ไม่มี จะแสดง key ออกมา
t('nonexistent.key') // 'nonexistent.key'
```

---

## 📞 ติดต่อ/ขอความช่วยเหลือ

- อ่าน [I18N_STRUCTURE.md](./I18N_STRUCTURE.md) สำหรับรายละเอียดเพิ่มเติม
- ดู [I18N_TEMPLATE.md](./I18N_TEMPLATE.md) สำหรับ template
- ตรวจสอบ [next-intl docs](https://next-intl-docs.vercel.app/)

---

**อัปเดตล่าสุด:** 2025-11-06
**เวอร์ชัน:** 1.0.0
**จำนวนคำแปล:** 66 keys ต่อภาษา
