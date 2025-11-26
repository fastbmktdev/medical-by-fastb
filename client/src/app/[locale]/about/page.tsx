import { ContactForm } from "@/components/features/contact";
import {
  TrophyIcon,
  StarIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { PageHeader } from "@/components/shared";

export default function AboutPage() {
  return (
    <div className="bg-white text-zinc-950 min-h-screen">
      <PageHeader
        title="เกี่ยวกับเรา"
        description="เราคือแพลตฟอร์มจองโรงพยาบาลไทยและบัตรห้องตรวจ ที่เชื่อมโยงนักเรียน นักสู้ และแฟนมวยเข้าด้วยกัน ผ่านระบบจองที่เรียบง่าย โปร่งใส และยืดหยุ่น"
      />

      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl text-zinc-950">
        <div className="gap-6 grid sm:grid-cols-2 mt-8">
          <div className="bg-white text-zinc-950 p-6 border border-gray-300 ">
            <h2 className="font-semibold">ทีมงาน</h2>
            <p className="mt-2 text-zinc-950/70 text-sm">
              ทีมผู้เชี่ยวชาญด้านการแพทย์ เทคโนโลยี และการท่องเที่ยว
            </p>
          </div>
          <div className="bg-white text-zinc-950 p-6 border border-gray-300 ">
            <h2 className="font-semibold">พันธกิจ</h2>
            <p className="mt-2 text-zinc-950/70 text-sm">
              ทำให้การเข้าถึงการแพทย์เป็นเรื่องง่ายสำหรับทุกคน
              ทั้งฝึกซ้อมและรับชม
            </p>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="font-semibold text-xl sm:text-2xl text-center">
            ไฮไลท์โรงพยาบาลในเครือเรา
          </h2>
          <div className="gap-6 grid sm:grid-cols-2 lg:grid-cols-3 mt-6">
            <div className="bg-white text-zinc-950 p-6 border border-gray-300  text-center">
              <TrophyIcon className="mx-auto w-10 h-10 text-amber-400" />
              <h3 className="mt-4 font-semibold">รางวัลสถานพยาบาลยอดเยี่ยม 5 ปีซ้อน</h3>
              <p className="mt-2 text-zinc-950/70 text-sm">
                โรงพยาบาลของเราได้รับรางวัลสถานพยาบาลยอดเยี่ยม 5 ปีซ้อน
              </p>
            </div>
            <div className="bg-white text-zinc-950 p-6 border border-gray-300  text-center">
              <StarIcon className="mx-auto w-10 h-10 text-sky-400" />
              <h3 className="mt-4 font-semibold">ทีมแพทย์ผู้เชี่ยวชาญ</h3>
              <p className="mt-2 text-zinc-950/70 text-sm">
                ทีมแพทย์และบุคลากรทางการแพทย์ที่ได้รับการรับรองและมีประสบการณ์สูง
              </p>
            </div>
            <div className="sm:col-span-2 lg:col-span-1 bg-white text-zinc-950 p-6 border border-gray-300  text-center">
              <ShieldCheckIcon className="mx-auto w-10 h-10 text-emerald-400" />
              <h3 className="mt-4 font-semibold">มาตรฐานโรงพยาบาลสากล</h3>
              <p className="mt-2 text-zinc-950/70 text-sm">
                โรงพยาบาลพร้อมด้วยอุปกรณ์ทางการแพทย์ที่ทันสมัยและปลอดภัย
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white text-zinc-950 mt-8 p-6 sm:p-8 border border-gray-300 ">
          <h2 className="mb-2 font-semibold text-xl sm:text-2xl text-center">
            ติดต่อเรา
          </h2>
          <p className="mb-6 text-zinc-950/70 text-sm text-center">
            อยากพูดคุย สอบถามข้อสงสัย หรือเสนอแนะ สามารถกรอกฟอร์มด้านล่างได้เลย
          </p>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
