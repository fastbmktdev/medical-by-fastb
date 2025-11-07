# Template สำหรับเพิ่มคำแปลใหม่

## วิธีใช้งาน Template นี้

1. คัดลอก JSON structure ที่ต้องการ
2. แก้ไขค่าให้เหมาะสมกับฟีเจอร์ของคุณ
3. เพิ่มเข้าไปในไฟล์ทั้ง 3 ภาษา (th.json, en.json, jp.json)
4. รัน validation script: `node scripts/validate-i18n.js`

---

## Template พื้นฐาน

### 1. หน้าใหม่ทั่วไป (Generic Page)

```json
{
  "pageName": {
    "title": "หัวข้อหน้า / Page Title / ページタイトル",
    "subtitle": "หัวข้อย่อย / Subtitle / サブタイトル",
    "description": "คำอธิบาย / Description / 説明",
    "loading": "กำลังโหลด... / Loading... / 読み込み中...",
    "error": "เกิดข้อผิดพลาด / Error occurred / エラーが発生しました",
    "success": "สำเร็จ / Success / 成功",
    "empty": "ไม่มีข้อมูล / No data available / データがありません"
  }
}
```

### 2. ฟอร์ม (Form)

```json
{
  "formName": {
    "title": "ชื่อฟอร์ม / Form Title / フォームタイトル",
    "fields": {
      "fieldName": "ชื่อฟิลด์ / Field Name / フィールド名",
      "placeholder": "กรุณากรอก... / Please enter... / 入力してください..."
    },
    "buttons": {
      "submit": "ส่ง / Submit / 送信",
      "cancel": "ยกเลิก / Cancel / キャンセル",
      "reset": "รีเซ็ต / Reset / リセット"
    },
    "validation": {
      "required": "กรุณากรอกข้อมูล / This field is required / この項目は必須です",
      "invalid": "ข้อมูลไม่ถูกต้อง / Invalid data / 無効なデータ"
    },
    "messages": {
      "submitting": "กำลังส่งข้อมูล... / Submitting... / 送信中...",
      "success": "บันทึกสำเร็จ / Saved successfully / 保存に成功しました",
      "error": "บันทึกไม่สำเร็จ / Failed to save / 保存に失敗しました"
    }
  }
}
```

### 3. ตาราง (Table)

```json
{
  "tableName": {
    "title": "ชื่อตาราง / Table Title / テーブルタイトル",
    "columns": {
      "id": "รหัส / ID / ID",
      "name": "ชื่อ / Name / 名前",
      "status": "สถานะ / Status / ステータス",
      "createdAt": "วันที่สร้าง / Created Date / 作成日",
      "actions": "การกระทำ / Actions / アクション"
    },
    "actions": {
      "view": "ดู / View / 表示",
      "edit": "แก้ไข / Edit / 編集",
      "delete": "ลบ / Delete / 削除"
    },
    "empty": "ไม่มีข้อมูล / No data / データなし",
    "pagination": {
      "showing": "แสดง / Showing / 表示中",
      "of": "จาก / of / の",
      "results": "รายการ / results / 件"
    }
  }
}
```

### 4. Modal/Dialog

```json
{
  "modalName": {
    "title": "หัวข้อ Modal / Modal Title / モーダルタイトル",
    "message": "ข้อความ / Message / メッセージ",
    "buttons": {
      "confirm": "ยืนยัน / Confirm / 確認",
      "cancel": "ยกเลิก / Cancel / キャンセル",
      "close": "ปิด / Close / 閉じる"
    },
    "confirmDelete": {
      "title": "ยืนยันการลบ / Confirm Delete / 削除の確認",
      "message": "คุณแน่ใจหรือไม่ที่จะลบรายการนี้? / Are you sure you want to delete this item? / このアイテムを削除してもよろしいですか？",
      "confirm": "ลบ / Delete / 削除",
      "cancel": "ยกเลิก / Cancel / キャンセル"
    }
  }
}
```

---

## Template สำหรับฟีเจอร์เฉพาะ

