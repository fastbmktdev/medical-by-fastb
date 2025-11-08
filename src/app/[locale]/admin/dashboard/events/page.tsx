"use client";

import { useEffect, useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { createClient } from '@/lib/database/supabase/client';
import { RoleGuard } from '@/components/features/auth';
import { DashboardLayout } from '@/components/shared';
import { adminMenuItems } from '@/components/features/admin/adminMenuItems';
import { Card, CardBody, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Button, Input, Tabs, Tab, useDisclosure } from '@heroui/react';
import {
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  CalendarIcon,
  TicketIcon,
} from '@heroicons/react/24/outline';
import { User } from '@supabase/supabase-js';
import Image from 'next/image';
import { Event, EventTicket } from '@/types';
import EventDetailModal from '@/components/features/admin/event-management/EventDetailModal';
import EventEditModal from '@/components/features/admin/event-management/EventEditModal';
import EventDeleteDialog from '@/components/features/admin/event-management/EventDeleteDialog';
import EventCreateModal from '@/components/features/admin/event-management/EventCreateModal';
import EventTicketsModal from '@/components/features/admin/event-management/EventTicketsModal';

function AdminEventsContent() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const detailModal = useDisclosure();
  const editModal = useDisclosure();
  const deleteDialog = useDisclosure();
  const createModal = useDisclosure();
  const ticketsModal = useDisclosure();

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    loadUser();
    loadEvents();
  }, [supabase]);

  useEffect(() => {
    filterEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, searchQuery, selectedTab]);

  async function loadEvents() {
    try {
      setIsLoading(true);
      const response = await fetch('/api/events?limit=1000');
      const data = await response.json();

      if (data.success) {
        setEvents(data.data || []);
      } else {
        toast.error(data.error || 'Failed to load events');
      }
    } catch (error) {
      console.error('Error loading events:', error);
      toast.error('Failed to load events');
    } finally {
      setIsLoading(false);
    }
  }

  function filterEvents() {
    let filtered = [...events];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        e.name?.toLowerCase().includes(query) ||
        e.name_english?.toLowerCase().includes(query) ||
        e.slug?.toLowerCase().includes(query) ||
        e.location?.toLowerCase().includes(query)
      );
    }

    // Filter by tab
    if (selectedTab === 'published') {
      filtered = filtered.filter(e => e.is_published === true);
    } else if (selectedTab === 'unpublished') {
      filtered = filtered.filter(e => e.is_published === false);
    } else if (selectedTab === 'featured') {
      filtered = filtered.filter(e => e.is_featured === true);
    } else if (selectedTab === 'upcoming') {
      filtered = filtered.filter(e => {
        const eventDate = new Date(e.event_date || e.date || '');
        return eventDate > new Date() && e.status === 'upcoming';
      });
    } else if (selectedTab === 'completed') {
      filtered = filtered.filter(e => e.status === 'completed');
    }

    setFilteredEvents(filtered);
  }

  async function handleCreate(eventData: any) {
    try {
      setIsProcessing(true);
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Event created successfully');
        await loadEvents();
        return true;
      } else {
        toast.error(data.error || 'Failed to create event');
        return false;
      }
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event');
      return false;
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleUpdate(eventId: string, eventData: any) {
    try {
      setIsProcessing(true);
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Event updated successfully');
        await loadEvents();
        return true;
      } else {
        toast.error(data.error || 'Failed to update event');
        return false;
      }
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event');
      return false;
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleDelete(eventId: string) {
    try {
      setIsProcessing(true);
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Event deleted successfully');
        await loadEvents();
        return true;
      } else {
        toast.error(data.error || 'Failed to delete event');
        return false;
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
      return false;
    } finally {
      setIsProcessing(false);
    }
  }

  const getStatusChip = (status?: string) => {
    switch (status) {
      case 'upcoming':
        return <Chip color="primary" variant="flat" size="sm">กำลังจะจัด</Chip>;
      case 'ongoing':
        return <Chip color="success" variant="flat" size="sm">กำลังจัด</Chip>;
      case 'completed':
        return <Chip color="default" variant="flat" size="sm">เสร็จสิ้น</Chip>;
      case 'cancelled':
        return <Chip color="danger" variant="flat" size="sm">ยกเลิก</Chip>;
      default:
        return <Chip color="default" variant="flat" size="sm">ไม่ระบุ</Chip>;
    }
  };

  const stats = {
    total: events.length,
    published: events.filter(e => e.is_published === true).length,
    unpublished: events.filter(e => e.is_published === false).length,
    featured: events.filter(e => e.is_featured === true).length,
    upcoming: events.filter(e => {
      const eventDate = new Date(e.event_date || e.date || '');
      return eventDate > new Date() && e.status === 'upcoming';
    }).length,
    completed: events.filter(e => e.status === 'completed').length,
  };

  if (isLoading) {
    return (
      <DashboardLayout
        menuItems={adminMenuItems}
        headerTitle="จัดการอีเวนต์"
        headerSubtitle="จัดการอีเวนต์ทั้งหมดในระบบ"
        roleLabel="ผู้ดูแลระบบ"
        roleColor="danger"
        userEmail={user?.email}
      >
        <div className="flex justify-center items-center py-20">
          <div className="border-4 border-red-600 border-t-transparent rounded-full w-12 h-12 animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <DashboardLayout
        menuItems={adminMenuItems}
        headerTitle="จัดการอีเวนต์"
        headerSubtitle="จัดการอีเวนต์ทั้งหมดในระบบ"
        roleLabel="ผู้ดูแลระบบ"
        roleColor="danger"
        userEmail={user?.email}
      >
        <Toaster position="top-right" />

        {/* Stats Cards */}
        <div className="gap-4 grid grid-cols-1 md:grid-cols-6 mb-6">
          <Card>
            <CardBody>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-zinc-400 text-sm">อีเวนต์ทั้งหมด</p>
                  <p className="font-bold text-2xl">{stats.total}</p>
                </div>
                <CalendarIcon className="w-8 h-8 text-blue-500" />
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-zinc-400 text-sm">เผยแพร่แล้ว</p>
                  <p className="font-bold text-2xl text-green-500">{stats.published}</p>
                </div>
                <CalendarIcon className="w-8 h-8 text-green-500" />
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-zinc-400 text-sm">ยังไม่เผยแพร่</p>
                  <p className="font-bold text-2xl text-red-500">{stats.unpublished}</p>
                </div>
                <CalendarIcon className="w-8 h-8 text-red-500" />
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-zinc-400 text-sm">แนะนำ</p>
                  <p className="font-bold text-2xl text-yellow-500">{stats.featured}</p>
                </div>
                <CalendarIcon className="w-8 h-8 text-yellow-500" />
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-zinc-400 text-sm">กำลังจะจัด</p>
                  <p className="font-bold text-2xl text-primary">{stats.upcoming}</p>
                </div>
                <CalendarIcon className="w-8 h-8 text-primary" />
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-zinc-400 text-sm">เสร็จสิ้น</p>
                  <p className="font-bold text-2xl text-zinc-400">{stats.completed}</p>
                </div>
                <CalendarIcon className="w-8 h-8 text-zinc-400" />
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Search and Actions */}
        <Card className="mb-6">
          <CardBody>
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="top-1/2 left-3 absolute w-5 h-5 text-zinc-400 -translate-y-1/2" />
                <Input
                  placeholder="ค้นหาอีเวนต์..."
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  className="pl-10"
                  startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
                />
              </div>
              <Button
                color="primary"
                startContent={<PlusIcon className="w-5 h-5" />}
                onPress={createModal.onOpen}
              >
                เพิ่มอีเวนต์ใหม่
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Tabs */}
        <Tabs
          selectedKey={selectedTab}
          onSelectionChange={(key) => setSelectedTab(key as string)}
          className="mb-6"
        >
          <Tab key="all" title={`ทั้งหมด (${stats.total})`} />
          <Tab key="published" title={`เผยแพร่แล้ว (${stats.published})`} />
          <Tab key="unpublished" title={`ยังไม่เผยแพร่ (${stats.unpublished})`} />
          <Tab key="featured" title={`แนะนำ (${stats.featured})`} />
          <Tab key="upcoming" title={`กำลังจะจัด (${stats.upcoming})`} />
          <Tab key="completed" title={`เสร็จสิ้น (${stats.completed})`} />
        </Tabs>

        {/* Events Table */}
        <Card>
          <CardBody>
            <Table aria-label="Events table">
              <TableHeader>
                <TableColumn>อีเวนต์</TableColumn>
                <TableColumn>วันที่จัดงาน</TableColumn>
                <TableColumn>สถานที่</TableColumn>
                <TableColumn>ราคาเริ่มต้น</TableColumn>
                <TableColumn>สถานะ</TableColumn>
                <TableColumn>การจัดการ</TableColumn>
              </TableHeader>
              <TableBody emptyContent="ไม่พบอีเวนต์">
                {filteredEvents.map((event) => {
                  const eventDate = new Date(event.event_date || event.date || '');
                  const formattedDate = eventDate.toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  });
                  const price = event.price_start ?? event.price;
                  const imageUrl = event.image || event.images?.[0] || '/assets/images/fallback-img.jpg';

                  return (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                              src={imageUrl}
                              alt={event.name || 'Event'}
                              fill
                              sizes='100%'
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-semibold">{event.name}</p>
                            {event.name_english && (
                              <p className="text-zinc-400 text-sm">{event.name_english}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{formattedDate}</p>
                          <p className="text-zinc-400 text-xs">
                            {eventDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm line-clamp-1">{event.location}</p>
                      </TableCell>
                      <TableCell>
                        {price ? (
                          <p className="font-semibold">฿{price.toLocaleString()}</p>
                        ) : (
                          <p className="text-zinc-400 text-sm">-</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {getStatusChip(event.status)}
                          {event.is_published ? (
                            <Chip color="success" variant="flat" size="sm">เผยแพร่</Chip>
                          ) : (
                            <Chip color="default" variant="flat" size="sm">ร่าง</Chip>
                          )}
                          {event.is_featured && (
                            <Chip color="warning" variant="flat" size="sm">แนะนำ</Chip>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => {
                              setSelectedEvent(event);
                              detailModal.onOpen();
                            }}
                          >
                            <EyeIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="primary"
                            onPress={() => {
                              setSelectedEvent(event);
                              ticketsModal.onOpen();
                            }}
                          >
                            <TicketIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="primary"
                            onPress={() => {
                              setSelectedEvent(event);
                              editModal.onOpen();
                            }}
                          >
                            <PencilIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="danger"
                            onPress={() => {
                              setSelectedEvent(event);
                              deleteDialog.onOpen();
                            }}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardBody>
        </Card>

        {/* Modals */}
        <EventCreateModal
          isOpen={createModal.isOpen}
          onClose={createModal.onClose}
          onCreate={handleCreate}
          isProcessing={isProcessing}
        />
        {selectedEvent && (
          <>
            <EventDetailModal
              isOpen={detailModal.isOpen}
              onClose={detailModal.onClose}
              event={selectedEvent}
            />
            <EventEditModal
              isOpen={editModal.isOpen}
              onClose={editModal.onClose}
              onUpdate={handleUpdate}
              event={selectedEvent}
              isProcessing={isProcessing}
            />
            <EventDeleteDialog
              isOpen={deleteDialog.isOpen}
              onClose={deleteDialog.onClose}
              onDelete={handleDelete}
              event={selectedEvent}
              isProcessing={isProcessing}
            />
            <EventTicketsModal
              isOpen={ticketsModal.isOpen}
              onClose={ticketsModal.onClose}
              event={selectedEvent}
              onReload={loadEvents}
            />
          </>
        )}
      </DashboardLayout>
    </>
  );
}

export default function AdminEventsPage() {
  return (
    <RoleGuard allowedRole="admin">
      <AdminEventsContent />
    </RoleGuard>
  );
}

