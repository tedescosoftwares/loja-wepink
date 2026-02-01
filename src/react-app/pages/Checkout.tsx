import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useCart } from '@/react-app/hooks/useCart';
import Header from '@/react-app/components/Header';

interface CheckoutFormData {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_address: string;
  customer_cep: string;
  customer_street: string;
  customer_neighborhood: string;
  customer_city: string;
  customer_state: string;
  customer_number: string;
  customer_complement: string;
  notes: string;
  coupon_code: string;
}

export default function Checkout() {
  const navigate = useNavigate();
  const { items, getTotalPrice, clearCart, getMinimumOrder, isMinimumOrderMet } = useCart();
  const [formData, setFormData] = useState<CheckoutFormData>({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    customer_address: '',
    customer_cep: '',
    customer_street: '',
    customer_neighborhood: '',
    customer_city: '',
    customer_state: '',
    customer_number: '',
    customer_complement: '',
    notes: '',
    coupon_code: ''
  });
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    if (items.length === 0) {
      navigate('/');
    }
    if (items.length > 0 && !isMinimumOrderMet()) {
      alert(`Pedido mínimo de ${formatPrice(getMinimumOrder())}. Volte ao carrinho e adicione mais produtos.`);
      navigate('/');
    }
  }, [items, navigate, isMinimumOrderMet, getMinimumOrder]);

  // Function to fetch address data from ViaCEP API
  const fetchAddressFromCep = async (cep: string) => {
    // Remove non-digits from CEP
    const cleanCep = cep.replace(/\D/g, '');
    
    // Check if CEP has 8 digits
    if (cleanCep.length !== 8) {
      return;
    }
    
    setCepLoading(true);
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        alert('CEP não encontrado. Verifique o número digitado.');
        return;
      }
      
      // Update form data with fetched address
      setFormData(prev => ({
        ...prev,
        customer_street: data.logradouro || '',
        customer_neighborhood: data.bairro || '',
        customer_city: data.localidade || '',
        customer_state: data.uf || '',
        customer_address: `${data.logradouro || ''}, ${data.bairro || ''}, ${data.localidade || ''} - ${data.uf || ''}`
      }));
      
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      alert('Erro ao buscar endereço. Tente novamente.');
    } finally {
      setCepLoading(false);
    }
  };

  

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle coupon code with uppercase transformation
    if (name === 'coupon_code') {
      setFormData(prev => ({
        ...prev,
        [name]: value.toUpperCase()
      }));
      
      // Reset coupon state when code changes
      setCouponApplied(false);
      setCouponDiscount(0);
      setCouponMessage('');
      setCouponError('');
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // If CEP field changed and has 8 digits, fetch address
    if (name === 'customer_cep') {
      const cleanCep = value.replace(/\D/g, '');
      if (cleanCep.length === 8) {
        fetchAddressFromCep(cleanCep);
      }
    }
  };

  // Format CEP while typing
  const formatCep = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length <= 5) {
      return cleanValue;
    }
    return `${cleanValue.slice(0, 5)}-${cleanValue.slice(5, 8)}`;
  };

