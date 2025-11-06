import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@heroui/react';
import { Event } from '@/types';
import Image from 'next/image';

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
}

export default function EventDetailModal({
  isOpen,
  onClose,
  event,
}: EventDetailModalProps) {
  if (!event) return null;

  const eventDate = new Date(event.event_date || event.date || '');
  const formattedDate = eventDate.toLocaleDateString('th-TH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const price = event.price_start ?? event.price;
  const imageUrl = event.image || event.images?.[0] || '/assets/images/fallback-img.jpg';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>
          <h2 className="font-bold text-2xl">{event.name}</h2>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {imageUrl && (
              <div className="relative w-full h-64 rounded-lg overflow-hidden">
                <Image
                  src={imageUrl}
                  alt={event.name || 'Event'}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-zinc-400 text-sm">ชื่อไทย</p>
                <p className="font-semibold">{event.name}</p>
              </div>
              {event.name_english && (
                <div>
                  <p className="text-zinc-400 text-sm">ชื่ออังกฤษ</p>
                  <p className="font-semibold">{event.name_english}</p>
                </div>
              )}
            </div>

            <div>
              <p className="text-zinc-400 text-sm">วันที่จัดงาน</p>
              <p className="font-semibold">{formattedDate}</p>
              <p className="text-zinc-400 text-sm">{eventDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>

            <div>
              <p className="text-zinc-400 text-sm">สถานที่</p>
              <p className="font-semibold">{event.location}</p>
              {event.address && (
                <p className="text-zinc-400 text-sm">{event.address}</p>
              )}
            </div>

            {price && (
              <div>
                <p className="text-zinc-400 text-sm">ราคาเริ่มต้น</p>
                <p className="font-bold text-red-500 text-xl">฿{price.toLocaleString()}</p>
              </div>
            )}

            {event.description && (
              <div>
                <p className="text-zinc-400 text-sm">คำอธิบาย</p>
                <p className="text-zinc-300">{event.description}</p>
              </div>
            )}

            {event.details && (
              <div>
                <p className="text-zinc-400 text-sm">รายละเอียด</p>
                <p className="text-zinc-300 whitespace-pre-wrap">{event.details}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-zinc-400 text-sm">สถานะ</p>
                <p className="font-semibold">
                  {event.status === 'upcoming' ? 'กำลังจะจัด' :
                   event.status === 'ongoing' ? 'กำลังจัด' :
                   event.status === 'completed' ? 'เสร็จสิ้น' :
                   event.status === 'cancelled' ? 'ยกเลิก' : 'ไม่ระบุ'}
                </p>
              </div>
              <div>
                <p className="text-zinc-400 text-sm">การเผยแพร่</p>
                <p className="font-semibold">{event.is_published ? 'เผยแพร่แล้ว' : 'ยังไม่เผยแพร่'}</p>
              </div>
            </div>

            {event.max_attendees && (
              <div>
                <p className="text-zinc-400 text-sm">จำนวนผู้เข้าร่วมสูงสุด</p>
                <p className="font-semibold">{event.max_attendees} คน</p>
              </div>
            )}

            {event.tickets && event.tickets.length > 0 && (
              <div>
                <p className="text-zinc-400 text-sm mb-2">ตั๋ว</p>
                <div className="space-y-2">
                  {event.tickets.map((ticket) => (
                    <div key={ticket.id} className="bg-zinc-800 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{ticket.name}</p>
                          <p className="text-zinc-400 text-sm">
                            เหลือ {ticket.quantity_available - ticket.quantity_sold} ที่นั่ง
                          </p>
                        </div>
                        <p className="font-bold text-red-500">฿{(ticket.price || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            ปิด
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