### 5. ระบบจอง (Booking System)

```json
{
  "booking": {
    "title": "จองคอร์ส / Book a Course / コースを予約",
    "subtitle": "เลือกคอร์สและเวลาที่คุณต้องการ / Select your course and time / コースと時間を選択",
    "steps": {
      "selectCourse": "เลือกคอร์ส / Select Course / コースを選択",
      "selectDateTime": "เลือกวันและเวลา / Select Date & Time / 日時を選択",
      "fillDetails": "กรอกรายละเอียด / Fill Details / 詳細を入力",
      "confirm": "ยืนยัน / Confirm / 確認"
    },
    "form": {
      "course": "คอร์ส / Course / コース",
      "date": "วันที่ / Date / 日付",
      "time": "เวลา / Time / 時間",
      "duration": "ระยะเวลา / Duration / 期間",
      "participants": "จำนวนคน / Participants / 参加者数",
      "notes": "หมายเหตุ / Notes / 備考"
    },
    "buttons": {
      "next": "ถัดไป / Next / 次へ",
      "back": "ย้อนกลับ / Back / 戻る",
      "confirm": "ยืนยันการจอง / Confirm Booking / 予約を確認",
      "cancel": "ยกเลิก / Cancel / キャンセル"
    },
    "messages": {
      "loading": "กำลังโหลดตารางเวลา... / Loading schedule... / スケジュールを読み込み中...",
      "submitting": "กำลังดำเนินการจอง... / Processing booking... / 予約を処理中...",
      "success": "จองสำเร็จ / Booking successful / 予約に成功しました",
      "error": "จองไม่สำเร็จ / Booking failed / 予約に失敗しました",
      "noAvailableSlots": "ไม่มีเวลาว่าง / No available slots / 空き時間がありません"
    },
    "status": {
      "pending": "รอยืนยัน / Pending / 保留中",
      "confirmed": "ยืนยันแล้ว / Confirmed / 確認済み",
      "cancelled": "ยกเลิกแล้ว / Cancelled / キャンセル済み",
      "completed": "เสร็จสิ้น / Completed / 完了"
    }
  }
}
```

### 6. ระบบชำระเงิน (Payment System)

```json
{
  "payment": {
    "title": "ชำระเงิน / Payment / 支払い",
    "subtitle": "เลือกวิธีการชำระเงิน / Choose payment method / 支払い方法を選択",
    "methods": {
      "creditCard": "บัตรเครดิต / Credit Card / クレジットカード",
      "debitCard": "บัตรเดบิต / Debit Card / デビットカード",
      "bankTransfer": "โอนเงินผ่านธนาคาร / Bank Transfer / 銀行振込",
      "promptpay": "พร้อมเพย์ / PromptPay / プロンプトペイ",
      "truewallet": "ทรูวอลเล็ท / TrueWallet / トゥルーウォレット"
    },
    "form": {
      "cardNumber": "หมายเลขบัตร / Card Number / カード番号",
      "cardHolder": "ชื่อบนบัตร / Card Holder / カード名義",
      "expiryDate": "วันหมดอายุ / Expiry Date / 有効期限",
      "cvv": "รหัส CVV / CVV Code / CVVコード"
    },
    "summary": {
      "title": "สรุปการชำระเงิน / Payment Summary / 支払い概要",
      "subtotal": "ยอดรวม / Subtotal / 小計",
      "discount": "ส่วนลด / Discount / 割引",
      "tax": "ภาษี / Tax / 税金",
      "total": "ยอดรวมทั้งหมด / Total / 合計"
    },
    "buttons": {
      "pay": "ชำระเงิน / Pay Now / 今すぐ支払う",
      "cancel": "ยกเลิก / Cancel / キャンセル"
    },
    "messages": {
      "processing": "กำลังดำเนินการชำระเงิน... / Processing payment... / 支払いを処理中...",
      "success": "ชำระเงินสำเร็จ / Payment successful / 支払いに成功しました",
      "failed": "ชำระเงินไม่สำเร็จ / Payment failed / 支払いに失敗しました",
      "verifying": "กำลังตรวจสอบ... / Verifying... / 確認中..."
    },
    "status": {
      "pending": "รอชำระ / Pending / 支払い待ち",
      "processing": "กำลังดำเนินการ / Processing / 処理中",
      "completed": "ชำระแล้ว / Completed / 支払い済み",
      "failed": "ล้มเหลว / Failed / 失敗",
      "refunded": "คืนเงินแล้ว / Refunded / 返金済み"
    }
  }
}
```

