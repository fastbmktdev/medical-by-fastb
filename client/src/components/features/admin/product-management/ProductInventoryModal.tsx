import { useState, useEffect } from 'react';
import { Input, Select, SelectItem } from '@heroui/react';
import AdminFormModal from '../shared/AdminFormModal';

interface ProductInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    nameThai?: string | null;
    nameEnglish?: string | null;
    stock: number;
  } | null;
  onUpdate: (productId: string, stock: number, action: 'set' | 'add' | 'subtract') => Promise<boolean>;
  isProcessing: boolean;
}

export default function ProductInventoryModal({
  isOpen,
  onClose,
  product,
  onUpdate,
  isProcessing,
}: ProductInventoryModalProps) {
  const [action, setAction] = useState<'set' | 'add' | 'subtract'>('set');
  const [stockValue, setStockValue] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) {
      setStockValue('');
      setAction('set');
      setError('');
    }
  }, [product]);

  const handleSubmit = async () => {
    if (!product) return;

    const value = parseInt(stockValue);
    
    if (isNaN(value) || value < 0) {
      setError('กรุณากรอกจำนวนที่ถูกต้อง');
      return;
    }

    if (action !== 'set' && value === 0) {
      setError('กรุณากรอกจำนวนที่มากกว่า 0');
      return;
    }

    if (action === 'subtract' && value > product.stock) {
      setError(`ไม่สามารถหักได้มากกว่า ${product.stock} ชิ้น`);
      return;
    }

    setError('');
    const success = await onUpdate(product.id, value, action);
    
    if (success) {
      setStockValue('');
      setAction('set');
      onClose();
    }
  };

  const getActionLabel = () => {
    switch (action) {
      case 'set':
        return 'ตั้งค่า';
      case 'add':
        return 'เพิ่ม';
      case 'subtract':
        return 'หัก';
      default:
        return '';
    }
  };

  const getNewStockPreview = () => {
    if (!product || !stockValue || isNaN(parseInt(stockValue))) return null;

    const value = parseInt(stockValue);
    let newStock: number;

    switch (action) {
      case 'add':
        newStock = product.stock + value;
        break;
      case 'subtract':
        newStock = Math.max(0, product.stock - value);
        break;
      case 'set':
      default:
        newStock = value;
        break;
    }

    return newStock;
  };

  if (!product) return null;

  const newStock = getNewStockPreview();

  return (
    <AdminFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="จัดการสต็อก"
      subtitle={product.nameThai || product.nameEnglish || 'Product'}
      size="md"
      onSubmit={handleSubmit}
      isProcessing={isProcessing}
      isFormValid={!!stockValue && !error && (action === 'set' || parseInt(stockValue) > 0)}
    >
      <div className="space-y-4">
        {/* Current Stock */}
        <div className="bg-zinc-900 p-4 ">
          <p className="text-zinc-400 text-sm mb-1">สต็อกปัจจุบัน</p>
          <p className="font-semibold text-2xl">
            {product.stock.toLocaleString()} ชิ้น
          </p>
        </div>

        {/* Action Selection */}
        <Select
          label="การดำเนินการ"
          selectedKeys={[action]}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] as string;
            setAction(selected as 'set' | 'add' | 'subtract');
            setError('');
          }}
        >
          <SelectItem key="set">
            ตั้งค่า (Set) - กำหนดจำนวนสต็อกใหม่
          </SelectItem>
          <SelectItem key="add">
            เพิ่ม (Add) - เพิ่มจำนวนสต็อก
          </SelectItem>
          <SelectItem key="subtract">
            หัก (Subtract) - ลดจำนวนสต็อก
          </SelectItem>
        </Select>

        {/* Stock Value Input */}
        <Input
          label={`จำนวนที่จะ${getActionLabel()}`}
          type="number"
          value={stockValue}
          onValueChange={(value) => {
            setStockValue(value);
            setError('');
          }}
          isInvalid={!!error}
          errorMessage={error}
          isRequired
          min="0"
          placeholder="0"
        />

        {/* Preview */}
        {newStock !== null && (
          <div className="bg-blue-500/10 p-4 border-blue-500 border ">
            <p className="text-zinc-400 text-sm mb-1">สต็อกหลังการอัปเดต</p>
            <p className="font-semibold text-xl text-blue-400">
              {newStock.toLocaleString()} ชิ้น
            </p>
            {action === 'subtract' && newStock < 10 && newStock > 0 && (
              <p className="text-yellow-500 text-sm mt-2">
                ⚠️ สต็อกจะเหลือน้อย (น้อยกว่า 10 ชิ้น)
              </p>
            )}
            {newStock === 0 && (
              <p className="text-red-500 text-sm mt-2">
                ⚠️ สต็อกจะหมด
              </p>
            )}
          </div>
        )}

        {/* Action Description */}
        <div className="text-zinc-400 text-sm">
          <p className="font-semibold mb-1">คำอธิบาย:</p>
          <ul className="list-disc list-inside space-y-1">
            {action === 'set' && (
              <li>ตั้งค่าสต็อกเป็นจำนวนที่ระบุ (ไม่เกี่ยวกับสต็อกปัจจุบัน)</li>
            )}
            {action === 'add' && (
              <li>เพิ่มจำนวนสต็อกตามจำนวนที่ระบุ</li>
            )}
            {action === 'subtract' && (
              <li>หักจำนวนสต็อกตามจำนวนที่ระบุ (ไม่สามารถหักได้มากกว่าสต็อกปัจจุบัน)</li>
            )}
          </ul>
        </div>
      </div>
    </AdminFormModal>
  );
}

