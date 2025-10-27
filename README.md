<div align="center">
  <h1>THAIKICK - Muay Thai Platform</h1>
  <p>
    แพลตฟอร์มครบครันสำหรับค้นหาและจองค่ายมวย ซื้อตั๋วเวทีมวย และช้อปปิ้งอุปกรณ์มวยไทย
  </p>
  <p>
    <strong>พัฒนาด้วย Next.js 15, Supabase, TypeScript และ Tailwind CSS</strong>
  </p>
</div>

---

## 🌟 ภาพรวมโปรเจกต์

**THAIKICK** เป็นแพลตฟอร์ม Full-Stack ที่ครอบคลุมทุกความต้องการของชุมชนมวยไทย ตั้งแต่การค้นหาและจองค่ายมวย การซื้อตั๋วเวทีมวย ไปจนถึงการช้อปปิ้งอุปกรณ์มวยไทย พร้อมระบบ Gamification ที่สร้างแรงจูงใจให้ผู้ใช้มีส่วนร่วมมากขึ้น

### 🏗️ สถาปัตยกรรมระบบ

โปรเจกต์ใช้สถาปัตยกรรม **Modern Full-Stack Web Application** ที่ออกแบบมาเพื่อความยืดหยุ่น ความปลอดภัย และความสามารถในการขยายตัว:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   Next.js 15    │◄──►│   Supabase      │◄──►│   PostgreSQL    │
│   App Router    │    │   Auth + API    │    │   + Storage     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI/UX         │    │   External      │    │   Development   │
│   Tailwind CSS  │    │   Stripe + Email│    │   TypeScript    │
│   HeroUI        │    │   Resend        │    │   Playwright    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## ✨ ฟีเจอร์หลัก

### 🎯 ฟีเจอร์หลัก (Core Features)
-   🥋 **ระบบจัดการค่ายมวย**: ค้นหา, ดูรายละเอียด และจองแพ็คเกจค่ายมวยทั่วประเทศ
-   🎫 **ระบบตั๋วเวทีมวย**: จองตั๋วชมเวทีมวยและอีเวนต์ต่างๆ
-   � **ระบบบ E-commerce**: ช้อปปิ้งอุปกรณ์มวยไทย นวม ชุดมวย และอุปกรณ์ฝึกซ้อม
-   🏆 **ระบบ Gamification**: สะสมแต้ม, ปลดล็อกความสำเร็จ และระบบอันดับ

### 🔐 ระบบจัดการผู้ใช้
-   👤 **Authentication**: สมัครสมาชิก, เข้าสู่ระบบ, ยืนยันอีเมล และจัดการโปรไฟล์
-   �  **Role-Based Access Control**: แบ่งสิทธิ์การเข้าถึง 3 ระดับ
    -   **User**: ผู้ใช้งานทั่วไป - จองค่าย, ซื้อตั๋ว, ช้อปปิ้ง
    -   **Partner**: เจ้าของค่ายมวย - จัดการค่ายมวยและแพ็คเกจ
    -   **Admin**: ผู้ดูแลระบบ - จัดการระบบทั้งหมด

### 💼 ระบบธุรกิจ
-   💳 **Payment Gateway**: ชำระเงินผ่าน Stripe อย่างปลอดภัย
-   📊 **Analytics Dashboard**: แดชบอร์ดสำหรับแต่ละ role พร้อมสถิติและรายงาน
-   📧 **Email Integration**: ระบบแจ้งเตือนและยืนยันผ่าน Resend
-   📱 **Responsive Design**: รองรับทุกอุปกรณ์ มือถือ แท็บเล็ต และเดสก์ท็อป

## 🛠️ เทคโนโลยีและโครงสร้าง

### 🚀 Technology Stack
-   **Frontend Framework**: Next.js 15 (App Router) + TypeScript
-   **Styling**: Tailwind CSS 4.1.3 + HeroUI Components
-   **Backend & Database**: Supabase (PostgreSQL + Auth + Storage)
-   **Payment Processing**: Stripe
-   **Email Service**: Resend
-   **Testing**: Playwright (E2E Testing)
-   **Development**: ESLint + Prettier + Supabase CLI

### 📁 โครงสร้างโปรเจกต์

