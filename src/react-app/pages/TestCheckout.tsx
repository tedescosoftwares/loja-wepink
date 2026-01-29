import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ShoppingBag, Plus, Check } from 'lucide-react';

export default function TestCheckout() {
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const navigate = useNavigate();

  const createTestOrder = async () => {
    setCreating(true);
    setSuccess(false);
    
    try {
      const testOrder = {
        customer_name: `Cliente Teste ${Date.now()}`,
        customer_phone: "(11) 99999-9999",
        customer_email: "teste@teste.com",
        customer_address: "Rua Teste, 123 - Centro, São Paulo",
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
        notes: "Pedido de teste criado automaticamente para verificar funcionamento",
        payment_method: "pix"
      };

      console.log('TestCheckout: Creating test order with data:', testOrder);

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testOrder),
      });

      console.log('TestCheckout: Response status:', response.status);
      
      const data = await response.json();
      console.log('TestCheckout: Response data:', data);
      
      if (response.ok) {
        setOrderId(data.orderId);
        setSuccess(true);
        console.log('TestCheckout: Order created successfully with ID:', data.orderId);
      } else {
        console.error('TestCheckout: Error response:', data);
        alert('Erro ao criar pedido: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('TestCheckout: Error creating test order:', error);
      alert('Erro ao criar pedido: ' + error);
    } finally {
      setCreating(false);
    }
  };

  const checkAdminOrders = async () => {
    try {
      console.log('TestCheckout: Checking admin orders...');
      const response = await fetch('/api/admin/orders');
      console.log('TestCheckout: Admin orders response status:', response.status);
      
      const data = await response.json();
      console.log('TestCheckout: Admin orders data:', data);
      
      if (data.orders && data.orders.length > 0) {
        alert(`Encontrados ${data.orders.length} pedidos no sistema! Último pedido: ID ${data.orders[0].id} - Status: ${data.orders[0].status}`);
      } else {
        alert('Nenhum pedido encontrado no sistema.');
      }
    } catch (error) {
      console.error('TestCheckout: Error checking admin orders:', error);
      alert('Erro ao verificar pedidos: ' + error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6" />
            Teste Completo de Checkout
          </h1>

          <div className="space-y-6">
            {/* Status Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h2 className="font-semibold text-blue-900 mb-2">Status do Sistema</h2>
              <div className="space-y-2 text-sm">
                <p className="text-blue-700">
                  ✅ Site publicado em: <strong>https://catalogo-central-2025.mocha.app/</strong>
                </p>
                <p className="text-blue-700">
                  🔧 Esta página testa o fluxo completo de criação de pedidos
                </p>
                <p className="text-blue-700">
                  📊 Verifique o painel admin em: <strong>/admin-password</strong>
                </p>
              </div>
            </div>

            {/* Test Order Creation */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h2 className="font-semibold text-green-900 mb-2">Criar Pedido de Teste</h2>
              <p className="text-green-700 text-sm mb-4">
                Clique no botão para criar um pedido de teste que deve aparecer imediatamente no painel admin.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={createTestOrder}
                  disabled={creating}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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

                <button
                  onClick={checkAdminOrders}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Verificar Pedidos no Admin
                </button>
              </div>

              {success && orderId && (
                <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <Check className="w-5 h-5" />
                    <span className="font-medium">
                      Pedido #{orderId} criado com sucesso!
                    </span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    Este pedido deve aparecer agora no painel admin com status "Aguardando QR Code"
                  </p>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h2 className="font-semibold text-amber-900 mb-2">Como Verificar se Tudo Está Funcionando</h2>
              <ol className="list-decimal list-inside space-y-2 text-sm text-amber-800">
                <li>Clique em "Criar Pedido de Teste" acima</li>
                <li>Acesse <strong>/admin-password</strong> em uma nova aba</li>
                <li>Digite a senha: <strong>admin123</strong></li>
                <li>Verifique se o pedido aparece no dashboard</li>
                <li>O pedido deve ter status "Aguardando QR Code"</li>
                <li>Deve aparecer um alerta visual e sonoro no dashboard</li>
              </ol>
            </div>

            {/* Real Checkout Test */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h2 className="font-semibold text-purple-900 mb-2">Teste com Checkout Real</h2>
              <p className="text-purple-700 text-sm mb-4">
                Para testar o fluxo completo como um cliente real faria:
              </p>
              <div className="space-y-2 text-sm text-purple-800">
                <p>1. Vá para a <strong>página inicial</strong> do site</p>
                <p>2. Adicione produtos ao carrinho</p>
                <p>3. Clique em "Finalizar Pedido"</p>
                <p>4. Preencha os dados e clique em "Gerar PIX"</p>
                <p>5. Verifique se o pedido aparece no admin</p>
              </div>
              
              <button
                onClick={() => navigate('/')}
                className="mt-3 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Ir para Página Inicial
              </button>
            </div>

            {/* Admin Access */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h2 className="font-semibold text-gray-900 mb-2">Acesso ao Painel Admin</h2>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>URL:</strong> /admin-password</p>
                <p><strong>Senha:</strong> admin123</p>
                <p><strong>Dashboard:</strong> /admin (após login)</p>
              </div>
              
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => window.open('/admin-password', '_blank')}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                  Abrir Painel Admin
                </button>
                <button
                  onClick={() => window.open('/admin', '_blank')}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm"
                >
                  Admin Direto
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
