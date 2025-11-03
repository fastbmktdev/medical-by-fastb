import { DocumentTextIcon, PhotoIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { FormData, FormErrors, SERVICE_OPTIONS } from "../types";

interface GymDetailsFormProps {
  formData: FormData;
  errors: FormErrors;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onServiceToggle: (service: string) => void;
  selectedFiles: File[];
  fileErrors: string[];
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
}

export const GymDetailsForm = ({
  formData,
  errors,
  onInputChange,
  onServiceToggle,
  selectedFiles,
  fileErrors,
  onFileChange,
  onRemoveFile,
}: GymDetailsFormProps) => {
  return (
    <div className="bg-zinc-950 shadow-xl p-6 md:p-8 rounded-xl">
      <h2 className="flex items-center gap-3 mb-6 font-semibold text-white text-2xl">
        <DocumentTextIcon className="w-7 h-7 text-blue-500" />
        ข้อมูลยิมเบื้องต้น
      </h2>

      <div className="space-y-6">
        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block mb-2 font-medium text-zinc-300 text-sm"
          >
            รายละเอียดยิม
          </label>
          <p className="mb-3 text-zinc-500 text-xs">
            ประเภทคอร์ส, จำนวนเวทีมวย, ความจุคน, จุดเด่น, อุปกรณ์, เวลาเปิด-ปิด ฯลฯ
          </p>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={onInputChange}
            rows={6}
            className="bg-zinc-700 px-4 py-3 border border-zinc-600 focus:border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 w-full text-white resize-none placeholder-zinc-500"
            placeholder="เช่น: ยิมมวยไทยขนาดใหญ่ มีเวที 2 เวที รองรับได้ 50 คน เปิดทุกวัน 06:00-22:00 มีครูมืออาชีพ 10 คน..."
          />
        </div>

        {/* Services */}
        <div>
          <label className="block mb-3 font-medium text-zinc-300 text-sm">
            ประเภทบริการที่ยิมมี
          </label>
          <div className="gap-3 grid grid-cols-2 md:grid-cols-3">
            {SERVICE_OPTIONS.map((service) => (
              <label
                key={service}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  formData.services.includes(service)
                    ? "bg-brand-primary/20 border-red-500 text-white"
                    : "bg-zinc-700 border-zinc-600 text-zinc-300 hover:border-zinc-500"
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.services.includes(service)}
                  onChange={() => onServiceToggle(service)}
                  className="rounded focus:ring-red-500 w-4 h-4 text-red-600"
                />
                <span className="text-sm">{service}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block mb-2 font-medium text-zinc-300 text-sm">
            อัปโหลดรูปภาพยิม / โลโก้
          </label>
          <p className="mb-3 text-zinc-500 text-xs">
            รองรับไฟล์: JPG, PNG (ขนาดไม่เกิน 5MB ต่อไฟล์)
          </p>
          
          <label className="flex flex-col items-center gap-3 bg-zinc-700 hover:bg-zinc-600 p-6 border border-zinc-600 border-dashed rounded-lg transition-colors cursor-pointer">
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
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center bg-zinc-700 p-3 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <PhotoIcon className="w-5 h-5 text-blue-400" />
                    <span className="max-w-[200px] font-mono text-white text-sm truncate">
                      {file.name}
                    </span>
                    <span className="text-zinc-500 text-xs">
                      ({(file.size / 1024).toFixed(1)} KB)
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
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

