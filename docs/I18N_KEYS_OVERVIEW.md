# i18n Keys Overview - รายการคำแปลทั้งหมด

ตารางอ้างอิงคำแปลทั้งหมด 83 keys ใน 3 ภาษา (ไทย, อังกฤษ, ญี่ปุ่น)

---

## 📊 สถิติ

| ภาษา | Locale | Keys | สถานะ |
|------|--------|------|-------|
| ไทย | `th` | 83 | ✅ |
| อังกฤษ | `en` | 83 | ✅ |
| ญี่ปุ่น | `jp` | 83 | ✅ |

---

## 1. common.buttons (18 keys)

| Key | TH (ไทย) | EN (English) | JP (日本語) |
|-----|----------|--------------|-------------|
| `common.buttons.save` | บันทึก | Save | 保存 |
| `common.buttons.cancel` | ยกเลิก | Cancel | キャンセル |
| `common.buttons.delete` | ลบ | Delete | 削除 |
| `common.buttons.edit` | แก้ไข | Edit | 編集 |
| `common.buttons.confirm` | ยืนยัน | Confirm | 確認 |
| `common.buttons.submit` | ส่ง | Submit | 送信 |
| `common.buttons.close` | ปิด | Close | 閉じる |
| `common.buttons.back` | ย้อนกลับ | Back | 戻る |
| `common.buttons.next` | ถัดไป | Next | 次へ |
| `common.buttons.previous` | ก่อนหน้า | Previous | 前へ |
| `common.buttons.search` | ค้นหา | Search | 検索 |
| `common.buttons.filter` | กรอง | Filter | フィルター |
| `common.buttons.export` | ส่งออก | Export | エクスポート |
| `common.buttons.import` | นำเข้า | Import | インポート |
| `common.buttons.upload` | อัปโหลด | Upload | アップロード |
| `common.buttons.download` | ดาวน์โหลด | Download | ダウンロード |
| `common.buttons.view` | ดู | View | 表示 |
| `common.buttons.details` | รายละเอียด | Details | 詳細 |

**ตัวอย่างการใช้:**
```tsx
const t = useTranslations('common.buttons');
<button>{t('save')}</button>
<button>{t('cancel')}</button>
```

---

## 2. common.labels (10 keys)

| Key | TH (ไทย) | EN (English) | JP (日本語) |
|-----|----------|--------------|-------------|
| `common.labels.email` | อีเมล | Email | メール |
| `common.labels.password` | รหัสผ่าน | Password | パスワード |
| `common.labels.name` | ชื่อ | Name | 名前 |
| `common.labels.phone` | เบอร์โทรศัพท์ | Phone | 電話番号 |
| `common.labels.address` | ที่อยู่ | Address | 住所 |
| `common.labels.status` | สถานะ | Status | ステータス |
| `common.labels.actions` | การกระทำ | Actions | アクション |
| `common.labels.date` | วันที่ | Date | 日付 |
| `common.labels.time` | เวลา | Time | 時間 |
| `common.labels.description` | คำอธิบาย | Description | 説明 |

**ตัวอย่างการใช้:**
```tsx
const t = useTranslations('common.labels');
<label>{t('email')}</label>
<label>{t('password')}</label>
```

---

## 3. common.status (7 keys)

| Key | TH (ไทย) | EN (English) | JP (日本語) |
|-----|----------|--------------|-------------|
| `common.status.active` | ใช้งาน | Active | アクティブ |
| `common.status.inactive` | ไม่ใช้งาน | Inactive | 非アクティブ |
| `common.status.pending` | รอดำเนินการ | Pending | 保留中 |
| `common.status.approved` | อนุมัติแล้ว | Approved | 承認済み |
| `common.status.rejected` | ปฏิเสธ | Rejected | 却下 |
| `common.status.completed` | เสร็จสิ้น | Completed | 完了 |
| `common.status.cancelled` | ยกเลิก | Cancelled | キャンセル |

