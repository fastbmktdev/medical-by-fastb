/**
 * Email Templates
 * HTML templates for various email types
 */

/**
 * Base email template wrapper
 */
function getBaseEmailTemplate(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>MUAYTHAI Platform</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; background: white;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🥊 MUAYTHAI Platform</h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            ${content}
          </div>
          
          <!-- Footer -->
          <div style="background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
              <strong>MUAYTHAI Platform</strong>
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              อีเมลนี้ถูกส่งอัตโนมัติจากระบบ กรุณาอย่าตอบกลับอีเมลนี้
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Format date in Thai locale
 */
function formatThaiDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Bangkok',
  });
}

/**
 * Format datetime in Thai locale
 */
function formatThaiDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Bangkok',
  });
}

/**
 * Format currency
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Booking Confirmation Email Template
 */
export function generateBookingConfirmationHtml(data: {
  customerName: string;
  bookingNumber: string;
  gymName: string;
  packageName: string;
  packageType: 'one_time' | 'package';
  startDate: string;
  endDate?: string | null;
  pricePaid: number;
  customerPhone?: string;
  specialRequests?: string;
  bookingUrl?: string;
}): string {
  const {
    customerName,
    bookingNumber,
    gymName,
    packageName,
    packageType,
    startDate,
    endDate,
    pricePaid,
    customerPhone,
    specialRequests,
    bookingUrl,
  } = data;

  const isOneTime = packageType === 'one_time';
  const bookingDateRange = isOneTime
    ? formatThaiDate(startDate)
    : `${formatThaiDate(startDate)} - ${endDate ? formatThaiDate(endDate) : ''}`;

  const content = `
    <h2 style="color: #dc2626; margin-top: 0; font-size: 24px;">ยืนยันการจองสำเร็จ! 🎉</h2>
    
    <p style="font-size: 16px; color: #374151;">สวัสดี <strong>${customerName}</strong></p>
    
    <p style="color: #1f2937;">เราขอขอบคุณที่เลือกใช้บริการของเรา การจองของคุณได้รับการยืนยันแล้ว</p>
    
    <!-- Booking Details -->
    <div style="background: #f9fafb; border-radius: 8px; padding: 24px; margin: 24px 0; border-left: 4px solid #dc2626;">
      <h3 style="color: #dc2626; margin-top: 0; font-size: 18px;">รายละเอียดการจอง</h3>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; width: 40%;">หมายเลขการจอง:</td>
          <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${bookingNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">ค่ายมวย:</td>
          <td style="padding: 8px 0; color: #1f2937;">${gymName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">แพ็คเกจ:</td>
          <td style="padding: 8px 0; color: #1f2937;">${packageName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">วันที่:</td>
          <td style="padding: 8px 0; color: #1f2937;">${bookingDateRange}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">ยอดชำระ:</td>
          <td style="padding: 8px 0; color: #059669; font-weight: 600; font-size: 18px;">${formatCurrency(pricePaid)}</td>
        </tr>
        ${customerPhone ? `
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">เบอร์โทร:</td>
          <td style="padding: 8px 0; color: #1f2937;">${customerPhone}</td>
        </tr>
        ` : ''}
      </table>
      
      ${specialRequests ? `
      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;"><strong>คำขอพิเศษ:</strong></p>
        <p style="margin: 0; color: #1f2937; white-space: pre-wrap;">${specialRequests}</p>
      </div>
      ` : ''}
    </div>
    
    <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <p style="margin: 0; color: #92400e; font-size: 14px;">
        <strong>⚠️ หมายเหตุ:</strong> กรุณามาให้ตรงเวลา และเตรียมเอกสารยืนยันตัวตน (บัตรประชาชน หรือ passport) มาแสดงเมื่อเช็คอิน
      </p>
    </div>
    
    ${bookingUrl ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${bookingUrl}" style="display: inline-block; background: #dc2626; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        ดูรายละเอียดการจอง
      </a>
    </div>
    ` : ''}
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      หากมีคำถามหรือต้องการยกเลิกการจอง กรุณาติดต่อเราที่ <a href="mailto:support@muaythai.com" style="color: #dc2626;">support@muaythai.com</a>
    </p>
  `;

  return getBaseEmailTemplate(content);
}

/**
 * Payment Receipt Email Template
 */
export function generatePaymentReceiptHtml(data: {
  customerName: string;
  transactionNumber: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  items: Array<{
    description: string;
    quantity?: number;
    amount: number;
  }>;
  receiptUrl?: string;
}): string {
  const {
    customerName,
    transactionNumber,
    amount,
    paymentMethod,
    paymentDate,
    items,
    receiptUrl,
  } = data;

  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${item.description}${item.quantity ? ` x${item.quantity}` : ''}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #1f2937;">${formatCurrency(item.amount)}</td>
      </tr>
    `
    )
    .join('');

  const content = `
    <h2 style="color: #dc2626; margin-top: 0; font-size: 24px;">ใบเสร็จการชำระเงิน ✅</h2>
    
    <p style="font-size: 16px; color: #374151;">สวัสดี <strong>${customerName}</strong></p>
    
    <p style="color: #1f2937;">ขอบคุณสำหรับการชำระเงินของคุณ ใบเสร็จของคุณพร้อมแล้ว</p>
    
    <!-- Receipt Details -->
    <div style="background: #f9fafb; border-radius: 8px; padding: 24px; margin: 24px 0; border-left: 4px solid #10b981;">
      <h3 style="color: #059669; margin-top: 0; font-size: 18px;">รายละเอียดการชำระเงิน</h3>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; width: 40%;">หมายเลขรายการ:</td>
          <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${transactionNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">วันที่ชำระ:</td>
          <td style="padding: 8px 0; color: #1f2937;">${formatThaiDateTime(paymentDate)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">วิธีการชำระ:</td>
          <td style="padding: 8px 0; color: #1f2937;">${paymentMethod}</td>
        </tr>
      </table>
      
      <div style="border-top: 2px solid #e5e7eb; margin-top: 16px; padding-top: 16px;">
        <table style="width: 100%; border-collapse: collapse;">
          ${itemsHtml}
          <tr>
            <td style="padding: 16px 12px 12px 12px; font-weight: 600; color: #1f2937; font-size: 16px;">รวมทั้งสิ้น</td>
            <td style="padding: 16px 12px 12px 12px; text-align: right; font-weight: 700; color: #059669; font-size: 20px;">${formatCurrency(amount)}</td>
          </tr>
        </table>
      </div>
    </div>
    
    ${receiptUrl ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${receiptUrl}" style="display: inline-block; background: #059669; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        ดาวน์โหลดใบเสร็จ (PDF)
      </a>
    </div>
    ` : ''}
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      ใบเสร็จนี้สามารถใช้เป็นหลักฐานการชำระเงินได้ หากมีคำถามกรุณาติดต่อ <a href="mailto:support@muaythai.com" style="color: #dc2626;">support@muaythai.com</a>
    </p>
  `;

  return getBaseEmailTemplate(content);
}

/**
 * Booking Reminder Email Template
 */
export function generateBookingReminderHtml(data: {
  customerName: string;
  bookingNumber: string;
  gymName: string;
  packageName: string;
  startDate: string;
  startTime?: string;
  gymAddress?: string;
  gymPhone?: string;
  bookingUrl?: string;
}): string {
  const {
    customerName,
    bookingNumber,
    gymName,
    packageName,
    startDate,
    startTime,
    gymAddress,
    gymPhone,
    bookingUrl,
  } = data;

  const content = `
    <h2 style="color: #dc2626; margin-top: 0; font-size: 24px;">📅 เตือนความจำ: การจองของคุณจะเริ่มในอีก 1 วัน</h2>
    
    <p style="font-size: 16px; color: #374151;">สวัสดี <strong>${customerName}</strong></p>
    
    <p style="color: #1f2937;">เราต้องการเตือนคุณว่า การจองของคุณจะเริ่มในวันที่ <strong>${formatThaiDate(startDate)}</strong></p>
    
    <!-- Booking Details -->
    <div style="background: #fef3c7; border-radius: 8px; padding: 24px; margin: 24px 0; border-left: 4px solid #f59e0b;">
      <h3 style="color: #92400e; margin-top: 0; font-size: 18px;">รายละเอียดการจอง</h3>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #78350f; width: 40%;">หมายเลขการจอง:</td>
          <td style="padding: 8px 0; color: #78350f; font-weight: 600;">${bookingNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #78350f;">ค่ายมวย:</td>
          <td style="padding: 8px 0; color: #78350f;">${gymName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #78350f;">แพ็คเกจ:</td>
          <td style="padding: 8px 0; color: #78350f;">${packageName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #78350f;">วันที่เริ่ม:</td>
          <td style="padding: 8px 0; color: #78350f; font-weight: 600;">${formatThaiDate(startDate)}${startTime ? ` เวลา ${startTime} น.` : ''}</td>
        </tr>
        ${gymAddress ? `
        <tr>
          <td style="padding: 8px 0; color: #78350f;">ที่อยู่:</td>
          <td style="padding: 8px 0; color: #78350f;">${gymAddress}</td>
        </tr>
        ` : ''}
        ${gymPhone ? `
        <tr>
          <td style="padding: 8px 0; color: #78350f;">เบอร์โทร:</td>
          <td style="padding: 8px 0; color: #78350f;"><a href="tel:${gymPhone}" style="color: #78350f;">${gymPhone}</a></td>
        </tr>
        ` : ''}
      </table>
    </div>
    
    <div style="background: #dbeafe; border: 1px solid #3b82f6; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <p style="margin: 0; color: #1e40af; font-size: 14px;">
        <strong>💡 คำแนะนำ:</strong>
      </p>
      <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #1e40af; font-size: 14px;">
        <li>เตรียมเอกสารยืนยันตัวตน (บัตรประชาชน หรือ passport)</li>
        <li>มาให้ตรงเวลาเพื่อให้การเช็คอินเป็นไปอย่างรวดเร็ว</li>
        <li>สวมใส่เสื้อผ้าที่เหมาะสมสำหรับการฝึกซ้อม</li>
        ${gymPhone ? `<li>หากมีคำถามกรุณาติดต่อค่ายมวยที่ ${gymPhone}</li>` : ''}
      </ul>
    </div>
    
    ${bookingUrl ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${bookingUrl}" style="display: inline-block; background: #dc2626; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        ดูรายละเอียดการจอง
      </a>
    </div>
    ` : ''}
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      หากต้องการยกเลิกหรือเปลี่ยนแปลงการจอง กรุณาติดต่อเราทันทีที่ <a href="mailto:support@muaythai.com" style="color: #dc2626;">support@muaythai.com</a>
    </p>
  `;

  return getBaseEmailTemplate(content);
}

/**
 * Payment Failed Email Template
 */
export function generatePaymentFailedHtml(data: {
  customerName: string;
  transactionNumber: string;
  amount: number;
  paymentMethod: string;
  failureReason?: string;
  retryUrl?: string;
  supportEmail?: string;
}): string {
  const {
    customerName,
    transactionNumber,
    amount,
    paymentMethod,
    failureReason,
    retryUrl,
    supportEmail = 'support@muaythai.com',
  } = data;

  const content = `
    <h2 style="color: #dc2626; margin-top: 0; font-size: 24px;">❌ การชำระเงินไม่สำเร็จ</h2>
    
    <p style="font-size: 16px; color: #374151;">สวัสดี <strong>${customerName}</strong></p>
    
    <p style="color: #1f2937;">เราพบว่าการชำระเงินของคุณไม่สำเร็จ กรุณาตรวจสอบและลองใหม่อีกครั้ง</p>
    
    <!-- Payment Details -->
    <div style="background: #fee2e2; border-radius: 8px; padding: 24px; margin: 24px 0; border-left: 4px solid #dc2626;">
      <h3 style="color: #991b1b; margin-top: 0; font-size: 18px;">รายละเอียดการชำระเงิน</h3>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #7f1d1d; width: 40%;">หมายเลขรายการ:</td>
          <td style="padding: 8px 0; color: #7f1d1d; font-weight: 600;">${transactionNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #7f1d1d;">จำนวนเงิน:</td>
          <td style="padding: 8px 0; color: #7f1d1d; font-weight: 600;">${formatCurrency(amount)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #7f1d1d;">วิธีการชำระ:</td>
          <td style="padding: 8px 0; color: #7f1d1d;">${paymentMethod}</td>
        </tr>
        ${failureReason ? `
        <tr>
          <td style="padding: 8px 0; color: #7f1d1d;">สาเหตุ:</td>
          <td style="padding: 8px 0; color: #7f1d1d;">${failureReason}</td>
        </tr>
        ` : ''}
      </table>
    </div>
    
    <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <p style="margin: 0; color: #92400e; font-size: 14px;">
        <strong>💡 สาเหตุที่พบบ่อย:</strong>
      </p>
      <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #92400e; font-size: 14px;">
        <li>เงินในบัญชีไม่เพียงพอ</li>
        <li>บัตรเครดิต/เดบิตหมดอายุ</li>
        <li>ข้อมูลการชำระเงินไม่ถูกต้อง</li>
        <li>ข้อจำกัดจากธนาคารหรือผู้ให้บริการบัตร</li>
      </ul>
    </div>
    
    ${retryUrl ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${retryUrl}" style="display: inline-block; background: #dc2626; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        ลองชำระเงินอีกครั้ง
      </a>
    </div>
    ` : ''}
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      หากยังคงมีปัญหา กรุณาติดต่อฝ่ายสนับสนุนที่ <a href="mailto:${supportEmail}" style="color: #dc2626;">${supportEmail}</a> หรือโทรหาเราที่หมายเลข <strong>02-XXX-XXXX</strong>
    </p>
  `;

  return getBaseEmailTemplate(content);
}

/**
 * Partner Approval Email Template
 */
export function generatePartnerApprovalHtml(data: {
  partnerName: string;
  gymName: string;
  approvalDate: string;
  dashboardUrl?: string;
}): string {
  const { partnerName, gymName, approvalDate, dashboardUrl } = data;

  const content = `
    <h2 style="color: #059669; margin-top: 0; font-size: 24px;">🎉 ยินดีด้วย! การสมัครค่ายมวยของคุณได้รับการอนุมัติ</h2>
    
    <p style="font-size: 16px; color: #374151;">สวัสดี <strong>${partnerName}</strong></p>
    
    <p style="color: #1f2937;">เรามีข่าวดี! การสมัครค่ายมวย <strong>${gymName}</strong> ของคุณได้รับการอนุมัติแล้วเมื่อวันที่ ${formatThaiDate(approvalDate)}</p>
    
    <div style="background: #d1fae5; border-radius: 8px; padding: 24px; margin: 24px 0; border-left: 4px solid #059669;">
      <h3 style="color: #065f46; margin-top: 0; font-size: 18px;">ขั้นตอนถัดไป</h3>
      
      <ol style="margin: 0; padding-left: 20px; color: #065f46; line-height: 2;">
        <li>เข้าสู่ระบบเพื่อเข้าถึง Partner Dashboard</li>
        <li>เพิ่มแพ็คเกจและบริการต่างๆ ของค่ายมวย</li>
        <li>อัพโหลดรูปภาพเพิ่มเติมเพื่อดึงดูดลูกค้า</li>
        <li>เริ่มรับการจองจากลูกค้า!</li>
      </ol>
    </div>
    
    ${dashboardUrl ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${dashboardUrl}" style="display: inline-block; background: #059669; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        เข้าสู่ Partner Dashboard
      </a>
    </div>
    ` : ''}
    
    <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <p style="margin: 0; color: #92400e; font-size: 14px;">
        <strong>💡 เคล็ดลับ:</strong> เพิ่มแพ็คเกจและข้อมูลค่ายมวยให้ครบถ้วนจะช่วยให้ลูกค้าค้นพบคุณได้ง่ายขึ้น และเพิ่มโอกาสในการได้รับการจอง
      </p>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      หากมีคำถามหรือต้องการความช่วยเหลือในการตั้งค่า กรุณาติดต่อทีมสนับสนุนที่ <a href="mailto:partners@muaythai.com" style="color: #dc2626;">partners@muaythai.com</a>
    </p>
  `;

  return getBaseEmailTemplate(content);
}

/**
 * Partner Rejection Email Template
 */
export function generatePartnerRejectionHtml(data: {
  partnerName: string;
  gymName: string;
  rejectionReason?: string;
  reapplyUrl?: string;
  supportEmail?: string;
}): string {
  const {
    partnerName,
    gymName,
    rejectionReason,
    reapplyUrl,
    supportEmail = 'support@muaythai.com',
  } = data;

  const content = `
    <h2 style="color: #dc2626; margin-top: 0; font-size: 24px;">ขออภัย: การสมัครค่ายมวยของคุณยังไม่ได้รับการอนุมัติ</h2>
    
    <p style="font-size: 16px; color: #374151;">สวัสดี <strong>${partnerName}</strong></p>
    
    <p style="color: #1f2937;">เราขอขอบคุณที่สนใจเข้าร่วมเป็น Partner กับเรา อย่างไรก็ตาม หลังจากการตรวจสอบแล้ว การสมัครค่ายมวย <strong>${gymName}</strong> ของคุณยังไม่ผ่านเกณฑ์การอนุมัติในครั้งนี้</p>
    
    ${rejectionReason ? `
    <div style="background: #fee2e2; border-radius: 8px; padding: 24px; margin: 24px 0; border-left: 4px solid #dc2626;">
      <h3 style="color: #991b1b; margin-top: 0; font-size: 18px;">เหตุผล</h3>
      <p style="color: #7f1d1d; margin: 0; white-space: pre-wrap;">${rejectionReason}</p>
    </div>
    ` : ''}
    
    <div style="background: #dbeafe; border: 1px solid #3b82f6; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <p style="margin: 0; color: #1e40af; font-size: 14px;">
        <strong>💡 ข้อเสนอแนะ:</strong>
      </p>
      <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #1e40af; font-size: 14px;">
        <li>ตรวจสอบให้แน่ใจว่าข้อมูลที่ส่งครบถ้วนและถูกต้อง</li>
        <li>แนบเอกสารที่จำเป็นครบถ้วน</li>
        <li>อัพโหลดรูปภาพที่ชัดเจนของค่ายมวย</li>
        <li>ตรวจสอบว่าเบอร์โทรศัพท์และอีเมลสามารถติดต่อได้</li>
      </ul>
    </div>
    
    ${reapplyUrl ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${reapplyUrl}" style="display: inline-block; background: #dc2626; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        สมัครใหม่
      </a>
    </div>
    ` : ''}
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      หากคุณมีคำถามหรือต้องการข้อมูลเพิ่มเติมเกี่ยวกับเกณฑ์การอนุมัติ กรุณาติดต่อทีมสนับสนุนที่ <a href="mailto:${supportEmail}" style="color: #dc2626;">${supportEmail}</a>
    </p>
  `;

  return getBaseEmailTemplate(content);
}

/**
 * Admin Alert Email Template (generic)
 */
export function generateAdminAlertHtml(data: {
  alertType: string;
  title: string;
  message: string;
  details?: Record<string, any>;
  actionUrl?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}): string {
  const {
    alertType,
    title,
    message,
    details,
    actionUrl,
    priority = 'medium',
  } = data;

  const priorityColors = {
    low: '#6b7280',
    medium: '#3b82f6',
    high: '#f59e0b',
    critical: '#dc2626',
  };

  const priorityLabels = {
    low: 'ต่ำ',
    medium: 'ปานกลาง',
    high: 'สูง',
    critical: 'ด่วน',
  };

  const detailsHtml = details
    ? Object.entries(details)
        .map(
          ([key, value]) => `
        <tr>
          <td style="padding: 8px 0; color: #6b7280; width: 40%;">${key}:</td>
          <td style="padding: 8px 0; color: #1f2937;">${typeof value === 'object' ? JSON.stringify(value) : String(value)}</td>
        </tr>
      `
        )
        .join('')
    : '';

  const content = `
    <h2 style="color: ${priorityColors[priority]}; margin-top: 0; font-size: 24px;">🚨 แจ้งเตือนระบบ: ${title}</h2>
    
    <div style="background: ${priority === 'critical' ? '#fee2e2' : priority === 'high' ? '#fef3c7' : '#dbeafe'}; border-radius: 8px; padding: 16px; margin: 16px 0; border-left: 4px solid ${priorityColors[priority]};">
      <p style="margin: 0; color: #1f2937;">
        <strong>ประเภท:</strong> ${alertType}<br>
        <strong>ระดับความสำคัญ:</strong> <span style="color: ${priorityColors[priority]}; font-weight: 600;">${priorityLabels[priority]}</span>
      </p>
    </div>
    
    <p style="color: #1f2937; font-size: 16px; margin: 24px 0;">${message}</p>
    
    ${detailsHtml ? `
    <div style="background: #f9fafb; border-radius: 8px; padding: 24px; margin: 24px 0; border-left: 4px solid ${priorityColors[priority]};">
      <h3 style="color: ${priorityColors[priority]}; margin-top: 0; font-size: 18px;">รายละเอียด</h3>
      <table style="width: 100%; border-collapse: collapse;">
        ${detailsHtml}
      </table>
    </div>
    ` : ''}
    
    ${actionUrl ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${actionUrl}" style="display: inline-block; background: ${priorityColors[priority]}; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        ดูรายละเอียด / ดำเนินการ
      </a>
    </div>
    ` : ''}
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      กรุณาตรวจสอบและดำเนินการตามความเหมาะสม
    </p>
  `;

  return getBaseEmailTemplate(content);
}

