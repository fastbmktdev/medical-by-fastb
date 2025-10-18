"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  BuildingStorefrontIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  MapPinIcon,
  DocumentTextIcon,
  PhotoIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import TermsModal from "@/components/modals/TermsModal";

/**
 * Interface for partner application form data
 * Maps to the gyms table in Supabase
 */
interface FormData {
  gymName: string;
  contactName: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  description: string;
  services: string[];
  termsAccepted: boolean;
}

/**
 * Interface for form validation errors
 */
interface FormErrors {
  [key: string]: string;
}


/**
 * Interface for gym data in Supabase
 */
interface GymData {
  id?: string;
  user_id: string;
  gym_name: string;
  contact_name: string;
  phone: string;
  email: string;
  website?: string;
  location: string;
  gym_details?: string;
  services: string[];
  images?: string[];
  status?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Application status enum
 */
type ApplicationStatus = "pending" | "approved" | "denied" | "none";

export default function PartnerApplyPage() {
  // Router for navigation
  const router = useRouter();
  
  // Supabase client instance
  const supabase = createClient();
  
  // Authentication and user state
  const [user, setUser] = useState<User | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus>("none");
  const [existingGym, setExistingGym] = useState<GymData | null>(null);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    gymName: "",
    contactName: "",
    phone: "",
    email: "",
    website: "",
    address: "",
    description: "",
    services: [],
    termsAccepted: false,
  });

  // File upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  
  // Form validation and submission state
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Terms modal state
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Service options for gym types
  const serviceOptions = [
    "มวยไทย",
    "ฟิตเนส",
    "เทรนนิ่งเด็ก",
    "Private Class",
    "คลาสกลุ่ม",
    "เทรนนิ่งมืออาชีพ",
    "คอร์สลดน้ำหนัก",
    "โยคะ/พิลาทิส"
  ];

  /**
   * Verify user authentication and check their role
   * If authenticated, fetch their role and check for existing applications
   */
  const checkAuthAndRole = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Get current session from Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        // User is not logged in, redirect to login page
        router.push("/login?redirect=/partner/apply");
        return;
      }

      const currentUser = session.user;
      setUser(currentUser);

      // Fetch user role from user_roles table
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", currentUser.id)
        .single();

      if (roleError && roleError.code !== "PGRST116") {
        // Silently handle errors
      }

      const currentRole = roleData?.role || "authenticated";
      setUserRole(currentRole);

      // Check if user already has a gym application
      const { data: gymData, error: gymError } = await supabase
        .from("gyms")
        .select("*")
        .eq("user_id", currentUser.id)
        .single();

      if (gymError) {
        if (gymError.code === "42P01") {
          setSubmitError("Database tables not set up. Please contact administrator.");
        }
        // Silently handle other errors
      } else if (gymData) {
        // User already has an application
        setExistingGym(gymData);
        setApplicationStatus(gymData.status || "pending");
      }

    } catch {
      router.push("/login?redirect=/partner/apply");
    } finally {
      setIsLoading(false);
    }
  }, [router, supabase]);

  /**
   * Check authentication status and user role on component mount
   * Redirects to login if not authenticated
   * Fetches user role and existing gym application
   */
  useEffect(() => {
    checkAuthAndRole();
  }, [checkAuthAndRole]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required fields validation
    if (!formData.gymName.trim()) {
      newErrors.gymName = "กรุณากรอกชื่อยิม";
    }

    if (!formData.contactName.trim()) {
      newErrors.contactName = "กรุณากรอกชื่อผู้ติดต่อ";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "กรุณากรอกเบอร์โทรศัพท์";
    } else if (!/^[0-9]{9,10}$/.test(formData.phone.replace(/-/g, ""))) {
      newErrors.phone = "เบอร์โทรศัพท์ไม่ถูกต้อง (9-10 หลัก)";
    }

    if (!formData.email.trim()) {
      newErrors.email = "กรุณากรอกอีเมล";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "รูปแบบอีเมลไม่ถูกต้อง";
    }

    if (!formData.address.trim()) {
      newErrors.address = "กรุณากรอกที่อยู่";
    }

    if (!formData.termsAccepted) {
      newErrors.termsAccepted = "กรุณายืนยันความถูกต้องและรับทราบเงื่อนไข";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

  /**
   * Handle file selection with validation
   * Validates file type and size (max 5MB per file)
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const newErrors: string[] = [];
      const validFiles: File[] = [];

      // Validate each file
      filesArray.forEach((file) => {
        // Check file type (jpg, jpeg, png only)
        const validTypes = ["image/jpeg", "image/jpg", "image/png"];
        if (!validTypes.includes(file.type)) {
          newErrors.push(`${file.name}: ไฟล์ต้องเป็น JPG หรือ PNG เท่านั้น`);
          return;
        }

        // Check file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (file.size > maxSize) {
          newErrors.push(`${file.name}: ขนาดไฟล์เกิน 5MB`);
          return;
        }

        validFiles.push(file);
      });

      setFileErrors(newErrors);
      setSelectedFiles((prev) => [...prev, ...validFiles]);
    }
  };

  /**
   * Remove a file from the selected files list
   */
  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  /**
   * Upload gym images to Supabase Storage
   * Returns array of public URLs for uploaded images
   */
  const uploadImages = async (userId: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const file of selectedFiles) {
      try {
        // Generate unique file name
        const fileExt = file.name.split(".").pop();
        const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        // Upload to Supabase Storage bucket 'gym-images'
        const { error } = await supabase.storage
          .from("gym-images")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) {
          throw error;
        }

        // Get public URL for the uploaded image
        const { data: urlData } = supabase.storage
          .from("gym-images")
          .getPublicUrl(fileName);

        uploadedUrls.push(urlData.publicUrl);
      } catch {
        throw new Error("การอัปโหลดรูปภาพล้มเหลว");
      }
    }

    return uploadedUrls;
  };

  /**
   * NOTE: Role promotion removed - role will be updated to 'partner' only when admin approves
   * User will remain 'authenticated' until approval
   */

  /**
   * Handle form submission
   * Shows terms modal instead of submitting immediately
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form data
    if (!validateForm()) {
      return;
    }

    // Check if user is authenticated
    if (!user) {
      setSubmitError("กรุณาเข้าสู่ระบบก่อนสมัคร");
      return;
    }

    // Show terms modal for user to accept
    setShowTermsModal(true);
  };

  /**
   * Handle actual form submission after terms acceptance
   * Uploads images, creates gym record, and updates user role
   */
  const handleTermsAccepted = async () => {
    setShowTermsModal(false);

    // Check if user is authenticated
    if (!user) {
      setSubmitError("กรุณาเข้าสู่ระบบก่อนสมัคร");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Step 1: Upload images to Supabase Storage
      let imageUrls: string[] = [];
      if (selectedFiles.length > 0) {
        imageUrls = await uploadImages(user.id);
      }

      // Step 2: Insert gym data into gyms table
      const gymData: Omit<GymData, "id"> = {
        user_id: user.id,
        gym_name: formData.gymName,
        contact_name: formData.contactName,
        phone: formData.phone,
        email: formData.email,
        website: formData.website || undefined,
        location: formData.address,
        gym_details: formData.description || undefined,
        services: formData.services,
        images: imageUrls,
        status: "pending",
      };

      const { data: insertedGym, error: insertError } = await supabase
        .from("gyms")
        .insert(gymData)
        .select()
        .single();

      if (insertError) {
        throw new Error("ไม่สามารถบันทึกข้อมูลยิมได้: " + insertError.message);
      }

      // Success! Update state
      // Note: User role remains 'authenticated' until admin approves
      setIsSuccess(true);
      setExistingGym(insertedGym);
      setApplicationStatus("pending");

      // Reset form
      setFormData({
        gymName: "",
        contactName: "",
        phone: "",
        email: "",
        website: "",
        address: "",
        description: "",
        services: [],
        termsAccepted: false,
      });
      setSelectedFiles([]);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่อีกครั้ง";
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Loading screen while checking authentication
   */
  if (isLoading) {
    return (
      <div className="flex justify-center items-center bg-zinc-900 min-h-screen">
        <div className="text-center">
          <div className="inline-block mb-4 border-4 border-t-transparent border-red-600 rounded-full w-16 h-16 animate-spin"></div>
          <p className="text-zinc-300 text-lg">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  /**
   * Success screen after form submission
   */
  if (isSuccess) {
    return (
      <div className="bg-zinc-900 min-h-screen">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-3xl">
          <div className="bg-zinc-800 shadow-2xl p-8 md:p-12 rounded-2xl text-center">
            <div className="flex justify-center mb-6">
              <CheckCircleIcon className="w-24 h-24 text-green-500" />
            </div>
            <h1 className="mb-4 font-bold text-white text-3xl md:text-4xl">
              สมัครสำเร็จ!
            </h1>
            <p className="mb-4 text-zinc-300 text-xl leading-relaxed">
              ขอบคุณที่สนใจเข้าร่วมเป็น Partner Gym
            </p>
            <p className="mb-8 text-zinc-400 text-lg">
              กรุณารอแอดมินตรวจสอบและติดต่อกลับภายใน 3-5 วันทำการ
            </p>
            <div className="bg-zinc-700 mb-8 p-4 rounded-lg">
              <p className="text-zinc-300 text-sm">
                <strong>สถานะ:</strong> <span className="text-yellow-400">รอการตรวจสอบ</span>
              </p>
            </div>
            <div className="flex sm:flex-row flex-col justify-center gap-4">
              <Link
                href="/"
                className="inline-block bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold text-white transition-colors"
              >
                กลับหน้าหลัก
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Show application status if user already has a gym application
   * If status is 'denied', show the form again so user can reapply
   */
  if (existingGym && applicationStatus === "denied") {
    // If denied, reset the existingGym and allow user to reapply
    // This happens automatically because the gym record is deleted when denied
    // So this condition should not be reached, but we handle it just in case
    setExistingGym(null);
    setApplicationStatus("none");
  }

  if (existingGym && applicationStatus !== "none" && applicationStatus !== "denied") {
    const statusColors = {
      pending: { bg: "bg-yellow-500/20", border: "border-yellow-500", text: "text-yellow-400", label: "รอการตรวจสอบ" },
      approved: { bg: "bg-green-500/20", border: "border-green-500", text: "text-green-400", label: "อนุมัติแล้ว" },
    };

    const status = statusColors[applicationStatus as keyof typeof statusColors] || statusColors.pending;

    return (
      <div className="bg-zinc-900 min-h-screen">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-4xl">
          <div className="bg-zinc-800 shadow-2xl p-8 md:p-12 rounded-2xl">
            <div className="flex items-center gap-4 mb-6">
              <ClockIcon className="w-12 h-12 text-blue-500" />
              <div>
                <h1 className="font-bold text-white text-3xl md:text-4xl">
                  สถานะการสมัคร Partner
                </h1>
                <p className="mt-1 text-zinc-400">ข้อมูลคำขอสมัครของคุณ</p>
              </div>
            </div>

            <div className={`${status.bg} border-2 ${status.border} rounded-lg p-6 mb-8`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-3 h-3 rounded-full ${status.border.replace('border-', 'bg-')} animate-pulse`}></div>
                <p className="font-semibold text-zinc-300 text-lg">
                  สถานะ: <span className={status.text}>{status.label}</span>
                </p>
              </div>
              {applicationStatus === "pending" && (
                <p className="mt-2 text-zinc-400 text-sm">
                  ทีมงานกำลังตรวจสอบข้อมูลของคุณ กรุณารอการติดต่อกลับภายใน 3-5 วันทำการ
                </p>
              )}
              {applicationStatus === "approved" && (
                <p className="mt-2 text-zinc-400 text-sm">
                  ยินดีด้วย! คำขอของคุณได้รับการอนุมัติแล้ว ตอนนี้คุณเป็น Partner กับเราแล้ว
                </p>
              )}
            </div>

            <div className="space-y-4 bg-zinc-700 p-6 rounded-lg">
              <h2 className="mb-4 font-semibold text-white text-xl">ข้อมูลที่ส่งมา</h2>
              
              <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
                <div>
                  <p className="text-zinc-400 text-sm">ชื่อยิม</p>
                  <p className="font-medium text-white">{existingGym.gym_name}</p>
                </div>
                <div>
                  <p className="text-zinc-400 text-sm">ผู้ติดต่อ</p>
                  <p className="font-medium text-white">{existingGym.contact_name}</p>
                </div>
                <div>
                  <p className="text-zinc-400 text-sm">เบอร์โทรศัพท์</p>
                  <p className="font-mono font-medium text-white">{existingGym.phone}</p>
                </div>
                <div>
                  <p className="text-zinc-400 text-sm">อีเมล</p>
                  <p className="font-mono font-medium text-white">{existingGym.email}</p>
                </div>
              </div>

              {existingGym.services && existingGym.services.length > 0 && (
                <div>
                  <p className="mb-2 text-zinc-400 text-sm">บริการ</p>
                  <div className="flex flex-wrap gap-2">
                    {existingGym.services.map((service, index) => (
                      <span key={index} className="bg-red-600/20 px-3 py-1 border border-red-500 rounded-full text-red-400 text-sm">
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {existingGym.images && existingGym.images.length > 0 && (
                <div>
                  <p className="mb-2 text-zinc-400 text-sm">รูปภาพ</p>
                  <div className="gap-3 grid grid-cols-2 md:grid-cols-4">
                    {existingGym.images.map((image, index) => (
                      <div key={index} className="relative w-full h-24">
                        <Image 
                          src={image} 
                          alt={`Gym image ${index + 1}`}
                          fill
                          className="rounded-lg object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-center mt-8">
              <Link
                href="/"
                className="inline-block bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold text-white transition-colors"
              >
                กลับหน้าหลัก
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 min-h-screen">
      {/* Terms Modal */}
      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={handleTermsAccepted}
        gymName={formData.gymName || "ยิมของคุณ"}
      />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-red-900/20 to-zinc-900">
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
          <div className="bg-zinc-800 shadow-xl p-6 md:p-8 rounded-xl">
            <h2 className="flex items-center gap-3 mb-6 font-semibold text-white text-2xl">
              <BuildingStorefrontIcon className="w-7 h-7 text-red-500" />
              ข้อมูลพื้นฐาน
            </h2>

            <div className="space-y-6">
              {/* Gym Name */}
              <div>
                <label
                  htmlFor="gymName"
                  className="block mb-2 font-medium text-zinc-300 text-sm"
                >
                  ชื่อยิม / ชื่อสถานที่ <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="gymName"
                    name="gymName"
                    value={formData.gymName}
                    onChange={handleInputChange}
                    className={`w-full bg-zinc-700 border ${
                      errors.gymName ? "border-red-500" : "border-zinc-600"
                    } rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono`}
                    placeholder="เช่น: Tiger Muay Thai Gym"
                  />
                </div>
                {errors.gymName && (
                  <p className="flex items-center gap-1 mt-2 text-red-400 text-sm">
                    <ExclamationTriangleIcon className="w-4 h-4" />
                    {errors.gymName}
                  </p>
                )}
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
                    onChange={handleInputChange}
                    className={`w-full bg-zinc-700 border ${
                      errors.contactName ? "border-red-500" : "border-zinc-600"
                    } rounded-lg px-4 py-3 pl-10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent`}
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
                      onChange={handleInputChange}
                      className={`w-full bg-zinc-700 border ${
                        errors.phone ? "border-red-500" : "border-zinc-600"
                      } rounded-lg px-4 py-3 pl-10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono`}
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
                      onChange={handleInputChange}
                      className={`w-full bg-zinc-700 border ${
                        errors.email ? "border-red-500" : "border-zinc-600"
                      } rounded-lg px-4 py-3 pl-10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono`}
                      placeholder="contact@gym.com"
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
                    onChange={handleInputChange}
                    className="bg-zinc-700 px-4 py-3 pl-10 border border-zinc-600 focus:border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 w-full font-mono text-white placeholder-zinc-500"
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
                    onChange={handleInputChange}
                    rows={3}
                    className={`w-full bg-zinc-700 border ${
                      errors.address ? "border-red-500" : "border-zinc-600"
                    } rounded-lg px-4 py-3 pl-10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none`}
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

          {/* Gym Details */}
          <div className="bg-zinc-800 shadow-xl p-6 md:p-8 rounded-xl">
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
                  onChange={handleInputChange}
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
                  {serviceOptions.map((service) => (
                    <label
                      key={service}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        formData.services.includes(service)
                          ? "bg-red-600/20 border-red-500 text-white"
                          : "bg-zinc-700 border-zinc-600 text-zinc-300 hover:border-zinc-500"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.services.includes(service)}
                        onChange={() => handleServiceToggle(service)}
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
                
                <label className="flex flex-col items-center gap-3 bg-zinc-700 hover:bg-zinc-600 p-6 border-2 border-zinc-600 border-dashed rounded-lg transition-colors cursor-pointer">
                  <PhotoIcon className="w-12 h-12 text-zinc-400" />
                  <span className="text-zinc-300 text-sm">
                    คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวาง
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleFileChange}
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
                          onClick={() => removeFile(index)}
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

          {/* Terms & Conditions */}
          <div className="bg-zinc-800 shadow-xl p-6 md:p-8 rounded-xl">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="termsAccepted"
                checked={formData.termsAccepted}
                onChange={handleInputChange}
                className={`mt-1 w-5 h-5 rounded text-red-600 focus:ring-red-500 ${
                  errors.termsAccepted ? "border-red-500" : ""
                }`}
              />
              <div className="flex-1">
                <span className="text-zinc-300">
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

          {/* Submit Error Display */}
          {submitError && (
            <div className="bg-red-500/20 p-4 border-2 border-red-500 rounded-lg">
              <div className="flex items-center gap-3">
                <ExclamationTriangleIcon className="flex-shrink-0 w-6 h-6 text-red-400" />
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
              className="flex justify-center items-center gap-3 bg-red-600 hover:bg-red-700 disabled:bg-zinc-600 shadow-lg px-8 py-4 rounded-lg w-full font-bold text-white text-lg hover:scale-[1.02] transition-all disabled:cursor-not-allowed transform"
            >
              {isSubmitting ? (
                <>
                  <div className="border-white border-b-2 rounded-full w-6 h-6 animate-spin"></div>
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
            <a href="/contact" className="text-red-500 hover:text-red-400">
              support@muaythai.com
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}

