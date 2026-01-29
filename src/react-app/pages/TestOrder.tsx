import { useState } from 'react';
import { ShoppingBag, Plus } from 'lucide-react';

export default function TestOrder() {
  const [creating, setCreating] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);

  const createTestOrder = async () => {
    setCreating(true);
    try {
      const testOrder = {
        customer_name: `Cliente Teste ${Date.now()}`,
        customer_phone: "(11) 99999-9999",
        customer_email: "teste@teste.com",
        customer_address: "Rua Teste, 123",
        customer_cep: "01234-567",
        items: [
          {
            product: {
              id: 1,
              name: "Coca-Cola 350ml",
              price: 3.50
            },
            quantity: 2
          },
          {
            product: {
              id: 2,
              name: "Água Crystal 500ml", 
              price: 2.00
            },
            quantity: 1
          }
        ],
        total_amount: 9.00,
        notes: "Pedido de teste criado automaticamente",
        payment_method: "pix"
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testOrder),
      });

      const data = await response.json();
      
      if (response.ok) {
        alert(`Pedido criado com sucesso! ID: ${data.orderId}`);
        fetchOrders();
      } else {
        alert('Erro ao criar pedido: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating test order:', error);
      alert('Erro ao criar pedido');
    } finally {
      setCreating(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/admin/orders');
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <ShoppingBag className="w-6 h-6" />
          Teste de Criação de Pedidos
        </h1>

        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h2 className="font-semibold text-blue-900 mb-2">Criar Pedido de Teste</h2>
            <p className="text-blue-700 text-sm mb-4">
              Clique no botão abaixo para criar um pedido de teste que deve aparecer no painel admin.
            </p>
            
            <button
              onClick={createTestOrder}
              disabled={creating}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {creating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Criando Pedido...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Criar Pedido de Teste
                </>
              )}
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Últimos Pedidos</h2>
              <button
                onClick={fetchOrders}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Atualizar
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhum pedido encontrado
              </div>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Pedido #{order.id}</h3>
                        <p className="text-sm text-gray-600">
                          {order.customer_name} • {order.customer_phone}
                        </p>
                        <p className="text-xs text-gray-500">
                          Status: {order.status} • {new Date(order.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          R$ {order.total_amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {order.items.length} itens
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h2 className="font-semibold text-amber-900 mb-2">Verificar no Painel Admin</h2>
            <p className="text-amber-700 text-sm mb-3">
              Após criar um pedido de teste, vá para o painel admin para verificar se ele aparece:
            </p>
            <div className="space-y-2 text-sm text-amber-800">
              <p>1. Acesse <a href="/admin-password" className="underline font-medium">/admin-password</a></p>
              <p>2. Digite a senha: <strong>admin123</strong></p>
              <p>3. Verifique se o pedido aparece no dashboard com status "Aguardando QR Code"</p>
              <p>4. Se não conseguir acessar, tente <a href="/admin" className="underline font-medium">ir direto para /admin</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