### 7. โปรไฟล์ผู้ใช้ (User Profile)

```json
{
  "profile": {
    "title": "โปรไฟล์ / Profile / プロフィール",
    "subtitle": "จัดการข้อมูลส่วนตัวของคุณ / Manage your personal information / 個人情報を管理",
    "tabs": {
      "overview": "ภาพรวม / Overview / 概要",
      "personalInfo": "ข้อมูลส่วนตัว / Personal Info / 個人情報",
      "security": "ความปลอดภัย / Security / セキュリティ",
      "notifications": "การแจ้งเตือน / Notifications / 通知",
      "preferences": "การตั้งค่า / Preferences / 設定"
    },
    "personalInfo": {
      "firstName": "ชื่อ / First Name / 名",
      "lastName": "นามสกุล / Last Name / 姓",
      "email": "อีเมล / Email / メール",
      "phone": "เบอร์โทรศัพท์ / Phone / 電話番号",
      "birthDate": "วันเกิด / Birth Date / 生年月日",
      "gender": "เพศ / Gender / 性別",
      "address": "ที่อยู่ / Address / 住所"
    },
    "security": {
      "changePassword": "เปลี่ยนรหัสผ่าน / Change Password / パスワード変更",
      "currentPassword": "รหัสผ่านปัจจุบัน / Current Password / 現在のパスワード",
      "newPassword": "รหัสผ่านใหม่ / New Password / 新しいパスワード",
      "confirmPassword": "ยืนยันรหัสผ่าน / Confirm Password / パスワード確認",
      "twoFactor": "การยืนยันตัวตนแบบ 2 ขั้นตอน / Two-Factor Authentication / 二段階認証"
    },
    "buttons": {
      "save": "บันทึก / Save / 保存",
      "cancel": "ยกเลิก / Cancel / キャンセル",
      "edit": "แก้ไข / Edit / 編集",
      "upload": "อัปโหลดรูปภาพ / Upload Photo / 写真をアップロード"
    },
    "messages": {
      "saving": "กำลังบันทึก... / Saving... / 保存中...",
      "success": "บันทึกสำเร็จ / Saved successfully / 保存に成功しました",
      "error": "เกิดข้อผิดพลาด / Error occurred / エラーが発生しました"
    }
  }
}
```

### 8. รีวิวและคะแนน (Reviews & Ratings)

```json
{
  "reviews": {
    "title": "รีวิวและคะแนน / Reviews & Ratings / レビューと評価",
    "subtitle": "ดูรีวิวจากผู้ใช้จริง / See reviews from real users / 実際のユーザーからのレビューを見る",
    "rating": {
      "average": "คะแนนเฉลี่ย / Average Rating / 平均評価",
      "totalReviews": "รีวิวทั้งหมด / Total Reviews / 総レビュー数",
      "stars": "ดาว / Stars / スター"
    },
    "form": {
      "title": "เขียนรีวิว / Write a Review / レビューを書く",
      "rating": "ให้คะแนน / Rating / 評価",
      "comment": "ความคิดเห็น / Comment / コメント",
      "placeholder": "แชร์ประสบการณ์ของคุณ... / Share your experience... / あなたの体験をシェア..."
    },
    "buttons": {
      "submit": "ส่งรีวิว / Submit Review / レビューを送信",
      "edit": "แก้ไข / Edit / 編集",
      "delete": "ลบ / Delete / 削除"
    },
    "filters": {
      "all": "ทั้งหมด / All / すべて",
      "newest": "ล่าสุด / Newest / 最新",
      "highest": "คะแนนสูงสุด / Highest Rated / 最高評価",
      "lowest": "คะแนนต่ำสุด / Lowest Rated / 最低評価"
    },
    "messages": {
      "loading": "กำลังโหลดรีวิว... / Loading reviews... / レビューを読み込み中...",
      "submitting": "กำลังส่งรีวิว... / Submitting review... / レビューを送信中...",
      "success": "ส่งรีวิวสำเร็จ / Review submitted successfully / レビューの送信に成功しました",
      "error": "ส่งรีวิวไม่สำเร็จ / Failed to submit review / レビューの送信に失敗しました",
      "noReviews": "ยังไม่มีรีวิว / No reviews yet / まだレビューがありません"
    }
  }
}
```

