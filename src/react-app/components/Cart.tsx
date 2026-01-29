import { X, Plus, Minus, ShoppingBag, CreditCard, Tag, Gift, CarTaxiFront, ShoppingCart } from 'lucide-react';
import { useCart } from '@/react-app/hooks/useCart';
import { useNavigate } from 'react-router';
import { useState, useEffect } from 'react';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AvailableCoupon {
  id: number;
  code: string;
  discount_type: string;
  discount_value: number;
  minimum_order_amount: number;
  description?: string;
}

export default function Cart({ isOpen, onClose }: CartProps) {
  const { items, updateQuantity, removeFromCart, getTotalPrice, clearCart, getMinimumOrder, getRemainingForMinimum, isMinimumOrderMet } = useCart();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');
  const [couponError, setCouponError] = useState('');
  const [showCoupons, setShowCoupons] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<AvailableCoupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  // Load available coupons when cart opens
  const loadAvailableCoupons = async () => {
    if (loadingCoupons) return;
    
    setLoadingCoupons(true);
    try {
      const response = await fetch('/api/coupons/available', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_amount: getTotalPrice()
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableCoupons(data.coupons || []);
      }
    } catch (error) {
      console.error('Error loading available coupons:', error);
    } finally {
      setLoadingCoupons(false);
    }
  };

  useEffect(() => {
    if (isOpen && items.length > 0) {
      loadAvailableCoupons();
    }
  }, [isOpen, items.length, getTotalPrice()]);

  const validateCoupon = async (code: string) => {
    if (!code.trim()) {
      setCouponError('Digite um código de cupom');
      return;
    }

    setCouponLoading(true);
    setCouponError('');

    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code.trim(),
          order_amount: getTotalPrice()
        }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setCouponApplied(true);
        setCouponDiscount(data.discount_amount);
        setCouponMessage(data.message);
        setCouponError('');
        setCouponCode(code.trim().toUpperCase());
        setShowCoupons(false); // Hide coupon selector after applying
      } else {
        setCouponApplied(false);
        setCouponDiscount(0);
        setCouponMessage('');
        setCouponError(data.error || 'Cupom inválido');
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      setCouponError('Erro ao validar cupom. Tente novamente.');
      setCouponApplied(false);
      setCouponDiscount(0);
      setCouponMessage('');
    } finally {
      setCouponLoading(false);
    }
  };

  const selectCoupon = (coupon: AvailableCoupon) => {
    setCouponCode(coupon.code);
    validateCoupon(coupon.code);
  };

  const removeCoupon = () => {
    setCouponApplied(false);
    setCouponDiscount(0);
    setCouponMessage('');
    setCouponError('');
    setCouponCode('');
  };

  const getFinalPrice = () => {
    return getTotalPrice() - couponDiscount;
  };

  const handleCheckout = () => {
    if (items.length === 0) return;
    if (!isMinimumOrderMet()) {
      alert(`Pedido mínimo de ${formatPrice(getMinimumOrder())}. Adicione mais ${formatPrice(getRemainingForMinimum())} para continuar.`);
      return;
    }
    onClose();
    navigate('/checkout', { 
      state: { 
        appliedCoupon: couponApplied ? {
          code: couponCode,
          discount: couponDiscount
        } : null
      }
    });
  };

  const getDiscountDescription = (coupon: AvailableCoupon) => {
    if (coupon.discount_type === 'percentage') {
      return `${coupon.discount_value}% de desconto`;
    } else {
      return `${formatPrice(coupon.discount_value)} de desconto`;
    }
  };

  const canUseCoupon = (coupon: AvailableCoupon) => {
    return getTotalPrice() >= coupon.minimum_order_amount;
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose} />
      )}

      {/* Cart Sidebar */}
      <div className={`fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-xl transform transition-transform duration-300 z-50 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b bg-gradient-to-r from-[#ff0080] to-[#ff0080]">
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-[#ffffff]">
              <div className="relative ">
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
                {items.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-bold animate-pulse">
                    {items.length}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline">Carrinho</span>
              <span className="sm:hidden">Meu Carrinho</span>
            </h2>
            <button 
              onClick={onClose} 
              className="p-2 rounded-full hover:bg-blue-100 transition-colors bg-white shadow-sm"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-gray-50">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Carrinho Vazio</h3>
                <p className="text-gray-500 text-sm">Adicione produtos para começar suas compras</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 hover:shadow-md transition-all">
                    <div className="flex gap-3">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.product.image_url ? (
                          <img
                            src={item.product.image_url}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                            <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-[#ff0080]" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm sm:text-base mb-1 line-clamp-2 text-gray-900 leading-tight">{item.product.name}</h4>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex flex-col">
                            <span className="text-lg font-bold text-[#ff0080]">
                              {formatPrice(item.product.price)}
                            </span>
                            <span className="text-sm text-gray-500">
                              {item.quantity}x = {formatPrice(item.product.price * item.quantity)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center bg-gray-100 rounded-lg border">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="p-2 hover:bg-gray-200 rounded-l-lg transition-colors"
                            >
                              <Minus className="w-4 h-4 text-gray-600" />
                            </button>
                            <span className="px-3 py-2 text-sm font-semibold bg-white border-x min-w-[3ch] text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="p-2 hover:bg-gray-200 rounded-r-lg transition-colors"
                            >
                              <Plus className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-red-500 hover:text-red-700 text-xs font-medium px-3 py-1 rounded-md hover:bg-red-50 transition-colors"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t bg-white p-4 sm:p-6 space-y-4 shadow-lg">
              {/* Coupon Section */}
              <div className="bg-gradient-to-r from-pink-50 to-pink-50 border border-[#ff0080] rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-[#ff0080] flex items-center gap-2">
                    <Gift className="w-5 h-5" />
                    Cupons de Desconto
                  </h3>
                  {!couponApplied && (
                    <button
                      onClick={() => {
                        setShowCoupons(!showCoupons);
                        if (!showCoupons && availableCoupons.length === 0) {
                          loadAvailableCoupons();
                        }
                      }}
                      className="text-pink-600 hover:text-pink-500 text-sm font-medium px-3 py-1 rounded-md hover:bg-pink-100 transition-colors flex items-center gap-1"
                    >
                      <Tag className="w-4 h-4" />
                      Ver Cupons
                    </button>
                  )}
                </div>
                
                {!couponApplied ? (
                  <div className="space-y-3">
                    {/* Manual Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff0080] focus:border-[#ff0080] uppercase text-sm"
                        placeholder="Digite um cupom"
                        style={{ textTransform: 'uppercase' }}
                      />
                      <button
                        onClick={() => validateCoupon(couponCode)}
                        disabled={couponLoading || !couponCode.trim()}
                        className="px-4 py-2 bg-[#ff0080] text-white rounded-lg hover:bg-[#ff0080] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                      >
                        {couponLoading ? (
                          <div className="flex items-center gap-1">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          </div>
                        ) : (
                          'Aplicar'
                        )}
                      </button>
                    </div>

                    {/* Available Coupons */}
                    {showCoupons && (
                      <div className="space-y-2">
                        <div className="text-xs text-pink-700 font-medium">Cupons disponíveis:</div>
                        {loadingCoupons ? (
                          <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600 mx-auto"></div>
                            <div className="text-sm text-pink-600 mt-2">Carregando cupons...</div>
                          </div>
                        ) : availableCoupons.length === 0 ? (
                          <div className="text-sm text-pink-600 text-center py-3 bg-purple-50 rounded-lg">
                            Nenhum cupom disponível no momento
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {availableCoupons.map((coupon) => {
                              const canUse = canUseCoupon(coupon);
                              return (
                                <div key={coupon.id} className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                  canUse 
                                    ? 'bg-white border-purple-200 hover:border-purple-400 hover:bg-purple-50' 
                                    : 'bg-gray-50 border-gray-200 opacity-60'
                                }`} onClick={() => canUse && selectCoupon(coupon)}>
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className={`font-bold text-sm px-2 py-1 rounded ${
                                          canUse ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                          {coupon.code}
                                        </span>
                                        <span className={`text-xs font-semibold ${
                                          canUse ? 'text-green-600' : 'text-gray-500'
                                        }`}>
                                          {getDiscountDescription(coupon)}
                                        </span>
                                      </div>
                                      {coupon.minimum_order_amount > 0 && (
                                        <div className={`text-xs ${
                                          canUse ? 'text-gray-600' : 'text-red-500'
                                        }`}>
                                          {canUse 
                                            ? `✓ Pedido mínimo: ${formatPrice(coupon.minimum_order_amount)}`
                                            : `Pedido mínimo: ${formatPrice(coupon.minimum_order_amount)} (faltam ${formatPrice(coupon.minimum_order_amount - getTotalPrice())})`
                                          }
                                        </div>
                                      )}
                                    </div>
                                    {canUse && (
                                      <div className="text-purple-600">
                                        <Tag className="w-4 h-4" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {couponError && (
                      <div className="text-red-600 text-sm flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {couponError}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-green-800">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <div>
                          <span className="font-medium">Cupom aplicado: {couponCode}</span>
                          <p className="text-sm text-green-700">{couponMessage}</p>
                          <p className="text-sm font-bold text-green-800">Desconto: -{formatPrice(couponDiscount)}</p>
                        </div>
                      </div>
                      <button
                        onClick={removeCoupon}
                        className="text-red-600 hover:text-red-800 text-sm font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="bg-gradient-to-r from-pink-50 to-pink-50 rounded-xl p-4 border border-[#ff0080]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-pink-600">Itens ({items.reduce((total, item) => total + item.quantity, 0)}):</span>
                  <span className="text-sm text-pink-900">{formatPrice(getTotalPrice())}</span>
                </div>
                
                {couponApplied && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-green-600 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Desconto ({couponCode}):
                    </span>
                    <span className="text-sm text-green-600 font-semibold">-{formatPrice(couponDiscount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-pink-600">Entrega:</span>
                  <span className="text-sm text-[#ff0080] font-medium">Grátis</span>
                </div>
                
                {/* Minimum Order Warning */}
                {!isMinimumOrderMet() && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-2">
                    <div className="flex items-center gap-2 text-amber-800 mb-1">
                      <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.081 15.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <span className="text-xs font-medium">Pedido Mínimo</span>
                    </div>
                    <p className="text-xs text-amber-700">
                      Faltam <strong>{formatPrice(getRemainingForMinimum())}</strong> para atingir o pedido mínimo de <strong>{formatPrice(getMinimumOrder())}</strong>
                    </p>
                  </div>
                )}
                
                <div className="border-t border-blue-200 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-800">Total:</span>
                    <div className="text-right">
                      {couponApplied && (
                        <div className="text-sm text-gray-500 line-through">
                          {formatPrice(getTotalPrice())}
                        </div>
                      )}
                      <span className={`text-xl font-bold ${couponApplied ? 'text-green-600' : 'text-[#ff0080]'} ${isMinimumOrderMet() ? '' : 'text-amber-600'}`}>
                        {formatPrice(getFinalPrice())}
                      </span>
                    </div>
                  </div>
                  
                  {couponApplied && (
                    <div className="text-right mt-1">
                      <span className="text-xs text-green-600 font-medium">
                        Você economizou {formatPrice(couponDiscount)}! 🎉
                      </span>
                    </div>
                  )}
                  
                  {isMinimumOrderMet() && (
                    <div className="flex items-center gap-1 justify-end mt-1">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-xs text-green-600 font-medium">Pedido mínimo atingido!</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleCheckout}
                  disabled={!isMinimumOrderMet()}
                  className={`w-full py-4 rounded-xl transition-all transform flex items-center justify-center gap-3 font-bold shadow-lg text-lg ${
                    isMinimumOrderMet()
                      ? 'bg-gradient-to-r from-[#ff0080] to-[#ff0080] text-white hover:from-[#ff0080c4] hover:to-[#ff0080c4] hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl'
                      : 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-75'
                  }`}
                >
                  <CreditCard className="w-6 h-6" />
                  {isMinimumOrderMet() ? 'Finalizar Pedido' : `Pedido Mínimo ${formatPrice(getMinimumOrder())}`}
                </button>

                <button
                  onClick={clearCart}
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Limpar Carrinho
                </button>
              </div>

              {/* Security Badge */}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500 pt-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Compra 100% segura via PIX</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
