import {
  BuildingStorefrontIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { FormData, FormErrors } from "../types";

interface BasicInformationFormProps {
  formData: FormData;
  errors: FormErrors;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onBlur: (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
}

const ErrorMessage = ({
  error,
}: {
  error?: string;
}) =>
  error ? (
    <p className="flex items-center gap-1 mt-2 text-red-400 text-sm">
      <ExclamationTriangleIcon className="w-4 h-4" />
      {error}
    </p>
  ) : null;

const InputField = ({
  id,
  name,
  type = "text",
  value,
  onChange,
  onBlur,
  error,
  label,
  placeholder,
  leftIcon,
  className = "",
  labelClassName = "",
  inputClassName = "",
  required = false,
  ...props
}: {
  id: string;
  name: string;
  type?: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  onBlur: React.FocusEventHandler<HTMLInputElement>;
  error?: string;
  label: React.ReactNode;
  placeholder?: string;
  leftIcon?: React.ReactNode;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
  required?: boolean;
  [key: string]: any;
}) => (
  <div className={className}>
    <label
      htmlFor={id}
      className={`block mb-2 font-medium ${labelClassName} text-sm`}
    >
      {label}
      {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      {leftIcon}
      <input
        type={type}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className={inputClassName}
        placeholder={placeholder}
        {...props}
      />
    </div>
    <ErrorMessage error={error} />
  </div>
);

const TextAreaField = ({
  id,
  name,
  value,
  onChange,
  onBlur,
  error,
  label,
  placeholder,
  leftIcon,
  className = "",
  labelClassName = "",
  textAreaClassName = "",
  required = false,
  ...props
}: {
  id: string;
  name: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLTextAreaElement>;
  onBlur: React.FocusEventHandler<HTMLTextAreaElement>;
  error?: string;
  label: React.ReactNode;
  placeholder?: string;
  leftIcon?: React.ReactNode;
  className?: string;
  labelClassName?: string;
  textAreaClassName?: string;
  required?: boolean;
  [key: string]: any;
}) => (
  <div className={className}>
    <label
      htmlFor={id}
      className={`block mb-2 font-medium ${labelClassName} text-sm`}
    >
      {label}
      {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      {leftIcon}
      <textarea
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className={textAreaClassName}
        placeholder={placeholder}
        {...props}
      />
    </div>
    <ErrorMessage error={error} />
  </div>
);

export const BasicInformationForm = ({
  formData,
  errors,
  onInputChange,
  onBlur,
}: BasicInformationFormProps) => {
  return (
    <div className="bg-zinc-100 shadow-xl p-6 md:p-8 ">
      <h2 className="flex items-center gap-3 mb-6 font-semibold text-zinc-950 text-2xl">
        <BuildingStorefrontIcon className="w-7 h-7 text-violet-700" />
        ข้อมูลพื้นฐาน
      </h2>

      <div className="space-y-6">
        {/* hospital Name */}
        <InputField
          id="hospitalName"
          name="hospitalName"
          value={formData.hospitalName}
          onChange={onInputChange}
          onBlur={onBlur}
          error={errors.hospitalName}
          label="ชื่อโรงพยาบาล (ภาษาไทย)"
          placeholder="เช่น: โรงพยาบาลการแพทย์เสือ"
          required
          labelClassName="text-zinc-950"
          inputClassName={`w-full bg-zinc-100/60 border text-zinc-950 ${
            errors.hospitalName ? "border-red-500" : "border-zinc-600"
          }  px-4 py-3 text-zinc-950 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent font-mono`}
        />

        {/* hospital Name English */}
        <div>
          <InputField
            id="hospitalNameEnglish"
            name="hospitalNameEnglish"
            value={formData.hospitalNameEnglish}
            onChange={onInputChange}
            onBlur={onBlur}
            error={errors.hospitalNameEnglish}
            label="ชื่อโรงพยาบาล (English)"
            placeholder="e.g., Tiger Medical hospital"
            labelClassName="text-zinc-950"
            inputClassName={`w-full bg-zinc-100/60 border ${
              errors.hospitalNameEnglish ? "border-red-500" : "border-zinc-600"
            }  px-4 py-3 text-zinc-950 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent font-mono`}
          />
          <p className="mt-2 text-zinc-400 text-xs">
            ใช้สำหรับสร้าง URL ของโรงพยาบาล เช่น /hospitals/tiger-medical-hospital
          </p>
        </div>

        {/* Contact Name */}
        <InputField
          id="contactName"
          name="contactName"
          value={formData.contactName}
          onChange={onInputChange}
          onBlur={onBlur}
          error={errors.contactName}
          label="ชื่อผู้ติดต่อหลัก"
          placeholder="เช่น: สมชาย ใจดี"
          required
          labelClassName="text-zinc-950"
          leftIcon={
            <UserIcon className="top-3.5 left-3 absolute w-5 h-5 text-zinc-500" />
          }
          inputClassName={`w-full bg-zinc-100/60 border ${
            errors.contactName ? "border-red-500" : "border-zinc-600"
          }  px-4 py-3 pl-10 text-zinc-950 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
        />

        {/* Phone and Email */}
        <div className="gap-6 grid grid-cols-1 md:grid-cols-2">
          <InputField
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={onInputChange}
            onBlur={onBlur}
            error={errors.phone}
            label="เบอร์โทรศัพท์"
            placeholder="0812345678"
            required
            labelClassName="text-zinc-950"
            leftIcon={
              <PhoneIcon className="top-3.5 left-3 absolute w-5 h-5 text-zinc-500" />
            }
            inputClassName={`w-full bg-zinc-100/60 border ${
              errors.phone ? "border-red-500" : "border-zinc-600"
            }  px-4 py-3 pl-10 text-zinc-950 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent font-mono`}
          />

          <InputField
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={onInputChange}
            onBlur={onBlur}
            error={errors.email}
            label="อีเมลผู้ติดต่อ"
            placeholder="contact@hospital.com"
            required
            labelClassName="text-zinc-950"
            leftIcon={
              <EnvelopeIcon className="top-3.5 left-3 absolute w-5 h-5 text-zinc-500" />
            }
            inputClassName={`w-full bg-zinc-100/60 border ${
              errors.email ? "border-red-500" : "border-zinc-600"
            }  px-4 py-3 pl-10 text-zinc-950 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent font-mono`}
          />
        </div>

        {/* Website */}
        <InputField
          id="website"
          name="website"
          value={formData.website}
          onChange={onInputChange}
          onBlur={onBlur}
          error={undefined}
          label={
            <>
              เว็บไซต์หรือโซเชียลมีเดีย
              <span className="ml-2 text-zinc-500 text-xs">(ถ้ามี)</span>
            </>
          }
          placeholder="https://www.example.com หรือ @facebook_page"
          labelClassName="text-zinc-950"
          leftIcon={
            <GlobeAltIcon className="top-3.5 left-3 absolute w-5 h-5 text-zinc-500" />
          }
          inputClassName="bg-zinc-100/60 px-4 py-3 pl-10 border border-zinc-600 focus:border-transparent  focus:outline-none focus:ring-2 focus:ring-violet-500 w-full font-mono text-zinc-950 placeholder-zinc-500"
        />

        {/* Address */}
        <TextAreaField
          id="address"
          name="address"
          value={formData.address}
          onChange={onInputChange}
          onBlur={onBlur}
          error={errors.address}
          label="ที่อยู่ / โลเคชั่น"
          placeholder="เลขที่, ซอก, ถนน, แขวง/ตำบล, เขต/อำเภอ, จังหวัด, รหัสไปรษณีย์"
          required
          labelClassName="text-zinc-950"
          leftIcon={
            <MapPinIcon className="top-3.5 left-3 absolute w-5 h-5 text-zinc-500" />
          }
          textAreaClassName={`w-full bg-zinc-100/60 border ${
            errors.address ? "border-red-500" : "border-zinc-600"
          }  px-4 py-3 pl-10 text-zinc-950 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none`}
          rows={3}
        />
      </div>
    </div>
  );
};
