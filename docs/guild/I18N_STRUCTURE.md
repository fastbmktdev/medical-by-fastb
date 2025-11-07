# โครงสร้างระบบ Internationalization (i18n)

## ภาพรวม

โปรเจคนี้รองรับ 3 ภาษา:
- **ภาษาไทย (th)** - ภาษาเริ่มต้น 🇹🇭
- **ภาษาอังกฤษ (en)** 🇬🇧
- **ภาษาญี่ปุ่น (jp)** 🇯🇵

ใช้ไลบรารี **next-intl** สำหรับจัดการ internationalization

---

## โครงสร้างไฟล์

### 1. ไฟล์คอนฟิก

```
src/
├── i18n.ts                 # คอนฟิกหลัก i18n
├── middleware.ts           # Middleware สำหรับ routing ตามภาษา
└── navigation.ts           # Navigation helpers แบบ locale-aware

messages/
├── th.json                 # การแปลภาษาไทย
├── en.json                 # การแปลภาษาอังกฤษ
└── jp.json                 # การแปลภาษาญี่ปุ่น
```

### 2. โครงสร้าง URL

ทุก URL จะมี prefix ของภาษาเสมอ:
- ภาษาไทย: `https://example.com/th/...`
- ภาษาอังกฤษ: `https://example.com/en/...`
- ภาษาญี่ปุ่น: `https://example.com/jp/...`

---

## โครงสร้างไฟล์แปลภาษา

ไฟล์แปลภาษาทั้ง 3 ภาษามีโครงสร้างเหมือนกัน แบ่งเป็น 6 หมวดหมู่:

### 1. `common` - คำทั่วไป

#### `common.buttons` - ปุ่มต่างๆ
```json
{
  "save": "บันทึก / Save / 保存",
  "cancel": "ยกเลิก / Cancel / キャンセル",
  "delete": "ลบ / Delete / 削除",
  "edit": "แก้ไข / Edit / 編集",
  "confirm": "ยืนยัน / Confirm / 確認",
  "submit": "ส่ง / Submit / 送信",
  "close": "ปิด / Close / 閉じる",
  "back": "ย้อนกลับ / Back / 戻る",
  "next": "ถัดไป / Next / 次へ",
  "previous": "ก่อนหน้า / Previous / 前へ",
  "search": "ค้นหา / Search / 検索",
  "filter": "กรอง / Filter / フィルター",
  "export": "ส่งออก / Export / エクスポート",
  "import": "นำเข้า / Import / インポート",
  "upload": "อัปโหลด / Upload / アップロード",
  "download": "ดาวน์โหลด / Download / ダウンロード",
  "view": "ดู / View / 表示",
  "details": "รายละเอียด / Details / 詳細"
}
```

#### `common.labels` - ป้ายข้อมูล
```json
{
  "email": "อีเมล / Email / メール",
  "password": "รหัสผ่าน / Password / パスワード",
  "name": "ชื่อ / Name / 名前",
  "phone": "เบอร์โทรศัพท์ / Phone / 電話番号",
  "address": "ที่อยู่ / Address / 住所",
  "status": "สถานะ / Status / ステータス",
  "actions": "การกระทำ / Actions / アクション",
  "date": "วันที่ / Date / 日付",
  "time": "เวลา / Time / 時間",
  "description": "คำอธิบาย / Description / 説明"
}
```

#### `common.status` - สถานะต่างๆ
```json
{
  "active": "ใช้งาน / Active / アクティブ",
  "inactive": "ไม่ใช้งาน / Inactive / 非アクティブ",
  "pending": "รอดำเนินการ / Pending / 保留中",
  "approved": "อนุมัติแล้ว / Approved / 承認済み",
  "rejected": "ปฏิเสธ / Rejected / 却下",
  "completed": "เสร็จสิ้น / Completed / 完了",
  "cancelled": "ยกเลิก / Cancelled / キャンセル"
}
```

#### `common.messages` - ข้อความแจ้งเตือน
```json
{
  "loading": "กำลังโหลด... / Loading... / 読み込み中...",
  "saving": "กำลังบันทึก... / Saving... / 保存中...",
  "success": "สำเร็จ / Success / 成功",
  "error": "เกิดข้อผิดพลาด / Error occurred / エラーが発生しました",
  "noData": "ไม่มีข้อมูล / No data / データなし",
  "confirmDelete": "คุณแน่ใจหรือไม่ที่จะลบรายการนี้? / Are you sure you want to delete this item? / このアイテムを削除してもよろしいですか？"
}
```