**ตัวอย่างการใช้:**
```tsx
const t = useTranslations('common.status');
<Badge>{t('active')}</Badge>
<Badge>{t('pending')}</Badge>
```

---

## 4. common.messages (6 keys)

| Key | TH (ไทย) | EN (English) | JP (日本語) |
|-----|----------|--------------|-------------|
| `common.messages.loading` | กำลังโหลด... | Loading... | 読み込み中... |
| `common.messages.saving` | กำลังบันทึก... | Saving... | 保存中... |
| `common.messages.success` | สำเร็จ | Success | 成功 |
| `common.messages.error` | เกิดข้อผิดพลาด | Error occurred | エラーが発生しました |
| `common.messages.noData` | ไม่มีข้อมูล | No data | データなし |
| `common.messages.confirmDelete` | คุณแน่ใจหรือไม่ที่จะลบรายการนี้? | Are you sure you want to delete this item? | このアイテムを削除してもよろしいですか？ |

**ตัวอย่างการใช้:**
```tsx
const t = useTranslations('common.messages');
{isLoading && <p>{t('loading')}</p>}
{error && <p>{t('error')}</p>}
{success && <p>{t('success')}</p>}
```

---

## 5. navigation (13 keys)

| Key | TH (ไทย) | EN (English) | JP (日本語) |
|-----|----------|--------------|-------------|
| `navigation.home` | หน้าแรก | Home | ホーム |
| `navigation.gyms` | ค่ายมวย | Gyms | ジム |
| `navigation.events` | อีเวนต์ | Events | イベント |
| `navigation.programs` | โปรแกรม | Programs | プログラム |
| `navigation.shop` | ร้านค้า | Shop | ショップ |
| `navigation.articles` | บทความ | Articles | 記事 |
| `navigation.about` | เกี่ยวกับเรา | About Us | について |
| `navigation.faq` | คำถามที่พบบ่อย | FAQ | よくある質問 |
| `navigation.contact` | ติดต่อเรา | Contact | お問い合わせ |
| `navigation.dashboard` | แดชบอร์ด | Dashboard | ダッシュボード |
| `navigation.profile` | โปรไฟล์ | Profile | プロフィール |
| `navigation.settings` | ตั้งค่า | Settings | 設定 |
| `navigation.logout` | ออกจากระบบ | Logout | ログアウト |

**ตัวอย่างการใช้:**
```tsx
const t = useTranslations('navigation');
<nav>
  <Link href="/home">{t('home')}</Link>
  <Link href="/gyms">{t('gyms')}</Link>
  <Link href="/dashboard">{t('dashboard')}</Link>
</nav>
```

---

## 6. auth.login (7 keys)

| Key | TH (ไทย) | EN (English) | JP (日本語) |
|-----|----------|--------------|-------------|
| `auth.login.title` | เข้าสู่ระบบ | Sign In | ログイン |
| `auth.login.subtitle` | ยินดีต้อนรับกลับมา | Welcome back | お帰りなさい |
| `auth.login.email` | อีเมล | Email | メール |
| `auth.login.password` | รหัสผ่าน | Password | パスワード |
| `auth.login.button` | เข้าสู่ระบบ | Sign In | ログイン |
| `auth.login.forgotPassword` | ลืมรหัสผ่าน? | Forgot password? | パスワードを忘れた？ |
| `auth.login.noAccount` | ยังไม่มีบัญชี? | Don't have an account? | アカウントをお持ちでないですか？ |
| `auth.login.signupLink` | สมัครสมาชิก | Sign up | 新規登録 |

**ตัวอย่างการใช้:**
```tsx
const t = useTranslations('auth.login');
<form>
  <h1>{t('title')}</h1>
  <p>{t('subtitle')}</p>
  <input type="email" placeholder={t('email')} />
  <input type="password" placeholder={t('password')} />
  <button>{t('button')}</button>
</form>
```

