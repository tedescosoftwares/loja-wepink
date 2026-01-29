import { useState, useEffect } from 'react';
import { Zap, Gift, X } from 'lucide-react';

interface DynamicDiscount {
  discount_id: number;
  discount_type: string;
  discount_value: number;
  trigger_value: number;
  current_additions: number;
  remaining_additions: number;
  is_triggered: boolean;
}

interface DynamicDiscountNotificationProps {
  productId: number;
  productName: string;
  onClose?: () => void;
}

export default function DynamicDiscountNotification({ 
  productId, 
  productName, 
  onClose 
}: DynamicDiscountNotificationProps) {
  const [discounts, setDiscounts] = useState<DynamicDiscount[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetchProductDiscounts();
  }, [productId]);

  const fetchProductDiscounts = async () => {
    try {
      const response = await fetch(`/api/dynamic-discounts/${productId}`);
      const data = await response.json();
      const activeDiscounts = data.discounts || [];
      
      setDiscounts(activeDiscounts);
      setVisible(activeDiscounts.length > 0);
      setLoading(false);
      
      console.log(`🎯 DISCOUNT CHECK: Product ${productId} has ${activeDiscounts.length} active discounts`);
    } catch (error) {
      console.error('Error fetching product discounts:', error);
      setLoading(false);
    }
  };

  const handleClose = () => {
    setVisible(false);
    onClose?.();
  };

  const formatDiscount = (discount: DynamicDiscount) => {
    if (discount.discount_type === 'percentage') {
      return `${discount.discount_value}% OFF`;
    } else {
      return `R$ ${discount.discount_value.toFixed(2)} OFF`;
    }
  };

  if (loading || !visible || discounts.length === 0) {
    return null;
  }

  const triggeredDiscounts = discounts.filter(d => d.is_triggered);
  const nearbyDiscounts = discounts.filter(d => !d.is_triggered && d.remaining_additions <= 3);

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      {triggeredDiscounts.length > 0 && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-lg shadow-lg mb-3 animate-pulse">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-full">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg">🎉 Desconto Ativado!</h3>
                <p className="text-sm opacity-90">{productName}</p>
                <div className="mt-2">
                  {triggeredDiscounts.map((discount, index) => (
                    <div key={index} className="bg-white bg-opacity-20 px-2 py-1 rounded text-sm font-medium">
                      {formatDiscount(discount)} disponível agora!
                    </div>
                  ))}
                </div>
                <p className="text-xs mt-2 opacity-80">
                  ✨ O desconto será aplicado automaticamente no checkout
                </p>
              </div>
            </div>
            <button 
              onClick={handleClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {nearbyDiscounts.length > 0 && (
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-lg shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-full">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold">🔥 Quase lá!</h3>
                <p className="text-sm opacity-90">{productName}</p>
                <div className="mt-2 space-y-1">
                  {nearbyDiscounts.map((discount, index) => (
                    <div key={index} className="bg-white bg-opacity-20 p-2 rounded text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{formatDiscount(discount)}</span>
                        <span className="text-xs">
                          Faltam {discount.remaining_additions} adições
                        </span>
                      </div>
                      <div className="mt-1 bg-white bg-opacity-20 rounded-full h-2">
                        <div 
                          className="bg-white h-2 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${(discount.current_additions / discount.trigger_value) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs mt-2 opacity-80">
                  Continue adicionando para desbloquear o desconto!
                </p>
              </div>
            </div>
            <button 
              onClick={handleClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
