"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/shared";
import { 
  ExclamationTriangleIcon, 
  CheckCircleIcon,
  UserPlusIcon,
  EyeIcon,
  EyeSlashIcon
} from "@heroicons/react/24/outline";
import { DashboardLayout } from "@/components/compositions/layouts";
import { adminMenuItems } from "@/components/features/admin/adminMenuItems";

interface UserFormData {
  email: string;
  password: string;
  full_name: string;
  username: string;
  phone: string;
  role: string;
  avatar_url: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  full_name?: string;
  username?: string;
  phone?: string;
  role?: string;
  general?: string;
}

interface CreatedUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

const PASSWORD_FIELD = "password";

const generateSecurePassword = (length = 16): string => {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{}|;:,.<>?";
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);

  return Array.from(randomValues, (value) => charset[value % charset.length]).join("");
};

export default function CreateUserPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [autoGeneratePassword, setAutoGeneratePassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [createdUser, setCreatedUser] = useState<CreatedUser | null>(null);

  const [formData, setFormData] = useState<UserFormData>({
    email: "",
    password: "",
    full_name: "",
    username: "",
    phone: "",
    role: "authenticated",
    avatar_url: ""
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "กรุณากรอกอีเมล";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "รูปแบบอีเมลไม่ถูกต้อง";
    }

    // Password validation (only if not auto-generating)
    if (!autoGeneratePassword) {
      if (!formData.password) {
        newErrors.password = "กรุณากรอกรหัสผ่าน";
      } else if (formData.password.length < 8) {
        newErrors.password = "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร";
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(formData.password)) {
        newErrors.password = "รหัสผ่านต้องมีตัวพิมพ์เล็ก, ตัวพิมพ์ใหญ่, ตัวเลข และอักขระพิเศษ";
      }
    }

    // Full name validation
    if (!formData.full_name.trim()) {
      newErrors.full_name = "กรุณากรอกชื่อ-นามสกุล";
    }

    // Username validation
    if (formData.username && !/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      newErrors.username = "Username สามารถใช้ได้เฉพาะตัวอักษร, ตัวเลข, _ และ -";
    }

    // Phone validation
    if (formData.phone && !/^\+?[1-9]\d{1,14}$/.test(formData.phone)) {
      newErrors.phone = "รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง (เช่น +66812345678)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof FormErrors];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});
    setSuccessMessage("");
    setGeneratedPassword(null);
    setCreatedUser(null);

    try {
      const passwordForSubmission = autoGeneratePassword
        ? generateSecurePassword()
        : formData.password;

      const baseUserData = {
        email: formData.email,
        full_name: formData.full_name,
        username: formData.username || undefined,
        phone: formData.phone || undefined,
        role: formData.role,
        avatar_url: formData.avatar_url || undefined,
      };

      const userData = {
        ...baseUserData,
        [PASSWORD_FIELD]: passwordForSubmission,
      };

      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'เกิดข้อผิดพลาดในการสร้างผู้ใช้');
      }

      setSuccessMessage("สร้างผู้ใช้สำเร็จแล้ว!");
      setCreatedUser(result.user);
      setGeneratedPassword(autoGeneratePassword ? passwordForSubmission : null);
      
      // Reset form
      setFormData({
        email: "",
        password: "",
        full_name: "",
        username: "",
        phone: "",
        role: "authenticated",
        avatar_url: ""
      });
      setAutoGeneratePassword(false);

    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <DashboardLayout
      menuItems={adminMenuItems}
      headerTitle="สร้างผู้ใช้ใหม่"
      headerSubtitle="เพิ่มผู้ใช้ใหม่เข้าสู่ระบบ"
      roleLabel="ผู้ดูแลระบบ"
      roleColor="danger"
      userEmail="admin@medical.com"
    >
      <div className="max-w-2xl mx-auto">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-500/20 p-4 border border-green-500 ">
            <div className="flex items-center gap-3">
              <CheckCircleIcon className="shrink-0 w-6 h-6 text-green-400" />
              <div>
                <p className="text-green-400 text-sm font-medium">{successMessage}</p>
                {createdUser && (
                  <div className="mt-2 text-green-300 text-xs">
                    <p>อีเมล: {createdUser.email}</p>
                    <p>ชื่อ: {createdUser.full_name}</p>
                    <p>บทบาท: {createdUser.role}</p>
                    {generatedPassword && (
                      <p className="mt-2">
                        รหัสผ่านชั่วคราว:{" "}
                        <span className="font-mono break-all">{generatedPassword}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Error Message */}
          {errors.general && (
            <div className="bg-red-500/20 p-4 border border-red-500 ">
              <div className="flex items-center gap-3">
                <ExclamationTriangleIcon className="shrink-0 w-6 h-6 text-red-400" />
                <p className="text-red-400 text-sm">{errors.general}</p>
              </div>
            </div>
          )}

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block mb-2 font-medium text-zinc-300 text-sm">
              อีเมล <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full bg-zinc-800/50 backdrop-blur-sm border ${
                errors.email ? "border-red-500/70 shadow-red-500/20" : "border-zinc-600/50 hover:border-zinc-500/70"
              }  px-4 py-3 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/70 transition-all duration-200`}
              placeholder="user@example.com"
              required
            />
            {errors.email && (
              <p className="flex items-center gap-1 mt-2 text-red-400 text-sm">
                <ExclamationTriangleIcon className="w-4 h-4" />
                {errors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className="font-medium text-zinc-300 text-sm">
                รหัสผ่าน <span className="text-red-400">*</span>
              </label>
              <label className="flex items-center gap-2 text-zinc-400 text-sm">
                <input
                  type="checkbox"
                  checked={autoGeneratePassword}
                  onChange={(e) => setAutoGeneratePassword(e.target.checked)}
                  className=" border-zinc-600 bg-zinc-800 text-red-500 focus:ring-red-500/50"
                />
                สร้างรหัสผ่านอัตโนมัติ
              </label>
            </div>
            
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                disabled={autoGeneratePassword}
                className={`w-full bg-zinc-800/50 backdrop-blur-sm border ${
                  errors.password ? "border-red-500/70 shadow-red-500/20" : "border-zinc-600/50 hover:border-zinc-500/70"
                }  px-4 py-3 pr-12 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/70 transition-all duration-200 ${
                  autoGeneratePassword ? "opacity-50 cursor-not-allowed" : ""
                }`}
                placeholder={autoGeneratePassword ? "จะสร้างรหัสผ่านอัตโนมัติ" : "••••••••"}
                required={!autoGeneratePassword}
              />
              <Button
                type="button"
                onClick={togglePasswordVisibility}
                variant="ghost"
                size="icon"
                className="absolute top-1/2 -translate-y-1/2 right-1 text-zinc-400 hover:text-zinc-300 p-1 "
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p className="flex items-center gap-1 mt-2 text-red-400 text-sm">
                <ExclamationTriangleIcon className="w-4 h-4" />
                {errors.password}
              </p>
            )}
            {autoGeneratePassword && (
              <p className="mt-2 text-zinc-400 text-xs">
                ระบบจะสร้างรหัสผ่านที่ปลอดภัยให้อัตโนมัติ
              </p>
            )}
          </div>

          {/* Full Name Field */}
          <div>
            <label htmlFor="full_name" className="block mb-2 font-medium text-zinc-300 text-sm">
              ชื่อ-นามสกุล <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              className={`w-full bg-zinc-800/50 backdrop-blur-sm border ${
                errors.full_name ? "border-red-500/70 shadow-red-500/20" : "border-zinc-600/50 hover:border-zinc-500/70"
              }  px-4 py-3 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/70 transition-all duration-200`}
              placeholder="ชื่อ-นามสกุล"
              required
            />
            {errors.full_name && (
              <p className="flex items-center gap-1 mt-2 text-red-400 text-sm">
                <ExclamationTriangleIcon className="w-4 h-4" />
                {errors.full_name}
              </p>
            )}
          </div>

          {/* Username Field */}
          <div>
            <label htmlFor="username" className="block mb-2 font-medium text-zinc-300 text-sm">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className={`w-full bg-zinc-800/50 backdrop-blur-sm border ${
                errors.username ? "border-red-500/70 shadow-red-500/20" : "border-zinc-600/50 hover:border-zinc-500/70"
              }  px-4 py-3 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/70 transition-all duration-200`}
              placeholder="username (ไม่บังคับ)"
            />
            {errors.username && (
              <p className="flex items-center gap-1 mt-2 text-red-400 text-sm">
                <ExclamationTriangleIcon className="w-4 h-4" />
                {errors.username}
              </p>
            )}
          </div>

          {/* Phone Field */}
          <div>
            <label htmlFor="phone" className="block mb-2 font-medium text-zinc-300 text-sm">
              เบอร์โทรศัพท์
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className={`w-full bg-zinc-800/50 backdrop-blur-sm border ${
                errors.phone ? "border-red-500/70 shadow-red-500/20" : "border-zinc-600/50 hover:border-zinc-500/70"
              }  px-4 py-3 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/70 transition-all duration-200`}
              placeholder="+66812345678"
            />
            {errors.phone && (
              <p className="flex items-center gap-1 mt-2 text-red-400 text-sm">
                <ExclamationTriangleIcon className="w-4 h-4" />
                {errors.phone}
              </p>
            )}
          </div>

          {/* Role Field */}
          <div>
            <label htmlFor="role" className="block mb-2 font-medium text-zinc-300 text-sm">
              บทบาท <span className="text-red-400">*</span>
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className="w-full bg-zinc-800/50 backdrop-blur-sm border border-zinc-600/50 hover:border-zinc-500/70  px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/70 transition-all duration-200"
              required
            >
              <option value="authenticated">ผู้ใช้ทั่วไป</option>
              <option value="partner">พาร์ทเนอร์</option>
              <option value="admin">ผู้ดูแลระบบ</option>
            </select>
          </div>

          {/* Avatar URL Field */}
          <div>
            <label htmlFor="avatar_url" className="block mb-2 font-medium text-zinc-300 text-sm">
              URL รูปโปรไฟล์
            </label>
            <input
              type="url"
              id="avatar_url"
              name="avatar_url"
              value={formData.avatar_url}
              onChange={handleInputChange}
              className="w-full bg-zinc-800/50 backdrop-blur-sm border border-zinc-600/50 hover:border-zinc-500/70  px-4 py-3 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/70 transition-all duration-200"
              placeholder="https://example.com/avatar.jpg"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={isLoading}
              loading={isLoading}
              loadingText="กำลังสร้างผู้ใช้..."
              rightIcon={<UserPlusIcon className="w-5 h-5" />}
              className="flex-1"
            >
              สร้างผู้ใช้
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              ยกเลิก
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
