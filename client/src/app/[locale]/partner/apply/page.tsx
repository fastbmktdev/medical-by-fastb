"use client";

import { useState, useEffect } from "react";
import { Link } from "@/navigation";
import {
  BuildingStorefrontIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { TermsModal } from "@/components/features/modals";
import { usePartnerApplication } from "./hooks/usePartnerApplication";
import { useFileUpload } from "./hooks/useFileUpload";
import { useFormSubmission } from "./hooks/useFormSubmission";
import { LoadingView } from "./components/LoadingView";
import { SuccessView } from "./components/SuccessView";
import { ApplicationStatusView } from "./components/ApplicationStatusView";
import { BasicInformationForm } from "./components/BasicInformationForm";
import { hospitalDetailsForm as HospitalDetailsForm } from "./components/HospitalDetailsForm";
import { IdCardUpload } from "./components/IdCardUpload";
import { TermsSection } from "./components/TermsSection";
import { FormData } from "./types";
import { injectStyles } from "./utils/styles";
import { LoadingSpinner } from "@/components/design-system/primitives/Loading";

export default function PartnerApplyPage() {
  // Inject custom styles
  useEffect(() => {
    injectStyles();
  }, []);

  // Partner application hook
  const {
    user,
    isLoading,
    applicationStatus,
    existingHospital,
    setExistingHospital,
    setApplicationStatus,
    supabase,
  } = usePartnerApplication();

  // File upload hook
  const {
    selectedFiles,
    fileErrors,
    handleFileChange,
    removeFile,
    clearFiles,
  } = useFileUpload();

  // Form state
  const [formData, setFormData] = useState<FormData>({
    hospitalName: "",
    hospitalNameEnglish: "",
    contactName: "",
    phone: "",
    email: "",
    website: "",
    address: "",
    description: "",
    services: [],
    termsAccepted: false,
    idCardUrl: "",
    idCardOriginalUrl: "",
  });

  // ID card paths for deletion (if needed in future)
  const [_idCardPaths, setIdCardPaths] = useState<{
    originalPath: string;
    watermarkedPath: string;
  }>({ originalPath: "", watermarkedPath: "" });

  // Terms modal state
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form submission hook
  const { submitForm, isSubmitting, submitError, errors, setErrors } =
    useFormSubmission({
      supabase,
      user,
      onSuccess: (hospital) => {
        setIsSuccess(true);
        setExistingHospital(hospital);
        setApplicationStatus("pending");
        // Reset form
        setFormData({
          hospitalName: "",
          hospitalNameEnglish: "",
          contactName: "",
          phone: "",
          email: "",
          website: "",
          address: "",
          description: "",
          services: [],
          termsAccepted: false,
          idCardUrl: "",
          idCardOriginalUrl: "",
        });
        setIdCardPaths({ originalPath: "", watermarkedPath: "" });
        clearFiles();
      },
    });

  /**
   * Validate individual field
   * @param fieldName - Name of the field to validate
   * @param value - Value to validate (optional, uses formData if not provided)
   * @returns Error message or empty string if valid
   */
  const validateField = (fieldName: string, value?: string): string => {
    const val =
      value !== undefined
        ? value
        : (formData[fieldName as keyof FormData] as string);

    switch (fieldName) {
      case "hospitalName":
        if (!val || !val.trim()) {
          return "กรุณากรอกชื่อโรงพยาบาล";
        } else if (val.trim().length < 3) {
          return "ชื่อโรงพยาบาลต้องมีอย่างน้อย 3 ตัวอักษร";
        }
        return "";

      case "contactName":
        if (!val || !val.trim()) {
          return "กรุณากรอกชื่อผู้ติดต่อ";
        } else if (val.trim().length < 2) {
          return "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร";
        }
        return "";

      case "phone":
        if (!val || !val.trim()) {
          return "กรุณากรอกเบอร์โทรศัพท์";
        } else if (!/^(0[6-9])\d{8}$/.test(val)) {
          return "รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง (เช่น 0812345678)";
        }
        return "";

      case "email":
        if (!val || !val.trim()) {
          return "กรุณากรอกอีเมล";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
          return "รูปแบบอีเมลไม่ถูกต้อง";
        }
        return "";

      case "address":
        if (!val || !val.trim()) {
          return "กรุณากรอกที่อยู่";
        } else if (val.trim().length < 10) {
          return "ที่อยู่ต้องมีอย่างน้อย 10 ตัวอักษร";
        }
        return "";

      case "hospitalNameEnglish":
        // Optional field, only validate if provided
        if (val && val.trim() && val.trim().length < 3) {
          return "ชื่อโรงพยาบาล (English) ต้องมีอย่างน้อย 3 ตัวอักษร";
        }
        return "";

      case "website":
        // Optional field, only validate if provided
        if (val && val.trim()) {
          const urlPattern =
            /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
          const socialPattern = /^@[\w\.]+$/;
          if (!urlPattern.test(val) && !socialPattern.test(val)) {
            return "รูปแบบ URL หรือโซเชียลมีเดียไม่ถูกต้อง";
          }
        }
        return "";

      default:
        return "";
    }
  };

  /**
   * Handle blur event for form fields
   * Validates the field when user leaves it
   */
  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // Skip validation for optional fields when empty
    if (
      (name === "website" ||
        name === "hospitalNameEnglish" ||
        name === "description") &&
      !value.trim()
    ) {
      return;
    }

    const error = validateField(name, value);

    if (error) {
      setErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleServiceToggle = (service: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowTermsModal(true);
  };

  const handleTermsAccepted = async () => {
    setShowTermsModal(false);
    await submitForm(formData, selectedFiles);
  };

  // Loading screen
  if (isLoading) {
    return <LoadingView />;
  }

  // Success screen
  if (isSuccess) {
    return <SuccessView />;
  }

  // Show application status if user already has a hospital application
  if (
    existingHospital &&
    applicationStatus !== "none" &&
    applicationStatus !== "denied"
  ) {
    return (
      <ApplicationStatusView
        existingHospital={existingHospital}
        applicationStatus={applicationStatus}
      />
    );
  }

  // If denied, allow reapplication
  if (existingHospital && applicationStatus === "denied") {
    setExistingHospital(null);
    setApplicationStatus("none");
  }

  return (
    <div className="bg-zinc-100 min-h-screen">
      {/* Terms Modal */}
      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={handleTermsAccepted}
        hospitalName={formData.hospitalName || "โรงพยาบาลของคุณ"}
      />

      {/* Hero Section */}
      <div className="bg-linear-to-br from-red-900/20 to-zinc-950 mt-16">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-7xl">
          <div className="text-center">
            <h1 className="mb-4 font-bold text-white text-4xl md:text-5xl">
              สมัครเข้าร่วมเป็น Partner hospital
            </h1>
            <p className="mx-auto mb-2 max-w-2xl text-zinc-300 text-xl">
              ร่วมเป็นพันธมิตรกับเรา เพื่อเข้าถึงฐานลูกค้าที่กว้างขึ้น
            </p>
            <p className="text-zinc-400">
              กรุณากรอกข้อมูลให้ครบถ้วน ทีมงานจะติดต่อกลับภายใน 3-5 วันทำการ
            </p>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <BasicInformationForm
            formData={formData}
            errors={errors}
            onInputChange={handleInputChange}
            onBlur={handleBlur}
          />

          {/* hospital Details */}
          <HospitalDetailsForm
            formData={formData}
            errors={errors}
            onInputChange={handleInputChange}
            onBlur={handleBlur}
            onServiceToggle={handleServiceToggle}
            selectedFiles={selectedFiles}
            fileErrors={fileErrors}
            onFileChange={handleFileChange}
            onRemoveFile={removeFile}
          />

          {/* ID Card Upload */}
          <IdCardUpload
            onUploadComplete={(data) => {
              setFormData((prev) => ({
                ...prev,
                idCardUrl: data.watermarkedUrl,
                idCardOriginalUrl: data.originalUrl,
              }));
              setIdCardPaths({
                originalPath: data.originalPath,
                watermarkedPath: data.watermarkedPath,
              });
              // Clear error if exists
              if (errors.idCard) {
                setErrors((prev) => {
                  const newErrors = { ...prev };
                  delete newErrors.idCard;
                  return newErrors;
                });
              }
            }}
            onUploadError={(error) => {
              setErrors((prev) => ({
                ...prev,
                idCard: error,
              }));
            }}
            currentWatermarkedUrl={formData.idCardUrl}
          />

          {/* Terms & Conditions */}
          <TermsSection
            formData={formData}
            errors={errors}
            onInputChange={handleInputChange}
          />

          {/* Submit Error Display */}
          {submitError && (
            <div className="bg-red-500/20 p-4 border border-red-500 ">
              <div className="flex items-center gap-3">
                <ExclamationTriangleIcon className="shrink-0 w-6 h-6 text-red-400" />
                <div>
                  <p className="font-semibold text-red-400">เกิดข้อผิดพลาด</p>
                  <p className="mt-1 text-red-300 text-sm">{submitError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex justify-center items-center gap-3 bg-brand-primary hover:bg-red-600 disabled:bg-zinc-600 shadow-lg px-8 py-4  w-full font-bold text-white text-lg hover:scale-[1.02] transition-all disabled:cursor-not-allowed transform"
              aria-label="ส่งใบสมัครพาร์ทเนอร์"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  กำลังส่งข้อมูล...
                </>
              ) : (
                <>
                  <BuildingStorefrontIcon className="w-6 h-6" />
                  สมัครเข้าร่วมเป็น Partner
                </>
              )}
            </button>
          </div>

          <p className="pt-2 text-zinc-500 text-sm text-center">
            หากมีคำถามหรือต้องการความช่วยเหลือ กรุณาติดต่อ{" "}
            <Link href="/contact" className="text-red-500 hover:text-red-400">
              support@medical.com
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
