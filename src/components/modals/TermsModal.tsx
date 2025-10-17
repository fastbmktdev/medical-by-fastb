'use client';

import { useState } from 'react';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (marketingConsent: boolean) => void;
  gymName: string;
}

export default function TermsModal({ isOpen, onClose, onAccept, gymName }: TermsModalProps) {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  if (!isOpen) return null;

  const handleAccept = () => {
    if (!acceptedTerms) return;
    onAccept(marketingConsent);
  };

  const handleClose = () => {
    // Reset state when closing
    setAcceptedTerms(false);
    setMarketingConsent(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-br from-red-900 to-red-700 px-6 py-5 border-b border-red-600">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <CheckCircleIcon className="w-8 h-8" />
                ยืนยันการส่งใบสมัคร
              </h2>
              <p className="text-red-100 text-sm mt-1">กรุณาอ่านและยอมรับเงื่อนไขก่อนส่งใบสมัคร</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-red-800 transition-colors text-white"
              aria-label="ปิด"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-220px)] px-6 py-6">
          {/* General Terms Section */}
          <div className="mb-8 bg-zinc-900 rounded-xl p-6 border border-zinc-700">
            <h3 className="text-xl font-bold text-white mb-4 border-b border-zinc-700 pb-3">
              เงื่อนไขบริการทั่วไป
            </h3>

            <div className="space-y-6 text-zinc-300">
              <div>
                <h4 className="text-lg font-semibold text-red-400 mb-3">
                  การให้สิทธิใช้ภาพลักษณ์เพื่อการตลาดและการประชาสัมพันธ์
                </h4>
                <p className="text-sm text-zinc-400 italic mb-4">
                  สิทธิในการใช้ภาพลักษณ์และข้อมูลเพื่อการตลาด
                </p>

                <div className="space-y-4">
                  <div className="bg-zinc-800 rounded-lg p-4 border-l-4 border-blue-500">
                    <h5 className="font-semibold text-white mb-2">1. การยินยอม</h5>
                    <p className="text-sm text-zinc-300 leading-relaxed">
                      ผู้ใช้บริการ <span className="text-yellow-400 font-medium">ให้ความยินยอมโดยชัดแจ้งและสมัครใจ</span> แก่{' '}
                      <span className="text-red-400 font-semibold">thaikickmuaythai.com</span> ในการ{' '}
                      <span className="text-white font-medium">บันทึก ถ่ายภาพ ถ่ายวิดีโอ</span> (รวมถึงเสียง) หรือ{' '}
                      <span className="text-white font-medium">ประมวลผล</span> ภาพลักษณ์ ข้อมูล หรือสื่อใด ๆ
                      ที่ผู้ใช้ปรากฏตัวในสถานที่ กิจกรรม หรือบนแพลตฟอร์มของ thaikickmuaythai.com
                    </p>
                  </div>

                  <div className="bg-zinc-800 rounded-lg p-4 border-l-4 border-green-500">
                    <h5 className="font-semibold text-white mb-2">2. วัตถุประสงค์และขอบเขต</h5>
                    <p className="text-sm text-zinc-300 leading-relaxed">
                      thaikickmuaythai.com มีสิทธิ{' '}
                      <span className="text-yellow-400 font-medium">โดยเด็ดขาดและเป็นสิทธิ์ขาดแต่เพียงผู้เดียว</span>{' '}
                      ในการ <span className="text-white font-medium">ใช้ ทำซ้ำ ดัดแปลง แก้ไข เผยแพร่ หรือโอนสิทธิ</span>{' '}
                      ในสื่อดังกล่าวทั้งหมดหรือบางส่วน เพื่อวัตถุประสงค์ในการ{' '}
                      <span className="text-red-400 font-medium">โฆษณา การสร้างแบรนด์ การส่งเสริมการขาย และการประชาสัมพันธ์</span>{' '}
                      ของ thaikickmuaythai.com ในทุกช่องทาง ทั้งในและต่างประเทศ{' '}
                      <span className="text-yellow-400 font-medium">โดยไม่มีข้อจำกัดด้านระยะเวลา</span>
                    </p>
                  </div>

                  <div className="bg-zinc-800 rounded-lg p-4 border-l-4 border-purple-500">
                    <h5 className="font-semibold text-white mb-2">3. การสละสิทธิ</h5>
                    <p className="text-sm text-zinc-300 leading-relaxed">
                      ผู้ใช้บริการตกลงว่าการยินยอมนี้เป็นการให้สิทธิ{' '}
                      <span className="text-yellow-400 font-medium">โดยไม่มีค่าตอบแทน</span> และ{' '}
                      <span className="text-red-400 font-medium">สละสิทธิ</span> ในการเรียกร้อง{' '}
                      <span className="text-white font-medium">ค่าเสียหาย ค่าตอบแทน หรือค่าสิทธิ (Royalty)</span> ใด ๆ
                      จาก thaikickmuaythai.com ที่เกิดจากการใช้ภาพลักษณ์และข้อมูลเพื่อการตลาดดังกล่าว
                    </p>
                  </div>

                  <div className="bg-zinc-800 rounded-lg p-4 border-l-4 border-orange-500">
                    <h5 className="font-semibold text-white mb-2">4. การคงอยู่ของสิทธิ</h5>
                    <p className="text-sm text-zinc-300 leading-relaxed">
                      สิทธิในการใช้สื่อตามมาตรานี้ จะ<span className="text-yellow-400 font-medium">มีผลต่อเนื่องและไม่มีกำหนดเวลา</span>{' '}
                      แม้ว่าผู้ใช้บริการจะ <span className="text-white font-medium">ส��้นสุดสถานะการเป็นสมาชิก</span> หรือ{' '}
                      <span className="text-white font-medium">เลิกใช้บริการ</span>ของ thaikickmuaythai.com แล้วก็ตาม
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Information Section */}
              <div className="mt-6 pt-6 border-t border-zinc-700">
                <h4 className="text-base font-semibold text-blue-400 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  ตัวอย่างการใช้งานสื่อ
                </h4>
                <div className="bg-zinc-800/50 rounded-lg p-4">
                  <p className="text-sm text-zinc-300 mb-3 leading-relaxed">
                    เมื่อคุณยอมรับเงื่อนไขนี้ thaikickmuaythai.com สามารถนำภาพ วิดีโอ และข้อมูลของคุณไปใช้ใน:
                  </p>
                  <ul className="space-y-2 text-sm text-zinc-300">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>โฆษณาบนโซเชียลมีเดีย (Facebook, Instagram, TikTok, YouTube)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>เว็บไซต์และแอปพลิเคชัน thaikickmuaythai.com</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>สื่อสิ่งพิมพ์ โบรชัวร์ และป้ายโฆษณา</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>วิดีโอประชาสัมพันธ์และเนื้อหาการตลาด</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>งานแถลงข่าวและกิจกรรมส่งเสริมการขาย</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Important Notice Section */}
              <div className="mt-6 pt-6 border-t border-zinc-700">
                <h4 className="text-base font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  ข้อควรทราบสำคัญ
                </h4>
                <div className="space-y-3">
                  <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-700/50 rounded-lg p-4">
                    <p className="text-sm text-zinc-300 leading-relaxed">
                      <span className="text-yellow-300 font-semibold">→</span> การยินยอมนี้{' '}
                      <span className="text-white font-medium">ไม่มีค่าใช้จ่าย</span> และ{' '}
                      <span className="text-white font-medium">ไม่มีค่าตอบแทน</span> ใดๆ
                    </p>
                  </div>
                  <div className="bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-700/50 rounded-lg p-4">
                    <p className="text-sm text-zinc-300 leading-relaxed">
                      <span className="text-blue-300 font-semibold">→</span> สิทธิที่ได้รับ{' '}
                      <span className="text-white font-medium">ไม่สามารถเพิกถอนได้</span> แม้จะยกเลิกการเป็นสมาชิกแล้ว
                    </p>
                  </div>
                  <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-700/50 rounded-lg p-4">
                    <p className="text-sm text-zinc-300 leading-relaxed">
                      <span className="text-purple-300 font-semibold">→</span> เราจะใช้ภาพและข้อมูล{' '}
                      <span className="text-white font-medium">อย่างมืออาชีพและสร้างสรรค์</span>{' '}
                      เพื่อประโยชน์ในการประชาสัมพันธ์เท่านั้น
                    </p>
                  </div>
                </div>
              </div>

              {/* Data Protection Section */}
              <div className="mt-6 pt-6 border-t border-zinc-700">
                <h4 className="text-base font-semibold text-green-400 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  การคุ้มครองข้อมูลส่วนบุคคล
                </h4>
                <div className="bg-green-900/10 border border-green-700/50 rounded-lg p-4">
                  <p className="text-sm text-zinc-300 leading-relaxed mb-3">
                    แม้ว่าคุณจะยินยอมให้ใช้ภาพลักษณ์เพื่อการตลาด แต่เรายังคง{' '}
                    <span className="text-green-400 font-medium">ปกป้องข้อมูลส่วนบุคคล</span> ของคุณตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล (PDPA):
                  </p>
                  <ul className="space-y-2 text-sm text-zinc-300">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">🔒</span>
                      <span>ข้อมูลส่วนตัว (ชื่อ, ที่อยู่, เบอร์โทร) จะ<span className="text-white font-medium">ไม่ถูกเผยแพร่</span>สาธารณะ</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">🔒</span>
                      <span>ใช้เฉพาะภาพและวิดีโอที่<span className="text-white font-medium">เหมาะสมและสร้างสรรค์</span></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">🔒</span>
                      <span>คุณสามารถ<span className="text-white font-medium">ขอดูและแก้ไขข้อมูล</span>ส่วนตัวได้ตลอดเวลา</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Gym-specific Terms */}
          <div className="mb-6 bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl p-6 border-2 border-red-600">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              เงื่อนไขสำหรับ: <span className="text-red-400">{gymName}</span>
            </h3>

            <div className="space-y-4">
              <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-700">
                <p className="text-zinc-300 leading-relaxed">
                  ข้าพเจ้าได้อ่านและยอมรับ{' '}
                  <span className="text-white font-semibold">ข้อตกลงและเงื่อนไขการใช้บริการ</span> และ{' '}
                  <span className="text-white font-semibold">นโยบายความเป็นส่วนตัว</span> ของ{' '}
                  <span className="text-red-400 font-semibold">{gymName}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Checkboxes Section */}
          <div className="space-y-4 bg-zinc-900 rounded-xl p-6 border-2 border-zinc-700">
            {/* Main Terms Acceptance */}
            <label className="flex items-start gap-4 p-4 rounded-lg bg-zinc-800 border-2 border-zinc-700 hover:border-red-500 transition-all cursor-pointer group">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 w-5 h-5 rounded text-red-600 focus:ring-red-500 focus:ring-2 cursor-pointer"
              />
              <div className="flex-1">
                <p className="text-white font-semibold text-base group-hover:text-red-400 transition-colors">
                  ข้าพเจ้าได้อ่านและยอมรับ ข้อตกลงและเงื่อนไขการใช้บริการ และ นโยบายความเป็นส่วนตัว
                </p>
                <p className="text-zinc-400 text-sm mt-2">
                  การยอมรับเงื่อนไขนี้เป็นข้อบังคับ และจำเป็นต้องทำก่อนส่งใบสมัคร
                </p>
              </div>
            </label>

            {/* Marketing Consent */}
            <label className="flex items-start gap-4 p-4 rounded-lg bg-gradient-to-br from-red-900/20 to-orange-900/20 border-2 border-red-700 hover:border-red-500 transition-all cursor-pointer group">
              <input
                type="checkbox"
                checked={marketingConsent}
                onChange={(e) => setMarketingConsent(e.target.checked)}
                className="mt-1 w-5 h-5 rounded text-red-600 focus:ring-red-500 focus:ring-2 cursor-pointer"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-white font-semibold text-base group-hover:text-red-400 transition-colors">
                    คำยินยอมใช้สื่อการตลาด
                  </p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white animate-pulse">
                    สำคัญมาก
                  </span>
                </div>
                <p className="text-zinc-300 text-sm leading-relaxed">
                  ข้าพเจ้า <span className="text-yellow-400 font-medium">ยินยอมโดยชัดแจ้ง</span> ให้{' '}
                  <span className="text-red-400 font-semibold">{gymName}</span> ใช้{' '}
                  <span className="text-white font-medium">ภาพถ่าย วิดีโอ และข้อมูลความสำเร็จ</span> ของข้าพเจ้า
                  เพื่อวัตถุประสงค์ในการ{' '}
                  <span className="text-white font-medium">ประชาสัมพันธ์และการตลาด</span>{' '}
                  <span className="text-yellow-400 font-medium">โดยไม่มีค่าตอบแทน</span>
                </p>
                <p className="text-zinc-500 text-xs mt-2 italic">
                  (ดูรายละเอียดในเงื่อนไขฯ ด้านบน)
                </p>
              </div>
            </label>
          </div>

          {/* Warning if terms not accepted */}
          {!acceptedTerms && (
            <div className="mt-4 p-4 bg-yellow-900/20 border-2 border-yellow-600 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-yellow-300 text-sm">
                  <strong>โปรดทราบ:</strong> คุณจำเป็นต้องยอมรับเงื่อนไขการให้บริการและนโยบายความเป็นส่วนตัวก่อนส่งใบสมัคร
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-zinc-900 border-t-2 border-zinc-700 px-6 py-5">
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              onClick={handleClose}
              className="px-6 py-3 rounded-lg font-semibold text-zinc-300 bg-zinc-700 hover:bg-zinc-600 transition-colors border border-zinc-600"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleAccept}
              disabled={!acceptedTerms}
              className={`px-8 py-3 rounded-lg font-bold text-white transition-all transform ${
                acceptedTerms
                  ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 hover:scale-105 shadow-lg shadow-red-600/30'
                  : 'bg-zinc-600 cursor-not-allowed opacity-50'
              }`}
            >
              <div className="flex items-center gap-2 justify-center">
                <CheckCircleIcon className="w-5 h-5" />
                <span>ยอมรับและส่งใบสมัคร</span>
              </div>
            </button>
          </div>

          {marketingConsent && (
            <div className="mt-3 text-center">
              <p className="text-green-400 text-sm flex items-center justify-center gap-2">
                <CheckCircleIcon className="w-4 h-4" />
                ขอบคุณที่ยินยอมให้ใช้สื่อการตลาด
              </p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