### 2. `navigation` - เมนูนำทาง
```json
{
  "home": "หน้าแรก / Home / ホーム",
  "gyms": "ค่ายมวย / Gyms / ジム",
  "events": "อีเวนต์ / Events / イベント",
  "programs": "โปรแกรม / Programs / プログラム",
  "shop": "ร้านค้า / Shop / ショップ",
  "articles": "บทความ / Articles / 記事",
  "about": "เกี่ยวกับเรา / About Us / について",
  "faq": "คำถามที่พบบ่อย / FAQ / よくある質問",
  "contact": "ติดต่อเรา / Contact / お問い合わせ",
  "dashboard": "แดชบอร์ด / Dashboard / ダッシュボード",
  "profile": "โปรไฟล์ / Profile / プロフィール",
  "settings": "ตั้งค่า / Settings / 設定",
  "logout": "ออกจากระบบ / Logout / ログアウト"
}
```

### 3. `auth` - ระบบยืนยันตัวตน

#### `auth.login` - เข้าสู่ระบบ
```json
{
  "title": "เข้าสู่ระบบ / Sign In / ログイン",
  "subtitle": "ยินดีต้อนรับกลับมา / Welcome back / お帰りなさい",
  "email": "อีเมล / Email / メール",
  "password": "รหัสผ่าน / Password / パスワード",
  "button": "เข้าสู่ระบบ / Sign In / ログイン",
  "forgotPassword": "ลืมรหัสผ่าน? / Forgot password? / パスワードを忘れた？",
  "noAccount": "ยังไม่มีบัญชี? / Don't have an account? / アカウントをお持ちでないですか？",
  "signupLink": "สมัครสมาชิก / Sign up / 新規登録"
}
```

#### `auth.signup` - สมัครสมาชิก
```json
{
  "title": "สมัครสมาชิก / Sign Up / 新規登録",
  "subtitle": "สร้างบัญชีของคุณ / Create your account / アカウントを作成",
  "fullName": "ชื่อ-นามสกุล / Full Name / 氏名",
  "email": "อีเมล / Email / メール",
  "password": "รหัสผ่าน / Password / パスワード",
  "confirmPassword": "ยืนยันรหัสผ่าน / Confirm Password / パスワード確認",
  "button": "สมัครสมาชิก / Sign Up / 新規登録",
  "hasAccount": "มีบัญชีอยู่แล้ว? / Already have an account? / すでにアカウントをお持ちですか？",
  "loginLink": "เข้าสู่ระบบ / Sign in / ログイン"
}
```

#### `auth.forgotPassword` - ลืมรหัสผ่าน
```json
{
  "title": "ลืมรหัสผ่าน / Forgot Password / パスワードを忘れた",
  "subtitle": "กรอกอีเมลเพื่อรีเซ็ตรหัสผ่าน / Enter your email to reset password / メールアドレスを入力してパスワードをリセット",
  "button": "ส่งลิงก์รีเซ็ต / Send Reset Link / リセットリンクを送信"
}
```

### 4. `dashboard` - แดชบอร์ด
```json
{
  "welcome": "ยินดีต้อนรับ / Welcome / ようこそ",
  "overview": "ภาพรวม / Overview / 概要",
  "recentActivity": "กิจกรรมล่าสุด / Recent Activity / 最近のアクティビティ",
  "quickActions": "การกระทำด่วน / Quick Actions / クイックアクション"
}
```

### 5. `validation` - การตรวจสอบข้อมูล
```json
{
  "required": "กรุณากรอก{field} / Please enter {field} / {field}を入力してください",
  "invalidEmail": "รูปแบบอีเมลไม่ถูกต้อง / Invalid email format / 無効なメール形式",
  "passwordTooShort": "รหัสผ่านต้องมีอย่างน้อย {min} ตัวอักษร / Password must be at least {min} characters / パスワードは{min}文字以上である必要があります",
  "passwordMismatch": "รหัสผ่านไม่ตรงกัน / Passwords do not match / パスワードが一致しません",
  "invalidPhone": "เบอร์โทรศัพท์ไม่ถูกต้อง / Invalid phone number / 無効な電話番号"
}
```