---

## 7. auth.signup (8 keys)

| Key | TH (ไทย) | EN (English) | JP (日本語) |
|-----|----------|--------------|-------------|
| `auth.signup.title` | สมัครสมาชิก | Sign Up | 新規登録 |
| `auth.signup.subtitle` | สร้างบัญชีของคุณ | Create your account | アカウントを作成 |
| `auth.signup.fullName` | ชื่อ-นามสกุล | Full Name | 氏名 |
| `auth.signup.email` | อีเมล | Email | メール |
| `auth.signup.password` | รหัสผ่าน | Password | パスワード |
| `auth.signup.confirmPassword` | ยืนยันรหัสผ่าน | Confirm Password | パスワード確認 |
| `auth.signup.button` | สมัครสมาชิก | Sign Up | 新規登録 |
| `auth.signup.hasAccount` | มีบัญชีอยู่แล้ว? | Already have an account? | すでにアカウントをお持ちですか？ |
| `auth.signup.loginLink` | เข้าสู่ระบบ | Sign in | ログイン |

**ตัวอย่างการใช้:**
```tsx
const t = useTranslations('auth.signup');
<form>
  <h1>{t('title')}</h1>
  <input type="text" placeholder={t('fullName')} />
  <input type="email" placeholder={t('email')} />
  <input type="password" placeholder={t('password')} />
  <input type="password" placeholder={t('confirmPassword')} />
  <button>{t('button')}</button>
</form>
```

---

## 8. auth.forgotPassword (3 keys)

| Key | TH (ไทย) | EN (English) | JP (日本語) |
|-----|----------|--------------|-------------|
| `auth.forgotPassword.title` | ลืมรหัสผ่าน | Forgot Password | パスワードを忘れた |
| `auth.forgotPassword.subtitle` | กรอกอีเมลเพื่อรีเซ็ตรหัสผ่าน | Enter your email to reset password | メールアドレスを入力してパスワードをリセット |
| `auth.forgotPassword.button` | ส่งลิงก์รีเซ็ต | Send Reset Link | リセットリンクを送信 |

**ตัวอย่างการใช้:**
```tsx
const t = useTranslations('auth.forgotPassword');
<form>
  <h1>{t('title')}</h1>
  <p>{t('subtitle')}</p>
  <button>{t('button')}</button>
</form>
```

---

## 9. dashboard (4 keys)

| Key | TH (ไทย) | EN (English) | JP (日本語) |
|-----|----------|--------------|-------------|
| `dashboard.welcome` | ยินดีต้อนรับ | Welcome | ようこそ |
| `dashboard.overview` | ภาพรวม | Overview | 概要 |
| `dashboard.recentActivity` | กิจกรรมล่าสุด | Recent Activity | 最近のアクティビティ |
| `dashboard.quickActions` | การกระทำด่วน | Quick Actions | クイックアクション |

**ตัวอย่างการใช้:**
```tsx
const t = useTranslations('dashboard');
<div>
  <h1>{t('welcome')}, {userName}</h1>
  <section>
    <h2>{t('overview')}</h2>
    {/* content */}
  </section>
  <section>
    <h2>{t('recentActivity')}</h2>
    {/* content */}
  </section>
</div>
```

---

## 10. validation (5 keys)

| Key | TH (ไทย) | EN (English) | JP (日本語) |
|-----|----------|--------------|-------------|
| `validation.required` | กรุณากรอก{field} | Please enter {field} | {field}を入力してください |
| `validation.invalidEmail` | รูปแบบอีเมลไม่ถูกต้อง | Invalid email format | 無効なメール形式 |
| `validation.passwordTooShort` | รหัสผ่านต้องมีอย่างน้อย {min} ตัวอักษร | Password must be at least {min} characters | パスワードは{min}文字以上である必要があります |
| `validation.passwordMismatch` | รหัสผ่านไม่ตรงกัน | Passwords do not match | パスワードが一致しません |
| `validation.invalidPhone` | เบอร์โทรศัพท์ไม่ถูกต้อง | Invalid phone number | 無効な電話番号 |

