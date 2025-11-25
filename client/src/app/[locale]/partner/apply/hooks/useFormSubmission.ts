import { useState } from "react";
import { SupabaseClient } from "@supabase/supabase-js";
import { User } from "@supabase/supabase-js";
import { FormData, HospitalData } from "../types";
import { validateForm } from "../utils/validation";
import { uploadImages } from "../utils/fileUpload";

interface UseFormSubmissionProps {
  supabase: SupabaseClient;
  user: User | null;
  onSuccess: (hospital: HospitalData) => void;
}

export const useFormSubmission = ({ supabase, user, onSuccess }: UseFormSubmissionProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submitForm = async (formData: FormData, selectedFiles: File[]) => {
    // Validate form data
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return false;
    }

    // Check if ID card is uploaded
    if (!formData.idCardUrl || !formData.idCardOriginalUrl) {
      setErrors({ idCard: "กรุณาอัปโหลดบัตรประชาชน" });
      setSubmitError("กรุณาอัปโหลดบัตรประชาชนก่อนส่งใบสมัคร");
      return false;
    }

    // Check if user is authenticated
    if (!user) {
      setSubmitError("กรุณาเข้าสู่ระบบก่อนสมัคร");
      return false;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setErrors({});

    try {
      // Step 1: Upload images to Supabase Storage
      let imageUrls: string[] = [];
      if (selectedFiles.length > 0) {
        imageUrls = await uploadImages(supabase, selectedFiles, user.id);
      }

      // Step 2: Insert hospital data into hospitals table
      const hospitalData: Omit<HospitalData, "id"> = {
        user_id: user.id,
        hospital_name: formData.hospitalName,
        hospital_name_english: formData.hospitalNameEnglish || undefined,
        contact_name: formData.contactName,
        phone: formData.phone,
        email: formData.email,
        website: formData.website || undefined,
        location: formData.address,
        hospital_details: formData.description || undefined,
        services: formData.services,
        images: imageUrls,
        status: "pending",
        id_card_url: formData.idCardUrl,
        id_card_original_url: formData.idCardOriginalUrl,
      };

      const { data: insertedHospital, error: insertError } = await supabase
        .from("hospitals")
        .insert(hospitalData)
        .select()
        .maybeSingle();

      if (insertError) {
        throw new Error("ไม่สามารถบันทึกข้อมูลโรงพยาบาลได้: " + insertError.message);
      }

      if (!insertedHospital) {
        throw new Error("ไม่สามารถรับข้อมูลโรงพยาบาลที่สร้างใหม่ได้");
      }

      // Success! Call the success callback
      onSuccess(insertedHospital);
      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่อีกครั้ง";
      setSubmitError(errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitForm,
    isSubmitting,
    submitError,
    errors,
    setErrors,
  };
};
