"use client";

import { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { PageHeader } from "@/components/shared";
import { Link } from "@/navigation";

const faqData = [
  {
    category: "การจองโรงพยาบาล",
    questions: [
      {
        question: "ต้องจองล่วงหน้ากี่วัน?",
        answer: "แนะนำให้จองล่วงหน้าอย่างน้อย 3-7 วัน เพื่อให้แน่ใจว่ามีที่ว่าง โดยเฉพาะในช่วง peak season (ธันวาคม-มีนาคม) ควรจองล่วงหน้า 1-2 สัปดาห์"
      },
      {
        question: "สามารถยกเลิกการจองได้หรือไม่?",
        answer: "สามารถยกเลิกการจองได้ภายใน 24 ชั่วโมงก่อนเวลาที่จอง โดยจะได้รับเงินคืน 100% หากยกเลิกภายใน 48 ชั่วโมง จะได้รับเงินคืน 50% หากยกเลิกหลังจากนั้นจะไม่สามารถคืนเงินได้"
      },
      {
        question: "ต้องเตรียมอะไรไปบ้าง?",
        answer: "แนะนำให้เตรียมเสื้อผ้าสำหรับออกกำลังกาย น้ำดื่ม ผ้าขนหนู และอุปกรณ์ป้องกันส่วนบุคคล (ถ้ามี) โรงพยาบาลส่วนใหญ่จะมีอุปกรณ์ให้ยืมใช้"
      },
      {
        question: "เหมาะสำหรับผู้เริ่มต้นหรือไม่?",
        answer: "โรงพยาบาลส่วนใหญ่มีคลาสสำหรับผู้เริ่มต้น โดยจะมีอาจารย์คอยดูแลและสอนพื้นฐานอย่างปลอดภัย แนะนำให้แจ้งระดับความสามารถล่วงหน้าเพื่อให้ได้รับการดูแลที่เหมาะสม"
      }
    ]
  },
  {
    category: "การจองตั๋วอีเวนต์",
    questions: [
      {
        question: "ตั๋วสามารถโอนให้ผู้อื่นได้หรือไม่?",
        answer: "ตั๋วสามารถโอนให้ผู้อื่นได้โดยการแจ้งให้ทีมงานทราบล่วงหน้าอย่างน้อย 24 ชั่วโมง พร้อมเอกสารยืนยันตัวตนของผู้รับโอน"
      },
      {
        question: "หากอีเวนต์ถูกยกเลิกจะได้รับเงินคืนหรือไม่?",
        answer: "หากอีเวนต์ถูกยกเลิกโดยผู้จัด จะได้รับเงินคืน 100% ภายใน 7-14 วันทำการ หากอีเวนต์ถูกเลื่อน จะได้รับตั๋วสำหรับวันที่ใหม่โดยอัตโนมัติ"
      },
      {
        question: "สามารถเปลี่ยนที่นั่งได้หรือไม่?",
        answer: "สามารถเปลี่ยนที่นั่งได้หากยังมีที่ว่าง โดยจะต้องชำระค่าธรรมเนียมการเปลี่ยนแปลง 200 บาท และต้องแจ้งล่วงหน้าอย่างน้อย 48 ชั่วโมง"
      },
      {
        question: "เด็กเข้าชมได้หรือไม่?",
        answer: "เด็กอายุต่ำกว่า 12 ปีสามารถเข้าชมได้ฟรี (ไม่รวมที่นั่ง) แต่ต้องมีผู้ปกครองดูแลตลอดเวลา สำหรับเด็กอายุ 12-18 ปี ต้องซื้อตั๋วในราคาเด็ก"
      }
    ]
  },
  {
    category: "โปรแกรมนักมวย",
    questions: [
      {
        question: "คุณสมบัติการสมัครเป็นนักมวย?",
        answer: "อายุ 18-35 ปี มีประสบการณ์การฝึกการแพทย์อย่างน้อย 6 เดือน ผ่านการตรวจสุขภาพจากแพทย์ มีประกันสุขภาพ และสามารถฝึกซ้อมได้อย่างน้อย 3 ครั้งต่อสัปดาห์"
      },
      {
        question: "สิทธิประโยชน์ที่ได้รับ?",
        answer: "เข้าร่วมการแข่งขันการแพทย์ระดับต่างๆ ลดราคาค่าใช้จ่ายในการฝึกซ้อม เข้าถึงโรงพยาบาลพันธมิตรทั่วประเทศ ประกันสุขภาพสำหรับนักมวย และเข้าร่วมเวิร์กช็อปพิเศษ"
      },
      {
        question: "ระบบแต้มสะสมทำงานอย่างไร?",
        answer: "ฝึกซ้อม 1 ครั้ง = 10 แต้ม, เข้าร่วมการแข่งขัน = 50 แต้ม, ชนะการแข่งขัน = 100 แต้ม, แนะนำเพื่อนเข้าร่วม = 25 แต้ม แต้มสามารถแลกของรางวัลและสิทธิพิเศษต่างๆ ได้"
      },
      {
        question: "ต้องเสียค่าธรรมเนียมหรือไม่?",
        answer: "ค่าสมัครสมาชิก 500 บาท (ครั้งเดียว) และค่าธรรมเนียมรายปี 1,200 บาท รวมถึงค่าประกันสุขภาพ 1,200 บาท/เดือน"
      }
    ]
  },
  {
    category: "การชำระเงิน",
    questions: [
      {
        question: "ช่องทางการชำระเงินมีอะไรบ้าง?",
        answer: "รับชำระผ่านบัตรเครดิต/เดบิต Visa, Mastercard, JCB, UnionPay, PayPal, PromptPay, TrueMoney Wallet, และการโอนเงินผ่านธนาคาร"
      },
      {
        question: "ปลอดภัยในการชำระเงินหรือไม่?",
        answer: "ระบบชำระเงินของเราใช้เทคโนโลยี SSL Encryption และ PCI DSS Compliance เพื่อความปลอดภัยสูงสุด ข้อมูลบัตรเครดิตจะถูกเข้ารหัสและไม่เก็บไว้ในระบบ"
      },
      {
        question: "จะได้รับใบเสร็จเมื่อไหร่?",
        answer: "จะได้รับใบเสร็จทางอีเมลทันทีหลังการชำระเงินสำเร็จ และสามารถดาวน์โหลดได้จากแดชบอร์ดส่วนตัว"
      },
      {
        question: "สามารถขอใบกำกับภาษีได้หรือไม่?",
        answer: "สามารถขอใบกำกับภาษีได้โดยแจ้งความประสงค์ตอนชำระเงิน หรือติดต่อทีมงานหลังการชำระเงิน พร้อมส่งเอกสารที่จำเป็น"
      }
    ]
  },
  {
    category: "บริการเสริม",
    questions: [
      {
        question: "บริการวีซ่านักมวยใช้เวลากี่วัน?",
        answer: "ใช้เวลา 7-15 วันทำการ ขึ้นอยู่กับประเภทวีซ่าและเอกสารที่ส่งมา เราแนะนำให้ยื่นคำขอล่วงหน้า 1 เดือนก่อนเดินทาง"
      },
      {
        question: "บริการจัดหาที่พักครอบคลุมพื้นที่ไหน?",
        answer: "ครอบคลุมพื้นที่ใกล้โรงพยาบาลในกรุงเทพฯ ภูเก็ต เชียงใหม่ พัทยา และเกาะสมุย โดยมีตัวเลือกตั้งแต่หอพักราคาประหยัดถึงโรงแรมหรู"
      },
      {
        question: "ประกันสุขภาพครอบคลุมอะไรบ้าง?",
        answer: "ครอบคลุมการบาดเจ็บจากการฝึกซ้อมและแข่งขัน การรักษาพยาบาลฉุกเฉิน การผ่าตัด และการฟื้นฟูสมรรถภาพ รวมถึงการเสียชีวิตและทุพพลภาพ"
      },
      {
        question: "สามารถยกเลิกบริการเสริมได้หรือไม่?",
        answer: "สามารถยกเลิกได้ตามเงื่อนไขของแต่ละบริการ โดยทั่วไปหากยกเลิกก่อนเริ่มใช้บริการจะได้รับเงินคืน 100% หากยกเลิกหลังเริ่มใช้แล้วจะได้รับเงินคืนตามสัดส่วน"
      }
    ]
  },
  {
    category: "การใช้งานเว็บไซต์",
    questions: [
      {
        question: "ลืมรหัสผ่านทำอย่างไร?",
        answer: "คลิก 'ลืมรหัสผ่าน' ในหน้าเข้าสู่ระบบ กรอกอีเมลที่ใช้สมัครสมาชิก ระบบจะส่งลิงก์รีเซ็ตรหัสผ่านไปให้ทางอีเมล"
      },
      {
        question: "สามารถเปลี่ยนภาษาได้หรือไม่?",
        answer: "สามารถเปลี่ยนภาษาได้ 3 ภาษา ได้แก่ ไทย อังกฤษ และญี่ปุ่น โดยคลิกที่ปุ่มภาษาในมุมขวาบนของเว็บไซต์"
      },
      {
        question: "เว็บไซต์ใช้งานบนมือถือได้หรือไม่?",
        answer: "เว็บไซต์รองรับการใช้งานบนมือถือและแท็บเล็ตทุกขนาด โดยมีการออกแบบ Responsive Design ที่ปรับตัวตามขนาดหน้าจอ"
      },
      {
        question: "มีแอปพลิเคชันมือถือหรือไม่?",
        answer: "ขณะนี้ยังไม่มีแอปพลิเคชันมือถือ แต่เว็บไซต์ได้รับการออกแบบให้ใช้งานบนมือถือได้อย่างสะดวก สามารถเพิ่มไอคอนเว็บไซต์ลงหน้าจอได้"
      }
    ]
  }
];

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState("การจองโรงพยาบาล");
  const [openQuestions, setOpenQuestions] = useState<Set<string>>(new Set());

  const toggleQuestion = (questionId: string) => {
    const newOpenQuestions = new Set(openQuestions);
    if (newOpenQuestions.has(questionId)) {
      newOpenQuestions.delete(questionId);
    } else {
      newOpenQuestions.add(questionId);
    }
    setOpenQuestions(newOpenQuestions);
  };

  const categories = faqData.map(category => category.category);
  const selectedCategoryData = faqData.find(cat => cat.category === activeCategory);

  return (
    <div className="bg-zinc-100 min-h-screen">
      <PageHeader 
        title="คำถามที่พบบ่อย" 
        description="ค้นหาคำตอบสำหรับคำถามที่พบบ่อยเกี่ยวกับการใช้งานแพลตฟอร์มของเรา"
      />

      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">
        <div className="flex lg:flex-row flex-col gap-8">
          {/* Categories Sidebar */}
          <div className="lg:w-1/4">
            <div className="top-8 sticky bg-zinc-100 p-6 ">
              <h3 className="mb-4 font-semibold text-lg">หมวดหมู่</h3>
              <nav className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`w-full text-left px-4 py-3  transition-colors ${
                      activeCategory === category
                        ? "bg-brand-primary text-white"
                        : "text-zinc-300 hover:bg-zinc-700 hover:text-white"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* FAQ Content */}
          <div className="lg:w-3/4">
            <div className="bg-zinc-100 p-8 ">
              <h2 className="mb-6 font-bold text-2xl">{activeCategory}</h2>
              
              <div className="space-y-4">
                {selectedCategoryData?.questions.map((faq, index) => {
                  const questionId = `${activeCategory}-${index}`;
                  const isOpen = openQuestions.has(questionId);
                  
                  return (
                    <div key={index} className="border border-zinc-700 ">
                      <button
                        onClick={() => toggleQuestion(questionId)}
                        className="flex justify-between items-center hover:bg-zinc-700 p-6 w-full text-left transition-colors"
                      >
                        <h3 className="pr-4 font-semibold text-lg">
                          {faq.question}
                        </h3>
                        {isOpen ? (
                          <ChevronUpIcon className="shrink-0 w-6 h-6 text-zinc-400" />
                        ) : (
                          <ChevronDownIcon className="shrink-0 w-6 h-6 text-zinc-400" />
                        )}
                      </button>
                      
                      {isOpen && (
                        <div className="px-6 pb-6">
                          <div className="pt-4 border-zinc-700 border-t">
                            <p className="text-zinc-300 leading-relaxed">
                              {faq.answer}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Contact Support */}
            <div className="bg-zinc-100 mt-8 p-8  text-center">
              <h3 className="mb-4 font-semibold text-xl">ไม่พบคำตอบที่ต้องการ?</h3>
              <p className="mb-6 text-zinc-400">
                ทีมงานของเราพร้อมให้ความช่วยเหลือและตอบคำถามเพิ่มเติม
              </p>
              <div className="flex sm:flex-row flex-col justify-center gap-4">
                <Link
                  href="/contact"
                  className="bg-brand-primary hover:bg-red-600 px-6 py-3  font-semibold transition-colors"
                >
                  ติดต่อทีมงาน
                </Link>
                <Link
                  href="mailto:support@medicalnext.com"
                  className="bg-zinc-700 hover:bg-zinc-600 px-6 py-3  font-semibold transition-colors"
                >
                  ส่งอีเมล
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