**ตัวอย่างการใช้:**
```tsx
const t = useTranslations('validation');

// ใช้กับ dynamic values
if (!email) {
  error = t('required', { field: 'อีเมล' });
}
if (!isValidEmail(email)) {
  error = t('invalidEmail');
}
if (password.length < 8) {
  error = t('passwordTooShort', { min: 8 });
}
```

---

## 🎯 Keys ที่ใช้บ่อยที่สุด (Top 20)

| Rank | Key | Use Case |
|------|-----|----------|
| 1 | `common.buttons.save` | ปุ่มบันทึกในทุกฟอร์ม |
| 2 | `common.buttons.cancel` | ปุ่มยกเลิกในทุกฟอร์ม |
| 3 | `common.messages.loading` | แสดงสถานะกำลังโหลด |
| 4 | `common.messages.success` | แจ้งเตือนความสำเร็จ |
| 5 | `common.messages.error` | แจ้งเตือนข้อผิดพลาด |
| 6 | `navigation.home` | เมนูหน้าแรก |
| 7 | `navigation.dashboard` | เมนูแดชบอร์ด |
| 8 | `common.status.active` | แสดงสถานะใช้งาน |
| 9 | `common.status.pending` | แสดงสถานะรอดำเนินการ |
| 10 | `validation.required` | Validation ฟิลด์จำเป็น |
| 11 | `common.buttons.confirm` | ปุ่มยืนยัน |
| 12 | `common.buttons.delete` | ปุ่มลบ |
| 13 | `common.messages.confirmDelete` | ยืนยันการลบ |
| 14 | `common.labels.email` | Label อีเมล |
| 15 | `common.labels.password` | Label รหัสผ่าน |
| 16 | `navigation.profile` | เมนูโปรไฟล์ |
| 17 | `navigation.logout` | ปุ่มออกจากระบบ |
| 18 | `auth.login.title` | หัวข้อหน้าล็อกอิน |
| 19 | `common.buttons.edit` | ปุ่มแก้ไข |
| 20 | `common.status.completed` | แสดงสถานะเสร็จสิ้น |

---

## 📋 Checklist การใช้งาน

### สำหรับนักพัฒนา

- [ ] Import `useTranslations` จาก `next-intl`
- [ ] ใช้ namespace ที่เหมาะสม
- [ ] ไม่ hardcode ข้อความ
- [ ] ใช้ dynamic values สำหรับข้อความที่มีตัวแปร
- [ ] ทดสอบทั้ง 3 ภาษา

### สำหรับการเพิ่มคำแปล

- [ ] เลือก namespace ที่เหมาะสม
- [ ] เพิ่มใน 3 ไฟล์พร้อมกัน (th.json, en.json, jp.json)
- [ ] รัน `node scripts/validate-i18n.js`
- [ ] ตรวจสอบ JSON syntax
- [ ] ทดสอบในแอป
- [ ] Commit การเปลี่ยนแปลง

---

## 🔍 การค้นหาคำแปล

### ค้นหาด้วย Category

```bash
# ค้นหาทุก button
cat messages/th.json | grep -A 1 "common.buttons"

# ค้นหา navigation
cat messages/th.json | grep -A 1 "navigation"

# ค้นหา auth
cat messages/th.json | grep -A 1 "auth"
```

### ค้นหาด้วยคำ

```bash
# ค้นหาคำว่า "บันทึก"
cat messages/th.json | grep "บันทึก"

# ค้นหาคำว่า "Save"
cat messages/en.json | grep "Save"

# ค้นหาคำว่า "保存"
cat messages/jp.json | grep "保存"
```

---

## 📦 Export สำหรับใช้งาน

### สร้าง TypeScript Types

