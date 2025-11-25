import { useState, useEffect } from 'react';
import {
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Chip,
} from '@heroui/react';
import AdminFormModal from '../../shared/AdminFormModal';
import type {
  HospitalEditModalProps,
  HospitalFormData,
  HospitalFormErrors,
} from '../types';
import { validateField } from '../validation';
import { previewSlug } from '@shared/lib/utils';

export default function HospitalEditModal({
  isOpen,
  onClose,
  hospital,
  onSave,
  isProcessing,
}: HospitalEditModalProps) {
  const [formData, setFormData] = useState<HospitalFormData>({
    hospital_name: '',
    hospital_name_english: '',
    contact_name: '',
    phone: '',
    email: '',
    website: '',
    location: '',
    hospital_details: '',
    services: [],
    status: 'pending',
  });

  const [errors, setErrors] = useState<HospitalFormErrors>({});
  const [serviceInput, setServiceInput] = useState('');

  // Pre-fill form data when hospital changes
  useEffect(() => {
    if (hospital) {
      setFormData({
        hospital_name: hospital.hospital_name || '',
        hospital_name_english: hospital.hospital_name_english || '',
        contact_name: hospital.contact_name || '',
        phone: hospital.phone || '',
        email: hospital.email || '',
        website: hospital.website || '',
        location: hospital.location || '',
        hospital_details: hospital.hospital_details || '',
        services: hospital.services || [],
        status: (hospital.status as HospitalFormData['status']) || 'pending',
      });
      setErrors({});
    }
  }, [hospital]);

  const handleChange = (name: keyof HospitalFormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));

    // Validate on change
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error,
    }));
  };

  const handleAddService = () => {
    if (serviceInput.trim() && !formData.services.includes(serviceInput.trim())) {
      setFormData(prev => ({
        ...prev,
        services: [...prev.services, serviceInput.trim()],
      }));
      setServiceInput('');
    }
  };

  const handleRemoveService = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter(s => s !== service),
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: HospitalFormErrors = {};

    newErrors.hospital_name = validateField('hospital_name', formData.hospital_name);
    newErrors.hospital_name_english = validateField('hospital_name_english', formData.hospital_name_english);
    newErrors.contact_name = validateField('contact_name', formData.contact_name);
    newErrors.phone = validateField('phone', formData.phone);
    newErrors.email = validateField('email', formData.email);
    newErrors.website = validateField('website', formData.website);
    newErrors.location = validateField('location', formData.location);

    // Remove undefined errors
    Object.keys(newErrors).forEach(key => {
      if (newErrors[key as keyof HospitalFormErrors] === undefined) {
        delete newErrors[key as keyof HospitalFormErrors];
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!hospital || !validateForm()) return;

    await onSave(hospital.id, {
      hospital_name: formData.hospital_name.trim(),
      hospital_name_english: formData.hospital_name_english.trim() || undefined,
      contact_name: formData.contact_name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      website: formData.website.trim() || undefined,
      location: formData.location.trim(),
      hospital_details: formData.hospital_details.trim() || undefined,
      services: formData.services,
      status: formData.status,
    });
  };

  const isFormValid = Object.keys(errors).length === 0 &&
    !!formData.hospital_name.trim() &&
    !!formData.contact_name.trim() &&
    !!formData.phone.trim() &&
    !!formData.email.trim() &&
    !!formData.location.trim();

  if (!hospital) return null;

  return (
    <AdminFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="แก้ไขข้อมูลโรงพยาบาล"
      subtitle={hospital.hospital_name}
      size="3xl"
      onSubmit={handleSubmit}
      isProcessing={isProcessing}
      isFormValid={isFormValid}
    >
      <div className="space-y-4">
        {/* hospital Name */}
        <Input
          label="ชื่อโรงพยาบาล (ไทย)"
          placeholder="กรอกชื่อโรงพยาบาล"
          value={formData.hospital_name}
          onValueChange={(value) => handleChange('hospital_name', value)}
          isInvalid={!!errors.hospital_name}
          errorMessage={errors.hospital_name}
          isRequired
          classNames={{
            input: 'text-white',
            label: 'text-default-400',
          }}
        />

        {/* hospital Name English */}
        <Input
          label="ชื่อโรงพยาบาล (อังกฤษ)"
          placeholder="Enter hospital name in English"
          value={formData.hospital_name_english}
          onValueChange={(value) => handleChange('hospital_name_english', value)}
          isInvalid={!!errors.hospital_name_english}
          errorMessage={errors.hospital_name_english}
          description={formData.hospital_name_english ? `Slug: ${previewSlug(formData.hospital_name_english)}` : 'ใช้สำหรับสร้าง URL ของโรงพยาบาล'}
          classNames={{
            input: 'text-white',
            label: 'text-default-400',
          }}
        />

        {/* Current Slug Display */}
        {hospital?.slug && (
          <div className="bg-default-100/50 px-3 py-2 ">
            <p className="mb-1 text-default-400 text-xs">Slug ปัจจุบัน:</p>
            <p className="font-mono text-sm">{hospital.slug}</p>
          </div>
        )}

        {/* Contact Name */}
        <Input
          label="ชื่อผู้ติดต่อ"
          placeholder="กรอกชื่อผู้ติดต่อ"
          value={formData.contact_name}
          onValueChange={(value) => handleChange('contact_name', value)}
          isInvalid={!!errors.contact_name}
          errorMessage={errors.contact_name}
          isRequired
          classNames={{
            input: 'text-white',
            label: 'text-default-400',
          }}
        />

        {/* Phone */}
        <Input
          label="เบอร์โทรศัพท์"
          placeholder="02-123-4567 หรือ 0812345678"
          value={formData.phone}
          onValueChange={(value) => handleChange('phone', value)}
          isInvalid={!!errors.phone}
          errorMessage={errors.phone}
          isRequired
          classNames={{
            input: 'text-white',
            label: 'text-default-400',
          }}
        />

        {/* Email */}
        <Input
          label="อีเมล"
          type="email"
          placeholder="example@email.com"
          value={formData.email}
          onValueChange={(value) => handleChange('email', value)}
          isInvalid={!!errors.email}
          errorMessage={errors.email}
          isRequired
          classNames={{
            input: 'text-white',
            label: 'text-default-400',
          }}
        />

        {/* Website */}
        <Input
          label="เว็บไซต์"
          type="url"
          placeholder="https://example.com"
          value={formData.website}
          onValueChange={(value) => handleChange('website', value)}
          isInvalid={!!errors.website}
          errorMessage={errors.website}
          classNames={{
            input: 'text-white',
            label: 'text-default-400',
          }}
        />

        {/* Location */}
        <Textarea
          label="ที่อยู่"
          placeholder="กรอกที่อยู่โรงพยาบาล"
          value={formData.location}
          onValueChange={(value) => handleChange('location', value)}
          isInvalid={!!errors.location}
          errorMessage={errors.location}
          isRequired
          minRows={2}
          classNames={{
            input: 'text-white',
            label: 'text-default-400',
          }}
        />

        {/* hospital Details */}
        <Textarea
          label="รายละเอียดโรงพยาบาล"
          placeholder="กรอกรายละเอียดเพิ่มเติม"
          value={formData.hospital_details}
          onValueChange={(value) => setFormData(prev => ({ ...prev, hospital_details: value }))}
          minRows={3}
          classNames={{
            input: 'text-white',
            label: 'text-default-400',
          }}
        />

        {/* Services */}
        <div>
          <label className="block mb-2 text-default-400 text-sm">บริการ</label>
          <div className="flex gap-2 mb-2">
            <Input
              placeholder="เพิ่มบริการ"
              value={serviceInput}
              onValueChange={setServiceInput}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddService();
                }
              }}
              classNames={{
                input: 'text-white',
              }}
            />
            <Button
              color="primary"
              onPress={handleAddService}
              isDisabled={!serviceInput.trim()}
            >
              เพิ่ม
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.services.map((service, index) => (
              <Chip
                key={index}
                onClose={() => handleRemoveService(service)}
                variant="flat"
                color="primary"
              >
                {service}
              </Chip>
            ))}
          </div>
        </div>

        {/* Status */}
        <Select
          label="สถานะ"
          selectedKeys={[formData.status]}
          onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as HospitalFormData['status'] }))}
          classNames={{
            trigger: 'bg-default-100',
            label: 'text-default-400',
            value: 'text-white',
          }}
        >
          <SelectItem key="pending">
            รอการตรวจสอบ
          </SelectItem>
          <SelectItem key="approved">
            อนุมัติแล้ว
          </SelectItem>
          <SelectItem key="rejected">
            ไม่อนุมัติ
          </SelectItem>
        </Select>
      </div>
    </AdminFormModal>
  );
}
