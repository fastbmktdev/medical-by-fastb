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
import { createClient } from "@/lib/database/supabase/client";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { TermsModal } from "@/components/features/modals";

/**
 * Interface for partner application form data
 * Maps to the gyms table in Supabase
 */
interface FormData {
  gymName: string;
  gymNameEnglish: string;
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
  gym_name_english?: string;
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
  const [isLoading, setIsLoading] = useState(true);
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus>("none");
  const [existingGym, setExistingGym] = useState<GymData | null>(null);

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


      // Check if user already has a gym application
      const { data: gymData, error: gymError } = await supabase
        .from("gyms")
        .select("*")
        .eq("user_id", currentUser.id)
        .maybeSingle();

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
        gym_name_english: formData.gymNameEnglish || undefined,
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
        .maybeSingle();

      if (insertError) {
        throw new Error("ไม่สามารถบันทึกข้อมูลยิมได้: " + insertError.message);
      }

      if (!insertedGym) {
        throw new Error("ไม่สามารถรับข้อมูลยิมที่สร้างใหม่ได้");
      }

      // Success! Update state
      // Note: User role remains 'authenticated' until admin approves
      setIsSuccess(true);
      setExistingGym(insertedGym);
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
      <div className="flex justify-center items-center bg-zinc-950 min-h-screen">
        <div className="text-center">
          <div className="inline-block mb-4 border-4 border-red-600 border-t-transparent rounded-full w-16 h-16 animate-spin"></div>
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
      <div className="bg-zinc-950 min-h-screen">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-3xl">
          <div className="bg-zinc-950 shadow-2xl p-8 md:p-12 rounded-2xl text-center">
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