//HJDSHJHJKHDJKFSFD

  const validateCoupon = async () => {
    if (!formData.coupon_code.trim()) {
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
          code: formData.coupon_code.trim(),
          order_amount: getTotalPrice()
        }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setCouponApplied(true);
        setCouponDiscount(data.discount_amount);
        setCouponMessage(data.message);
        setCouponError('');
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

  const removeCoupon = () => {
    setCouponApplied(false);
    setCouponDiscount(0);
    setCouponMessage('');
    setCouponError('');
    setFormData(prev => ({ ...prev, coupon_code: '' }));
  };

  const getFinalPrice = () => {
    return getTotalPrice() - couponDiscount;
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatCep(e.target.value);
    setFormData(prev => ({
      ...prev,
      customer_cep: formattedValue
    }));
    
    // Check if CEP has 8 digits to fetch address
    const cleanCep = formattedValue.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      fetchAddressFromCep(cleanCep);
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate minimum order before proceeding (check final amount after discount)
    const finalAmount = getFinalPrice();
    if (finalAmount < getMinimumOrder()) {
      alert(`Pedido mínimo de ${formatPrice(getMinimumOrder())}. ${couponApplied ? 'Mesmo com desconto, o' : 'O'} valor final deve ser pelo menos ${formatPrice(getMinimumOrder())}.`);
      return;
    }
    
    setLoading(true);

    try {
      // Build complete address string
      const completeAddress = [
        formData.customer_street,
        formData.customer_number ? `nº ${formData.customer_number}` : '',
        formData.customer_complement,
        formData.customer_neighborhood,
        formData.customer_city,
        formData.customer_state
      ].filter(Boolean).join(', ');

      const orderData = {
        ...formData,
        customer_address: completeAddress || formData.customer_address,
        items: items.map(item => ({
          product: {
            id: item.product.id,
            name: item.product.name,
            price: item.product.price
          },
          quantity: item.quantity
        })),
        total_amount: getTotalPrice(),
        coupon_code: couponApplied ? formData.coupon_code : null,
        discount_amount: couponApplied ? couponDiscount : null,
        final_amount: getFinalPrice(),
        payment_method: 'pix'
      };

      console.log('🟢 CHECKOUT: Creating order with data:', orderData);

      // Create order
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      console.log('🟢 CHECKOUT: Order creation response status:', response.status);
      
      const responseData = await response.json();
      console.log('🟢 CHECKOUT: Order creation response data:', responseData);
      console.log('🟢 CHECKOUT: Response ok:', response.ok);
      console.log('🟢 CHECKOUT: Response success:', responseData.success);
      
      if (response.ok && responseData.success) {
        const orderId = responseData.orderId;
        console.log('🟢 CHECKOUT: Order created successfully with ID:', orderId);
        
        // Clear cart after successful order
        //clearCart();
        
        // Force redirect to order tracking page with the order ID
        console.log('🟢 CHECKOUT: Redirecting to order tracking page...');
        console.log('🟢 CHECKOUT: Navigate URL:', `/order-tracking?id=${orderId}`);
        
        // Use window.location for more reliable redirect
        navigate(`/order-tracking?id=${orderId}`, { replace: true });
        return; // Exit early to prevent further execution
      } else {
        console.error('🔴 CHECKOUT: Order creation failed:', responseData);
        throw new Error(responseData.error || responseData.details || 'Erro ao criar pedido');
      }
    } catch (error) {
      console.error('🔴 CHECKOUT: Error creating order:', error);
      alert(`Erro ao processar pedido: ${(error as Error).message}. Tente novamente.`);
    } finally {
      setLoading(false);
    }
  };

  

  if (items.length === 0 && step !== 'success') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onMenuToggle={() => {}} />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => step === 'form' ? navigate('/') : setStep('form')}
            className="p-2 rounded-lg text-pink-600 hover:text-white hover:bg-pink-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-pink-500">
            {step === 'form' && 'Finalizar Pedido'}
            {step === 'success' && 'Pedido Confirmado'}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {step === 'form' && (
              <div className="bg-pink-50 rounded-lg shadow p-6">
                <h2 className="text-lg text-[#ff0080] font-semibold mb-6">Dados para Entrega e Pagamento PIX</h2>
                
                <form onSubmit={handleSubmitForm} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#ff0080] mb-1">
                      Nome completo *
                    </label>
                    <input
                      type="text"
                      name="customer_name"
                      value={formData.customer_name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-pink-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="Seu nome completo"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#ff0080] mb-1">
                      Telefone *
                    </label>
                    <input
                      type="tel"
                      name="customer_phone"
                      value={formData.customer_phone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-pink-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#ff0080] mb-1">
                      E-mail
                    </label>
                    <input
                      type="email"
                      name="customer_email"
                      value={formData.customer_email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-pink-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="seu@email.com"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#ff0080] mb-1">
                          CEP *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            name="customer_cep"
                            value={formData.customer_cep}
                            onChange={handleCepChange}
                            required
                            className="w-full px-3 py-2 border border-pink-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="00000-000"
                            maxLength={9}
                          />
                          {cepLoading && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-[#ff0080] mb-1">
                          Rua/Logradouro *
                        </label>
                        <input
                          type="text"
                          name="customer_street"
                          value={formData.customer_street}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-pink-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                          placeholder="Nome da rua"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-[#ff0080] mb-1">
                          Número *
                        </label>
                        <input
                          type="text"
                          name="customer_number"
                          value={formData.customer_number}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-pink-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                          placeholder="123"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-[#ff0080] mb-1">
                          Complemento
                        </label>
                        <input
                          type="text"
                          name="customer_complement"
                          value={formData.customer_complement}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-pink-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                          placeholder="Apto, Bloco..."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#ff0080] mb-1">
                          Bairro *
                        </label>
                        <input
                          type="text"
                          name="customer_neighborhood"
                          value={formData.customer_neighborhood}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-pink-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                          placeholder="Nome do bairro"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-[#ff0080] mb-1">
                          Cidade *
                        </label>
                        <input
                          type="text"
                          name="customer_city"
                          value={formData.customer_city}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-pink-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                          placeholder="Nome da cidade"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-[#ff0080] mb-1">
                          Estado *
                        </label>
                        <input
                          type="text"
                          name="customer_state"
                          value={formData.customer_state}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-pink-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                          placeholder="SP"
                          maxLength={2}
                          style={{ textTransform: 'uppercase' }}
                        />
                      </div>
                    </div>

                    <div className="bg-[#ff0080] border border-pink-200 rounded-lg p-3">
                      <p className="text-sm text-pink-50">
                        💡 <strong>Dica:</strong> Digite o CEP e o endereço será preenchido automaticamente!
                      </p>
                    </div>
                  </div>

                  {/* Coupon Section */}
                  <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 mb-4">
                    <h3 className="font-medium text-[#ff0080] mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Cupom de Desconto
                    </h3>
                    
                    {!couponApplied ? (
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            name="coupon_code"
                            value={formData.coupon_code}
                            onChange={handleInputChange}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                            placeholder="Digite seu cupom (ex: WEPINK10%)"
                            style={{ textTransform: 'uppercase' }}
                          />
                          <button
                            type="button"
                            onClick={validateCoupon}
                            disabled={couponLoading || !formData.coupon_code.trim()}
                            className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                          >
                            {couponLoading ? (
                              <div className="flex items-center gap-1">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span className="hidden sm:inline">Validando...</span>
                              </div>
                            ) : (
                              'Aplicar'
                            )}
                          </button>
                        </div>
                        
                        {couponError && (
                          <div className="text-red-600 text-sm flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {couponError}
                          </div>
                        )}
                        
                        <p className="text-xs text-pink-700">
                          💡 <strong>Dica:</strong> Experimente o cupom "WEPINK10%" para 10% de desconto!
                        </p>
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-green-800">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <div>
                              <span className="font-medium">Cupom aplicado: {formData.coupon_code.toUpperCase()}</span>
                              <p className="text-sm text-green-700">{couponMessage}</p>
                              <p className="text-sm font-bold text-green-800">Desconto: -{formatPrice(couponDiscount)}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={removeCoupon}
                            className="text-red-600 hover:text-red-800 text-sm font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Minimum Order Check */}
                  {isMinimumOrderMet() && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 text-green-800 mb-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-medium">Pedido Mínimo Atingido!</span>
                      </div>
                     {/* <p className="text-sm text-green-700">
                        ✓ Valor mínimo de {formatPrice(getMinimumOrder())} confirmado
                      </p>*/}
                    </div>
                  )}

                  <div className="bg-white border border-pink-200 rounded-lg p-4 mb-4">
                    <h3 className="font-medium text-[#ff0080] mb-2 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Forma de Pagamento: PIX
                    </h3>
                    <p className="text-sm text-[#ff0080]">
                      ✓ Pagamento instantâneo via PIX<br/>
                      ✓ QR Code será gerado na próxima etapa<br/>
                      ✓ Confirmação automática do pagamento
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#ff0080] mb-1">
                      Observações
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-pink-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="Informações adicionais sobre a entrega..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#ff0080] text-white py-3 px-4 rounded-lg hover:bg-[#ff0080d3] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Processando...
                      </div>
                    ) : (
                      'Gerar PIX para Pagamento'
                    )}
                  </button>
                </form>
              </div>
            )}

            

            {step === 'success' && (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Pedido Confirmado!
                </h2>
                
                <p className="text-gray-600 mb-6">
                  Recebemos seu pedido e o pagamento está sendo processado. 
                  Você receberá uma confirmação em breve e entregaremos suas bebidas geladas!
                </p>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600">
                    Seu pedido foi enviado com sucesso!
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => navigate('/')}
                    className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Continuar Comprando
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-pink-50 rounded-lg shadow p-6 sticky top-4">
              <h3 className="text-lg text-[#ff0080] font-semibold mb-4">Resumo do Pedido</h3>
              
              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-gray-500">
                        Qtd: {item.quantity} × {formatPrice(item.product.price)}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {formatPrice(item.product.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Subtotal:</span>
                  <span className="text-sm text-gray-900">{formatPrice(getTotalPrice())}</span>
                </div>
                
                {couponApplied && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-green-600 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Desconto ({formData.coupon_code.toUpperCase()}):
                    </span>
                    <span className="text-sm text-green-600 font-semibold">-{formatPrice(couponDiscount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Entrega:</span>
                  <span className="text-sm text-green-600 font-medium">Grátis</span>
                </div>
                
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-[#ff0080]">Total:</span>
                    <div className="text-right">
                      {couponApplied && (
                        <div className="text-sm text-gray-500 line-through">
                          {formatPrice(getTotalPrice())}
                        </div>
                      )}
                      <span className={`text-xl font-bold ${couponApplied ? 'text-green-600' : 'text-pink-600'}`}>
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
                </div>
              </div>

              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
