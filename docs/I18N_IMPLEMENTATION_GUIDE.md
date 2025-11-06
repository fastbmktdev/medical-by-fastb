# Multi-language (i18n) Implementation Guide

**วันที่**: 2025-11-06
**Feature**: Multi-language Support (ไทย, อังกฤษ, ญี่ปุ่น)
**Framework**: next-intl with Next.js 15+ App Router

---

## ✅ สิ่งที่ทำเสร็จแล้ว (Phase 1)

### 1. **ติดตั้ง next-intl** ✅
```bash
npm install next-intl
```

### 2. **Configuration Files** ✅

#### **src/i18n.ts**
- กำหนด supported locales: `['th', 'en', 'jp']`
- Locale names, flags สำหรับแสดงใน UI
- Message loader configuration

#### **src/middleware.ts**
- รวม next-intl middleware เข้ากับ existing middleware (CSRF, rate limiting, Supabase)
- Auto-redirect ไป `/th/*`, `/en/*`, `/jp/*` ตาม locale preference
- Skip i18n สำหรับ `/api/*`, `/_next/*`, static files

#### **next.config.ts**
- เพิ่ม `withNextIntl()` plugin wrapper
- รวมกับ existing Sentry configuration

### 3. **Message Files** ✅

สร้าง 3 ไฟล์ใน `/messages/`:

#### **messages/th.json** (ไทย)
- common.buttons: บันทึก, ยกเลิก, ลบ, แก้ไข...
- common.labels: อีเมล, รหัสผ่าน, ชื่อ...
- common.status: ใช้งาน, ไม่ใช้งาน, รอดำเนินการ...
- navigation: หน้าแรก, ค่ายมวย, อีเวนต์...
- auth.login, auth.signup, auth.forgotPassword
- dashboard, validation

#### **messages/en.json** (English)
- ครบทุก keys เหมือน th.json
- แปลเป็นภาษาอังกฤษ

#### **messages/jp.json** (日本語)
- ครบทุก keys เหมือน th.json
- แปลเป็นภาษาญี่ปุ่น

### 4. **Language Switcher Component** ✅

#### **src/components/shared/LanguageSwitcher.tsx**
- ใช้ `useLocale()` hook จาก next-intl
- Desktop version: Dropdown แสดง 3 ภาษา
- Mobile version: List แสดงใน mobile menu
- แสดง flags, ชื่อภาษา, checkmark สำหรับ active locale
- เปลี่ยนภาษาด้วยการ redirect ไป `/[locale]/path`

#### **Updated Header.tsx**
- Import LanguageSwitcher component
- ลบ mock state-based language switcher
- ใช้ real LanguageSwitcher แทน (Desktop + Mobile)

### 5. **[locale] Layout** ✅

#### **src/app/[locale]/layout.tsx**
- Wrap ด้วย `NextIntlClientProvider`
- Validate locale parameter
- Load messages สำหรับ current locale
- Generate static params สำหรับ 3 locales

#### **src/app/[locale]/page.tsx**
- Placeholder homepage
- แสดง current locale

---

## 📊 Directory Structure

```
src/
├── i18n.ts                          # i18n configuration
├── middleware.ts                    # Combined middleware (i18n + CSRF + rate limit + Supabase)
├── app/
│   ├── [locale]/                    # NEW: Locale-based routing
│   │   ├── layout.tsx               # Root layout with NextIntlClientProvider
│   │   ├── page.tsx                 # Homepage (placeholder)
│   │   └── [other routes]/          # All existing routes should move here
│   ├── api/                         # API routes (no locale prefix)
│   ├── providers.tsx                # Existing providers
│   └── globals.css                  # Global styles
├── components/
│   └── shared/
│       └── LanguageSwitcher.tsx     # NEW: Language switcher component
└── messages/                        # NEW: Translation files
    ├── th.json                      # Thai translations
    ├── en.json                      # English translations
    └── jp.json                      # Japanese translations
```

---

## 🔄 ขั้นตอนต่อไป: Migration Routes

### **Phase 2: Migrate Existing Routes (Manual)**

ต้องย้ายไฟล์ทั้งหมดจาก `src/app/` ไปยัง `src/app/[locale]/`:

#### **Example:**