---

## การใช้งาน

### 1. ใช้งานในคอมโพเนนต์

```tsx
import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations();

  return (
    <div>
      <h1>{t('navigation.home')}</h1>
      <button>{t('common.buttons.save')}</button>
      <p>{t('common.messages.loading')}</p>
    </div>
  );
}
```

### 2. ใช้งานกับ Namespace

```tsx
import { useTranslations } from 'next-intl';

export default function LoginForm() {
  const t = useTranslations('auth.login');

  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('subtitle')}</p>
      <button>{t('button')}</button>
    </div>
  );
}
```

### 3. ใช้งานกับ Dynamic Values

```tsx
import { useTranslations } from 'next-intl';

export default function ValidationMessage() {
  const t = useTranslations('validation');

  return (
    <div>
      {/* จะแสดง: กรุณากรอกอีเมล */}
      <p>{t('required', { field: 'อีเมล' })}</p>

      {/* จะแสดง: รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร */}
      <p>{t('passwordTooShort', { min: 8 })}</p>
    </div>
  );
}
```

### 4. เปลี่ยนภาษา

```tsx
'use client';

import { useLocale, usePathname, useRouter } from 'next-intl';
import { locales } from '@/i18n';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();

  const switchLanguage = (newLocale: string) => {
    // ลบ locale prefix ออกจาก path
    const pathWithoutLocale = pathname.replace(`/${locale}`, '');
    // สร้าง path ใหม่
    const newPath = `/${newLocale}${pathWithoutLocale}`;
    // Navigate
    window.location.href = newPath;
  };

  return (
    <select
      value={locale}
      onChange={(e) => switchLanguage(e.target.value)}
    >
      <option value="th">ไทย 🇹🇭</option>
      <option value="en">English 🇬🇧</option>
      <option value="jp">日本語 🇯🇵</option>
    </select>
  );
}
```

### 5. ใช้งานใน Server Components

```tsx
import { getTranslations } from 'next-intl/server';

export default async function ServerComponent() {
  const t = await getTranslations();

  return (
    <div>
      <h1>{t('navigation.home')}</h1>
    </div>
  );
}
```

---

## คำแนะนำในการเพิ่มคำแปลใหม่

### 1. เลือกหมวดหมู่ที่เหมาะสม

- **common** - คำที่ใช้ทั่วไปในทุกที่
- **navigation** - เมนูและลิงก์นำทาง
- **auth** - ระบบล็อกอิน/สมัครสมาชิก
- **dashboard** - หน้าแดชบอร์ด
- **validation** - ข้อความตรวจสอบข้อมูล
- สร้างหมวดหมู่ใหม่ถ้าจำเป็น (เช่น `booking`, `payment`, `profile`)

### 2. เพิ่มคำแปลใน 3 ไฟล์พร้อมกัน

ต้องเพิ่มในทั้ง 3 ไฟล์:
- `messages/th.json`
- `messages/en.json`
- `messages/jp.json`

### 3. ตัวอย่างการเพิ่ม Section ใหม่

```json
// messages/th.json
{
  "booking": {
    "title": "จองคอร์ส",
    "selectDate": "เลือกวันที่",
    "selectTime": "เลือกเวลา",
    "confirm": "ยืนยันการจอง",
    "cancel": "ยกเลิกการจอง"
  }
}

// messages/en.json
{
  "booking": {
    "title": "Book a Course",
    "selectDate": "Select Date",
    "selectTime": "Select Time",
    "confirm": "Confirm Booking",
    "cancel": "Cancel Booking"
  }
}

// messages/jp.json
{
  "booking": {
    "title": "コースを予約",
    "selectDate": "日付を選択",
    "selectTime": "時間を選択",
    "confirm": "予約を確認",
    "cancel": "予約をキャンセル"
  }
}
```

---

## Best Practices

### 1. การตั้งชื่อ Key

- ใช้ camelCase สำหรับ key (เช่น `fullName`, `confirmPassword`)
- ใช้ชื่อที่สื่อความหมาย
- จัดกลุ่มที่เกี่ยวข้องกันไว้ด้วยกัน

### 2. การใช้ Dynamic Values

