import AdminConfirmDialog from '../shared/AdminConfirmDialog';

interface Product {
  id: string;
  nameThai?: string | null;
  nameEnglish?: string | null;
}

interface ProductDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onConfirm: (productId: string) => Promise<boolean>;
  isProcessing: boolean;
}

export default function ProductDeleteDialog({
  isOpen,
  onClose,
  product,
  onConfirm,
  isProcessing,
}: ProductDeleteDialogProps) {
  if (!product) return null;

  const productName = product.nameThai || product.nameEnglish || 'สินค้านี้';

  const handleConfirm = async () => {
    const success = await onConfirm(product.id);
    if (success) {
      onClose();
    }
  };

  return (
    <AdminConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      title="ลบสินค้า"
      message={`คุณแน่ใจหรือไม่ที่จะลบสินค้า "${productName}"?`}
      warningMessage="การลบสินค้านี้จะไม่สามารถกู้คืนได้ และจะไม่แสดงในร้านค้าอีกต่อไป"
      confirmText="ลบสินค้า"
      confirmColor="danger"
      onConfirm={handleConfirm}
      isProcessing={isProcessing}
    />
  );
}

