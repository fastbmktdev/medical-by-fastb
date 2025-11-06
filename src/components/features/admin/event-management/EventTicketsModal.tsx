import { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Input } from '@heroui/react';
import { Event, EventTicket } from '@/types';
import { PlusIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface EventTicketsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
  onReload: () => void;
}

export default function EventTicketsModal({
  isOpen,
  onClose,
  event,
  onReload,
}: EventTicketsModalProps) {
  const [tickets, setTickets] = useState<EventTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTicket, setNewTicket] = useState({
    ticket_type: 'general',
    name: '',
    description: '',
    price: '',
    quantity_available: '',
    max_per_person: '10',
  });

  useEffect(() => {
    if (isOpen && event) {
      loadTickets();
    }
  }, [isOpen, event]);

  async function loadTickets() {
    if (!event) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/events/${event.id}`);
      const data = await response.json();

      if (data.success && data.data.tickets) {
        setTickets(data.data.tickets);
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast.error('Failed to load tickets');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateTicket() {
    if (!event) return;

    try {
      setIsCreating(true);
      // Note: This requires creating an API endpoint for managing event_tickets
      // For now, we'll show a message that this feature needs API support
      toast.error('API endpoint for ticket management needs to be created');
      // TODO: Create API endpoint /api/events/[id]/tickets
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create ticket');
    } finally {
      setIsCreating(false);
    }
  }

  if (!event) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>
          <div className="flex justify-between items-center w-full">
            <h2 className="font-bold text-2xl">จัดการตั๋ว: {event.name}</h2>
            <Button
              color="primary"
              startContent={<PlusIcon className="w-5 h-5" />}
              onPress={() => setShowCreateForm(true)}
            >
              เพิ่มตั๋ว
            </Button>
          </div>
        </ModalHeader>
        <ModalBody>
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <div className="border-4 border-red-600 border-t-transparent rounded-full w-8 h-8 animate-spin"></div>
            </div>
          ) : tickets.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-zinc-400">ยังไม่มีตั๋วสำหรับอีเวนต์นี้</p>
              <p className="text-zinc-500 text-sm mt-2">
                หมายเหตุ: ต้องสร้าง API endpoint สำหรับจัดการตั๋วก่อน
              </p>
            </div>
          ) : (
            <Table aria-label="Tickets table">
              <TableHeader>
                <TableColumn>ประเภท</TableColumn>
                <TableColumn>ชื่อ</TableColumn>
                <TableColumn>ราคา</TableColumn>
                <TableColumn>จำนวน</TableColumn>
                <TableColumn>ขายแล้ว</TableColumn>
                <TableColumn>เหลือ</TableColumn>
                <TableColumn>สถานะ</TableColumn>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>{ticket.ticket_type}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-semibold">{ticket.name}</p>
                        {ticket.description && (
                          <p className="text-zinc-400 text-xs">{ticket.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-bold text-red-500">฿{(ticket.price || 0).toLocaleString()}</p>
                    </TableCell>
                    <TableCell>{ticket.quantity_available}</TableCell>
                    <TableCell>{ticket.quantity_sold}</TableCell>
                    <TableCell>
                      {ticket.quantity_available - ticket.quantity_sold}
                    </TableCell>
                    <TableCell>
                      {ticket.is_active ? (
                        <Chip color="success" variant="flat" size="sm">เปิดขาย</Chip>
                      ) : (
                        <Chip color="default" variant="flat" size="sm">ปิดขาย</Chip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {showCreateForm && (
            <div className="mt-6 p-4 bg-zinc-800 rounded-lg space-y-4">
              <h3 className="font-bold text-lg">เพิ่มตั๋วใหม่</h3>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="ประเภทตั๋ว"
                  placeholder="general, vip, premium"
                  value={newTicket.ticket_type}
                  onValueChange={(value) => setNewTicket({ ...newTicket, ticket_type: value })}
                />
                <Input
                  label="ชื่อตั๋ว"
                  placeholder="General Admission"
                  value={newTicket.name}
                  onValueChange={(value) => setNewTicket({ ...newTicket, name: value })}
                />
              </div>
              <Input
                label="คำอธิบาย"
                placeholder="คำอธิบายตั๋ว"
                value={newTicket.description}
                onValueChange={(value) => setNewTicket({ ...newTicket, description: value })}
              />
              <div className="grid grid-cols-3 gap-4">
                <Input
                  type="number"
                  label="ราคา"
                  placeholder="0"
                  value={newTicket.price}
                  onValueChange={(value) => setNewTicket({ ...newTicket, price: value })}
                  startContent={<span className="text-zinc-400">฿</span>}
                />
                <Input
                  type="number"
                  label="จำนวนตั๋ว"
                  placeholder="0"
                  value={newTicket.quantity_available}
                  onValueChange={(value) => setNewTicket({ ...newTicket, quantity_available: value })}
                />
                <Input
                  type="number"
                  label="สูงสุดต่อคน"
                  placeholder="10"
                  value={newTicket.max_per_person}
                  onValueChange={(value) => setNewTicket({ ...newTicket, max_per_person: value })}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  color="primary"
                  onPress={handleCreateTicket}
                  isLoading={isCreating}
                >
                  สร้างตั๋ว
                </Button>
                <Button
                  variant="light"
                  onPress={() => {
                    setShowCreateForm(false);
                    setNewTicket({
                      ticket_type: 'general',
                      name: '',
                      description: '',
                      price: '',
                      quantity_available: '',
                      max_per_person: '10',
                    });
                  }}
                >
                  ยกเลิก
                </Button>
              </div>
            </div>
          )}
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

