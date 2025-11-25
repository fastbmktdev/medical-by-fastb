"use client";

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Button, Input, Select, SelectItem, Progress } from '@heroui/react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { ConfirmationModal } from '@/components/compositions/modals/ConfirmationModal';

interface HealthGoal {
  id: string;
  goal_type: string;
  title: string;
  description?: string;
  target_value?: number;
  current_value?: number;
  unit?: string;
  target_date?: string;
  is_completed: boolean;
}

const GOAL_TYPES = [
  { value: 'appointment_frequency', label: 'ความถี่การนัดหมาย' },
  { value: 'weight', label: 'น้ำหนัก' },
  { value: 'health_metric', label: 'ดัชนีสุขภาพ' },
  { value: 'custom', label: 'เป้าหมายอื่นๆ' },
];

export function HealthGoalsManager() {
  const [goals, setGoals] = useState<HealthGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<HealthGoal | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    goal_type: 'custom',
    title: '',
    description: '',
    target_value: '',
    unit: '',
    target_date: '',
  });

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const response = await fetch('/api/users/goals');
      const data = await response.json();
      
      if (data.success) {
        setGoals(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load goals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/users/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal_type: formData.goal_type,
          title: formData.title,
          description: formData.description || undefined,
          target_value: formData.target_value ? Number(formData.target_value) : undefined,
          unit: formData.unit || undefined,
          target_date: formData.target_date || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create goal');
      }

      toast.success('สร้างเป้าหมายสำเร็จ!');
      setShowForm(false);
      setFormData({
        goal_type: 'custom',
        title: '',
        description: '',
        target_value: '',
        unit: '',
        target_date: '',
      });
      loadGoals();
    } catch (error: unknown) {
      console.error('Create error:', error);
      toast.error((error as Error).message || 'เกิดข้อผิดพลาด');
    }
  };

  const handleDeleteClick = (goal: HealthGoal) => {
    setGoalToDelete(goal);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!goalToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/users/goals/${goalToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete');
      }

      toast.success('ลบเป้าหมายสำเร็จ!');
      loadGoals();
      setIsDeleteModalOpen(false);
      setGoalToDelete(null);
    } catch (error: unknown) {
      console.error('Delete error:', error);
      toast.error((error as Error).message || 'เกิดข้อผิดพลาด');
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setGoalToDelete(null);
  };

  const handleToggleComplete = async (goal: HealthGoal) => {
    try {
      const response = await fetch(`/api/users/goals/${goal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_completed: !goal.is_completed,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update');
      }

      loadGoals();
    } catch (error: unknown) {
      console.error('Update error:', error);
      toast.error((error as Error).message || 'เกิดข้อผิดพลาด');
    }
  };

  if (isLoading) {
    return <div className="animate-pulse bg-zinc-900/50 h-64 " />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg text-white">เป้าหมายด้านสุขภาพ</h3>
        <Button
          size="sm"
          color="primary"
          onPress={() => setShowForm(!showForm)}
          startContent={<PlusIcon className="w-4 h-4" />}
          className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 text-xs font-medium"
        >
          เพิ่มเป้าหมาย
        </Button>
      </div>

      {showForm && (
        <Card className="bg-zinc-100/50 border border-zinc-700">
          <CardHeader className="border-b border-zinc-700">
            <h4 className="font-semibold text-white">เป้าหมายใหม่</h4>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Select
                label="ประเภทเป้าหมาย"
                selectedKeys={[formData.goal_type]}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;
                  setFormData({ ...formData, goal_type: value });
                }}
                variant="bordered"
                classNames={{
                  trigger: "bg-zinc-100/50 border-zinc-700",
                }}
              >
                {GOAL_TYPES.map(type => (
                  <SelectItem key={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </Select>

              <Input
                label="ชื่อเป้าหมาย"
                value={formData.title}
                onValueChange={(value) => setFormData({ ...formData, title: value })}
                isRequired
                variant="bordered"
                classNames={{
                  input: "text-white",
                  inputWrapper: "bg-zinc-100/50 border-zinc-700",
                }}
              />

              <Input
                label="คำอธิบาย"
                value={formData.description}
                onValueChange={(value) => setFormData({ ...formData, description: value })}
                variant="bordered"
                classNames={{
                  input: "text-white",
                  inputWrapper: "bg-zinc-100/50 border-zinc-700",
                }}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="ค่าเป้าหมาย"
                  type="number"
                  value={formData.target_value}
                  onValueChange={(value) => setFormData({ ...formData, target_value: value })}
                  variant="bordered"
                  classNames={{
                    input: "text-white",
                    inputWrapper: "bg-zinc-100/50 border-zinc-700",
                  }}
                />
                <Input
                  label="หน่วย"
                  value={formData.unit}
                  onValueChange={(value) => setFormData({ ...formData, unit: value })}
                  placeholder="เช่น ครั้ง, กก."
                  variant="bordered"
                  classNames={{
                    input: "text-white",
                    inputWrapper: "bg-zinc-100/50 border-zinc-700",
                  }}
                />
              </div>

              <Input
                label="วันที่เป้าหมาย"
                type="date"
                value={formData.target_date}
                onValueChange={(value) => setFormData({ ...formData, target_date: value })}
                variant="bordered"
                classNames={{
                  input: "text-white",
                  inputWrapper: "bg-zinc-100/50 border-zinc-700",
                }}
              />

              <div className="flex gap-2 justify-end">
                <Button
                  variant="flat"
                  onPress={() => {
                    setShowForm(false);
                    setFormData({
                      goal_type: 'custom',
                      title: '',
                      description: '',
                      target_value: '',
                      unit: '',
                      target_date: '',
                    });
                  }}
                >
                  ยกเลิก
                </Button>
                <Button type="submit" color="primary">
                  สร้างเป้าหมาย
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      <div className="space-y-3">
        {goals.length > 0 ? (
          goals.map((goal) => {
            const progress = goal.target_value 
              ? Math.min((goal.current_value || 0) / goal.target_value * 100, 100)
              : 0;

            return (
              <Card
                key={goal.id}
                className={`bg-zinc-100/50 border ${goal.is_completed ? 'border-green-500/50' : 'border-zinc-700'}`}
              >
                <CardBody className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-white">{goal.title}</h4>
                        {goal.is_completed && (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs ">
                            สำเร็จแล้ว
                          </span>
                        )}
                      </div>
                      {goal.description && (
                        <p className="text-zinc-400 text-sm mt-1">{goal.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="flat"
                        onPress={() => handleToggleComplete(goal)}
                      >
                        {goal.is_completed ? 'ยกเลิกการสำเร็จ' : 'ทำสำเร็จ'}
                      </Button>
                      <Button
                        size="sm"
                        variant="flat"
                        color="danger"
                        onPress={() => handleDeleteClick(goal)}
                        startContent={<TrashIcon className="w-4 h-4" />}
                      >
                        ลบ
                      </Button>
                    </div>
                  </div>

                  {goal.target_value && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">
                          {goal.current_value || 0} / {goal.target_value} {goal.unit || ''}
                        </span>
                        <span className="text-zinc-400">{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} color="primary" />
                    </div>
                  )}

                  {goal.target_date && (
                    <p className="text-zinc-500 text-xs">
                      วันที่เป้าหมาย: {new Date(goal.target_date).toLocaleDateString('th-TH')}
                    </p>
                  )}
                </CardBody>
              </Card>
            );
          })
        ) : (
          <div className="bg-zinc-100/50 p-8  text-center text-zinc-400">
            ยังไม่มีเป้าหมายด้านสุขภาพ
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={cancelDelete}
        title="ยืนยันการลบเป้าหมาย"
        message={`คุณต้องการลบเป้าหมาย "${goalToDelete?.title}" หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`}
        confirmText="ลบเป้าหมาย"
        cancelText="ยกเลิก"
        confirmVariant="danger"
        onConfirm={confirmDelete}
        loading={isDeleting}
        testId="delete-goal-modal"
      />
    </div>
  );
}

