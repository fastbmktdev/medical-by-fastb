import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
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
import type { GymDetailModalProps } from '..';
import { STATUS_CONFIG, formatDate } from '..';

export default function GymDetailModal({
  isOpen,
  onClose,
  gym,
  onApprove,
  onReject,
  onEdit,
  onDelete,
  isProcessing,
}: GymDetailModalProps) {
  if (!gym) return null;

  const getStatusChip = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

    return (
      <Chip color={config.color} variant="flat">
        {config.label}
      </Chip>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      scrollBehavior="inside"
      backdrop="blur"
      classNames={{
        backdrop: "bg-black/50 backdrop-blur-sm",
        wrapper: "z-[100]",
        base: 'bg-zinc-900 border border-zinc-800',
        header: 'border-b border-zinc-800',
        body: 'py-6',
        footer: 'border-t border-zinc-800',
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <h3 className="text-white text-xl">รายละเอียดยิม</h3>
              <p className="text-default-400 text-sm">{gym.gym_name}</p>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-6">
                {/* Status */}
                <div>
                  <p className="mb-2 text-default-400 text-sm">สถานะ</p>
                  {getStatusChip(gym.status)}
                </div>

                {/* Images Gallery */}
                {gym.images && gym.images.length > 0 && (
                  <div>
                    <p className="mb-3 text-default-400 text-sm">รูปภาพยิม</p>
                    <div className="gap-3 grid grid-cols-2 md:grid-cols-3">
                      {gym.images.map((image, index) => (
                        <div
                          key={index}
                          className="relative rounded-lg w-full h-40 overflow-hidden"
                        >
                          <Image
                            src={image}
                            alt={`${gym.gym_name} ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact Information */}
                <div>
                  <h4 className="mb-3 font-semibold text-white">ข้อมูลติดต่อ</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex justify-center items-center bg-default-200 rounded-lg w-10 h-10">
                        <UsersIcon className="w-5 h-5 text-default-600" />
                      </div>
                      <div>
                        <p className="text-default-400 text-xs">ผู้ติดต่อ</p>
                        <p className="text-white">{gym.contact_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex justify-center items-center bg-default-200 rounded-lg w-10 h-10">
                        <PhoneIcon className="w-5 h-5 text-default-600" />
                      </div>
                      <div>
                        <p className="text-default-400 text-xs">เบอร์โทรศัพท์</p>
                        <p className="font-mono text-white">{gym.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex justify-center items-center bg-default-200 rounded-lg w-10 h-10">
                        <EnvelopeIcon className="w-5 h-5 text-default-600" />
                      </div>
                      <div>
                        <p className="text-default-400 text-xs">อีเมล</p>
                        <p className="font-mono text-white">{gym.email}</p>
                      </div>
                    </div>
                    {gym.website && (
                      <div className="flex items-center gap-3">
                        <div className="flex justify-center items-center bg-default-200 rounded-lg w-10 h-10">
                          <GlobeAltIcon className="w-5 h-5 text-default-600" />
                        </div>
                        <div>
                          <p className="text-default-400 text-xs">เว็บไซต์</p>
                          <a
                            href={gym.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {gym.website}
                          </a>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <div className="flex justify-center items-center bg-default-200 rounded-lg w-10 h-10">
                        <MapPinIcon className="w-5 h-5 text-default-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-default-400 text-xs">ที่อยู่</p>
                        <p className="text-white">{gym.location}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Services */}
                {gym.services && gym.services.length > 0 && (
                  <div>
                    <h4 className="mb-3 font-semibold text-white">บริการที่มี</h4>
                    <div className="flex flex-wrap gap-2">
                      {gym.services.map((service, index) => (
                        <Chip key={index} color="primary" variant="flat">
                          {service}
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}

                {/* Details */}
                {gym.gym_details && (
                  <div>
                    <h4 className="mb-3 font-semibold text-white">รายละเอียดเพิ่มเติม</h4>
                    <p className="text-default-300 text-sm whitespace-pre-wrap">
                      {gym.gym_details}
                    </p>
                  </div>
                )}

                {/* Metadata */}
                <div className="pt-4 border-zinc-800 border-t">
                  <div className="gap-4 grid grid-cols-2 text-xs">
                    <div>
                      <p className="text-default-400">วันที่สร้าง</p>
                      <p className="text-white">{formatDate(gym.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-default-400">อัพเดทล่าสุด</p>
                      <p className="text-white">{formatDate(gym.updated_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <div className="flex flex-wrap gap-2 w-full">
                {/* Show Approve/Reject buttons only for pending gyms */}
                {gym.status === 'pending' && (
                  <>
                    <Button
                      color="danger"
                      variant="flat"
                      onPress={() => onReject(gym.id)}
                      isDisabled={isProcessing}
                      startContent={<XCircleIcon className="w-4 h-4" />}
                    >
                      ปฏิเสธ
                    </Button>
                    <Button
                      color="success"
                      onPress={() => onApprove(gym.id)}
                      isLoading={isProcessing}
                      startContent={!isProcessing && <CheckCircleIcon className="w-4 h-4" />}
                    >
                      อนุมัติ
                    </Button>
                  </>
                )}

                {/* Edit and Delete buttons for all gyms */}
                <Button
                  color="secondary"
                  variant="flat"
                  onPress={() => {
                    onEdit(gym);
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
                    onDelete(gym);
                    onClose();
                  }}
                  isDisabled={isProcessing}
                  startContent={<TrashIcon className="w-4 h-4" />}
                >
                  ลบ
                </Button>

                <div className="flex-1" />

                <Button color="default" variant="light" onPress={onClose}>
                  ปิด
                </Button>
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
