import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ShoppingBag, Check, AlertCircle, Clock, QrCode } from 'lucide-react';
import Header from '@/react-app/components/Header';
import { useCart } from '@/react-app/hooks/useCart';

export default function TestRealFlow() {
  const [step, setStep] = useState<'setup' | 'adding' | 'checkout' | 'success' | 'error'>('setup');
  const [orderId, setOrderId] = useState<number | null>(null);
  const [error, setError] = useState<string>('');
  const [adminOrdersCount, setAdminOrdersCount] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);
  const navigate = useNavigate();
  const { addToCart, items, clearCart } = useCart();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]);
  };

  useEffect(() => {
    checkAdminOrders();
  }, []);

  const checkAdminOrders = async () => {
    try {
      addLog('🔍 Verificando pedidos no admin...');
      const response = await fetch('/api/admin/orders');
      if (response.ok) {
        const data = await response.json();
        const count = data.orders?.length || 0;
        setAdminOrdersCount(count);
        addLog(`✅ Admin tem ${count} pedidos`);
      } else {
        addLog(`❌ Erro ao verificar admin: ${response.status}`);
      }
    } catch (error) {
      addLog(`❌ Erro ao conectar com admin: ${error}`);
    }
  };

  const simulateCustomerFlow = async () => {
    try {
      setStep('adding');
      setError('');
      clearCart();
      
      addLog('🛒 Cliente: Iniciando fluxo de compra...');
      
      // Step 1: Add products to cart
      addLog('🛒 Cliente: Adicionando produtos ao carrinho...');
      
      // Simulate adding products (using mock products since we need cart functionality)
      const mockProduct1 = {
        id: 1,
        name: 'Coca-Cola 350ml',
        price: 3.50,
        description: 'Refrigerante tradicional',
        image_url: '',
        is_active: true,
        is_featured: true,
        stock_quantity: 100,
        category_id: 1,
        original_price: null,
        created_at: '',
        updated_at: ''
      };
      
      const mockProduct2 = {
        id: 2,
        name: 'Água Crystal 500ml',
        price: 2.00,
        description: 'Água mineral',
        image_url: '',
        is_active: true,
        is_featured: false,
        stock_quantity: 200,
        category_id: 2,
        original_price: null,
        created_at: '',
        updated_at: ''
      };

      addToCart(mockProduct1, 2);
      addToCart(mockProduct2, 1);
      
      addLog(`✅ Cliente: ${items.length + 2} produtos adicionados ao carrinho`);
      addLog(`💰 Cliente: Total do carrinho: R$ ${(7.00).toFixed(2)}`);
      
      // Step 2: Create order
      setStep('checkout');
      addLog('📋 Cliente: Criando pedido...');
      
      const orderData = {
        customer_name: 'João da Silva Teste',
        customer_phone: '(11) 99999-7777',
        customer_email: 'joao.teste@email.com',
        customer_address: 'Rua das Flores, 456 - Centro, São Paulo - SP',
        customer_cep: '01234-567',
        items: [
          {
            product: {
              id: 1,
              name: 'Coca-Cola 350ml',
              price: 3.50
            },
            quantity: 2
          },
          {
            product: {
              id: 2,
              name: 'Água Crystal 500ml',
              price: 2.00
            },
            quantity: 1
          }
        ],
        total_amount: 9.00,
        payment_method: 'pix',
        notes: 'Teste de fluxo completo do cliente - ' + new Date().toLocaleString()
      };

      addLog('📤 Cliente: Enviando pedido para API...');
      console.log('🟢 TEST FLOW: Sending order:', orderData);
      
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      addLog(`📡 Cliente: Resposta da API: ${response.status}`);
      
      const responseData = await response.json();
      console.log('🟢 TEST FLOW: Order response:', responseData);
      
      if (response.ok && responseData.success) {
        setOrderId(responseData.orderId);
        setStep('success');
        addLog(`✅ Cliente: Pedido criado com sucesso! ID: #${responseData.orderId}`);
        addLog('🎉 Cliente: Aguardando PIX do admin...');
        
        // Wait a bit then check admin
        setTimeout(() => {
          checkAdminOrders();
          addLog('🔄 Verificando se pedido apareceu no admin...');
        }, 2000);
        
      } else {
        throw new Error(responseData.error || responseData.details || 'Erro desconhecido');
      }
      
    } catch (error: any) {
      console.error('🔴 TEST FLOW: Error:', error);
      setError(error.message || 'Erro desconhecido');
      setStep('error');
      addLog(`❌ Cliente: ERRO - ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onMenuToggle={() => {}} />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6" />
            Teste Completo: Cliente → Admin
          </h1>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Status Atual</h3>
              <div className="flex items-center gap-2">
                {step === 'setup' && (
                  <>
                    <Clock className="w-5 h-5 text-blue-600" />
                    <span className="text-blue-800">Pronto para testar</span>
                  </>
                )}
                {step === 'adding' && (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <span className="text-blue-800">Adicionando produtos...</span>
                  </>
                )}
                {step === 'checkout' && (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <span className="text-blue-800">Criando pedido...</span>
                  </>
                )}
                {step === 'success' && (
                  <>
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="text-green-800">Sucesso!</span>
                  </>
                )}
                {step === 'error' && (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="text-red-800">Erro</span>
                  </>
                )}
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">Admin</h3>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-green-800">{adminOrdersCount}</span>
                <span className="text-green-700">pedidos</span>
              </div>
              <button
                onClick={checkAdminOrders}
                className="mt-2 text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
              >
                Atualizar
              </button>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900 mb-2">Último Pedido</h3>
              {orderId ? (
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-purple-600" />
                  <span className="text-purple-800">#{orderId}</span>
                </div>
              ) : (
                <span className="text-purple-600 text-sm">Nenhum pedido ainda</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mb-8 space-y-4">
            <button
              onClick={simulateCustomerFlow}
              disabled={step === 'adding' || step === 'checkout'}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
            >
              {step === 'adding' || step === 'checkout' ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Processando...
                </>
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5" />
                  Simular Fluxo Completo do Cliente
                </>
              )}
            </button>

            <div className="flex gap-3">
              <button
                onClick={() => navigate('/admin')}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <QrCode className="w-4 h-4" />
                Ir para Admin
              </button>
              
              <button
                onClick={() => navigate('/admin-password')}
                className="flex-1 bg-amber-600 text-white py-2 px-4 rounded-lg hover:bg-amber-700 transition-colors font-medium"
              >
                Admin com Senha
              </button>
              
              <button
                onClick={() => window.location.href = 'https://catalogo-central-2025.mocha.app/'}
                className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Site Publicado
              </button>
            </div>
          </div>

          {/* Results */}
          {step === 'success' && orderId && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Check className="w-8 h-8 text-green-600" />
                <div>
                  <h3 className="text-lg font-semibold text-green-900">
                    ✅ Pedido Criado com Sucesso!
                  </h3>
                  <p className="text-green-700">
                    Pedido #{orderId} foi enviado para o painel admin
                  </p>
                </div>
              </div>
              
              <div className="bg-white rounded p-4 mb-4">
                <h4 className="font-medium mb-2">Próximos passos:</h4>
                <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                  <li>Acesse o painel admin</li>
                  <li>Vá para "Pedidos" e encontre o pedido #{orderId}</li>
                  <li>Adicione o PIX copia e cola para o cliente</li>
                  <li>O cliente receberá o PIX automaticamente</li>
                </ol>
              </div>
            </div>
          )}

          {step === 'error' && error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <h3 className="text-lg font-semibold text-red-900">Erro no Sistema</h3>
              </div>
              <p className="text-red-800 mb-4">{error}</p>
              <button
                onClick={() => setStep('setup')}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Tentar Novamente
              </button>
            </div>
          )}

          {/* Live Logs */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              📝 Log em Tempo Real ({logs.length}/20)
            </h3>
            <div className="bg-black rounded p-3 font-mono text-sm max-h-64 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-gray-400">Aguardando ações...</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className={`mb-1 ${
                    log.includes('❌') ? 'text-red-400' :
                    log.includes('✅') ? 'text-green-400' :
                    log.includes('🔍') || log.includes('🔄') ? 'text-blue-400' :
                    log.includes('🛒') || log.includes('📋') ? 'text-yellow-400' :
                    log.includes('🎉') ? 'text-purple-400' :
                    'text-gray-300'
                  }`}>
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Como funciona:</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Clique em "Simular Fluxo Completo" para criar um pedido como cliente</li>
              <li>O sistema adicionará produtos ao carrinho e criará o pedido</li>
              <li>O pedido será enviado para a API com status "awaiting_qr"</li>
              <li>Vá para o painel admin para ver o pedido e adicionar PIX</li>
              <li>O cliente receberá o PIX automaticamente na tela</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