```
THAIKICK/
├── 📱 src/app/                    # Next.js App Router
│   ├── 🔐 (auth)/                # Authentication routes
│   ├── 📊 admin/                 # Admin dashboard
│   ├── 🤝 partner/               # Partner dashboard  
│   ├── 📋 dashboard/             # User dashboard
│   ├── 🥋 gyms/                  # Gym listings & details
│   ├── 🎫 events/                # Event tickets
│   ├── 🛒 shop/                  # E-commerce
│   ├── 🎯 api/                   # API routes
│   └── 📄 (pages)/               # Static pages
├── 🧩 src/components/            # Reusable components
│   ├── 🎨 ui/                    # Base UI components
│   ├── 🔧 shared/                # Shared components
│   ├── ✨ features/              # Feature-specific components
│   └── 📐 layout/                # Layout components
├── 📚 src/lib/                   # Utilities & configurations
│   ├── 🔐 auth/                  # Authentication utilities
│   ├── 🗄️ database/              # Database clients & types
│   ├── 💳 payments/              # Stripe integration
│   ├── 📧 email/                 # Email services
│   ├── 🎣 hooks/                 # Custom React hooks
│   └── 🛠️ utils/                 # Helper functions
├── 🔄 src/services/              # API services
├── 📝 src/types/                 # TypeScript definitions
├── 🗄️ scripts/                  # Database management scripts
├── 📖 docs/                      # Project documentation
├── 🧪 tests/                     # Test files
└── 🗃️ supabase/                 # Supabase configuration
```

### 🎯 ฟีเจอร์เฉพาะทาง (Specialized Features)

#### 🏋️ Gym Management System
- **Multi-language Support**: ชื่อค่ายภาษาไทย/อังกฤษ
- **Location Integration**: Google Maps integration พร้อม GPS coordinates
- **Package Management**: แพ็คเกจแบบครั้งเดียว (one-time) และแบบรายเดือน (package)
- **Image Gallery**: อัพโหลดและจัดการรูปภาพค่ายมวยผ่าน Supabase Storage
- **Status Management**: ระบบอนุมัติค่ายมวยโดย Admin

#### 🎫 Event Ticketing System  
- **Event Categories**: แยกประเภทเวทีมวย (มวยไทย, มวยสากล, ONE Championship, etc.)
- **Seat Management**: จัดการที่นั่งและราคาตั๋วแบบหลายระดับ
- **QR Code Integration**: ตั๋วอิเล็กทรอนิกส์พร้อม QR Code

#### 🛒 E-commerce Platform
- **Product Categories**: นวมมวย, ชุดมวย, อุปกรณ์ฝึกซ้อม, อาหารเสริม
- **Inventory Management**: ระบบจัดการสต็อกสินค้า
- **Shipping Integration**: เชื่อมต่อระบบขนส่ง

#### 🏆 Gamification System
- **Point System**: สะสมแต้มจากการใช้งานแพลตฟอร์ม
- **Achievement Badges**: ปลดล็อกความสำเร็จต่างๆ
- **Leaderboard**: ระบบอันดับผู้ใช้
- **Rewards Program**: แลกแต้มเป็นส่วนลดและของรางวัล

## 🚀 เริ่มต้นใช้งาน

### 1. Clone โปรเจกต์

```bash
git clone https://github.com/your-username/muaythai-next-postgres.git
cd muaythai-next-postgres
```

### 2. ติดตั้ง Dependencies

```bash
npm install
```

### 3. ตั้งค่า Environment Variables

คัดลอกไฟล์ `.env.example` ไปยัง `.env.local` และตั้งค่าตัวแปรที่จำเป็น:

```bash
cp .env.example .env.local
```

**ตัวแปรสำคัญที่ต้องตั้งค่า:**
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe Configuration  
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Email Configuration (Resend)
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=noreply@yourdomain.com

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Setup Database

**🚀 วิธีเรียบง่าย (แนะนำ):**
```bash
# รันสคริปต์เดียวจบ - ใช้เวลา 2-3 นาที
./scripts/quick-deploy.sh
```

**📋 หรือทำเอง (Manual):**
1. เปิด Supabase SQL Editor
2. แก้ไขอีเมลใน `scripts/production-deploy.sql` บรรทัดที่ 200
3. Copy & Paste ไฟล์ทั้งหมดลงใน SQL Editor และกด Run

**🧪 สำหรับ Development:**
```bash
supabase start                    # เริ่ม local Supabase
supabase db push                  # Apply migrations
npm run db:utils                  # ตรวจสอบฐานข้อมูล
```

### 5. รันโปรเจกต์

```bash
npm run dev
```

