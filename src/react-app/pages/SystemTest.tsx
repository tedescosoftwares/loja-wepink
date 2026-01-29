import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ShoppingBag, Check, AlertCircle, RefreshCw, Eye, Settings } from 'lucide-react';
import Header from '@/react-app/components/Header';

export default function SystemTest() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    database: { status: string; count: number; details?: string };
    api: { status: string; details?: string };
    admin: { status: string; count: number; details?: string };
    orderCreation: { status: string; orderId?: number; details?: string };
  }>({
    database: { status: 'pending', count: 0 },
    api: { status: 'pending' },
    admin: { status: 'pending', count: 0 },
    orderCreation: { status: 'pending' }
  });
  const [logs, setLogs] = useState<string[]>([]);
  const navigate = useNavigate();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
    console.log(message);
  };

  const runFullSystemTest = async () => {
    setLoading(true);
    setLogs([]);
    addLog('🚀 Iniciando teste completo do sistema...');

    try {
      // Test 1: Database Connection
      addLog('📊 Teste 1: Conexão com banco de dados...');
      try {
        const dbResponse = await fetch('/api/admin/orders');
        const dbData = await dbResponse.json();
        
        if (dbResponse.ok && dbData.orders) {
          setResults(prev => ({
            ...prev,
            database: {
              status: 'success',
              count: dbData.orders.length,
              details: `${dbData.orders.length} pedidos encontrados`
            }
          }));
          addLog(`✅ Banco de dados: OK - ${dbData.orders.length} pedidos`);
        } else {
          throw new Error('Resposta inválida do banco');
        }
      } catch (error) {
        setResults(prev => ({
          ...prev,
          database: {
            status: 'error',
            count: 0,
            details: `Erro: ${(error as Error).message}`
          }
        }));
        addLog(`❌ Banco de dados: ERRO - ${(error as Error).message}`);
      }

      // Test 2: API Health
      addLog('🌐 Teste 2: APIs principais...');
      try {
        const apiTests = await Promise.all([
          fetch('/api/admin/orders'),
          fetch('/api/products'),
          fetch('/api/categories'),
          fetch('/api/banners')
        ]);

        const allOk = apiTests.every(response => response.ok);
        
        if (allOk) {
          setResults(prev => ({
            ...prev,
            api: {
              status: 'success',
              details: 'Todas as APIs principais funcionando'
            }
          }));
          addLog('✅ APIs: OK - Todas funcionando normalmente');
        } else {
          throw new Error('Uma ou mais APIs falharam');
        }
      } catch (error) {
        setResults(prev => ({
          ...prev,
          api: {
            status: 'error',
            details: `Erro: ${(error as Error).message}`
          }
        }));
        addLog(`❌ APIs: ERRO - ${(error as Error).message}`);
      }

      // Test 3: Order Creation
      addLog('📝 Teste 3: Criação de pedido...');
      try {
        const testOrder = {
          customer_name: `Teste Sistema ${new Date().getTime()}`,
          customer_phone: '(11) 99999-0000',
          customer_email: 'teste.sistema@email.com',
          customer_address: 'Rua Teste Sistema, 123 - São Paulo, SP',
          customer_cep: '01234-000',
          items: [
            {
              product: {
                id: 1,
                name: 'Produto Teste Sistema',
                price: 5.00
              },
              quantity: 1
            }
          ],
          total_amount: 5.00,
          payment_method: 'pix',
          notes: `Teste automático do sistema - ${new Date().toISOString()}`
        };

        const orderResponse = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testOrder)
        });

        const orderData = await orderResponse.json();

        if (orderResponse.ok && orderData.success && orderData.orderId) {
          setResults(prev => ({
            ...prev,
            orderCreation: {
              status: 'success',
              orderId: orderData.orderId,
              details: `Pedido #${orderData.orderId} criado`
            }
          }));
          addLog(`✅ Criação de pedido: OK - Pedido #${orderData.orderId} criado`);

          // Test 4: Admin Panel Detection
          addLog('👨‍💼 Teste 4: Detecção no painel admin...');
          setTimeout(async () => {
            try {
              const adminResponse = await fetch('/api/admin/orders');
              const adminData = await adminResponse.json();
              
              const orderFound = adminData.orders?.find((order: any) => order.id === orderData.orderId);
              
              if (orderFound) {
                setResults(prev => ({
                  ...prev,
                  admin: {
                    status: 'success',
                    count: adminData.orders.length,
                    details: `Pedido #${orderData.orderId} detectado no admin`
                  }
                }));
                addLog(`✅ Admin: OK - Pedido encontrado no painel admin`);
                addLog(`🎉 SISTEMA TOTALMENTE FUNCIONAL! Todos os testes passaram!`);
              } else {
                throw new Error('Pedido não encontrado no admin');
              }
            } catch (error) {
              setResults(prev => ({
                ...prev,
                admin: {
                  status: 'error',
                  count: 0,
                  details: `Erro: ${(error as Error).message}`
                }
              }));
              addLog(`❌ Admin: ERRO - ${(error as Error).message}`);
            }
          }, 2000);

        } else {
          throw new Error(orderData.error || orderData.details || 'Erro desconhecido');
        }
      } catch (error) {
        setResults(prev => ({
          ...prev,
          orderCreation: {
            status: 'error',
            details: `Erro: ${(error as Error).message}`
          }
        }));
        addLog(`❌ Criação de pedido: ERRO - ${(error as Error).message}`);
      }

    } finally {
      setTimeout(() => setLoading(false), 3000); // Wait for admin test to complete
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <Check className="w-5 h-5 text-green-600" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'pending': return <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />;
      default: return <div className="w-5 h-5 bg-gray-300 rounded-full" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'error': return 'bg-red-50 border-red-200';
      case 'pending': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onMenuToggle={() => {}} />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Teste Completo do Sistema
          </h1>

          {/* Control Panel */}
          <div className="mb-8">
            <button
              onClick={runFullSystemTest}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2 mb-4"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Testando Sistema...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Executar Teste Completo
                </>
              )}
            </button>

            <div className="flex gap-3">
              <button
                onClick={() => navigate('/admin')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Painel Admin
              </button>
              
              <button
                onClick={() => navigate('/')}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                Loja
              </button>
              
              <button
                onClick={() => window.open('https://catalogo-central-2025.mocha.app/', '_blank')}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors font-medium"
              >
                Site Publicado
              </button>
            </div>
          </div>

          {/* Test Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className={`p-4 rounded-lg border-2 ${getStatusColor(results.database.status)}`}>
              <div className="flex items-center gap-3 mb-2">
                {getStatusIcon(results.database.status)}
                <h3 className="font-semibold">Banco de Dados</h3>
              </div>
              <p className="text-sm text-gray-600 mb-1">
                {results.database.count} pedidos encontrados
              </p>
              {results.database.details && (
                <p className="text-xs text-gray-500">{results.database.details}</p>
              )}
            </div>

            <div className={`p-4 rounded-lg border-2 ${getStatusColor(results.api.status)}`}>
              <div className="flex items-center gap-3 mb-2">
                {getStatusIcon(results.api.status)}
                <h3 className="font-semibold">APIs</h3>
              </div>
              <p className="text-sm text-gray-600 mb-1">
                Endpoints principais
              </p>
              {results.api.details && (
                <p className="text-xs text-gray-500">{results.api.details}</p>
              )}
            </div>

            <div className={`p-4 rounded-lg border-2 ${getStatusColor(results.orderCreation.status)}`}>
              <div className="flex items-center gap-3 mb-2">
                {getStatusIcon(results.orderCreation.status)}
                <h3 className="font-semibold">Criação de Pedido</h3>
              </div>
              <p className="text-sm text-gray-600 mb-1">
                {results.orderCreation.orderId ? `Pedido #${results.orderCreation.orderId}` : 'Nenhum pedido criado'}
              </p>
              {results.orderCreation.details && (
                <p className="text-xs text-gray-500">{results.orderCreation.details}</p>
              )}
            </div>

            <div className={`p-4 rounded-lg border-2 ${getStatusColor(results.admin.status)}`}>
              <div className="flex items-center gap-3 mb-2">
                {getStatusIcon(results.admin.status)}
                <h3 className="font-semibold">Painel Admin</h3>
              </div>
              <p className="text-sm text-gray-600 mb-1">
                {results.admin.count} pedidos no admin
              </p>
              {results.admin.details && (
                <p className="text-xs text-gray-500">{results.admin.details}</p>
              )}
            </div>
          </div>

          {/* Overall Status */}
          <div className="mb-8">
            {Object.values(results).every(r => r.status === 'success') && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Check className="w-8 h-8 text-green-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-green-900">
                      🎉 Sistema 100% Funcional!
                    </h3>
                    <p className="text-green-700">
                      Todos os testes passaram. Os pedidos chegam em tempo real no painel admin.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {Object.values(results).some(r => r.status === 'error') && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-900">
                      ⚠️ Sistema com Problemas
                    </h3>
                    <p className="text-red-700">
                      Alguns testes falharam. Verifique os logs abaixo para mais detalhes.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Live Logs */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              📝 Log de Testes em Tempo Real ({logs.length}/50)
            </h3>
            <div className="bg-black rounded p-3 font-mono text-sm max-h-80 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-gray-400">Pronto para executar testes...</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className={`mb-1 ${
                    log.includes('❌') ? 'text-red-400' :
                    log.includes('✅') ? 'text-green-400' :
                    log.includes('🚀') || log.includes('📊') || log.includes('🌐') || log.includes('📝') || log.includes('👨‍💼') ? 'text-blue-400' :
                    log.includes('🎉') ? 'text-purple-400 font-bold' :
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
            <h3 className="font-semibold text-blue-900 mb-2">🔧 Como usar:</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Clique em "Executar Teste Completo" para testar todo o sistema</li>
              <li>Aguarde os 4 testes serem executados automaticamente</li>
              <li>Se todos passarem, o sistema está 100% funcional</li>
              <li>Se algum falhar, verifique os logs para identificar o problema</li>
              <li>Use os botões para acessar o painel admin ou a loja</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