---

## Template ตามบทบาทผู้ใช้ (Role-based)

### 9. แดชบอร์ดผู้ดูแล (Admin Dashboard)

```json
{
  "admin": {
    "dashboard": {
      "title": "แดชบอร์ดผู้ดูแล / Admin Dashboard / 管理者ダッシュボード",
      "stats": {
        "totalUsers": "ผู้ใช้ทั้งหมด / Total Users / 総ユーザー数",
        "activeUsers": "ผู้ใช้ที่ใช้งาน / Active Users / アクティブユーザー",
        "totalBookings": "การจองทั้งหมด / Total Bookings / 総予約数",
        "revenue": "รายได้ / Revenue / 収益"
      }
    },
    "users": {
      "title": "จัดการผู้ใช้ / Manage Users / ユーザー管理",
      "actions": {
        "view": "ดู / View / 表示",
        "edit": "แก้ไข / Edit / 編集",
        "delete": "ลบ / Delete / 削除",
        "activate": "เปิดใช้งาน / Activate / 有効化",
        "deactivate": "ปิดใช้งาน / Deactivate / 無効化"
      }
    },
    "content": {
      "title": "จัดการเนื้อหา / Manage Content / コンテンツ管理",
      "create": "สร้าง / Create / 作成",
      "update": "อัปเดต / Update / 更新",
      "publish": "เผยแพร่ / Publish / 公開",
      "unpublish": "ยกเลิกการเผยแพร่ / Unpublish / 非公開"
    }
  }
}
```

### 10. แดชบอร์ดสมาชิก (Member Dashboard)

```json
{
  "member": {
    "dashboard": {
      "title": "แดชบอร์ดของฉัน / My Dashboard / マイダッシュボード",
      "welcome": "ยินดีต้อนรับ, {name} / Welcome, {name} / ようこそ, {name}",
      "quickActions": {
        "bookClass": "จองคลาส / Book a Class / クラスを予約",
        "viewSchedule": "ดูตารางเวลา / View Schedule / スケジュールを見る",
        "myBookings": "การจองของฉัน / My Bookings / マイ予約",
        "myProgress": "ความก้าวหน้า / My Progress / 進捗状況"
      }
    },
    "bookings": {
      "title": "การจองของฉัน / My Bookings / マイ予約",
      "upcoming": "กำลังจะมาถึง / Upcoming / 今後の予約",
      "past": "ที่ผ่านมา / Past / 過去の予約",
      "cancelled": "ยกเลิกแล้ว / Cancelled / キャンセル済み"
    },
    "progress": {
      "title": "ความก้าวหน้า / My Progress / 進捗状況",
      "totalSessions": "เซสชันทั้งหมด / Total Sessions / 総セッション数",
      "hoursTraining": "ชั่วโมงฝึก / Hours Training / トレーニング時間",
      "achievements": "ความสำเร็จ / Achievements / 達成"
    }
  }
}
```

---

## คำศัพท์ที่ใช้บ่อย (Common Vocabulary)

### เวลาและวันที่
```json
{
  "time": {
    "today": "วันนี้ / Today / 今日",
    "tomorrow": "พรุ่งนี้ / Tomorrow / 明日",
    "yesterday": "เมื่อวาน / Yesterday / 昨日",
    "thisWeek": "สัปดาห์นี้ / This Week / 今週",
    "thisMonth": "เดือนนี้ / This Month / 今月",
    "thisYear": "ปีนี้ / This Year / 今年"
  }
}
```

