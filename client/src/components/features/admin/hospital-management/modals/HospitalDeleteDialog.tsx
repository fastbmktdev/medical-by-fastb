import DeleteDialog from '@/components/shared/dialogs/DeleteDialog';
import type { HospitalDeleteDialogProps } from '..';

export default function HospitalDeleteDialog({
  isOpen,
  onClose,
  hospital,
  onConfirm,
  isProcessing,
}: HospitalDeleteDialogProps) {
  if (!hospital) return null;

  return (
    <DeleteDialog
      isOpen={isOpen}
      onClose={onClose}
      title="ยืนยันการลบโรงพยาบาล"
      itemName={hospital.hospital_name || ''}
      item={hospital}
      onConfirm={() => onConfirm(hospital.id)}
      isProcessing={isProcessing}
      warningMessage="การลบนี้ไม่สามารถย้อนกลับได้ ข้อมูลโรงพยาบาลทั้งหมดจะถูกลบออกจากระบบอย่างถาวร"
    />
  );
}
