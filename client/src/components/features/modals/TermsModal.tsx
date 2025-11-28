"use client";

import { useState } from "react";
import { XMarkIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/shared";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (marketingConsent: boolean) => void;
  hospitalName: string;
}

export default function TermsModal({
  isOpen,
  onClose,
  onAccept,
  hospitalName,
}: TermsModalProps) {
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
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="relative bg-zinc-100 shadow-2xl  w-full max-w-4xl max-h-[90vh] overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="top-0 z-10 sticky bg-linear-to-br from-red-900 to-red-700 px-6 py-5 border-red-600 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="flex items-center gap-3 font-semibold text-2xl">
                <CheckCircleIcon className="w-8 h-8" />
                ยืนยันการส่งใบสมัคร
              </h2>
              <p className="mt-1 text-red-100 text-sm">
                กรุณาอ่านและยอมรับเงื่อนไขก่อนส่งใบสมัคร
              </p>
            </div>
            <button
              onClick={handleClose}
              className="hover:bg-red-800 p-2  transition-colors"
              aria-label="ปิด"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 max-h-[calc(90vh-220px)] overflow-y-auto">
          {/* General Terms Section */}
          <div className="bg-zinc-100 mb-8 p-6 border border-zinc-700 ">
            <h3 className="mb-4 pb-3 border-zinc-700 border-b font-semibold text-xl">
              เงื่อนไขบริการทั่วไป
            </h3>

            <div className="space-y-6 text-zinc-400">
              <div>
                <h4 className="mb-3 font-semibold text-red-400 text-lg">
                  การให้สิทธิใช้ภาพลักษณ์เพื่อการตลาดและการประชาสัมพันธ์
                </h4>
                <p className="mb-4 text-zinc-400 text-sm italic">
                  สิทธิในการใช้ภาพลักษณ์และข้อมูลเพื่อการตลาด
                </p>

                <div className="space-y-4">
                  <div className="bg-zinc-100 p-4 border-blue-500 border-l-4 ">
                    <h5 className="mb-2 font-semibold text-white">
                      1. การยินยอม
                    </h5>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      ผู้ใช้บริการ{" "}
                      <span className="font-medium text-yellow-400">
                        ให้ความยินยอมโดยชัดแจ้งและสมัครใจ
                      </span>{" "}
                      แก่{" "}
                      <span className="font-semibold text-red-400">
                        medicalhospital.com
                      </span>{" "}
                      ในการ{" "}
                      <span className="font-medium text-white">
                        บันทึก ถ่ายภาพ ถ่ายวิดีโอ
                      </span>{" "}
                      (รวมถึงเสียง) หรือ{" "}
                      <span className="font-medium text-white">ประมวลผล</span>{" "}
                      ภาพลักษณ์ ข้อมูล หรือสื่อใด ๆ ที่ผู้ใช้ปรากฏตัวในสถานที่
                      กิจกรรม หรือบนแพลตฟอร์มของ medicalhospital.com
                    </p>
                  </div>

                  <div className="bg-zinc-100 p-4 border-green-500 border-l-4 ">
                    <h5 className="mb-2 font-semibold text-white">
                      2. วัตถุประสงค์และขอบเขต
                    </h5>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      medicalhospital.com มีสิทธิ{" "}
                      <span className="font-medium text-yellow-400">
                        โดยเด็ดขาดและเป็นสิทธิ์ขาดแต่เพียงผู้เดียว
                      </span>{" "}
                      ในการ{" "}
                      <span className="font-medium text-white">
                        ใช้ ทำซ้ำ ดัดแปลง แก้ไข เผยแพร่ หรือโอนสิทธิ
                      </span>{" "}
                      ในสื่อดังกล่าวทั้งหมดหรือบางส่วน เพื่อวัตถุประสงค์ในการ{" "}
                      <span className="font-medium text-red-400">
                        โฆษณา การสร้างแบรนด์ การส่งเสริมการขาย
                        และการประชาสัมพันธ์
                      </span>{" "}
                      ของ medicalhospital.com ในทุกช่องทาง ทั้งในและต่างประเทศ{" "}
                      <span className="font-medium text-yellow-400">
                        โดยไม่มีข้อจำกัดด้านระยะเวลา
                      </span>
                    </p>
                  </div>

                  <div className="bg-zinc-100 p-4 border-purple-500 border-l-4 ">
                    <h5 className="mb-2 font-semibold text-white">
                      3. การสละสิทธิ
                    </h5>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      ผู้ใช้บริการตกลงว่าการยินยอมนี้เป็นการให้สิทธิ{" "}
                      <span className="font-medium text-yellow-400">
                        โดยไม่มีค่าตอบแทน
                      </span>{" "}
                      และ{" "}
                      <span className="font-medium text-red-400">สละสิทธิ</span>{" "}
                      ในการเรียกร้อง{" "}
                      <span className="font-medium text-white">
                        ค่าเสียหาย ค่าตอบแทน หรือค่าสิทธิ (Royalty)
                      </span>{" "}
                      ใด ๆ จาก medicalhospital.com
                      ที่เกิดจากการใช้ภาพลักษณ์และข้อมูลเพื่อการตลาดดังกล่าว
                    </p>
                  </div>

                  <div className="bg-zinc-100 p-4 border-orange-500 border-l-4 ">
                    <h5 className="mb-2 font-semibold text-white">
                      4. การคงอยู่ของสิทธิ
                    </h5>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      สิทธิในการใช้สื่อตามมาตรานี้ จะ
                      <span className="font-medium text-yellow-400">
                        มีผลต่อเนื่องและไม่มีกำหนดเวลา
                      </span>{" "}
                      แม้ว่าผู้ใช้บริการจะ{" "}
                      <span className="font-medium text-white">
                        ส��้นสุดสถานะการเป็นสมาชิก
                      </span>{" "}
                      หรือ{" "}
                      <span className="font-medium text-white">
                        เลิกใช้บริการ
                      </span>
                      ของ medicalhospital.com แล้วก็ตาม
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Information Section */}
              <div className="mt-6 pt-6 border-zinc-700 border-t">
                <h4 className="flex items-center gap-2 mb-3 font-semibold text-blue-400 text-base">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  ตัวอย่างการใช้งานสื่อ
                </h4>
                <div className="bg-zinc-100/50 p-4 ">
                  <p className="mb-3 text-zinc-400 text-sm leading-relaxed">
                    เมื่อคุณยอมรับเงื่อนไขนี้ medicalhospital.com สามารถนำภาพ
                    วิดีโอ และข้อมูลของคุณไปใช้ใน:
                  </p>
                  <ul className="space-y-2 text-zinc-400 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="mt-1 text-green-400">✓</span>
                      <span>
                        โฆษณาบนโซเชียลมีเดีย (Facebook, Instagram, TikTok,
                        YouTube)
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 text-green-400">✓</span>
                      <span>เว็บไซต์และแอปพลิเคชัน medicalhospital.com</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 text-green-400">✓</span>
                      <span>สื่อสิ่งพิมพ์ โบรชัวร์ และป้ายโฆษณา</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 text-green-400">✓</span>
                      <span>วิดีโอประชาสัมพันธ์และเนื้อหาการตลาด</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 text-green-400">✓</span>
                      <span>งานแถลงข่าวและกิจกรรมส่งเสริมการขาย</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Important Notice Section */}
              <div className="mt-6 pt-6 border-zinc-700 border-t">
                <h4 className="flex items-center gap-2 mb-3 font-semibold text-yellow-400 text-base">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  ข้อควรทราบสำคัญ
                </h4>
                <div className="space-y-3">
                  <div className="bg-linear-to-r from-yellow-900/20 to-orange-900/20 p-4 border border-yellow-700/50 ">
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      <span className="font-semibold text-yellow-300">→</span>{" "}
                      การยินยอมนี้{" "}
                      <span className="font-medium text-white">
                        ไม่มีค่าใช้จ่าย
                      </span>{" "}
                      และ{" "}
                      <span className="font-medium text-white">
                        ไม่มีค่าตอบแทน
                      </span>{" "}
                      ใดๆ
                    </p>
                  </div>
                  <div className="bg-linear-to-r from-blue-900/20 to-cyan-900/20 p-4 border border-blue-700/50 ">
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      <span className="font-semibold text-blue-300">→</span>{" "}
                      สิทธิที่ได้รับ{" "}
                      <span className="font-medium text-white">
                        ไม่สามารถเพิกถอนได้
                      </span>{" "}
                      แม้จะยกเลิกการเป็นสมาชิกแล้ว
                    </p>
                  </div>
                  <div className="bg-linear-to-r from-purple-900/20 to-pink-900/20 p-4 border border-purple-700/50 ">
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      <span className="font-semibold text-purple-300">→</span>{" "}
                      เราจะใช้ภาพและข้อมูล{" "}
                      <span className="font-medium text-white">
                        อย่างมืออาชีพและสร้างสรรค์
                      </span>{" "}
                      เพื่อประโยชน์ในการประชาสัมพันธ์เท่านั้น
                    </p>
                  </div>
                </div>
              </div>

              {/* Data Protection Section */}
              <div className="mt-6 pt-6 border-zinc-700 border-t">
                <h4 className="flex items-center gap-2 mb-3 font-semibold text-green-400 text-base">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  การคุ้มครองข้อมูลส่วนบุคคล
                </h4>
                <div className="bg-green-900/10 p-4 border border-green-700/50 ">
                  <p className="mb-3 text-zinc-400 text-sm leading-relaxed">
                    แม้ว่าคุณจะยินยอมให้ใช้ภาพลักษณ์เพื่อการตลาด แต่เรายังคง{" "}
                    <span className="font-medium text-green-400">
                      ปกป้องข้อมูลส่วนบุคคล
                    </span>{" "}
                    ของคุณตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล (PDPA):
                  </p>
                  <ul className="space-y-2 text-zinc-400 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">🔒</span>
                      <span>
                        ข้อมูลส่วนตัว (ชื่อ, ที่อยู่, เบอร์โทร) จะ
                        <span className="font-medium text-white">
                          ไม่ถูกเผยแพร่
                        </span>
                        สาธารณะ
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">🔒</span>
                      <span>
                        ใช้เฉพาะภาพและวิดีโอที่
                        <span className="font-medium text-white">
                          เหมาะสมและสร้างสรรค์
                        </span>
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">🔒</span>
                      <span>
                        คุณสามารถ
                        <span className="font-medium text-white">
                          ขอดูและแก้ไขข้อมูล
                        </span>
                        ส่วนตัวได้ตลอดเวลา
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* hospital-specific Terms */}
          <div className="bg-linear-to-br from-zinc-900 to-zinc-800 mb-6 p-6 border border-red-600 ">
            <h3 className="flex items-center gap-2 mb-4 font-semibold text-xl">
              <span className="bg-red-500  w-2 h-2 animate-pulse"></span>
              เงื่อนไขสำหรับ: <span className="text-red-400">{hospitalName}</span>
            </h3>

            <div className="space-y-4">
              <div className="bg-zinc-100/50 p-4 border border-zinc-700 ">
                <p className="text-zinc-400 leading-relaxed">
                  ข้าพเจ้าได้อ่านและยอมรับ{" "}
                  <span className="font-semibold text-white">
                    ข้อตกลงและเงื่อนไขการใช้บริการ
                  </span>{" "}
                  และ{" "}
                  <span className="font-semibold text-white">
                    นโยบายความเป็นส่วนตัว
                  </span>{" "}
                  ของ{" "}
                  <span className="font-semibold text-red-400">{hospitalName}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Checkboxes Section */}
          <div className="space-y-4 bg-zinc-100 p-6 border border-zinc-700 ">
            {/* Main Terms Acceptance */}
            <label className="group flex items-start gap-4 bg-zinc-100 p-4 border border-zinc-700 hover:border-red-500  transition-all cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1  focus:ring-2 focus:ring-red-500 w-5 h-5 text-red-600 cursor-pointer"
              />
              <div className="flex-1">
                <p className="font-semibold group-hover:text-red-400 text-base transition-colors">
                  ข้าพเจ้าได้อ่านและยอมรับ ข้อตกลงและเงื่อนไขการใช้บริการ และ
                  นโยบายความเป็นส่วนตัว
                </p>
                <p className="mt-2 text-zinc-400 text-sm">
                  การยอมรับเงื่อนไขนี้เป็นข้อบังคับ
                  และจำเป็นต้องทำก่อนส่งใบสมัคร
                </p>
              </div>
            </label>

            {/* Marketing Consent */}
            <label className="group flex items-start gap-4 bg-linear-to-br from-red-900/20 to-orange-900/20 p-4 border border-red-700 hover:border-red-500  transition-all cursor-pointer">
              <input
                type="checkbox"
                checked={marketingConsent}
                onChange={(e) => setMarketingConsent(e.target.checked)}
                className="mt-1  focus:ring-2 focus:ring-red-500 w-5 h-5 text-red-600 cursor-pointer"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <p className="font-semibold group-hover:text-red-400 text-base transition-colors">
                    คำยินยอมใช้สื่อการตลาด
                  </p>
                  <span className="inline-flex items-center bg-brand-primary px-2 py-0.5  font-semibold text-xs animate-pulse">
                    สำคัญมาก
                  </span>
                </div>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  ข้าพเจ้า{" "}
                  <span className="font-medium text-yellow-400">
                    ยินยอมโดยชัดแจ้ง
                  </span>{" "}
                  ให้{" "}
                  <span className="font-semibold text-red-400">{hospitalName}</span>{" "}
                  ใช้{" "}
                  <span className="font-medium text-white">
                    ภาพถ่าย วิดีโอ และข้อมูลความสำเร็จ
                  </span>{" "}
                  ของข้าพเจ้า เพื่อวัตถุประสงค์ในการ{" "}
                  <span className="font-medium text-white">
                    ประชาสัมพันธ์และการตลาด
                  </span>{" "}
                  <span className="font-medium text-yellow-400">
                    โดยไม่มีค่าตอบแทน
                  </span>
                </p>
                <p className="mt-2 text-zinc-500 text-xs italic">
                  (ดูรายละเอียดในเงื่อนไขฯ ด้านบน)
                </p>
              </div>
            </label>
          </div>

          {/* Warning if terms not accepted */}
          {!acceptedTerms && (
            <div className="bg-yellow-900/20 mt-4 p-4 border border-yellow-600 ">
              <div className="flex items-start gap-3">
                <svg
                  className="shrink-0 mt-0.5 w-6 h-6 text-yellow-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-yellow-300 text-sm">
                  <strong>โปรดทราบ:</strong>{" "}
                  คุณจำเป็นต้องยอมรับเงื่อนไขการให้บริการและนโยบายความเป็นส่วนตัวก่อนส่งใบสมัคร
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bottom-0 sticky bg-zinc-100 px-6 py-5 border-zinc-700 border-t-2">
          <div className="flex sm:flex-row flex-col justify-end gap-3">
            <Button onClick={handleClose} variant="secondary" size="lg">
              ยกเลิก
            </Button>
            <Button
              onClick={handleAccept}
              disabled={!acceptedTerms}
              variant="primary"
              size="lg"
              leftIcon={<CheckCircleIcon className="w-5 h-5" />}
            >
              ยอมรับและส่งใบสมัคร
            </Button>
          </div>

          {marketingConsent && (
            <div className="mt-3 text-center">
              <p className="flex justify-center items-center gap-2 text-green-400 text-sm">
                <CheckCircleIcon className="w-4 h-4" />
                ขอบคุณที่ยินยอมให้ใช้สื่อการตลาด
              </p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
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
