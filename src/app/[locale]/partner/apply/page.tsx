"use client";

import { useState, useEffect } from "react";
import { Link } from '@/navigation';
import { BuildingStorefrontIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { TermsModal } from "@/components/features/modals";
import { usePartnerApplication } from "./hooks/usePartnerApplication";
import { useFileUpload } from "./hooks/useFileUpload";
import { useFormSubmission } from "./hooks/useFormSubmission";
import { LoadingView } from "./components/LoadingView";
import { SuccessView } from "./components/SuccessView";
import { ApplicationStatusView } from "./components/ApplicationStatusView";
import { BasicInformationForm } from "./components/BasicInformationForm";
import { GymDetailsForm } from "./components/GymDetailsForm";
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
    existingGym,
    setExistingGym,
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
    gymName: "",
    gymNameEnglish: "",
    contactName: "",
    phone: "",
    email: "",
    website: "",
    address: "",
    description: "",
    services: [],
    termsAccepted: false,
  });

  // Terms modal state
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form submission hook
  const { submitForm, isSubmitting, submitError, errors, setErrors } = useFormSubmission({
    supabase,
    user,
    onSuccess: (gym) => {
      setIsSuccess(true);
      setExistingGym(gym);
      setApplicationStatus("pending");
      // Reset form
      setFormData({
        gymName: "",
        gymNameEnglish: "",
        contactName: "",
        phone: "",
        email: "",
        website: "",
        address: "",
        description: "",
        services: [],
        termsAccepted: false,
      });
      clearFiles();
    },
  });

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

  // Show application status if user already has a gym application
  if (existingGym && applicationStatus !== "none" && applicationStatus !== "denied") {
    return (
      <ApplicationStatusView
        existingGym={existingGym}
        applicationStatus={applicationStatus}
      />
    );
  }

  // If denied, allow reapplication
  if (existingGym && applicationStatus === "denied") {
    setExistingGym(null);
    setApplicationStatus("none");
  }

  return (
    <div className="bg-zinc-950 min-h-screen">
      {/* Terms Modal */}
      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={handleTermsAccepted}
        gymName={formData.gymName || "ยิมของคุณ"}
      />

      {/* Hero Section */}
      <div className="bg-linear-to-br from-red-900/20 to-zinc-950 mt-16">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-7xl">
          <div className="text-center">
            <h1 className="mb-4 font-bold text-white text-4xl md:text-5xl">
              สมัครเข้าร่วมเป็น Partner Gym
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
          />

          {/* Gym Details */}
          <GymDetailsForm
            formData={formData}
            errors={errors}
            onInputChange={handleInputChange}
            onServiceToggle={handleServiceToggle}
            selectedFiles={selectedFiles}
            fileErrors={fileErrors}
            onFileChange={handleFileChange}
            onRemoveFile={removeFile}
          />

          {/* Terms & Conditions */}
          <TermsSection
            formData={formData}
            errors={errors}
            onInputChange={handleInputChange}
          />

          {/* Submit Error Display */}
          {submitError && (
            <div className="bg-red-500/20 p-4 border border-red-500 rounded-lg">
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
              className="flex justify-center items-center gap-3 bg-brand-primary hover:bg-red-600 disabled:bg-zinc-600 shadow-lg px-8 py-4 rounded-lg w-full font-bold text-white text-lg hover:scale-[1.02] transition-all disabled:cursor-not-allowed transform"
             aria-label="Button">
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
              support@muaythai.com
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