  if (existingGym && applicationStatus !== "none") {
    const statusConfig = {
      pending: { 
        bg: "bg-gradient-to-br from-yellow-500/20 to-orange-500/20", 
        border: "border-yellow-500/50", 
        text: "text-yellow-400", 
        label: "รอการตรวจสอบ",
        icon: "⏳",
        description: "ทีมงานกำลังตรวจสอบข้อมูลของคุณ กรุณารอการติดต่อกลับภายใน 3-5 วันทำการ",
        progress: 50
      },
      approved: { 
        bg: "bg-gradient-to-br from-green-500/20 to-emerald-500/20", 
        border: "border-green-500/50", 
        text: "text-green-400", 
        label: "อนุมัติแล้ว",
        icon: "✅",
        description: "ยินดีด้วย! คำขอของคุณได้รับการอนุมัติแล้ว ตอนนี้คุณเป็น Partner กับเราแล้ว",
        progress: 100
      },
      denied: {
        bg: "bg-gradient-to-br from-red-500/20 to-rose-500/20",
        border: "border-red-500/50",
        text: "text-red-400",
        label: "ไม่ผ่านการอนุมัติ",
        icon: "❌",
        description: "ขออภัย คำขอของคุณไม่ผ่านการอนุมัติ กรุณาติดต่อทีมงานเพื่อสอบถามรายละเอียด",
        progress: 0
      }
    };

    const status = statusConfig[applicationStatus as keyof typeof statusConfig] || statusConfig.pending;

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
          <div className={`${status.bg} border ${status.border} rounded-3xl p-10 mb-12 backdrop-blur-md shadow-2xl relative overflow-hidden`}>
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
            
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8 relative z-10">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className={`w-6 h-6 rounded-full ${status.border.replace('border-', 'bg-').replace('/50', '')} animate-pulse shadow-lg`}></div>
                  <div className={`absolute inset-0 w-6 h-6 rounded-full ${status.border.replace('border-', 'bg-').replace('/50', '')} opacity-30 animate-ping`}></div>
                </div>
                <div>
                  <p className="font-bold text-zinc-200 text-2xl mb-2">
                    สถานะ: <span className={`${status.text} drop-shadow-lg`}>{status.label}</span>
                  </p>
                  <p className="text-zinc-300 text-lg leading-relaxed">
                    {status.description}
                  </p>
                </div>
              </div>
              
              {/* Enhanced Progress Bar */}
              <div className="flex-1 lg:max-w-md">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-zinc-300 text-sm font-medium">ความคืบหน้า</span>
                  <span className="text-zinc-200 text-sm font-bold bg-zinc-800/50 px-3 py-1 rounded-full">
                    {status.progress}%
                  </span>
                </div>
                <div className="relative w-full bg-zinc-800/50 rounded-full h-3 shadow-inner">
                  <div 
                    className={`h-3 rounded-full transition-all duration-2000 ease-out relative overflow-hidden ${
                      status.progress === 100 ? 'bg-gradient-to-r from-green-400 via-emerald-500 to-green-600' :
                      status.progress === 50 ? 'bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-600' :
                      'bg-gradient-to-r from-red-400 via-rose-500 to-red-600'
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
                <h2 className="font-bold text-white text-2xl">
                  ข้อมูลยิม
                </h2>
              </div>
              
              <div className="space-y-6">
                <div className="group/item flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-zinc-800/30 rounded-2xl hover:bg-zinc-800/50 transition-colors">
                  <span className="text-zinc-400 text-sm w-28 flex-shrink-0 font-medium">ชื่อยิม</span>
                  <span className="font-semibold text-white text-lg">{existingGym.gym_name}</span>
                </div>
                <div className="group/item flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-zinc-800/30 rounded-2xl hover:bg-zinc-800/50 transition-colors">
                  <span className="text-zinc-400 text-sm w-28 flex-shrink-0 font-medium">ผู้ติดต่อ</span>
                  <span className="font-semibold text-white text-lg">{existingGym.contact_name}</span>
                </div>
                <div className="group/item flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-zinc-800/30 rounded-2xl hover:bg-zinc-800/50 transition-colors">
                  <span className="text-zinc-400 text-sm w-28 flex-shrink-0 font-medium">เบอร์โทร</span>
                  <span className="font-mono font-semibold text-white text-lg bg-zinc-700/50 px-3 py-1 rounded-lg">{existingGym.phone}</span>
                </div>
                <div className="group/item flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-zinc-800/30 rounded-2xl hover:bg-zinc-800/50 transition-colors">
                  <span className="text-zinc-400 text-sm w-28 flex-shrink-0 font-medium">อีเมล</span>
                  <span className="font-mono font-semibold text-white text-lg bg-zinc-700/50 px-3 py-1 rounded-lg">{existingGym.email}</span>
                </div>
              </div>
            </div>

            {/* Application Timeline */}
            <div className="group bg-gradient-to-br from-zinc-900/60 to-zinc-800/40 backdrop-blur-md border border-zinc-700/50 rounded-3xl p-8 shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 hover:border-blue-500/30">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl border border-blue-500/30">
                  <ClockIcon className="w-8 h-8 text-blue-400" />
                </div>
                <h2 className="font-bold text-white text-2xl">
                  Timeline
                </h2>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-start gap-6">
                  <div className="relative">
                    <div className="flex-shrink-0 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mt-2 shadow-lg"></div>
                    <div className="absolute inset-0 w-4 h-4 bg-green-400 rounded-full opacity-30 animate-ping"></div>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-white text-lg">ส่งคำขอสมัคร</p>
                    <p className="text-zinc-300 text-sm bg-zinc-800/50 px-3 py-1 rounded-lg inline-block mt-1">
                      {existingGym.created_at ? new Date(existingGym.created_at).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'ไม่ระบุ'}
                    </p>
                  </div>
                </div>
                
                {applicationStatus === 'pending' && (
                  <div className="flex items-start gap-6">
                    <div className="relative">
                      <div className="flex-shrink-0 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mt-2 shadow-lg animate-pulse"></div>
                      <div className="absolute inset-0 w-4 h-4 bg-yellow-400 rounded-full opacity-30 animate-ping"></div>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-white text-lg">กำลังตรวจสอบ</p>
                      <p className="text-zinc-300 text-sm">ทีมงานกำลังตรวจสอบข้อมูล</p>
                    </div>
                  </div>
                )}
                
                {applicationStatus === 'approved' && (
                  <div className="flex items-start gap-6">
                    <div className="relative">
                      <div className="flex-shrink-0 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mt-2 shadow-lg"></div>
                      <div className="absolute inset-0 w-4 h-4 bg-green-400 rounded-full opacity-30 animate-ping"></div>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-white text-lg">อนุมัติแล้ว</p>
                      <p className="text-zinc-300 text-sm bg-zinc-800/50 px-3 py-1 rounded-lg inline-block mt-1">
                        {existingGym.updated_at ? new Date(existingGym.updated_at).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'ไม่ระบุ'}
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
              <h2 className="font-bold text-white text-2xl">
                รายละเอียดเพิ่มเติม
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Services */}
              {existingGym.services && existingGym.services.length > 0 && (
                <div className="space-y-6">
                  <h3 className="flex items-center gap-3 font-bold text-white text-xl">
                    <div className="p-2 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-xl border border-orange-500/30">
                      <span className="text-2xl">🏋️</span>
                    </div>
                    บริการที่ให้
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {existingGym.services.map((service, index) => (
                      <span key={index} className="group/tag bg-gradient-to-r from-red-500/20 to-red-600/20 px-4 py-2 border border-red-500/30 rounded-2xl text-red-400 text-sm font-semibold hover:from-red-500/30 hover:to-red-600/30 hover:border-red-500/50 transition-all duration-200 hover:scale-105 cursor-default">
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Images */}
              {existingGym.images && existingGym.images.length > 0 && (
                <div className="space-y-6">
                  <h3 className="flex items-center gap-3 font-bold text-white text-xl">
                    <div className="p-2 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl border border-blue-500/30">
                      <span className="text-2xl">📸</span>
                    </div>
                    รูปภาพยิม
                  </h3>
                  <div className="gap-4 grid grid-cols-2">
                    {existingGym.images.map((image, index) => (
                      <div key={index} className="relative w-full h-36 group cursor-pointer overflow-hidden rounded-2xl">
                        <Image 
                          src={image} 
                          alt={`Gym image ${index + 1}`}
                          fill
                          className="object-cover transition-all duration-300 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute inset-0 border-2 border-white/0 group-hover:border-white/30 transition-colors duration-300 rounded-2xl"></div>
                        <div className="absolute bottom-2 left-2 right-2 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
            {applicationStatus === 'approved' && (
              <Link
                href="/partner/dashboard"
                className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 hover:from-green-600 hover:via-emerald-600 hover:to-green-700 px-10 py-4 rounded-2xl font-bold text-white text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/25"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                <span className="text-2xl animate-bounce">🎉</span>
                <span>เข้าสู่ Partner Dashboard</span>
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </Link>
            )}
            
            {applicationStatus === 'pending' && (
              <div className="text-center space-y-6">
                <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-2xl p-6">
                  <p className="text-zinc-300 text-lg mb-4">
                    มีคำถามหรือต้องการติดต่อทีมงาน?
                  </p>
                  <a
                    href="mailto:support@thaikick-muaythai.com"
                    className="group inline-flex items-center gap-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 px-8 py-3 rounded-xl font-bold text-white transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-blue-500/25"
                  >
                    <span className="text-xl">📧</span>
                    <span>ติดต่อทีมงาน</span>
                  </a>
                </div>
              </div>
            )}
            
            {applicationStatus === 'denied' && (
              <div className="text-center space-y-6">
                <div className="bg-gradient-to-r from-red-500/10 to-rose-500/10 border border-red-500/30 rounded-2xl p-6">
                  <p className="text-zinc-300 text-lg mb-6">
                    ต้องการสมัครใหม่หรือมีคำถาม?
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a
                      href="mailto:support@thaikick-muaythai.com"
                      className="group inline-flex items-center gap-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 px-6 py-3 rounded-xl font-bold text-white transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-blue-500/25"
                    >
                      <span className="text-lg">📧</span>
                      <span>ติดต่อทีมงาน</span>
                    </a>
                    <button
                      onClick={() => window.location.reload()}
                      className="group inline-flex items-center gap-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 px-6 py-3 rounded-xl font-bold text-white transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-yellow-500/25"
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
              className="group inline-flex items-center gap-3 bg-gradient-to-r from-zinc-600 to-zinc-700 hover:from-zinc-700 hover:to-zinc-800 px-8 py-3 rounded-xl font-bold text-white transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
            >
              <span className="text-lg">🏠</span>
              <span>กลับหน้าหลัก</span>
            </Link>
          </div>
        </div>
      </div>
    );
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
      <div className="bg-gradient-to-br from-red-900/20 to-zinc-950">
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
          <div className="bg-zinc-950 shadow-xl p-6 md:p-8 rounded-xl">
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
                  ชื่อยิม (ภาษาไทย) <span className="text-red-500">*</span>
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
                    placeholder="เช่น: ยิมมวยไทยเสือ"
                  />
                </div>
                {errors.gymName && (
                  <p className="flex items-center gap-1 mt-2 text-red-400 text-sm">
                    <ExclamationTriangleIcon className="w-4 h-4" />
                    {errors.gymName}
                  </p>
                )}
              </div>

              {/* Gym Name English */}
              <div>
                <label
                  htmlFor="gymNameEnglish"
                  className="block mb-2 font-medium text-zinc-300 text-sm"
                >
                  ชื่อยิม (English)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="gymNameEnglish"
                    name="gymNameEnglish"
                    value={formData.gymNameEnglish}
                    onChange={handleInputChange}
                    className={`w-full bg-zinc-700 border ${
                      errors.gymNameEnglish ? "border-red-500" : "border-zinc-600"
                    } rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono`}
                    placeholder="e.g., Tiger Muay Thai Gym"
                  />
                </div>
                {errors.gymNameEnglish && (
                  <p className="flex items-center gap-1 mt-2 text-red-400 text-sm">
                    <ExclamationTriangleIcon className="w-4 h-4" />
                    {errors.gymNameEnglish}
                  </p>
                )}
                <p className="mt-2 text-zinc-400 text-xs">
                  ใช้สำหรับสร้าง URL ของยิม เช่น /gyms/tiger-muay-thai-gym
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
                
                <label className="flex flex-col items-center gap-3 bg-zinc-700 hover:bg-zinc-600 p-6 border border-zinc-600 border-dashed rounded-lg transition-colors cursor-pointer">
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
          <div className="bg-zinc-950 shadow-xl p-6 md:p-8 rounded-xl">
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
            <div className="bg-red-500/20 p-4 border border-red-500 rounded-lg">
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

// Add custom CSS animations
const styles = `
  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fade-in {
    animation: fade-in 0.8s ease-out;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