**Before:**
```
src/app/
├── login/
│   └── page.tsx
├── signup/
│   └── page.tsx
├── dashboard/
│   ├── page.tsx
│   └── profile/
│       └── page.tsx
```

**After:**
```
src/app/
├── [locale]/
│   ├── login/
│   │   └── page.tsx
│   ├── signup/
│   │   └── page.tsx
│   ├── dashboard/
│   │   ├── page.tsx
│   │   └── profile/
│   │       └── page.tsx
```

#### **Shell Command (ตัวอย่าง):**
```bash
# ย้าย login page
mv src/app/login src/app/[locale]/login

# ย้าย signup page
mv src/app/signup src/app/[locale]/signup

# ย้าย dashboard
mv src/app/dashboard src/app/[locale]/dashboard

# ... ทำต่อสำหรับทุก route
```

#### **ไฟล์ที่ควรย้าย:**
- `/login` → `/[locale]/login`
- `/signup` → `/[locale]/signup`
- `/dashboard` → `/[locale]/dashboard`
- `/admin` → `/[locale]/admin`
- `/partner` → `/[locale]/partner`
- `/gyms` → `/[locale]/gyms`
- `/events` → `/[locale]/events`
- `/shop` → `/[locale]/shop`
- `/articles` → `/[locale]/articles`
- `/about` → `/[locale]/about`
- `/faq` → `/[locale]/faq`
- `/contact` → `/[locale]/contact`
- และอื่น ๆ...

#### **ไฟล์ที่ไม่ต้องย้าย:**
- `/api/*` (API routes ไม่ต้องมี locale)
- `/favicon.ico`, `/sitemap.xml`, `/robots.txt`
- `layout.tsx` หลัก (แต่ต้องแก้ไข - ดูด้านล่าง)
- `providers.tsx`
- `globals.css`

---

## 🔧 การแก้ไข Root Layout

### **Before (src/app/layout.tsx):**
```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### **After:**

**Option 1: Redirect to default locale**
```tsx
import { redirect } from 'next/navigation';

export default function RootLayout() {
  // Redirect root path to default locale
  redirect('/th');
}
```

**Option 2: Keep minimal layout**
```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  // This layout is only used as a wrapper
  // Real layout logic is in [locale]/layout.tsx
  return children;
}
```

---

## 🎨 การใช้งาน Translations ใน Components

### **Server Components:**

```tsx
import { useTranslations } from 'next-intl';
import { unstable_setRequestLocale } from 'next-intl/server';

export default function MyPage({ params: { locale } }: { params: { locale: string } }) {
  unstable_setRequestLocale(locale);
  const t = useTranslations('navigation');

  return (
    <div>
      <h1>{t('home')}</h1>
      <p>{t('about')}</p>
    </div>
  );
}
```

### **Client Components:**

```tsx
'use client';

import { useTranslations } from 'next-intl';

export default function MyClientComponent() {
  const t = useTranslations('common.buttons');

  return (
    <div>
      <button>{t('save')}</button>
      <button>{t('cancel')}</button>
    </div>
  );
}
```

### **With Parameters:**

```json
{
  "validation": {
    "required": "Please enter {field}",
    "minLength": "Must be at least {min} characters"
  }
}
```

```tsx
t('validation.required', { field: 'Email' })
// Output: "Please enter Email"

t('validation.minLength', { min: 8 })
// Output: "Must be at least 8 characters"
```

---

## 🔗 Link Component Usage

### **Before:**
```tsx
<Link href="/dashboard">Dashboard</Link>
```

### **After (with next-intl):**

**Option 1: Use next-intl Link (แนะนำ)**
```tsx
import { Link } from 'next-intl';

<Link href="/dashboard">Dashboard</Link>
// Auto renders: /th/dashboard, /en/dashboard, /jp/dashboard
```

**Option 2: Use Next.js Link with manual locale**
```tsx
import Link from 'next/link';
import { useLocale } from 'next-intl';