### หน่วยนับ
```json
{
  "units": {
    "piece": "ชิ้น / piece / 個",
    "hour": "ชั่วโมง / hour / 時間",
    "day": "วัน / day / 日",
    "week": "สัปดาห์ / week / 週",
    "month": "เดือน / month / 月",
    "year": "ปี / year / 年",
    "person": "คน / person / 人",
    "baht": "บาท / baht / バーツ"
  }
}
```

### ข้อความตอบกลับทั่วไป
```json
{
  "responses": {
    "yes": "ใช่ / Yes / はい",
    "no": "ไม่ / No / いいえ",
    "ok": "ตกลง / OK / OK",
    "thanks": "ขอบคุณ / Thank you / ありがとう",
    "sorry": "ขออภัย / Sorry / ごめんなさい",
    "pleaseWait": "กรุณารอสักครู่ / Please wait / お待ちください"
  }
}
```

---

## เคล็ดลับในการแปล

### สำหรับภาษาไทย
- ใช้คำที่สุภาพและเป็นทางการ
- หลีกเลี่ยงคำศัพท์ที่ยาวเกินไป
- ใช้คำที่เข้าใจง่ายและชัดเจน

### สำหรับภาษาอังกฤษ
- ใช้คำที่กระชับและตรงประเด็น
- หลีกเลี่ยง jargon ที่ซับซ้อน
- ใช้ active voice

### สำหรับภาษาญี่ปุ่น
- ใช้ระดับความสุภาพที่เหมาะสม (です/ます form)
- ใช้คำที่เข้าใจง่ายสำหรับผู้ใช้ทั่วไป
- หลีกเลี่ยงคำที่เป็นทางการหรือแข็งเกินไป

---

## Checklist ก่อนเพิ่มคำแปลใหม่

- [ ] ตรวจสอบว่าไม่มี key ซ้ำอยู่แล้ว
- [ ] เพิ่ม key เดียวกันในทั้ง 3 ไฟล์ (th.json, en.json, jp.json)
- [ ] ตรวจสอบ JSON syntax ให้ถูกต้อง (comma, brackets)
- [ ] ตรวจสอบ structure ให้สอดคล้องกันในทั้ง 3 ไฟล์
- [ ] ใช้คำที่เหมาะสมและเป็นธรรมชาติในแต่ละภาษา
- [ ] รัน validation script: `node scripts/validate-i18n.js`
- [ ] ทดสอบในแอปพลิเคชันจริง
- [ ] Commit และ push การเปลี่ยนแปลง

---

## ตัวอย่างการใช้งาน

### ก่อนเพิ่ม - ตรวจสอบไฟล์ปัจจุบัน
```bash
# ดูโครงสร้างไฟล์
cat messages/th.json | jq 'keys'

# ค้นหา key ที่มีอยู่
cat messages/th.json | jq '.navigation'
```

### เพิ่มคำแปลใหม่
```bash
# 1. แก้ไขไฟล์ทั้ง 3
nano messages/th.json
nano messages/en.json
nano messages/jp.json

# 2. ตรวจสอบ JSON syntax
cat messages/th.json | jq . > /dev/null && echo "✓ TH OK"
cat messages/en.json | jq . > /dev/null && echo "✓ EN OK"
cat messages/jp.json | jq . > /dev/null && echo "✓ JP OK"

# 3. รัน validation script
node scripts/validate-i18n.js
```

### หลังเพิ่ม - Commit
```bash
git add messages/
git commit -m "Add translations for [feature name]"
git push
```

---

## แหล่งข้อมูลเพิ่มเติม

- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [I18N_STRUCTURE.md](./I18N_STRUCTURE.md) - โครงสร้างและคู่มือหลัก
- `src/i18n.ts` - ไฟล์คอนฟิก
- `scripts/validate-i18n.js` - สคริปต์ตรวจสอบ
