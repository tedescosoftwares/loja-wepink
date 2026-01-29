import { useState, useEffect } from "react";
import { ShoppingBag, Bell, User, Phone, MapPin, Clock } from "lucide-react";

interface Order {
  id: number;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_address?: string;
  customer_cep?: string;
  items: any[];
  total_amount: number;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export default function AdminDirect() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [awaitingOrders, setAwaitingOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetchOrders();
    
    // Refresh every 5 seconds
    const interval = setInterval(fetchOrders, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      console.log('AdminDirect: Fetching orders...');
      const response = await fetch('/api/admin/orders');
      const data = await response.json();
      
      console.log('AdminDirect: Orders received:', data);
      
      if (data.orders) {
        setOrders(data.orders);
        const awaiting = data.orders.filter((order: Order) => order.status === 'awaiting_qr');
        setAwaitingOrders(awaiting);
        console.log('AdminDirect: Awaiting orders:', awaiting.length);
      }
    } catch (error) {
      console.error('AdminDirect: Error fetching orders:', error);
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
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Admin Direto - Carregando...</h1>
          <div className="animate-pulse bg-white rounded-lg shadow p-6">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin Direto - Debug</h1>
          <button
            onClick={fetchOrders}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Atualizar
          </button>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <ShoppingBag className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Pedidos</p>
                <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Bell className="w-8 h-8 text-amber-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Aguardando QR</p>
                <p className="text-2xl font-bold text-amber-900">{awaitingOrders.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Última Atualização</p>
                <p className="text-sm text-gray-900">{new Date().toLocaleTimeString('pt-BR')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Awaiting Orders Alert */}
        {awaitingOrders.length > 0 && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-6 h-6 text-amber-600" />
              <h2 className="text-lg font-bold text-amber-900">
                🚨 {awaitingOrders.length} Pedidos Aguardando PIX
              </h2>
            </div>
            
            <div className="space-y-4">
              {awaitingOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-lg p-4 border border-amber-300">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-amber-900">Pedido #{order.id}</span>
                        <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs font-medium">
                          Aguardando PIX
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        {order.customer_name && (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{order.customer_name}</span>
                          </div>
                        )}
                        {order.customer_phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            <span>{order.customer_phone}</span>
                          </div>
                        )}
                        {order.customer_address && (
                          <div className="flex items-center gap-2 md:col-span-2">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate">{order.customer_address}</span>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-2">
                        Criado: {formatDate(order.created_at)}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-xl font-bold text-amber-900">
                        {formatPrice(order.total_amount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.items.length} itens
                      </p>
                    </div>
                  </div>
                  
                  {/* Items */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Itens:</h4>
                    <div className="space-y-1">
                      {order.items.map((item, index) => (
                        <div key={index} className="text-xs text-gray-600">
                          {item.quantity}x {item.product.name} - {formatPrice(item.product.price * item.quantity)}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {order.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Observações:</h4>
                      <p className="text-xs text-gray-600">{order.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Orders */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Todos os Pedidos</h2>
          </div>
          
          <div className="p-6">
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum pedido encontrado</p>
                <button
                  onClick={fetchOrders}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Tentar Novamente
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">Pedido #{order.id}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            order.status === 'awaiting_qr' 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status === 'awaiting_qr' ? 'Aguardando QR' : order.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {order.customer_name || 'Cliente não identificado'} • {formatDate(order.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatPrice(order.total_amount)}</p>
                        <p className="text-xs text-gray-500">{order.items.length} itens</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
