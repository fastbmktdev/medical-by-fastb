import ContactForm from "@/components/contact/ContactForm";
import { Award, ShieldCheck, Trophy } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-bold">About us</h1>
      <p className="mt-2 text-white/70 max-w-prose">
        เราคือแพลตฟอร์มจองค่ายมวยไทยและบัตรเวทีมวย ที่เชื่อมโยงนักเรียน นักสู้ และแฟนมวยเข้าด้วยกัน
        ผ่านระบบจองที่เรียบง่าย โปร่งใส และยืดหยุ่น
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 p-6 bg-zinc-950/60">
          <h2 className="font-semibold">ทีมงาน</h2>
          <p className="mt-2 text-sm text-white/70">ทีมผู้เชี่ยวชาญด้านมวยไทย เทคโนโลยี และการท่องเที่ยว</p>
        </div>
        <div className="rounded-xl border border-white/10 p-6 bg-zinc-950/60">
          <h2 className="font-semibold">พันธกิจ</h2>
          <p className="mt-2 text-sm text-white/70">ทำให้การเข้าถึงมวยไทยเป็นเรื่องง่ายสำหรับทุกคน ทั้งฝึกซ้อมและรับชม</p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl sm:text-2xl font-semibold text-center">ไฮไลท์ค่ายมวยในเครือเรา</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-white/10 p-6 bg-zinc-950/60 text-center">
            <Trophy className="w-10 h-10 mx-auto text-amber-400" />
            <h3 className="mt-4 font-semibold">แชมป์โลก 5 สมัย</h3>
            <p className="mt-2 text-sm text-white/70">ค่ายมวยของเราได้สร้างแชมป์โลกมาแล้วถึง 5 สมัย</p>
          </div>
          <div className="rounded-xl border border-white/10 p-6 bg-zinc-950/60 text-center">
            <Award className="w-10 h-10 mx-auto text-sky-400" />
            <h3 className="mt-4 font-semibold">โค้ชผู้เชี่ยวชาญ</h3>
            <p className="mt-2 text-sm text-white/70">ทีมโค้ชที่ได้รับการรับรองและมีประสบการณ์สูง</p>
          </div>
          <div className="rounded-xl border border-white/10 p-6 bg-zinc-950/60 text-center sm:col-span-2 lg:col-span-1">
            <ShieldCheck className="w-10 h-10 mx-auto text-emerald-400" />
            <h3 className="mt-4 font-semibold">สถานที่มาตรฐานสากล</h3>
            <p className="mt-2 text-sm text-white/70">อุปกรณ์และสถานที่ฝึกซ้อมที่ทันสมัยและปลอดภัย</p>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-white/10 p-6 sm:p-8 bg-zinc-950/60">
        <h2 className="text-xl sm:text-2xl font-semibold mb-2 text-center">ติดต่อเรา</h2>
        <p className="text-center text-sm text-white/70 mb-6">
          อยากพูดคุย สอบถามข้อสงสัย หรือเสนอแนะ สามารถกรอกฟอร์มด้านล่างได้เลย
        </p>
        <ContactForm />
      </div>
    </div>
  );
}


