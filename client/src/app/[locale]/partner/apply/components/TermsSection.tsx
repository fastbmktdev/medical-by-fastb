import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { FormData, FormErrors } from "../types";

interface TermsSectionProps {
  formData: FormData;
  errors: FormErrors;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export const TermsSection = ({ formData, errors, onInputChange }: TermsSectionProps) => {
  return (
    <div className="bg-zinc-100 shadow-xl p-6 md:p-8 ">
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          name="termsAccepted"
          checked={formData.termsAccepted}
          onChange={onInputChange}
          className={`mt-1 w-5 h-5  text-red-600 focus:ring-red-500 ${
            errors.termsAccepted ? "border-red-500" : ""
          }`}
        />
        <div className="flex-1">
          <span className="text-zinc-950">
            ยืนยันว่าข้อมูลที่กรอกถูกต้องและรับทราบเงื่อนไขการสมัคร{" "}
            <span className="text-red-500">*</span>
          </span>
          <p className="mt-2 text-zinc-500 text-sm">
            ข้อมูลของคุณจะถูกใช้เพื่อการติดต่อและประเมินการเป็นพันธมิตรเท่านั้น
            เราจะรักษาความลับของข้อมูลตามนโยบายความเป็นส่วนตัว
          </p>
        </div>
      </label>
      {errors.termsAccepted && (
        <p className="flex items-center gap-1 mt-3 text-red-400 text-sm">
          <ExclamationTriangleIcon className="w-4 h-4" />
          {errors.termsAccepted}
        </p>
      )}
    </div>
  );
};

