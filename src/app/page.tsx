export default function Home() {
  return (
    <main className="container mx-auto px-4 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">
          ยินดีต้อนรับสู่ Muaythai Next Postgres
        </h1>
        <p className="text-xl text-gray-400 mb-8">
          ระบบได้ถูกล้างข้อมูล Backend ทั้งหมดที่ไม่ใช่ Supabase แล้ว
        </p>
        <div className="bg-zinc-800 rounded-lg p-8 max-w-2xl mx-auto">
          <h2 className="text-2xl font-semibold mb-4">✅ สิ่งที่เหลืออยู่</h2>
          <ul className="text-left space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Supabase - สำหรับ Authentication และ Database</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>AlertContext - สำหรับแสดง Notifications</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>UI Components - Layout, ErrorBoundary, etc.</span>
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
