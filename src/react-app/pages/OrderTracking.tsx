import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { ArrowLeft, Package, Clock, User, Phone, QrCode } from 'lucide-react';

interface Order {
  id: number;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_address?: string;
  total_amount: number;
  items: Array<{
    product: {
      name: string;
      price: number;
    };
    quantity: number;
  }>;
  status: string;
  qr_code_url?: string;
  pix_copy_paste?: string;
  coupon_code?: string;
  discount_amount?: number;
  final_amount?: number;
  created_at: string;
  updated_at: string;
}

export default function OrderTracking() {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [pollingActive, setPollingActive] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [timerInitialized, setTimerInitialized] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('id');

  useEffect(() => {
    if (!orderId) {
      navigate('/');
      return;
    }

    fetchOrder();

    // Poll for order updates - more frequent for the first minute, then slower
    let interval: NodeJS.Timeout;
    if (pollingActive) {
      // Initial rapid polling for automatic PIX generation
      interval = setInterval(() => {
        fetchOrder();
      }, 2000); // Every 2 seconds for better UX

      // After 30 seconds, slow down the polling
      setTimeout(() => {
        if (interval) {
          clearInterval(interval);
          if (pollingActive) {
            interval = setInterval(() => {
              fetchOrder();
            }, 5000); // Every 5 seconds after 30 seconds
          }
        }
      }, 30000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [orderId, pollingActive]);

  // Modern Timer Effect - Starts only when PIX becomes available
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (timeLeft !== null && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev === null || prev <= 1) {
            return 0; // Stop at 00:00
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timeLeft]);

  // Initialize timer when PIX copy-paste becomes available
  useEffect(() => {
    if (order && (order.pix_copy_paste || order.qr_code_url) && !timerInitialized) {
      console.log('🟢 TIMER: PIX available, starting 10-minute countdown');
      setTimeLeft(10 * 60); // 10 minutes in seconds
      setTimerInitialized(true);
    }
  }, [order, timerInitialized]);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      const data = await response.json();

      if (response.ok && data.order) {
        const newOrder = data.order;

        // Check if PIX payment info was just added
        const hadNoPixBefore = !order?.qr_code_url && !order?.pix_copy_paste;
        const hasPixNow = newOrder.qr_code_url || newOrder.pix_copy_paste;

        setOrder(newOrder);

        // Show visual feedback when PIX is added
        if (hadNoPixBefore && hasPixNow) {
          console.log('🟢 PIX RECEIVED: Payment method added in real-time!');
        }

        // If order was confirmed, redirect to order approved page
        if (newOrder.status === 'confirmed') {
          setPollingActive(false);
          navigate(`/order-approved?id=${orderId}`);
          return;
        }

        // Stop polling if order is cancelled or delivered
        if (newOrder.status === 'cancelled' || newOrder.status === 'delivered') {
          setPollingActive(false);
        }
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };



  const copyPixCode = async () => {
    if (order?.pix_copy_paste) {
      try {
        await navigator.clipboard.writeText(order.pix_copy_paste);
        alert('Código PIX copiado!');
      } catch (err) {
        alert('Erro ao copiar código PIX');
      }
    }
  };

  const formatTimeLeft = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando pedido...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Pedido não encontrado</h2>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Voltar à Loja
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-pink-200 text-[#ff0080]">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-[#ff0080] hover:text-pink-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar à Loja
            </button>

            <div className="text-right">
              <div className="text-[#ff0080] text-sm font-medium">WEPINK</div>
              <div className="text-pink-600 text-xs">{formatDate(order.created_at)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Layout AmBev - Mobile First e Responsivo */}
          <div className="bg-white rounded-lg shadow-xl overflow-hidden">

            {/* Mobile: PIX Section First */}
            <div className="lg:hidden">
              <div className="bg-white p-4 border-b-4 border-pink-200">
                <div className="text-center">

                  {/* Título Profissional Mobile */}
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold text-[#ff0080] mb-1">Aguardando a confirmação de pagamento</h3>
                    <p className="text-[#ff0080] text-sm">para liberação do pedido</p>
                  </div>

                  {/* Aba PIX Profissional Mobile */}
                  <div className="text-center py-3 px-4">
                    {/* LOGO centralizada */}
                    <img
                      src="https://wepink.vtexassets.com/assets/vtex/assets-builder/wepink.store-theme/4.0.4/svg/logo-primary___ef05671065928b5b01f33e72323ba3b8.svg"
                      alt="Logo"
                      className="h-7 md:h-9 w-auto max-w-[180px] object-contain mx-auto mb-2"
                    />

                    {/* Linha de baixo (ícone + texto + bolinha) */}
                    <div className="flex items-center justify-center gap-2">
                      <QrCode className="w-5 h-5 text-pink-600" />
                      <span className="text-black font-bold text-base uppercase tracking-wide">
                        WEPINK - SAVI COSMÉTICOS LTDA | CNPJ: 42.422.967/0001-01
                      </span>
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    </div>

                    <p className="text-black text-xs mt-1 font-medium">
                      Processamento automático e seguro
                    </p>
                  </div>

                  {/* Conteúdo Principal Mobile */}
                  {(!order.qr_code_url && !order.pix_copy_paste) ? (
                    /* Tela de Aguarde Mobile */
                    <div className="space-y-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-dashed border-blue-300 rounded-lg p-6 min-h-[200px] flex flex-col items-center justify-center">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center mb-4 animate-pulse shadow-lg">
                          <Clock className="w-6 h-6 text-white animate-spin" />
                        </div>

                        <h4 className="text-xl font-bold text-blue-800 mb-2 uppercase tracking-wide text-center">
                          {order.status === 'awaiting_qr' ? 'PIX será adicionado em breve' : 'Gerando PIX Automaticamente'}
                        </h4>

                        <p className="text-blue-700 mb-4 text-center max-w-sm font-medium text-sm leading-relaxed">
                          {order.status === 'awaiting_qr'
                            ? 'O administrador adicionará o PIX manualmente. Atualizaremos automaticamente quando disponível.'
                            : 'Nosso sistema está gerando seu código PIX automaticamente. Aparecerá aqui em segundos!'
                          }
                        </p>

                        {/* Different loading animations based on status */}
                        {order.status === 'awaiting_qr' ? (
                          <div className="flex items-center gap-2 bg-blue-200 px-3 py-2 rounded-full">
                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                            <span className="text-xs text-blue-700 font-medium">Modo Manual Ativo</span>
                          </div>
                        ) : (
                          <div className="flex space-x-2">
                            <div className="w-3 h-3 bg-[#ff0080] rounded-full animate-bounce"></div>
                            <div className="w-3 h-3 bg-[#ff0080] rounded-full animate-bounce delay-75"></div>
                            <div className="w-3 h-3 bg-[#ff0080] rounded-full animate-bounce delay-150"></div>
                          </div>
                        )}

                        {/* Status indicator */}
                        <div className="mt-4 bg-white/50 backdrop-blur-sm border border-blue-300 px-4 py-2 rounded-full">
                          <div className="flex items-center gap-2 text-xs font-medium text-blue-700">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span>
                              {order.status === 'awaiting_qr' ? 'Aguardando admin' : 'Sistema automático ativo'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Tela do PIX Mobile */
                    <div className="space-y-3">

                      {/* TIMER MOBILE - Mais Compacto mas Visível */}
                      {timeLeft !== null && (
                        <div className={`relative overflow-hidden rounded-xl p-4 mb-4 shadow-lg border-2 transform transition-all duration-500 ${timeLeft <= 60 ? 'bg-gradient-to-r from-red-500 to-red-600 border-red-300 animate-pulse scale-105' :
                            timeLeft <= 300 ? 'bg-gradient-to-r from-orange-500 to-orange-600 border-orange-300' :
                              'bg-gradient-to-r from-[#f883bd] to-[#ff0080] border-pink-300'
                          }`}>

                          <div className="relative z-10 text-center">
                            {/* Icon compacto */}
                            <div className="flex justify-center mb-2">
                              <Clock className={`w-6 h-6 text-white ${timeLeft <= 60 ? 'animate-spin' : timeLeft <= 300 ? 'animate-pulse' : ''}`} />
                            </div>

                            {/* TIMER DISPLAY Mobile */}
                            <div className={`text-3xl font-mono font-black text-white mb-2 tracking-wider ${timeLeft <= 60 ? 'animate-pulse text-yellow-200' : 'text-white'
                              }`}>
                              {formatTimeLeft(timeLeft)}
                            </div>

                            {/* Status message compacto */}
                            <div className={`text-sm font-bold mb-2 ${timeLeft <= 60 ? 'text-yellow-200 animate-bounce' :
                                timeLeft <= 300 ? 'text-orange-100' :
                                  'text-blue-100'
                              }`}>
                              {timeLeft <= 60 ? '🚨 EXPIRA EM BREVE!' :
                                timeLeft <= 300 ? '⏰ Tempo restante' :
                                  'Tempo para pagamento'}
                            </div>

                            {/* Progress bar compacto */}
                            <div className="relative">
                              <div className={`h-2 rounded-full overflow-hidden ${timeLeft <= 60 ? 'bg-red-800' :
                                  timeLeft <= 300 ? 'bg-orange-800' :
                                    'bg-white'
                                }`}>
                                <div
                                  className={`h-full transition-all duration-1000 ${timeLeft <= 60 ? 'bg-gradient-to-r from-yellow-300 to-red-300 animate-pulse' :
                                      timeLeft <= 300 ? 'bg-gradient-to-r from-yellow-200 to-orange-300' :
                                        'bg-gradient-to-r from-white to-pink-300'
                                    }`}
                                  style={{
                                    width: `${Math.max(0, (timeLeft / (10 * 60)) * 100)}%`
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* QR Code ou PIX Mobile */}
                      <div className="bg-pink-50 rounded-lg p-3 min-h-[120px] flex flex-col items-center justify-center border border-pink-200">
                        {order.qr_code_url ? (
                          <div className="text-center">
                            <img
                              src={order.qr_code_url}
                              alt="QR Code PIX"
                              className="w-32 h-32 mx-auto mb-2 border border-gray-200"
                            />
                          </div>
                        ) : order.pix_copy_paste ? (
                          <div className="w-full text-center">
                            <div className="bg-pink-50 border border-pink-200 rounded-lg p-2 mb-2">
                              <p className="font-bold text-[#ff0080] text-sm">🔥 Seu PIX está pronto!</p>
                              <p className="text-[#ff0080] text-xs">👇 Clique no botão abaixo para finalizar o pagamento</p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className="w-32 h-32 bg-gray-200 rounded flex items-center justify-center mb-2">
                              <Clock className="w-8 h-8 text-gray-400 animate-pulse" />
                            </div>
                            <p className="text-xs text-gray-600">Carregando PIX...</p>
                          </div>
                        )}
                      </div>

                      {/* Botões Mobile */}
                      <div className="space-y-2">
                        {order.pix_copy_paste && (
                          <button
                            onClick={copyPixCode}
                            className="w-full py-3 px-4 rounded-lg font-bold text-base bg-gradient-to-r from-[#ff0080] to-[#ff0080] hover:from-[#e271a9] hover:to-[#ff0080] text-white transition-all transform hover:scale-105 shadow-lg"
                          >
                            <div className="flex items-center justify-center gap-2">
                              <QrCode className="w-5 h-5" />
                              COPIAR CÓDIGO PIX
                            </div>

                            {timeLeft !== null && timeLeft <= 300 && (
                              <div className={`text-xs mt-1 font-bold ${timeLeft <= 60 ? 'animate-bounce text-yellow-200' : 'opacity-90'
                                }`}>
                                {timeLeft <= 60 ? '🚨 EXPIRA EM ' : '⚡ EXPIRA EM '}{formatTimeLeft(timeLeft)}!
                              </div>
                            )}
                          </button>
                        )}

                        <button className="w-full border-2 border-pink-300 text-[#ff0080] py-2 px-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm bg-white">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span>Aguardando pagamento</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2">

              {/* Lado Esquerdo - Informações do Pedido */}
              <div className="bg-white  border-pink-200 text-black p-4 lg:p-6">
                <div>
                  {/* Logo AmBev Profissional */}
                  <div className="text-center mb-4 lg:mb-6 border-b border-pink-200 pb-3 lg:pb-4">
                    
                    <div className="text-xs lg:text-sm font-bold tracking-wider mb-1 text-pink-600">SAVI COSMÉTICOS -LTDA</div>
                    <img
                      src="https://wepink.vtexassets.com/assets/vtex/assets-builder/wepink.store-theme/4.0.4/svg/logo-primary___ef05671065928b5b01f33e72323ba3b8.svg"
                      alt="Logo"
                      className="h-7 md:h-9 w-auto max-w-[180px] object-contain mx-auto mb-2"
                    />
                    <div className="text-xs text-pink-600 mt-1 font-medium">Canal de vendas Oficial</div>
                  </div>

                  {/* Informações do Cliente Profissionais */}
                  <div className="space-y-3 lg:space-y-4">
                    <div className="bg-pink-50 rounded-lg p-3 lg:p-4 border border-pink-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <p className="text-xs lg:text-sm font-semibold text-pink-600 uppercase tracking-wide">Cliente - canal de vendas</p>
                      </div>
                      <p className="text-lg lg:text-xl font-bold mb-2 text-gray-600">
                        {order.customer_name?.toUpperCase() || 'CLIENTE AMBEV'}
                      </p>
                      <p className="text-xs lg:text-sm text-gray-600 font-medium">
                        {(order.status === 'awaiting_qr' || (!order.qr_code_url && !order.pix_copy_paste))
                          ? 'Finalizando processo de pagamento via PIX'
                          : 'Pedido em processamento - Acompanhe seu status.'
                        }
                      </p>
                    </div>

                    {/* Dados de Contato Profissionais */}
                    <div className="bg-pink-50 rounded-lg p-3 lg:p-4 border border-pink-200 space-y-2 lg:space-y-3">
                      <div className="border-b border-pink-200 pb-2">
                        <h4 className="text-xs lg:text-sm font-bold text-pink-600 uppercase tracking-wide mb-1">Dados do Cliente</h4>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3 lg:w-4 lg:h-4 text-pink-600" />
                          <span className="text-black text-xs lg:text-sm font-medium">Nome:</span>
                        </div>
                        <span className="font-semibold text-xs lg:text-sm text-black text-right">{order.customer_name || 'Não informado'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3 lg:w-4 lg:h-4 text-pink-600" />
                          <span className="text-black text-xs lg:text-sm font-medium">Telefone:</span>
                        </div>
                        <span className="font-semibold text-xs lg:text-sm text-black text-right">{order.customer_phone || 'Não informado'}</span>
                      </div>
                    </div>

                    {/* Número do Pedido Profissional */}
                    <div className="bg-pink-50 rounded-lg p-3 border border-pink-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 lg:w-5 lg:h-5 text-pink-600" />
                          <span className="font-semibold text-xs lg:text-sm text-black">Nº do Pedido:</span>
                        </div>
                        <span className="font-black text-lg lg:text-xl text-[#ff0080]">#{String(order.id).padStart(6, '0')}</span>
                      </div>
                      <div className="text-xs text-black mt-1 font-medium">
                        Data: {formatDate(order.created_at)}
                      </div>
                    </div>

                    {/* Resumo de Produtos Profissional */}
                    <div className="bg-pink-50 rounded-lg p-3 lg:p-4 border border-pink-200">
                      <div className="border-b border-pink-200 pb-2 mb-2 lg:mb-3">
                        <h4 className="text-xs lg:text-sm font-bold text-pink-600 uppercase tracking-wide flex items-center gap-2">
                          <Package className="w-3 h-3 lg:w-4 lg:h-4" />
                          Produtos ({order.items.length} {order.items.length === 1 ? 'item' : 'itens'})
                        </h4>
                      </div>
                      <div className="space-y-2 max-h-32 lg:max-h-40 overflow-y-auto">
                        {order.items.slice(0, 3).map((item, index) => (
                          <div key={index} className="bg-white rounded-lg p-2 lg:p-3 border border-pink-200">
                            <div className="flex justify-between items-start">
                              <div className="flex-1 pr-2">
                                <span className="font-semibold text-xs lg:text-sm text-black leading-tight block mb-1">
                                  {item.product.name}
                                </span>
                                <div className="flex flex-col lg:flex-row lg:items-center lg:gap-2 text-black text-xs">
                                  <span className="bg-pink-100 text-pink-600 px-2 py-1 rounded font-medium text-xs mb-1 lg:mb-0 inline-block w-fit">
                                    Qtd: {item.quantity}
                                  </span>
                                  <span className="text-xs">Unitário: {formatPrice(item.product.price)}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-xs lg:text-sm text-black block">
                                  {formatPrice(item.product.price * item.quantity)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <div className="text-center text-xs text-black bg-blue-50 rounded p-2 font-medium border border-blue-200">
                            + {order.items.length - 3} produtos adicionais
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Cupom e Desconto - Se aplicado */}
                    {order.coupon_code && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-3 lg:p-4 mb-3">
                        <div className="text-center">
                          <div className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase mb-2 inline-block">
                            CUPOM APLICADO
                          </div>
                          <div className="text-green-700 font-bold text-sm lg:text-base mb-2 uppercase">
                            {order.coupon_code}
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-green-700 text-xs lg:text-sm">Valor Original:</span>
                              <span className="text-gray-500 line-through text-sm lg:text-base">
                                {formatPrice(order.total_amount)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-green-700 text-xs lg:text-sm">Desconto:</span>
                              <span className="text-red-600 font-bold text-base lg:text-lg">
                                -{formatPrice(order.discount_amount || 0)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Valor Total Profissional */}
                    <div className="bg-pink-50 rounded-lg p-3 lg:p-4 border-2 border-pink-200">
                      <div className="text-center">
                        <div className="text-pink-600 text-xs lg:text-sm font-semibold uppercase tracking-wide mb-1">
                          {order.coupon_code ? 'Valor Final com Desconto' : 'Valor Total do Pedido'}
                        </div>
                        
                        <div className="text-2xl lg:text-3xl font-black text-[#ff0080]">
                          {formatPrice(order.final_amount || order.total_amount)}
                        </div>
                        <div className="text-[#ff0080] text-xs mt-1 font-medium">
                          
                          Pagamento via PIX
                          <img
                      src="https://images.seeklogo.com/logo-png/39/2/pix-logo-png_seeklogo-392002.png"
                      alt="Logo"
                      className="h-7 md:h-9 w-auto max-w-[180px] object-contain mx-auto mb-2"
                    />
                        </div>
                        {order.coupon_code && (
                          <div className="text-green-600 text-xs mt-1 font-bold">
                            Economia de {formatPrice(order.discount_amount || 0)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lado Direito - PIX/Status - Desktop Only */}
              <div className="hidden lg:block bg-white p-6 flex flex-col justify-center">
                <div className="text-center">

                  {/* Título Profissional */}
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-[#ff0080] mb-2">Aguardando a confirmação de pagamento</h3>
                    <p className="text-black text-sm">para liberação do pedido</p>
                  </div>

                  {/* Aba PIX Profissional */}
                  
                  <div className="bg-pink-50 border border-pink-200 rounded-t-lg mb-6">
                    <div className="text-center py-4 px-6">
                      <div className="flex items-center justify-center gap-3">
                        <QrCode className="w-6 h-6 text-pink-600" />
                        <span className="text-[#ff0080] font-bold text-lg uppercase tracking-wide">Savi cosméticos - LTDA</span>
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      </div>
                      <p className="text-black text-sm mt-1 font-medium">Processamento automático e seguro</p>
                    </div>
                  </div>

                  {/* Conteúdo Principal */}
                  {(!order.qr_code_url && !order.pix_copy_paste) ? (
                    /* Tela de Aguarde */
                    <div className="space-y-6">
                      <div className="bg-blue-50 border-2 border-dashed border-pink-300 rounded-lg p-8 min-h-[250px] flex flex-col items-center justify-center">
                        <div className="w-12 h-12 bg-pink-600 rounded-full flex items-center justify-center mb-4">
                          <Clock className="w-6 h-6 text-white animate-pulse" />
                        </div>

                        <h4 className="text-2xl font-bold text-black mb-3 uppercase tracking-wide">Processando PIX</h4>

                        <p className="text-black mb-4 text-center max-w-sm font-medium">
                          Aguarde, estamos gerando seu QR code de pagamento.
                          O código aparecerá em instantes nesta área.
                        </p>

                        {/* Loading animation */}
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-75"></div>
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-150"></div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Tela do PIX */
                    <div className="space-y-4">

                      {/* SUPER HIGHLIGHTED PIX TIMER - Ultra Visible */}
                      {timeLeft !== null && (
                        <div className={`relative overflow-hidden rounded-2xl p-6 mb-6 shadow-2xl border-4 transform transition-all duration-500 ${timeLeft <= 60 ? 'bg-gradient-to-r from-red-600 via-red-500 to-red-600 border-red-400 animate-pulse scale-105' :
                            timeLeft <= 300 ? 'bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 border-orange-400' :
                              'bg-gradient-to-r from-pink-600 via-pink-500 to-pink-600 border-pink-400'
                          }`}>

                          {/* Animated background overlay */}
                          <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/10 animate-gradient-x"></div>

                          {/* Pulsing border effect for urgent state */}
                          {timeLeft <= 60 && (
                            <div className="absolute inset-0 border-4 border-yellow-300 rounded-2xl animate-ping opacity-75"></div>
                          )}

                          <div className="relative z-10 text-center">
                            {/* Icon with enhanced animation */}
                            <div className="flex justify-center mb-4">
                              <div className={`relative ${timeLeft <= 60 ? 'animate-bounce' : ''}`}>
                                <Clock className={`w-10 h-10 text-white ${timeLeft <= 60 ? 'animate-spin' : timeLeft <= 300 ? 'animate-pulse' : ''}`} />
                                {timeLeft <= 60 && (
                                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-ping">
                                    <span className="text-red-600 font-black text-sm">!</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* MEGA TIMER DISPLAY */}
                            <div className={`text-6xl font-mono font-black text-white mb-3 tracking-wider drop-shadow-2xl ${timeLeft <= 60 ? 'animate-pulse text-yellow-200' :
                                timeLeft <= 300 ? 'text-yellow-100' :
                                  'text-white'
                              }`}>
                              {formatTimeLeft(timeLeft)}
                            </div>

                            {/* Status message with enhanced styling */}
                            <div className={`text-lg font-bold mb-4 ${timeLeft <= 60 ? 'text-yellow-200 animate-bounce' :
                                timeLeft <= 300 ? 'text-orange-100' :
                                  'text-pink-100'
                              }`}>
                              {timeLeft <= 60 ? '🚨 EXPIRA EM BREVE! PAGUE AGORA!' :
                                timeLeft <= 300 ? '⏰ Tempo restante' :
                                  'Tempo para pagamento'}
                            </div>

                            {/* Enhanced progress bar */}
                            <div className="relative">
                              <div className={`h-4 rounded-full overflow-hidden shadow-inner ${timeLeft <= 60 ? 'bg-red-800' :
                                  timeLeft <= 300 ? 'bg-orange-800' :
                                    'bg-pink-800'
                                }`}>
                                <div
                                  className={`h-full transition-all duration-1000 ${timeLeft <= 60 ? 'bg-gradient-to-r from-yellow-300 to-red-300 animate-pulse' :
                                      timeLeft <= 300 ? 'bg-gradient-to-r from-yellow-200 to-orange-300' :
                                        'bg-gradient-to-r from-white to-pink-300'
                                    }`}
                                  style={{
                                    width: `${Math.max(0, (timeLeft / (10 * 60)) * 100)}%`
                                  }}
                                ></div>
                              </div>

                              {/* Progress percentage */}
                              <div className="text-center mt-2 text-white/90 text-sm font-medium">
                                {Math.round((timeLeft / (10 * 60)) * 100)}% do tempo restante
                              </div>
                            </div>

                            {/* Emergency warning for last minute */}
                            {timeLeft <= 60 && (
                              <div className="mt-4 bg-yellow-400 text-red-900 px-4 py-2 rounded-lg font-black text-sm animate-bounce border-2 border-red-400">
                                ⚠️ ÚLTIMO MINUTO! PIX EXPIRA EM BREVE! ⚠️
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* QR Code ou PIX */}
                      <div className="bg-gray-50 rounded-lg p-4 min-h-[150px] flex flex-col items-center justify-center">
                        {order.qr_code_url ? (
                          <div className="text-center">
                            <img
                              src={order.qr_code_url}
                              alt="QR Code PIX"
                              className="w-48 h-48 mx-auto mb-3 border border-gray-200"
                            />
                          </div>
                        ) : order.pix_copy_paste ? (
                          <div className="w-full text-center">
                            <div className="bg-pink-50 border border-pink-200 rounded-lg p-3 mb-3">
                              <p className="font-bold text-[#ff0080]">🔥 Seu PIX está pronto!</p>
                              <p className="text-[#ff0080] text-sm">👇 Clique no botão abaixo para finalizar o pagamento</p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className="w-48 h-48 bg-gray-200 rounded flex items-center justify-center mb-3">
                              <Clock className="w-12 h-12 text-gray-400 animate-pulse" />
                            </div>
                            <p className="text-sm text-gray-600">Carregando PIX...</p>
                          </div>
                        )}
                      </div>

                      {/* Instruções Profissionais */}
                      <div className="bg-pink-50 border border-pink-200 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-[#ff0080] rounded-full"></div>
                          <span className="text-[#ff0080] font-bold text-sm uppercase tracking-wide">Instruções de Pagamento</span>
                        </div>
                        <p className="text-[#ff0080] text-sm font-medium leading-relaxed">
                          Utilize o botão abaixo para copiar o código PIX e realizar o pagamento através do seu aplicativo bancário preferido.
                        </p>
                      </div>

                      {/* Botões */}
                      <div className="space-y-2">
                        {order.pix_copy_paste && (
                          <button
                            onClick={copyPixCode}
                            className="w-full py-4 px-6 rounded-xl font-black text-lg bg-gradient-to-r from-[#eb7eb4] to-[#ff0080] hover:from-[#ff0080] hover:to-[#eb7eb4] text-white transition-all transform hover:scale-105 shadow-xl relative overflow-hidden"
                          >
                            {/* Animated background */}
                            <div className="absolute inset-0 bg-gradient-to-r from-[#eb7eb4]  to-[#ff0080] animate-pulse opacity-20"></div>

                            <div className="relative z-10 flex items-center justify-center gap-3">
                              <QrCode className="w-6 h-6" />
                              CLIQUE AQUI PARA COPIAR
                            </div>

                            {timeLeft !== null && timeLeft <= 300 && (
                              <div className={`relative z-10 text-sm mt-1 font-bold ${timeLeft <= 60 ? 'animate-bounce text-yellow-200' : 'opacity-90 animate-pulse'
                                }`}>
                                {timeLeft <= 60 ? '🚨 EXPIRA EM ' : '⚡ EXPIRA EM '}{formatTimeLeft(timeLeft)}!
                              </div>
                            )}
                          </button>
                        )}

                        <button className="w-full border-2 border-pink-300 text-[#ff0080] py-3 px-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm bg-white shadow-sm">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span>Aguardando pagamento</span>
                          </div>
                        </button>
                      </div>
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