```tsx
// ใช้ {variable} ในข้อความ
"welcome": "ยินดีต้อนรับ, {name}"
"itemsCount": "คุณมี {count} รายการ"

// ใช้งาน
t('welcome', { name: 'John' })
t('itemsCount', { count: 5 })
```

### 3. การจัดการ Pluralization

```json
{
  "items": {
    "zero": "ไม่มีรายการ",
    "one": "{count} รายการ",
    "other": "{count} รายการ"
  }
}
```

### 4. รักษาความสอดคล้อง

- ตรวจสอบให้แน่ใจว่าโครงสร้างของทั้ง 3 ไฟล์เหมือนกัน
- ใช้คำแปลที่สอดคล้องกันทั่วทั้งแอป
- อัพเดททั้ง 3 ภาษาพร้อมกัน

---

## การ Debug

### ตรวจสอบภาษาปัจจุบัน

```tsx
import { useLocale } from 'next-intl';

export default function DebugLocale() {
  const locale = useLocale();
  console.log('Current locale:', locale);
  return <div>Current locale: {locale}</div>;
}
```

### ตรวจสอบ Translation Keys

```tsx
// แสดง key แทนค่าแปล (สำหรับ debug)
import { useTranslations } from 'next-intl';

export default function DebugTranslations() {
  const t = useTranslations();

  // ถ้า key ไม่มีจะแสดง key นั้นออกมา
  console.log(t('some.nonexistent.key')); // จะแสดง "some.nonexistent.key"
}
```

---

## เครื่องมือช่วยเหลือ

### สร้าง Type-safe Translation Keys

```typescript
// types/i18n.ts
import th from '@/messages/th.json';

type Messages = typeof th;

declare global {
  interface IntlMessages extends Messages {}
}
```

### Validation Script

สร้างสคริปต์เช็คว่า keys ใน 3 ไฟล์ตรงกันหรือไม่:

```javascript
// scripts/validate-i18n.js
const fs = require('fs');

const th = JSON.parse(fs.readFileSync('./messages/th.json', 'utf8'));
const en = JSON.parse(fs.readFileSync('./messages/en.json', 'utf8'));
const jp = JSON.parse(fs.readFileSync('./messages/jp.json', 'utf8'));

function getKeys(obj, prefix = '') {
  let keys = [];
  for (let key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys = keys.concat(getKeys(obj[key], prefix + key + '.'));
    } else {
      keys.push(prefix + key);
    }
  }
  return keys;
}

const thKeys = getKeys(th).sort();
const enKeys = getKeys(en).sort();
const jpKeys = getKeys(jp).sort();

console.log('Validating i18n files...');
console.log('TH keys:', thKeys.length);
console.log('EN keys:', enKeys.length);
console.log('JP keys:', jpKeys.length);

const allEqual = JSON.stringify(thKeys) === JSON.stringify(enKeys)
              && JSON.stringify(enKeys) === JSON.stringify(jpKeys);

if (allEqual) {
  console.log('✅ All translation files have matching keys!');
} else {
  console.log('❌ Translation files have mismatched keys!');
  // แสดง keys ที่ไม่ตรงกัน
}
```

---

## สรุป

### ไฟล์สำคัญ
- [messages/th.json](../messages/th.json) - การแปลภาษาไทย
- [messages/en.json](../messages/en.json) - การแปลภาษาอังกฤษ
- [messages/jp.json](../messages/jp.json) - การแปลภาษาญี่ปุ่น
- [src/i18n.ts](../src/i18n.ts) - คอนฟิก i18n
- [src/components/shared/LanguageSwitcher.tsx](../src/components/shared/LanguageSwitcher.tsx) - ตัวเปลี่ยนภาษา

### หมวดหมู่หลัก
1. **common** - คำทั่วไป (buttons, labels, status, messages)
2. **navigation** - เมนูนำทาง
3. **auth** - ระบบยืนยันตัวตน (login, signup, forgotPassword)
4. **dashboard** - แดชบอร์ด
5. **validation** - การตรวจสอบข้อมูล

### จำนวนคำแปล
- Buttons: 18 คำ
- Labels: 10 คำ
- Status: 7 คำ
- Messages: 6 คำ
- Navigation: 13 เมนู
- Auth: 3 sections (login, signup, forgotPassword)
- Dashboard: 4 คำ
- Validation: 5 patterns

**รวมทั้งหมด: 66 translation keys** (ในแต่ละภาษา)
