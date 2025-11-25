import { 
  BuildingStorefrontIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  MapPinIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import { FormData, FormErrors } from "../types";

interface BasicInformationFormProps {
  formData: FormData;
  errors: FormErrors;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export const BasicInformationForm = ({ formData, errors, onInputChange, onBlur }: BasicInformationFormProps) => {
  return (
    <div className="bg-zinc-100 shadow-xl p-6 md:p-8 ">
      <h2 className="flex items-center gap-3 mb-6 font-semibold text-white text-2xl">
        <BuildingStorefrontIcon className="w-7 h-7 text-red-500" />
        ข้อมูลพื้นฐาน
      </h2>

      <div className="space-y-6">
        {/* hospital Name */}
        <div>
          <label
            htmlFor="hospitalName"
            className="block mb-2 font-medium text-zinc-300 text-sm"
          >
            ชื่อโรงพยาบาล (ภาษาไทย) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              id="hospitalName"
              name="hospitalName"
              value={formData.hospitalName}
              onChange={onInputChange}
              onBlur={onBlur}
              className={`w-full bg-zinc-700 border ${
                errors.hospitalName ? "border-red-500" : "border-zinc-600"
              }  px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono`}
              placeholder="เช่น: โรงพยาบาลการแพทย์เสือ"
            />
          </div>
          {errors.hospitalName && (
            <p className="flex items-center gap-1 mt-2 text-red-400 text-sm">
              <ExclamationTriangleIcon className="w-4 h-4" />
              {errors.hospitalName}
            </p>
          )}
        </div>

        {/* hospital Name English */}
        <div>
          <label
            htmlFor="hospitalNameEnglish"
            className="block mb-2 font-medium text-zinc-300 text-sm"
          >
            ชื่อโรงพยาบาล (English)
          </label>
          <div className="relative">
            <input
              type="text"
              id="hospitalNameEnglish"
              name="hospitalNameEnglish"
              value={formData.hospitalNameEnglish}
              onChange={onInputChange}
              onBlur={onBlur}
              className={`w-full bg-zinc-700 border ${
                errors.hospitalNameEnglish ? "border-red-500" : "border-zinc-600"
              }  px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono`}
              placeholder="e.g., Tiger Medical hospital"
            />
          </div>
          {errors.hospitalNameEnglish && (
            <p className="flex items-center gap-1 mt-2 text-red-400 text-sm">
              <ExclamationTriangleIcon className="w-4 h-4" />
              {errors.hospitalNameEnglish}
            </p>
          )}
          <p className="mt-2 text-zinc-400 text-xs">
            ใช้สำหรับสร้าง URL ของโรงพยาบาล เช่น /hospitals/tiger-medical-hospital
          </p>
        </div>

        {/* Contact Name */}
        <div>
          <label
            htmlFor="contactName"
            className="block mb-2 font-medium text-zinc-300 text-sm"
          >
            ชื่อผู้ติดต่อหลัก <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <UserIcon className="top-3.5 left-3 absolute w-5 h-5 text-zinc-500" />
            <input
              type="text"
              id="contactName"
              name="contactName"
              value={formData.contactName}
              onChange={onInputChange}
              onBlur={onBlur}
              className={`w-full bg-zinc-700 border ${
                errors.contactName ? "border-red-500" : "border-zinc-600"
              }  px-4 py-3 pl-10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent`}
              placeholder="เช่น: สมชาย ใจดี"
            />
          </div>
          {errors.contactName && (
            <p className="flex items-center gap-1 mt-2 text-red-400 text-sm">
              <ExclamationTriangleIcon className="w-4 h-4" />
              {errors.contactName}
            </p>
          )}
        </div>

        {/* Phone and Email */}
        <div className="gap-6 grid grid-cols-1 md:grid-cols-2">
          <div>
            <label
              htmlFor="phone"
              className="block mb-2 font-medium text-zinc-300 text-sm"
            >
              เบอร์โทรศัพท์ <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <PhoneIcon className="top-3.5 left-3 absolute w-5 h-5 text-zinc-500" />
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={onInputChange}
                onBlur={onBlur}
                className={`w-full bg-zinc-700 border ${
                  errors.phone ? "border-red-500" : "border-zinc-600"
                }  px-4 py-3 pl-10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono`}
                placeholder="0812345678"
              />
            </div>
            {errors.phone && (
              <p className="flex items-center gap-1 mt-2 text-red-400 text-sm">
                <ExclamationTriangleIcon className="w-4 h-4" />
                {errors.phone}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="email"
              className="block mb-2 font-medium text-zinc-300 text-sm"
            >
              อีเมลผู้ติดต่อ <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <EnvelopeIcon className="top-3.5 left-3 absolute w-5 h-5 text-zinc-500" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={onInputChange}
                onBlur={onBlur}
                className={`w-full bg-zinc-700 border ${
                  errors.email ? "border-red-500" : "border-zinc-600"
                }  px-4 py-3 pl-10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono`}
                placeholder="contact@hospital.com"
              />
            </div>
            {errors.email && (
              <p className="flex items-center gap-1 mt-2 text-red-400 text-sm">
                <ExclamationTriangleIcon className="w-4 h-4" />
                {errors.email}
              </p>
            )}
          </div>
        </div>

        {/* Website */}
        <div>
          <label
            htmlFor="website"
            className="block mb-2 font-medium text-zinc-300 text-sm"
          >
            เว็บไซต์หรือโซเชียลมีเดีย
            <span className="ml-2 text-zinc-500 text-xs">(ถ้ามี)</span>
          </label>
          <div className="relative">
            <GlobeAltIcon className="top-3.5 left-3 absolute w-5 h-5 text-zinc-500" />
            <input
              type="text"
              id="website"
              name="website"
              value={formData.website}
              onChange={onInputChange}
              onBlur={onBlur}
              className="bg-zinc-700 px-4 py-3 pl-10 border border-zinc-600 focus:border-transparent  focus:outline-none focus:ring-2 focus:ring-red-500 w-full font-mono text-white placeholder-zinc-500"
              placeholder="https://www.example.com หรือ @facebook_page"
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label
            htmlFor="address"
            className="block mb-2 font-medium text-zinc-300 text-sm"
          >
            ที่อยู่ / โลเคชั่น <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <MapPinIcon className="top-3.5 left-3 absolute w-5 h-5 text-zinc-500" />
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={onInputChange}
              onBlur={onBlur}
              rows={3}
              className={`w-full bg-zinc-700 border ${
                errors.address ? "border-red-500" : "border-zinc-600"
              }  px-4 py-3 pl-10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none`}
              placeholder="เลขที่, ซอก, ถนน, แขวง/ตำบล, เขต/อำเภอ, จังหวัด, รหัสไปรษณีย์"
            />
          </div>
          {errors.address && (
            <p className="flex items-center gap-1 mt-2 text-red-400 text-sm">
              <ExclamationTriangleIcon className="w-4 h-4" />
              {errors.address}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