const locale = useLocale();
<Link href={`/${locale}/dashboard`}>Dashboard</Link>
```

---

## 🌐 URL Structure

### **Before Migration:**
```
/                      → Homepage
/login                → Login page
/dashboard            → Dashboard
/gyms/[slug]          → Gym detail
```

### **After Migration:**
```
/                      → Redirect to /th (default)
/th                   → Homepage (Thai)
/en                   → Homepage (English)
/jp                   → Homepage (Japanese)
/th/login             → Login (Thai)
/en/login             → Login (English)
/jp/login             → Login (Japanese)
/th/dashboard         → Dashboard (Thai)
/en/dashboard         → Dashboard (English)
/th/gyms/[slug]       → Gym detail (Thai)
/en/gyms/[slug]       → Gym detail (English)
```

---

## 🎯 Testing Checklist

### **Phase 1 (Setup) - ✅ Completed**
- [x] next-intl installed
- [x] i18n.ts configuration created
- [x] middleware.ts updated
- [x] next.config.ts updated
- [x] 3 message files created (th, en, jp)
- [x] LanguageSwitcher component created
- [x] Header.tsx updated to use LanguageSwitcher
- [x] [locale]/layout.tsx created
- [x] Placeholder [locale]/page.tsx created

### **Phase 2 (Migration) - ⏳ Pending**
- [ ] Backup src/app directory
- [ ] Move all routes to [locale]/ directory
- [ ] Update root layout.tsx
- [ ] Test each page in all 3 locales
- [ ] Fix broken links
- [ ] Update imports if needed

### **Phase 3 (Translation) - ⏳ Pending**
- [ ] Extract hardcoded Thai text from components
- [ ] Add to messages/th.json
- [ ] Translate to messages/en.json
- [ ] Translate to messages/jp.json
- [ ] Replace hardcoded text with t() calls
- [ ] Test all translations

### **Phase 4 (SEO) - ⏳ Pending**
- [ ] Add hreflang tags
- [ ] Update sitemap.xml
- [ ] Update meta tags per locale
- [ ] Test Google Search Console

---

## ⚠️ Known Issues & Solutions

### **Issue 1: Middleware Conflicts**
**Problem:** next-intl middleware might conflict with Supabase/CSRF middleware

**Solution:** ✅ Already handled by combining middlewares in sequence:
1. Check if path needs i18n
2. Apply i18n redirect if needed
3. Apply CSRF protection (for API routes)
4. Apply rate limiting (for API routes)
5. Update Supabase session

### **Issue 2: API Routes Getting Locale Prefix**
**Problem:** API routes like `/api/bookings` might get prefixed to `/th/api/bookings`

**Solution:** ✅ Already handled by:
- Middleware skips i18n for paths starting with `/api/`
- Matcher pattern excludes `/api/` routes

### **Issue 3: Static Files (images, fonts)**
**Problem:** Static files might get locale prefix

**Solution:** ✅ Already handled by:
- Middleware regex excludes file extensions: `.ico`, `.png`, `.jpg`, etc.

---

## 📚 Resources

- **next-intl Docs**: https://next-intl-docs.vercel.app/
- **Next.js i18n**: https://nextjs.org/docs/app/building-your-application/routing/internationalization
- **Message Format**: https://formatjs.io/docs/core-concepts/icu-syntax/

---

## 🚀 Quick Start Commands

### **Test Current Setup:**
```bash
npm run dev
```

Visit:
- http://localhost:3000 → Should redirect to `/th`
- http://localhost:3000/th → Thai version
- http://localhost:3000/en → English version
- http://localhost:3000/jp → Japanese version

### **Check Translations:**
```bash
# View Thai messages
cat messages/th.json | jq '.common.buttons'

# View English messages
cat messages/en.json | jq '.common.buttons'

# View Japanese messages
cat messages/jp.json | jq '.common.buttons'
```

---

## ✅ Summary

**Phase 1 (Setup) - สำเร็จแล้ว:**
- ✅ next-intl installed และ configured
- ✅ 3 ภาษา setup: Thai, English, Japanese
- ✅ Language Switcher ทำงานได้ (Desktop + Mobile)
- ✅ Middleware รวมกับ existing security middleware
- ✅ Basic message files พร้อมใช้งาน

**Next Steps:**
1. ทดสอบ dev server: `npm run dev`
2. ทดสอบเปลี่ยนภาษาใน Header
3. เริ่ม Phase 2: Migrate routes ทีละหน้า
4. เริ่ม Phase 3: แปลงข้อความ hardcoded เป็น t() calls

---

**หมายเหตุ:**
การ migration นี้เป็นการเปลี่ยนแปลง architecture ขนาดใหญ่
แนะนำทำทีละ phase และ test ทุกครั้งก่อนทำ phase ถัดไป
