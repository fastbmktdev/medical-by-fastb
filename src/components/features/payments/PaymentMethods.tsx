'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CheckoutForm from './CheckoutForm';
import { 
  CreditCardIcon, 
  BanknotesIcon, 
  DevicePhoneMobileIcon,
  QrCodeIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface PaymentMethodsProps {
  amount: number;
  paymentType: 'gym_booking' | 'product' | 'ticket';
  metadata: Record<string, string>;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
}

type PaymentMethod = 'stripe' | 'bank_transfer' | 'promptpay' | 'onsite';

export default function PaymentMethods({
  amount,
  paymentType,
  metadata,
  onSuccess,
  onError,
}: PaymentMethodsProps) {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const paymentMethods = [
    {
      id: 'stripe' as PaymentMethod,
      name: 'บัตรเครดิต/เดบิต',
      description: 'Visa, Mastercard, JCB, UnionPay',
      icon: CreditCardIcon,
      available: true,
      features: ['ปลอดภัย', 'รวดเร็ว', 'รองรับทุกธนาคาร'],
    },
    {
      id: 'promptpay' as PaymentMethod,
      name: 'พร้อมเพย์',
      description: 'QR Code หรือเบอร์โทรศัพท์',
      icon: QrCodeIcon,
      available: true,
      features: ['สะดวก', 'ไม่ต้องใช้บัตร', 'QR Code'],
    },
    {
      id: 'bank_transfer' as PaymentMethod,
      name: 'โอนเงินผ่านธนาคาร',
      description: 'โอนเงินผ่านธนาคารต่างๆ',
      icon: BanknotesIcon,
      available: true,
      features: ['ไม่มีค่าธรรมเนียม', 'ปลอดภัย', 'โอนได้ทุกธนาคาร'],
    },
    {
      id: 'onsite' as PaymentMethod,
      name: 'ชำระเงินที่ค่ายมวย',
      description: 'ชำระเงินด้วยเงินสดที่ค่ายมวย',
      icon: DevicePhoneMobileIcon,
      available: paymentType === 'gym_booking',
      features: ['ไม่มีค่าธรรมเนียม', 'ชำระเงินสด', 'รับบริการทันที'],
    },
  ];

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
  };

  const handleStripePayment = async () => {
    setIsProcessing(true);
    try {
      // Stripe payment will be handled by CheckoutForm component
      // This is just for UI state management
    } catch (error) {
      onError('เกิดข้อผิดพลาดในการชำระเงิน');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBankTransfer = async () => {
    setIsProcessing(true);
    try {
      // Generate bank transfer information
      const bankInfo = {
        bank: 'ธนาคารกสิกรไทย',
        accountNumber: '1234567890',
        accountName: 'ค่ายมวยไทย',
        amount: amount,
        reference: `MT-${Date.now()}`,
      };

      // Store bank transfer info in session storage
      sessionStorage.setItem('bankTransferInfo', JSON.stringify(bankInfo));
      
      // Redirect to bank transfer confirmation page
      router.push('/payment/bank-transfer');
    } catch (error) {
      onError('เกิดข้อผิดพลาดในการสร้างข้อมูลโอนเงิน');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePromptPay = async () => {
    setIsProcessing(true);
    try {
      // Generate PromptPay QR code
      const promptPayInfo = {
        phoneNumber: '0812345678',
        amount: amount,
        reference: `MT-${Date.now()}`,
      };

      // Store PromptPay info in session storage
      sessionStorage.setItem('promptPayInfo', JSON.stringify(promptPayInfo));
      
      // Redirect to PromptPay page
      router.push('/payment/promptpay');
    } catch (error) {
      onError('เกิดข้อผิดพลาดในการสร้าง QR Code');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOnsitePayment = async () => {
    setIsProcessing(true);
    try {
      // Create onsite payment record
      const response = await fetch('/api/payments/create-onsite-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          paymentType,
          metadata,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create onsite payment');
      }

      const result = await response.json();
      onSuccess(result.paymentId);
    } catch (error) {
      onError('เกิดข้อผิดพลาดในการสร้างการชำระเงินที่ค่ายมวย');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSubmit = () => {
    if (!selectedMethod) return;

    switch (selectedMethod) {
      case 'stripe':
        handleStripePayment();
        break;
      case 'bank_transfer':
        handleBankTransfer();
        break;
      case 'promptpay':
        handlePromptPay();
        break;
      case 'onsite':
        handleOnsitePayment();
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Payment Method Selection */}
      {!selectedMethod && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">เลือกวิธีการชำระเงิน</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                onClick={() => method.available && handleMethodSelect(method.id)}
                className={`p-6 rounded-lg border cursor-pointer transition-all ${
                  method.available
                    ? 'border-zinc-600 hover:border-red-500 bg-zinc-700 hover:bg-zinc-600'
                    : 'border-zinc-700 bg-zinc-800 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-start gap-4">
                  <method.icon className="w-8 h-8 text-red-500 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-white mb-1">{method.name}</h4>
                    <p className="text-zinc-400 text-sm mb-3">{method.description}</p>
                    {method.available && (
                      <div className="flex flex-wrap gap-2">
                        {method.features.map((feature, index) => (
                          <span
                            key={index}
                            className="bg-red-600/20 text-red-400 text-xs px-2 py-1 rounded"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    )}
                    {!method.available && (
                      <span className="text-zinc-500 text-sm">ไม่พร้อมใช้งาน</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Payment Method */}
      {selectedMethod && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">วิธีการชำระเงินที่เลือก</h3>
            <button
              onClick={() => setSelectedMethod(null)}
              className="text-zinc-400 hover:text-white text-sm"
            >
              เปลี่ยนวิธีการชำระเงิน
            </button>
          </div>

          {selectedMethod === 'stripe' && (
            <div className="bg-zinc-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <CreditCardIcon className="w-6 h-6 text-red-500" />
                <h4 className="font-semibold text-white">บัตรเครดิต/เดบิต</h4>
              </div>
              <CheckoutForm
                returnUrl="/payment/success"
                onSuccess={onSuccess}
                onError={onError}
              />
            </div>
          )}

          {selectedMethod === 'bank_transfer' && (
            <div className="bg-zinc-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <BanknotesIcon className="w-6 h-6 text-red-500" />
                <h4 className="font-semibold text-white">โอนเงินผ่านธนาคาร</h4>
              </div>
              <div className="space-y-4">
                <div className="bg-zinc-800 rounded-lg p-4">
                  <h5 className="font-medium text-white mb-3">ข้อมูลการโอนเงิน</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">ธนาคาร:</span>
                      <span className="text-white">ธนาคารกสิกรไทย</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">เลขที่บัญชี:</span>
                      <span className="text-white font-mono">1234567890</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">ชื่อบัญชี:</span>
                      <span className="text-white">ค่ายมวยไทย</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">จำนวนเงิน:</span>
                      <span className="text-white font-semibold">฿{amount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleBankTransfer}
                  disabled={isProcessing}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-zinc-600 disabled:opacity-50 text-white py-3 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'กำลังสร้างข้อมูลโอนเงิน...' : 'ยืนยันการโอนเงิน'}
                </button>
              </div>
            </div>
          )}

          {selectedMethod === 'promptpay' && (
            <div className="bg-zinc-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <QrCodeIcon className="w-6 h-6 text-red-500" />
                <h4 className="font-semibold text-white">พร้อมเพย์</h4>
              </div>
              <div className="space-y-4">
                <div className="bg-zinc-800 rounded-lg p-4">
                  <h5 className="font-medium text-white mb-3">ข้อมูลพร้อมเพย์</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">เบอร์โทรศัพท์:</span>
                      <span className="text-white font-mono">0812345678</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">จำนวนเงิน:</span>
                      <span className="text-white font-semibold">฿{amount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handlePromptPay}
                  disabled={isProcessing}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-zinc-600 disabled:opacity-50 text-white py-3 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'กำลังสร้าง QR Code...' : 'สร้าง QR Code'}
                </button>
              </div>
            </div>
          )}

          {selectedMethod === 'onsite' && (
            <div className="bg-zinc-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <DevicePhoneMobileIcon className="w-6 h-6 text-red-500" />
                <h4 className="font-semibold text-white">ชำระเงินที่ค่ายมวย</h4>
              </div>
              <div className="space-y-4">
                <div className="bg-zinc-800 rounded-lg p-4">
                  <h5 className="font-medium text-white mb-3">ข้อมูลการชำระเงิน</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">จำนวนเงิน:</span>
                      <span className="text-white font-semibold">฿{amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">สถานที่:</span>
                      <span className="text-white">ค่ายมวยไทย</span>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-600/10 border border-yellow-600/50 rounded-lg p-4">
                  <p className="text-yellow-400 text-sm">
                    ⚠️ กรุณาชำระเงินด้วยเงินสดที่ค่ายมวยก่อนเริ่มใช้บริการ
                  </p>
                </div>
                <button
                  onClick={handleOnsitePayment}
                  disabled={isProcessing}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-zinc-600 disabled:opacity-50 text-white py-3 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'กำลังสร้างการชำระเงิน...' : 'ยืนยันการชำระเงินที่ค่ายมวย'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
