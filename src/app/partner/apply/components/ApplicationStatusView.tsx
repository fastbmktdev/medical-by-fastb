import Link from "next/link";
import Image from "next/image";
import { BuildingStorefrontIcon, ClockIcon } from "@heroicons/react/24/outline";
import { ApplicationStatus, GymData } from "../types";

interface ApplicationStatusViewProps {
  existingGym: GymData;
  applicationStatus: ApplicationStatus;
}

export const ApplicationStatusView = ({
  existingGym,
  applicationStatus,
}: ApplicationStatusViewProps) => {
  const statusConfig: Record<
    Exclude<ApplicationStatus, "none">,
    {
      bg: string;
      border: string;
      text: string;
      label: string;
      icon: string;
      description: string;
      progress: number;
    }
  > = {
    pending: {
      bg: "bg-gradient-to-br from-yellow-500/20 to-orange-500/20",
      border: "border-yellow-500/50",
      text: "text-yellow-400",
      label: "รอการตรวจสอบ",
      icon: "⏳",
      description:
        "ทีมงานกำลังตรวจสอบข้อมูลของคุณ กรุณารอการติดต่อกลับภายใน 3-5 วันทำการ",
      progress: 50,
    },
    approved: {
      bg: "bg-gradient-to-br from-green-500/20 to-emerald-500/20",
      border: "border-green-500/50",
      text: "text-green-400",
      label: "อนุมัติแล้ว",
      icon: "✅",
      description:
        "ยินดีด้วย! คำขอของคุณได้รับการอนุมัติแล้ว ตอนนี้คุณเป็น Partner กับเราแล้ว",
      progress: 100,
    },
    denied: {
      bg: "bg-gradient-to-br from-red-500/20 to-rose-500/20",
      border: "border-red-500/50",
      text: "text-red-400",
      label: "ไม่ผ่านการอนุมัติ",
      icon: "❌",
      description:
        "ขออภัย คำขอของคุณไม่ผ่านการอนุมัติ กรุณาติดต่อทีมงานเพื่อสอบถามรายละเอียด",
      progress: 0,
    },
  };

  const status =
    applicationStatus !== "none"
      ? statusConfig[applicationStatus]
      : statusConfig.pending;

  return (
    <div className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 min-h-screen relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-500/10 via-transparent to-transparent"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>

      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-5xl relative z-10">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="relative inline-block mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-700 rounded-full blur-lg opacity-30 animate-pulse"></div>
            <div className="relative inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-full shadow-2xl">
              <span className="text-4xl animate-bounce">{status.icon}</span>
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full animate-ping"></div>
          </div>

          <h1 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-red-100 to-white text-5xl md:text-6xl mb-6 animate-fade-in">
            สถานะการสมัคร Partner
          </h1>

          <div className="relative">
            <p className="text-zinc-300 text-xl max-w-3xl mx-auto leading-relaxed">
              ติดตามความคืบหน้าของคำขอสมัครเข้าร่วมเป็น Partner Gym
            </p>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-red-500 to-red-700 rounded-full"></div>
          </div>
        </div>

        {/* Status Card */}
        <div
          className={`${status.bg} border ${status.border} rounded-3xl p-10 mb-12 backdrop-blur-md shadow-2xl relative overflow-hidden`}
        >
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>

          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8 relative z-10">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div
                  className={`w-6 h-6 rounded-full ${status.border.replace("border-", "bg-").replace("/50", "")} animate-pulse shadow-lg`}
                ></div>
                <div
                  className={`absolute inset-0 w-6 h-6 rounded-full ${status.border.replace("border-", "bg-").replace("/50", "")} opacity-30 animate-ping`}
                ></div>
              </div>
              <div>
                <p className="font-bold text-zinc-200 text-2xl mb-2">
                  สถานะ:{" "}
                  <span className={`${status.text} drop-shadow-lg`}>
                    {status.label}
                  </span>
                </p>
                <p className="text-zinc-300 text-lg leading-relaxed">
                  {status.description}
                </p>
              </div>
            </div>

            {/* Enhanced Progress Bar */}
            <div className="flex-1 lg:max-w-md">
              <div className="flex justify-between items-center mb-3 text-sm">
                <span className="text-zinc-300 font-medium">ความคืบหน้า</span>
                <span className="text-zinc-200 font-bold bg-zinc-800/50 px-3 py-1 rounded-full">
                  {status.progress}%
                </span>
              </div>
              <div className="relative w-full bg-zinc-800/50 rounded-full h-3 shadow-inner">
                <div
                  className={`h-3 rounded-full transition-all duration-2000 ease-out relative overflow-hidden ${
                    status.progress === 100
                      ? "bg-gradient-to-r from-green-400 via-emerald-500 to-green-600"
                      : status.progress === 50
                        ? "bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-600"
                        : "bg-gradient-to-r from-red-400 via-rose-500 to-red-600"
                  }`}
                  style={{ width: `${status.progress}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Application Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Basic Information */}
          <div className="group bg-gradient-to-br from-zinc-900/60 to-zinc-800/40 backdrop-blur-md border border-zinc-700/50 rounded-3xl p-8 shadow-2xl hover:shadow-red-500/10 transition-all duration-300 hover:border-red-500/30">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-2xl border border-red-500/30">
                <BuildingStorefrontIcon className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="font-bold text-text-primary text-2xl">
                ข้อมูลยิม
              </h2>
            </div>

            <div className="space-y-6">
              <div className="group/item flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-zinc-800/30 rounded-2xl hover:bg-zinc-800/50 transition-colors">
                <span className="text-zinc-400 text-sm w-28 flex-shrink-0 font-medium">
                  ชื่อยิม
                </span>
                <span className="font-semibold text-text-primary text-lg">
                  {existingGym.gym_name}
                </span>
              </div>
              <div className="group/item flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-zinc-800/30 rounded-2xl hover:bg-zinc-800/50 transition-colors">
                <span className="text-zinc-400 text-sm w-28 flex-shrink-0 font-medium">
                  ผู้ติดต่อ
                </span>
                <span className="font-semibold text-text-primary text-lg">
                  {existingGym.contact_name}
                </span>
              </div>
              <div className="group/item flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-zinc-800/30 rounded-2xl hover:bg-zinc-800/50 transition-colors">
                <span className="text-zinc-400 text-sm w-28 flex-shrink-0 font-medium">
                  เบอร์โทร
                </span>
                <span className="font-mono font-semibold text-text-primary text-lg bg-zinc-700/50 px-3 py-1 rounded-lg">
                  {existingGym.phone}
                </span>
              </div>
              <div className="group/item flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-zinc-800/30 rounded-2xl hover:bg-zinc-800/50 transition-colors">
                <span className="text-zinc-400 text-sm w-28 flex-shrink-0 font-medium">
                  อีเมล
                </span>
                <span className="font-mono font-semibold text-text-primary text-lg bg-zinc-700/50 px-3 py-1 rounded-lg">
                  {existingGym.email}
                </span>
              </div>
            </div>
          </div>

          {/* Application Timeline */}
          <div className="group bg-gradient-to-br from-zinc-900/60 to-zinc-800/40 backdrop-blur-md border border-zinc-700/50 rounded-3xl p-8 shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 hover:border-blue-500/30">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl border border-blue-500/30">
                <ClockIcon className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="font-bold text-text-primary text-2xl">Timeline</h2>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-6">
                <div className="relative w-4 h-4 mt-2">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full shadow-lg"></div>
                  <div className="absolute inset-0 bg-green-400 rounded-full opacity-30 animate-ping"></div>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-text-primary text-lg">
                    ส่งคำขอสมัคร
                  </p>
                  <p className="text-zinc-300 text-sm bg-zinc-800/50 px-3 py-1 rounded-lg inline-block mt-1">
                    {existingGym.created_at
                      ? new Date(existingGym.created_at).toLocaleDateString(
                          "th-TH",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )
                      : "ไม่ระบุ"}
                  </p>
                </div>
              </div>

              {applicationStatus === "pending" && (
                <div className="flex items-start gap-6">
                  <div className="relative w-4 h-4 mt-2">
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-lg animate-pulse"></div>
                    <div className="absolute inset-0 bg-yellow-400 rounded-full opacity-30 animate-ping"></div>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-text-primary text-lg">
                      กำลังตรวจสอบ
                    </p>
                    <p className="text-zinc-300 text-sm">
                      ทีมงานกำลังตรวจสอบข้อมูล
                    </p>
                  </div>
                </div>
              )}

              {applicationStatus === "approved" && (
                <div className="flex items-start gap-6">
                  <div className="relative w-4 h-4 mt-2">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full shadow-lg"></div>
                    <div className="absolute inset-0 bg-green-400 rounded-full opacity-30 animate-ping"></div>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-text-primary text-lg">
                      อนุมัติแล้ว
                    </p>
                    <p className="text-zinc-300 text-sm bg-zinc-800/50 px-3 py-1 rounded-lg inline-block mt-1">
                      {existingGym.updated_at
                        ? new Date(existingGym.updated_at).toLocaleDateString(
                            "th-TH",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )
                        : "ไม่ระบุ"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Services and Images */}
        <div className="group bg-gradient-to-br from-zinc-900/60 to-zinc-800/40 backdrop-blur-md border border-zinc-700/50 rounded-3xl p-8 mb-12 shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 hover:border-purple-500/30">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-2xl border border-purple-500/30">
              <span className="text-3xl">📋</span>
            </div>
            <h2 className="font-bold text-text-primary text-2xl">
              รายละเอียดเพิ่มเติม
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Services */}
            {existingGym.services && existingGym.services.length > 0 && (
              <div className="space-y-6">
                <h3 className="flex items-center gap-3 font-bold text-text-primary text-xl">
                  <div className="p-2 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-xl border border-orange-500/30">
                    <span className="text-2xl">🏋️</span>
                  </div>
                  บริการที่ให้
                </h3>
                <div className="flex flex-wrap gap-3">
                  {existingGym.services.map((service, index) => (
                    <span
                      key={index}
                      className="group/tag bg-gradient-to-r from-red-500/20 to-red-600/20 px-4 py-2 border border-red-500/30 rounded-2xl text-red-400 text-sm font-semibold hover:from-red-500/30 hover:to-red-600/30 hover:border-red-500/50 transition-all duration-200 hover:scale-105 cursor-default"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Images */}
            {existingGym.images && existingGym.images.length > 0 && (
              <div className="space-y-6">
                <h3 className="flex items-center gap-3 font-bold text-text-primary text-xl">
                  <div className="p-2 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl border border-blue-500/30">
                    <span className="text-2xl">📸</span>
                  </div>
                  รูปภาพยิม
                </h3>
                <div className="gap-4 grid grid-cols-2">
                  {existingGym.images.map((image, index) => (
                    <div
                      key={index}
                      className="relative w-full h-36 group cursor-pointer overflow-hidden rounded-2xl"
                    >
                      <Image
                        src={image}
                        alt={`Gym image ${index + 1}`}
                        fill
                        className="object-cover transition-all duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute inset-0 border-2 border-white/0 group-hover:border-white/30 transition-colors duration-300 rounded-2xl"></div>
                      <div className="absolute bottom-2 left-2 right-2 text-text-primary text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        รูปภาพ {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          {applicationStatus === "approved" && (
            <Link
              href="/partner/dashboard"
              className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 hover:from-green-600 hover:via-emerald-600 hover:to-green-700 px-10 py-4 rounded-2xl font-bold text-text-primary text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/25"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
              <span className="text-2xl animate-bounce">🎉</span>
              <span>เข้าสู่ Partner Dashboard</span>
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </Link>
          )}

          {applicationStatus === "pending" && (
            <div className="text-center space-y-6">
              <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-2xl p-6">
                <p className="text-zinc-300 text-lg mb-4">
                  มีคำถามหรือต้องการติดต่อทีมงาน?
                </p>
                <a
                  href="mailto:support@thaikick-muaythai.com"
                  className="group inline-flex items-center gap-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 px-8 py-3 rounded-xl font-bold text-text-primary transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-blue-500/25"
                >
                  <span className="text-xl">📧</span>
                  <span>ติดต่อทีมงาน</span>
                </a>
              </div>
            </div>
          )}

          {applicationStatus === "denied" && (
            <div className="text-center space-y-6">
              <div className="bg-gradient-to-r from-red-500/10 to-rose-500/10 border border-red-500/30 rounded-2xl p-6">
                <p className="text-zinc-300 text-lg mb-6">
                  ต้องการสมัครใหม่หรือมีคำถาม?
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="mailto:support@thaikick-muaythai.com"
                    className="group inline-flex items-center gap-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 px-6 py-3 rounded-xl font-bold text-text-primary transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-blue-500/25"
                  >
                    <span className="text-lg">📧</span>
                    <span>ติดต่อทีมงาน</span>
                  </a>
                  <button
                    onClick={() => window.location.reload()}
                    className="group inline-flex items-center gap-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 px-6 py-3 rounded-xl font-bold text-text-primary transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-yellow-500/25"
                  >
                    <span className="text-lg">🔄</span>
                    <span>ลองใหม่</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <Link
            href="/"
            className="group inline-flex items-center gap-3 bg-gradient-to-r from-zinc-600 to-zinc-700 hover:from-zinc-700 hover:to-zinc-800 px-8 py-3 rounded-xl font-bold text-text-primary transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
          >
            <span className="text-lg">🏠</span>
            <span>กลับหน้าหลัก</span>
          </Link>
        </div>
      </div>
    </div>
  );
};