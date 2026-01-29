import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Bell, Clock, QrCode, AlertTriangle, User, Phone, MapPin, Globe, Ban } from 'lucide-react';

interface Order {
  id: number;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_address?: string;
  customer_ip?: string;
  total_amount: number;
  coupon_code?: string;
  discount_amount?: number;
  final_amount?: number;
  status: string;
  created_at: string;
  items: any[];
}

export default function AwaitingPixOrders() {
  const [awaitingOrders, setAwaitingOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [banningIp, setBanningIp] = useState<number | null>(null);

  useEffect(() => {
    fetchAwaitingOrders();
    
    // Atualizar a cada 5 segundos
    const interval = setInterval(fetchAwaitingOrders, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchAwaitingOrders = async () => {
    try {
      console.log('🟢 AWAITING ORDERS: Fetching awaiting orders...');
      const response = await fetch('/api/admin/orders');
      console.log('🟢 AWAITING ORDERS: Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔴 AWAITING ORDERS: HTTP error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('🟢 AWAITING ORDERS: Full response data:', data);
      
      if (data.orders && Array.isArray(data.orders)) {
        const awaiting = data.orders.filter((order: Order) => order.status === 'awaiting_qr');
        console.log('🟢 AWAITING ORDERS: Total orders:', data.orders.length);
        console.log('🟢 AWAITING ORDERS: Awaiting orders found:', awaiting.length);
        console.log('🟢 AWAITING ORDERS: Order statuses:', data.orders.map((o: any) => ({ id: o.id, status: o.status, created: o.created_at })));
        console.log('🟢 AWAITING ORDERS: Awaiting orders details:', awaiting);
        setAwaitingOrders(awaiting);
        
        // Show browser notification if there are new awaiting orders
        if (awaiting.length > 0 && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            new Notification('Novos Pedidos PIX!', {
              body: `${awaiting.length} ${awaiting.length === 1 ? 'pedido aguardando' : 'pedidos aguardando'} QR Code`,
              icon: '/favicon.ico'
            });
          } else if (Notification.permission !== 'denied') {
            Notification.requestPermission();
          }
        }
      } else {
        console.log('🔴 AWAITING ORDERS: No orders property or not array in response');
        setAwaitingOrders([]);
      }
    } catch (error) {
      console.error('🔴 AWAITING ORDERS: Error fetching awaiting orders:', error);
      setAwaitingOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBanIp = async (order: Order) => {
    if (banningIp || !order.customer_ip) return;

    const confirmMessage = `Tem certeza que deseja banir o IP ${order.customer_ip}?\n\nPedido: #${order.id}\nCliente: ${order.customer_name || 'Anônimo'}\nTelefone: ${order.customer_phone || 'N/A'}\nEmail: ${order.customer_email || 'N/A'}\n\nEsta ação impedirá este IP de acessar a loja.`;
    
    if (!confirm(confirmMessage)) return;

    const reason = prompt('Digite o motivo do banimento (opcional):') || `Banido via pedido aguardando PIX #${order.id}`;

    setBanningIp(order.id);
    
    try {
      const response = await fetch('/api/admin/ban-ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ip_address: order.customer_ip,
          reason: reason,
          banned_by: 'Admin - Via Pedidos Aguardando'
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✅ IP ${order.customer_ip} foi banido com sucesso!\n\nPedido: #${order.id}\nCliente: ${order.customer_name || 'Anônimo'}\nMotivo: ${reason}`);
        // Refresh orders to show updated data
        fetchAwaitingOrders();
      } else {
        alert('❌ Erro ao banir IP: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Error banning IP:', error);
      alert('❌ Erro ao banir IP do cliente');
    } finally {
      setBanningIp(null);
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

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const orderDate = new Date(dateString);
    
    // Ajustar para fuso horário brasileiro
    const nowBrasilia = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const orderBrasilia = new Date(orderDate.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    
    const diffInMinutes = Math.floor((nowBrasilia.getTime() - orderBrasilia.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora mesmo';
    if (diffInMinutes === 1) return '1 minuto atrás';
    if (diffInMinutes < 60) return `${diffInMinutes} minutos atrás`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours === 1) return '1 hora atrás';
    if (diffInHours < 24) return `${diffInHours} horas atrás`;
    
    return formatDate(dateString);
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-amber-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-amber-100 rounded"></div>
            <div className="h-20 bg-amber-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (awaitingOrders.length === 0) {
    return null; // Não mostra o componente se não há pedidos aguardando
  }

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl shadow-lg overflow-hidden">
      {/* Header com animação de alerta */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/10 animate-pulse"></div>
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-white/30 rounded-full animate-ping"></div>
              <Bell className="w-6 h-6 text-white relative z-10" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-bounce"></div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                🚨 Pedidos Aguardando PIX
              </h2>
              <p className="text-amber-100 text-sm">
                Clientes esperando para pagar
              </p>
            </div>
          </div>
          
          <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
            <span className="text-white font-bold text-lg">
              {awaitingOrders.length}
            </span>
          </div>
        </div>
      </div>
      
      {/* Lista de pedidos */}
      <div className="p-6">
        <div className="mb-4 flex items-center gap-2 text-amber-800">
          <AlertTriangle className="w-5 h-5" />
          <p className="font-medium">
            Estes clientes já fizeram o pedido e estão aguardando o PIX para pagamento
          </p>
        </div>
        
        <div className="space-y-4">
          {awaitingOrders.slice(0, 5).map((order) => (
            <div key={order.id} className="bg-white rounded-lg p-4 border-2 border-amber-200 shadow-sm hover:shadow-md transition-all duration-200 hover:border-amber-300">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  {/* Cabeçalho do pedido */}
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-amber-900 text-lg">
                      Pedido #{order.id}
                    </span>
                    <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-medium animate-pulse border border-amber-300">
                      <Clock className="w-3 h-3 inline mr-1" />
                      Aguardando PIX
                    </div>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {getTimeAgo(order.created_at)}
                    </span>
                  </div>
                  
                  {/* Informações do cliente */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    {order.customer_name && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <User className="w-4 h-4" />
                        <span className="font-medium">{order.customer_name}</span>
                      </div>
                    )}
                    
                    {order.customer_phone && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Phone className="w-4 h-4" />
                        <span>{order.customer_phone}</span>
                      </div>
                    )}
                    
                    {order.customer_address && (
                      <div className="flex items-center gap-2 text-gray-700 md:col-span-2">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{order.customer_address}</span>
                      </div>
                    )}
                    
                    {order.customer_ip && (
                      <div className="flex items-center gap-2 text-gray-600 md:col-span-2">
                        <Globe className="w-4 h-4" />
                        <span className="font-mono text-sm">{order.customer_ip}</span>
                        <button
                          onClick={() => handleBanIp(order)}
                          disabled={banningIp === order.id}
                          className="ml-2 bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                          title={`Banir IP ${order.customer_ip}`}
                        >
                          {banningIp === order.id ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-white border-t-transparent border-2"></div>
                              Banindo...
                            </>
                          ) : (
                            <>
                              <Ban className="w-3 h-3" />
                              Banir IP
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Resumo dos itens */}
                  <div className="text-xs text-gray-600">
                    {order.items.length} {order.items.length === 1 ? 'item' : 'itens'} • 
                    Criado em {formatDate(order.created_at)}
                  </div>
                </div>
                
                {/* Valor e botão de ação */}
                <div className="text-right space-y-3 ml-4">
                  <div>
                    <p className="text-2xl font-bold text-amber-900">
                      {formatPrice(order.total_amount)}
                    </p>
                    <p className="text-xs text-gray-500">Total do pedido</p>
                  </div>
                  
                  <Link
                    to="/admin/orders"
                    className="inline-flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors shadow-md hover:shadow-lg"
                  >
                    <QrCode className="w-4 h-4" />
                    Adicionar PIX
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Botão para ver todos se houver mais pedidos */}
        {awaitingOrders.length > 5 && (
          <div className="mt-6 text-center">
            <Link
              to="/admin/orders"
              className="inline-flex items-center gap-2 bg-amber-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-amber-700 transition-colors shadow-md hover:shadow-lg"
            >
              <Bell className="w-5 h-5" />
              Ver todos os {awaitingOrders.length} pedidos aguardando PIX
            </Link>
          </div>
        )}
        
        {/* Instruções rápidas */}
        <div className="mt-6 bg-amber-100 border border-amber-300 rounded-lg p-4">
          <h4 className="font-medium text-amber-900 mb-2">🎯 Ação necessária:</h4>
          <ol className="text-sm text-amber-800 space-y-1 list-decimal list-inside">
            <li>Clique em "Adicionar PIX" para ir aos pedidos</li>
            <li>Adicione o QR Code ou PIX copia e cola</li>
            <li>O cliente receberá automaticamente o PIX</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
