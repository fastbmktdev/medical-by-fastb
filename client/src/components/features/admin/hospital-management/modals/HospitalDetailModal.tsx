import {
  Button,
  Chip,
} from '@heroui/react';
import {
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  TrashIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  GlobeAltIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import AdminDetailModal from '../../shared/AdminDetailModal';
import AdminInfoSection, { AdminInfoItem, AdminInfoItemStart } from '../../shared/AdminInfoSection';
import type { HospitalDetailModalProps } from '..';
import { STATUS_CONFIG, formatDate } from '..';

export default function HospitalDetailModal({
  isOpen,
  onClose,
  hospital,
  onApprove,
  onReject,
  onEdit,
  onDelete,
  isProcessing,
}: HospitalDetailModalProps) {
  if (!hospital) return null;

  const getStatusChip = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

    return (
      <Chip color={config.color} variant="flat">
        {config.label}
      </Chip>
    );
  };

  const footer = (
    <div className="flex flex-wrap gap-2 w-full">
      {/* Show Approve/Reject buttons only for pending hospitals */}
      {hospital.status === 'pending' && (
        <>
          <Button
            color="danger"
            variant="flat"
            onPress={() => onReject(hospital.id)}
            isDisabled={isProcessing}
            startContent={<XCircleIcon className="w-4 h-4" />}
          >
            ปฏิเสธ
          </Button>
          <Button
            color="success"
            onPress={() => onApprove(hospital.id)}
            isLoading={isProcessing}
            startContent={!isProcessing && <CheckCircleIcon className="w-4 h-4" />}
          >
            อนุมัติ
          </Button>
        </>
      )}

      {/* Edit and Delete buttons for all hospitals */}
      <Button
        color="secondary"
        variant="flat"
        onPress={() => {
          onEdit(hospital);
          onClose();
        }}
        isDisabled={isProcessing}
        startContent={<PencilIcon className="w-4 h-4" />}
      >
        แก้ไข
      </Button>
      <Button
        color="danger"
        variant="flat"
        onPress={() => {
          onDelete(hospital);
          onClose();
        }}
        isDisabled={isProcessing}
        startContent={<TrashIcon className="w-4 h-4" />}
      >
        ลบ
      </Button>

      <div className="flex-1" />
    </div>
  );

  return (
    <AdminDetailModal
      isOpen={isOpen}
      onClose={onClose}
      title="รายละเอียดโรงพยาบาล"
      subtitle={hospital.hospital_name}
      size="3xl"
      actions={footer}
      isProcessing={isProcessing}
    >
              <div className="space-y-6">
                {/* Status */}
                <div>
                  <p className="mb-2 text-default-400 text-sm">สถานะ</p>
                  {getStatusChip(hospital.status ?? 'pending')}
                </div>

                {/* Images Gallery */}
                {hospital.images && hospital.images.length > 0 && (
                  <div>
                    <p className="mb-3 text-default-400 text-sm">รูปภาพโรงพยาบาล</p>
                    <div className="gap-3 grid grid-cols-2 md:grid-cols-3">
                      {hospital.images.map((image, index) => (
                        <div
                          key={index}
                          className="relative  w-full h-40 overflow-hidden"
                        >
                          <Image
                            src={image}
                            alt={`${hospital.hospital_name} ${index + 1}`}
                            fill
                            sizes='100%'
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact Information */}
                <AdminInfoSection title="ข้อมูลติดต่อ">
                  <div className="space-y-3">
                    <AdminInfoItem
                      icon={<UsersIcon className="w-5 h-5 text-default-600" />}
                      label="ผู้ติดต่อ"
                      value={hospital.contact_name}
                    />
                    <AdminInfoItem
                      icon={<PhoneIcon className="w-5 h-5 text-default-600" />}
                      label="เบอร์โทรศัพท์"
                      value={<span className="font-mono">{hospital.phone}</span>}
                    />
                    <AdminInfoItem
                      icon={<EnvelopeIcon className="w-5 h-5 text-default-600" />}
                      label="อีเมล"
                      value={<span className="font-mono">{hospital.email}</span>}
                    />
                    {hospital.website && (
                      <AdminInfoItem
                        icon={<GlobeAltIcon className="w-5 h-5 text-default-600" />}
                        label="เว็บไซต์"
                        value={hospital.website}
                        isLink
                        href={hospital.website}
                      />
                    )}
                    <AdminInfoItemStart
                      icon={<MapPinIcon className="w-5 h-5 text-default-600" />}
                      label="ที่อยู่"
                      value={hospital.location}
                    />
                  </div>
                </AdminInfoSection>

                {/* Services */}
                {hospital.services && hospital.services.length > 0 && (
                  <AdminInfoSection title="บริการที่มี">
                    <div className="flex flex-wrap gap-2">
                      {hospital.services.map((service, index) => (
                        <Chip key={index} color="primary" variant="flat">
                          {service}
                        </Chip>
                      ))}
                    </div>
                  </AdminInfoSection>
                )}

                {/* Details */}
                {hospital.hospital_details && (
                  <AdminInfoSection title="รายละเอียดเพิ่มเติม">
                    <p className="text-default-300 text-sm whitespace-pre-wrap">
                      {hospital.hospital_details}
                    </p>
                  </AdminInfoSection>
                )}

                {/* Metadata */}
                <div className="pt-4 border-zinc-800 border-t">
                  <div className="gap-4 grid grid-cols-2 text-xs">
                    <div>
                      <p className="text-default-400">วันที่สร้าง</p>
                      <p className="text-white">{formatDate(hospital.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-default-400">อัพเดทล่าสุด</p>
                      <p className="text-white">{formatDate(hospital.updated_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
    </AdminDetailModal>
  );
}
