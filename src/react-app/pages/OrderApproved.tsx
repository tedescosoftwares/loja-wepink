import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { CheckCircle, Package, Clock, User, Phone } from 'lucide-react';

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
  created_at: string;
}

export default function OrderApproved() {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('id');

  useEffect(() => {
    if (!orderId) {
      navigate('/admin/orders');
      return;
    }

    fetchOrder();
  }, [orderId, navigate]);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/admin/orders`);
      const data = await response.json();

      if (data.orders) {
        const foundOrder = data.orders.find((o: Order) => o.id === parseInt(orderId!));
        if (foundOrder) {
          setOrder(foundOrder);
        } else {
          navigate('/admin/orders');
        }
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      navigate('/admin/orders');
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



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando detalhes do pedido...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Pedido não encontrado</h2>
          <p className="text-gray-600">Entre em contato conosco para mais informações</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header Compacto Mobile */}
      <div className="bg-[#ff0080] px-4 py-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Pedido Aprovado!
          </h1>
          <p className="text-pink-100 text-sm md:text-base">
            #{String(order.id).padStart(4, '0')} - {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>

      {/* Main Content Compacto */}
      <div className="px-4 py-6">
        {/* Informações Essenciais */}
        <div className="bg-white border border-pink-200 rounded-lg mb-6">
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-[#ff0080] mb-1">
                  <User className="w-4 h-4" />
                  <span className="text-sm">Cliente</span>
                </div>
                <p className="font-bold text-gray-600 text-sm">
                  {order.customer_name || 'Cliente'}
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-[#ff0080] mb-1">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">Telefone</span>
                </div>
                <p className="font-bold text-gray-600 text-sm">
                  {order.customer_phone || 'N/A'}
                </p>
              </div>
            </div>

            <div className="text-center bg-pink-50 rounded-lg p-3">
              <span className="text-pink-600 text-sm font-medium">Valor Total</span>
              <p className="text-2xl font-bold text-[#ff0080]">
                {formatPrice(order.total_amount)}
              </p>
            </div>
          </div>
        </div>

        {/* Produtos Compacto */}
        <div className="bg-white border border-pink-200 rounded-lg mb-6">
          <div className="p-4">
            <h3 className="font-semibold text-gray-600 mb-3 text-center">
              Produtos ({order.items.length} {order.items.length === 1 ? 'item' : 'itens'})
            </h3>
            <div className="space-y-2">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-600 line-clamp-1">
                      {item.product.name}
                    </span>
                    <span className="text-xs text-pink-500">x{item.quantity}</span>
                  </div>
                  <span className="text-sm font-bold text-[#ff0080]">
                    {formatPrice(item.product.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Entrega Compacta */}
        <div className="bg-[#ff0080] rounded-lg p-4 text-center text-white mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="w-5 h-5" />
            <h3 className="text-lg font-bold">Prazo de Entrega</h3>
          </div>
          <div className="text-3xl font-black mb-2">48 HORAS</div>
          <p className="text-blue-100 text-sm">A partir da aprovação do pedido</p>
        </div>

        {/* Status Compacto */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-bold text-gray-900">Pedido em processamento</h3>
          </div>

          <p className="text-sm text-gray-700">
            Em alguns instantes você vai receber a confirmação e o código de rastreamento do seu pedido
            pelo WhatsApp e/ou e-mail informados no ato da compra.
          </p>

          <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800 font-medium">
              ✅ Nenhuma ação é necessária.
            </p>
            <p className="text-xs text-green-700 mt-1">
              O processamento é automático e seguro.
            </p>
          </div>
        </div>

        {/* Botão de Ação */}
        <button
          onClick={() => navigate('/')}
          className="w-full bg-[#ff0080] text-white py-3 rounded-lg font-semibold hover:bg-[#e93f94] transition-colors"
        >
          Continuar Comprando
        </button>
      </div>

      {/* Footer Compacto */}
      <div className="bg-gray-100 p-4 text-center mt-6">
        <div className="text-gray-600 text-sm">
          <p className="font-semibold">WEPINK - Savi Cosméticos - LTDA </p>
          <p className="text-xs mt-1">Copyright 2026 - Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}
