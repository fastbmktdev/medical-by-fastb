import { ContactForm } from "@/components/features/contact";
import { Award, ShieldCheck, Trophy } from "lucide-react";
import { PageHeader } from "@/components/shared";

export default function AboutPage() {
  return (
    <div className="bg-zinc-950 min-h-screen">
      <PageHeader 
        title="เกี่ยวกับเรา" 
        description="เราคือแพลตฟอร์มจองค่ายมวยไทยและบัตรเวทีมวย ที่เชื่อมโยงนักเรียน นักสู้ และแฟนมวยเข้าด้วยกัน ผ่านระบบจองที่เรียบง่าย โปร่งใส และยืดหยุ่น"
      />

      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl text-white">

      <div className="gap-6 grid sm:grid-cols-2 mt-8">
        <div className="bg-zinc-950/60 p-6 border border-white/10 rounded-xl">
          <h2 className="font-semibold">ทีมงาน</h2>
          <p className="mt-2 text-white/70 text-sm">ทีมผู้เชี่ยวชาญด้านมวยไทย เทคโนโลยี และการท่องเที่ยว</p>
        </div>
        <div className="bg-zinc-950/60 p-6 border border-white/10 rounded-xl">
          <h2 className="font-semibold">พันธกิจ</h2>
          <p className="mt-2 text-white/70 text-sm">ทำให้การเข้าถึงมวยไทยเป็นเรื่องง่ายสำหรับทุกคน ทั้งฝึกซ้อมและรับชม</p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="font-semibold text-xl sm:text-2xl text-center">ไฮไลท์ค่ายมวยในเครือเรา</h2>
        <div className="gap-6 grid sm:grid-cols-2 lg:grid-cols-3 mt-6">
          <div className="bg-zinc-950/60 p-6 border border-white/10 rounded-xl text-center">
            <Trophy className="mx-auto w-10 h-10 text-amber-400" />
            <h3 className="mt-4 font-semibold">แชมป์โลก 5 สมัย</h3>
            <p className="mt-2 text-white/70 text-sm">ค่ายมวยของเราได้สร้างแชมป์โลกมาแล้วถึง 5 สมัย</p>
          </div>
          <div className="bg-zinc-950/60 p-6 border border-white/10 rounded-xl text-center">
            <Award className="mx-auto w-10 h-10 text-sky-400" />
            <h3 className="mt-4 font-semibold">โค้ชผู้เชี่ยวชาญ</h3>
            <p className="mt-2 text-white/70 text-sm">ทีมโค้ชที่ได้รับการรับรองและมีประสบการณ์สูง</p>
          </div>
          <div className="sm:col-span-2 lg:col-span-1 bg-zinc-950/60 p-6 border border-white/10 rounded-xl text-center">
            <ShieldCheck className="mx-auto w-10 h-10 text-emerald-400" />
            <h3 className="mt-4 font-semibold">สถานที่มาตรฐานสากล</h3>
            <p className="mt-2 text-white/70 text-sm">อุปกรณ์และสถานที่ฝึกซ้อมที่ทันสมัยและปลอดภัย</p>
          </div>
        </div>
      </div>

        <div className="bg-zinc-950/60 mt-8 p-6 sm:p-8 border border-white/10 rounded-xl">
          <h2 className="mb-2 font-semibold text-xl sm:text-2xl text-center">ติดต่อเรา</h2>
          <p className="mb-6 text-white/70 text-sm text-center">
            อยากพูดคุย สอบถามข้อสงสัย หรือเสนอแนะ สามารถกรอกฟอร์มด้านล่างได้เลย
          </p>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}


