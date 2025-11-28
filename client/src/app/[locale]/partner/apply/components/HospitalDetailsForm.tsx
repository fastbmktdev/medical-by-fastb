import React from "react";
import { DocumentTextIcon, PhotoIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { FormData, FormErrors, SERVICE_OPTIONS } from "../types";

interface HospitalDetailsFormProps {
  formData: FormData;
  errors: FormErrors;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onServiceToggle: (service: string) => void;
  selectedFiles: File[];
  fileErrors: string[];
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
}

export const HospitalDetailsForm: React.FC<HospitalDetailsFormProps> = ({
  formData,
  errors,
  onInputChange,
  onBlur,
  onServiceToggle,
  selectedFiles,
  fileErrors,
  onFileChange,
  onRemoveFile,
}) => {
  return (
    <div className="bg-zinc-100 shadow-xl p-6 md:p-8 ">
      <h2 className="flex items-center gap-3 mb-6 font-semibold text-zinc-950 text-2xl">
        <DocumentTextIcon className="w-7 h-7 text-blue-500" />
        ข้อมูลโรงพยาบาลเบื้องต้น
      </h2>

      <div className="space-y-6">
        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block mb-2 font-medium text-zinc-950 text-sm"
          >
            รายละเอียดโรงพยาบาล
          </label>
          <p className="mb-3 text-zinc-950 text-xs">
            ประเภทคอร์ส, จำนวนห้องตรวจ, ความจุคน, จุดเด่น, อุปกรณ์, เวลาเปิด-ปิด ฯลฯ
          </p>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={onInputChange}
            onBlur={onBlur}
            rows={6}
            className="bg-zinc-100 px-4 py-3 border border-zinc-600 focus:border-transparent  focus:outline-none focus:ring-2 focus:ring-red-500 w-full text-white resize-none placeholder-zinc-500"
            placeholder="เช่น: โรงพยาบาลการแพทย์ขนาดใหญ่ มีเวที 2 เวที รองรับได้ 50 คน เปิดทุกวัน 06:00-22:00 มีแพทย์มืออาชีพ 10 คน..."
          />
        </div>

        {/* Services */}
        <div>
          <label className="block mb-3 font-medium text-zinc-300 text-sm">
            ประเภทบริการที่โรงพยาบาลมี
          </label>
          <div className="gap-3 grid grid-cols-2 md:grid-cols-3">
            {SERVICE_OPTIONS.map((service) => (
              <label
                key={service}
                className={`flex items-center gap-3 p-3  border cursor-pointer transition-all ${
                  formData.services.includes(service)
                    ? "bg-brand-primary/20 border-red-500 text-white"
                    : "bg-zinc-100 border-zinc-600 text-zinc-300 hover:border-zinc-500"
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.services.includes(service)}
                  onChange={() => onServiceToggle(service)}
                  className=" focus:ring-red-500 w-4 h-4 text-red-600"
                />
                <span className="text-sm">{service}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block mb-2 font-medium text-zinc-300 text-sm">
            อัปโหลดรูปภาพโรงพยาบาล / โลโก้ <span className="text-zinc-500 font-normal">(ไม่บังคับ)</span>
          </label>
          <div className="mb-3 p-3 border border-blue-500/30 bg-blue-500/10 ">
            <p className="text-blue-300 text-xs font-medium mb-1">
              📸 ข้อกำหนดไฟล์:
            </p>
            <ul className="text-blue-200/80 text-xs space-y-0.5 ml-4 list-disc">
              <li>ประเภทไฟล์: JPG, PNG, WebP</li>
              <li>ขนาดไฟล์: <strong className="text-blue-200">ไม่เกิน 5MB ต่อไฟล์</strong></li>
              <li>ความละเอียดแนะนำ: 800x600 px ขึ้นไป</li>
              <li>จำนวน: ไม่จำกัด (แนะนำ 3-5 รูป)</li>
            </ul>
          </div>
          
          <label className="flex flex-col items-center gap-3 bg-zinc-100 hover:bg-zinc-600 p-6 border border-zinc-600 border-dashed  transition-colors cursor-pointer">
            <PhotoIcon className="w-12 h-12 text-zinc-400" />
            <span className="text-zinc-300 text-sm">
              คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวาง
            </span>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png"
              onChange={onFileChange}
              className="hidden"
            />
          </label>

          {/* File Upload Errors */}
          {fileErrors.length > 0 && (
            <div className="space-y-1 mt-3">
              {fileErrors.map((error, index) => (
                <p key={index} className="flex items-center gap-1 text-red-400 text-sm">
                  <ExclamationTriangleIcon className="w-4 h-4" />
                  {error}
                </p>
              ))}
            </div>
          )}

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2 mt-4">
              {selectedFiles.map((file, index) => {
                const fileSizeMB = file.size / 1024 / 1024;
                const isLargeFile = fileSizeMB > 4; // ไฟล์ใหญ่กว่า 4MB (ใกล้ขีดจำกัด 5MB)
                const isTooLarge = fileSizeMB > 5; // เกินขีดจำกัด

                return (
                  <div
                    key={index}
                    className={`flex justify-between items-center p-3  ${
                      isTooLarge
                        ? 'bg-red-900/30 border border-red-500'
                        : isLargeFile
                        ? 'bg-yellow-900/20 border border-yellow-500/50'
                        : 'bg-zinc-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <PhotoIcon className={`w-5 h-5 ${
                        isTooLarge ? 'text-red-400' : 'text-blue-400'
                      }`} />
                      <span className={`max-w-[200px] font-mono text-sm truncate ${
                        isTooLarge ? 'text-red-300' : 'text-white'
                      }`}>
                        {file.name}
                      </span>
                      <span className={`text-xs ${
                        isTooLarge
                          ? 'text-red-400 font-semibold'
                          : isLargeFile
                          ? 'text-yellow-400 font-medium'
                          : 'text-zinc-500'
                      }`}>
                        ({file.size >= 1024 * 1024
                          ? `${fileSizeMB.toFixed(2)} MB`
                          : `${(file.size / 1024).toFixed(1)} KB`})
                        {isTooLarge && ' - เกินขนาด!'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveFile(index)}
                      className="text-red-400 hover:text-red-300 text-sm transition-colors"
                    >
                      ลบ
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};