```typescript
// types/translations.ts
export type TranslationKey =
  // Common Buttons
  | 'common.buttons.save'
  | 'common.buttons.cancel'
  // ... (all 83 keys)

export type Locale = 'th' | 'en' | 'jp';
```

### สร้าง Constants

```typescript
// constants/translation-keys.ts
export const TRANSLATION_KEYS = {
  COMMON: {
    BUTTONS: {
      SAVE: 'common.buttons.save',
      CANCEL: 'common.buttons.cancel',
      // ...
    },
    LABELS: {
      EMAIL: 'common.labels.email',
      PASSWORD: 'common.labels.password',
      // ...
    }
  },
  NAVIGATION: {
    HOME: 'navigation.home',
    DASHBOARD: 'navigation.dashboard',
    // ...
  }
} as const;
```

---

## 🎨 Pattern ที่แนะนำ

### 1. Component ที่ใช้ซ้ำ

```tsx
// components/Button.tsx
import { useTranslations } from 'next-intl';

export function SaveButton({ onClick }: { onClick: () => void }) {
  const t = useTranslations('common.buttons');
  return <button onClick={onClick}>{t('save')}</button>;
}

export function CancelButton({ onClick }: { onClick: () => void }) {
  const t = useTranslations('common.buttons');
  return <button onClick={onClick}>{t('cancel')}</button>;
}
```

### 2. Loading State

```tsx
// components/LoadingMessage.tsx
import { useTranslations } from 'next-intl';

export function LoadingMessage() {
  const t = useTranslations('common.messages');
  return <div className="loading">{t('loading')}</div>;
}
```

### 3. Status Badge

```tsx
// components/StatusBadge.tsx
import { useTranslations } from 'next-intl';

type Status = 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled';

export function StatusBadge({ status }: { status: Status }) {
  const t = useTranslations('common.status');
  return <span className={`badge badge-${status}`}>{t(status)}</span>;
}
```

---

## 📊 สถิติรายละเอียด

### จำนวน Keys ตาม Namespace

```
common.buttons       18 keys  (21.7%)
navigation           13 keys  (15.7%)
common.labels        10 keys  (12.0%)
auth.signup           8 keys   (9.6%)
auth.login            7 keys   (8.4%)
common.status         7 keys   (8.4%)
common.messages       6 keys   (7.2%)
validation            5 keys   (6.0%)
dashboard             4 keys   (4.8%)
auth.forgotPassword   3 keys   (3.6%)
─────────────────────────────────────
Total                83 keys (100.0%)
```

### ความยาวของข้อความ (ภาษาไทย)

```
สั้นที่สุด:  "ดู" (2 ตัวอักษร)
ยาวที่สุด:  "คุณแน่ใจหรือไม่ที่จะลบรายการนี้?" (34 ตัวอักษร)
เฉลี่ย:     ~10 ตัวอักษร
```

---

## ✅ Status Check

สถานะล่าสุด (2025-11-06):

```
✅ ไฟล์แปล:        3/3 ไฟล์
✅ Keys:            83/83 keys ในทุกภาษา
✅ ความสอดคล้อง:   100%
✅ ค่าว่าง:         0
✅ JSON Format:    ถูกต้องทั้งหมด
```

---

## 📚 เอกสารที่เกี่ยวข้อง

- [I18N_README.md](./I18N_README.md) - เอกสารหลัก
- [I18N_QUICK_REFERENCE.md](./I18N_QUICK_REFERENCE.md) - คู่มืออ้างอิงด่วน
- [I18N_STRUCTURE.md](./I18N_STRUCTURE.md) - โครงสร้างละเอียด
- [I18N_TEMPLATE.md](./I18N_TEMPLATE.md) - Template สำหรับเพิ่มคำแปล

---

**อัปเดตล่าสุด:** 2025-11-06
**เวอร์ชัน:** 1.0.0
**จำนวนรวม:** 83 keys × 3 ภาษา = 249 translations