เปิดเบราว์เซอร์และไปที่ [http://localhost:3000](http://localhost:3000)

## 🧪 การทดสอบและ Development Tools

### E2E Testing ด้วย Playwright
โปรเจกต์มี comprehensive E2E tests ที่ครอบคลุม user flows หลัก:

```bash
# รันเทสทั้งหมด (Headless Mode)
npm run test:e2e

# รันเทสพร้อม UI
npm run test:e2e:ui

# รันเทสแบบ debug
npm run test:e2e:debug

# ดูรายงานผลเทส
npm run test:report
```

### Database Management Scripts
ระบบจัดการฐานข้อมูลที่ครบครัน:

```bash
# ตรวจสอบสุขภาพฐานข้อมูล
npm run db:check

# ตรวจสอบ Partner roles
npm run db:partners  

# อัพเดท Gym slugs
npm run db:slugs

# รันยูทิลิตี้ทั้งหมด
npm run db:utils

# ตั้งค่า development environment
npm run dev:setup
```

### Development Workflow
```bash
# เริ่มต้น development
npm run dev                       # เริ่ม Next.js dev server
supabase start                    # เริ่ม local Supabase (terminal ใหม่)

# ตรวจสอบและ maintenance
npm run lint                      # ESLint checking
npm run build                     # Production build test
npm run db:check                  # Database health check

# Testing workflow  
npm run test:e2e                  # E2E tests
npm run test:scripts              # Database script tests
```

## 📖 เอกสารและทรัพยากร

### 📚 เอกสารหลัก
-   [**ศูนย์รวมเอกสาร**](./docs/README.md) - ภาพรวมเอกสารทั้งหมด
-   [**สถาปัตยกรรมระบบ**](./docs/architecture/README.md) - โครงสร้างและการออกแบบระบบ
-   [**คู่มือฟีเจอร์**](./docs/features/README.md) - รายละเอียดฟีเจอร์ทั้งหมด
-   [**Database Scripts**](./scripts/README.md) - การจัดการฐานข้อมูลและ scripts

### 🛠️ เอกสารสำหรับนักพัฒนา
-   [**คู่มือการติดตั้ง**](./docs/setup/README.md) - Setup และ configuration
-   [**คู่มือการทดสอบ**](./docs/testing/README.md) - E2E testing และ validation
-   [**แนวทางการมีส่วนร่วม**](./docs/contributing/README.md) - Contribution guidelines

### 🔧 API และ Integration
-   **Supabase Dashboard**: จัดการฐานข้อมูล, Authentication, Storage
-   **Stripe Dashboard**: จัดการการชำระเงินและ webhooks  
-   **Resend Dashboard**: จัดการ email templates และ delivery

### 📊 Key Metrics และ Analytics

| Metric | Description | Location |
|--------|-------------|----------|
| **User Engagement** | การใช้งานและ retention | Admin Dashboard |
| **Booking Conversion** | อัตราการแปลงจากการดูเป็นการจอง | Analytics API |
| **Revenue Tracking** | รายได้จากการจองและการขาย | Stripe Dashboard |
| **Performance Metrics** | ความเร็วและ uptime | Vercel Analytics |

## 🚀 Deployment และ Production

### 🌐 Deployment Options
- **Vercel** (แนะนำ): Auto-deployment จาก GitHub
- **Netlify**: Alternative deployment platform  
- **Docker**: Container-based deployment

### 🔒 Security Features
- **Row Level Security (RLS)**: ป้องกันข้อมูลระดับแถว
- **JWT Authentication**: Token-based authentication
- **HTTPS Enforcement**: บังคับใช้ HTTPS
- **Input Validation**: ตรวจสอบข้อมูลนำเข้าด้วย Zod
- **Rate Limiting**: จำกัดอัตราการเรียก API

### 📈 Performance Optimizations
- **Next.js App Router**: Optimized routing และ loading
- **Image Optimization**: Auto-optimized images
- **Code Splitting**: แยกโค้ดตาม route
- **Database Indexing**: Optimized database queries
- **Caching Strategy**: Multi-level caching

## 🤝 Contributing และ Community

### 👥 การมีส่วนร่วม
1. Fork โปรเจกต์
2. สร้าง feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit การเปลี่ยนแปลง (`git commit -m 'Add some AmazingFeature'`)
4. Push ไปยัง branch (`git push origin feature/AmazingFeature`)
5. เปิด Pull Request

### 🐛 Bug Reports
- ใช้ GitHub Issues สำหรับรายงาน bugs
- ระบุขั้นตอนการทำซ้ำ (reproduction steps)
- แนบ screenshots หรือ error logs

### 💡 Feature Requests
- เสนอฟีเจอร์ใหม่ผ่าน GitHub Discussions
- อธิบายปัญหาที่ฟีเจอร์จะช่วยแก้ไข
- ให้ตัวอย่างการใช้งาน

## 📞 Support และ Contact

### 🆘 การขอความช่วยเหลือ
1. ตรวจสอบ [เอกสารประกอบ](./docs/README.md)
2. ค้นหาใน [GitHub Issues](../../issues)
3. สร้าง issue ใหม่พร้อมรายละเอียด

### 📧 ติดต่อทีมพัฒนา
- **GitHub**: [Repository Issues](../../issues)
- **Email**: [ระบุอีเมลติดต่อ]
- **Discord**: [ลิงก์ Discord server หากมี]

---

## 📄 License

โปรเจกต์นี้อยู่ภายใต้ [MIT License](./LICENSE)

---

<div align="center">
  <p>
    <strong>🥊 สร้างด้วยความรักสำหรับชุมชนมวยไทย 🇹🇭</strong>
  </p>
  <p>
    <em>Built with ❤️ for the Muay Thai Community</em>
  </p>
</div>
