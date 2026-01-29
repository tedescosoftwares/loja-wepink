import { useState, useEffect } from 'react';
import { TrendingUp, Package, Target, Zap, Users, ShoppingCart, BarChart3, X } from 'lucide-react';

interface CartAnalytic {
  product_id: number;
  product_name: string;
  product_price: number;
  total_additions: number;
  total_quantity_added: number;
  unique_sessions: number;
  avg_quantity_per_addition: number;
  last_added: string;
  conversion_rate?: number;
}

interface DynamicDiscount {
  id: number;
  product_id: number;
  discount_type: string;
  discount_value: number;
  trigger_condition: string;
  trigger_value: number;
  is_active: boolean;
}

interface Product {
  id: number;
  name: string;
  price: number;
  category_id: number | null;
  is_active: boolean;
}

export default function CartAnalytics() {
  const [analytics, setAnalytics] = useState<CartAnalytic[]>([]);
  const [discounts, setDiscounts] = useState<DynamicDiscount[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'analytics' | 'discounts' | 'coupons'>('analytics');
  const [newDiscount, setNewDiscount] = useState({
    product_id: '',
    discount_type: 'percentage',
    discount_value: '',
    trigger_condition: 'cart_additions_count',
    trigger_value: ''
  });

  // Coupon management state
  const [coupons, setCoupons] = useState<any[]>([]);
  const [couponUsage, setCouponUsage] = useState<any[]>([]);
  const [showCreateCoupon, setShowCreateCoupon] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: 0,
    minimum_order_amount: 0,
    usage_limit: '',
    valid_until: ''
  });

  useEffect(() => {
    fetchAnalytics();
    fetchDiscounts();
    fetchAllProducts();
    fetchCoupons();
    fetchCouponUsage();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/cart-analytics');
      const data = await response.json();
      setAnalytics(data.analytics || []);
    } catch (error) {
      console.error('Error fetching cart analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDiscounts = async () => {
    try {
      const response = await fetch('/api/admin/dynamic-discounts');
      const data = await response.json();
      setDiscounts(data.discounts || []);
    } catch (error) {
      console.error('Error fetching dynamic discounts:', error);
    }
  };

  const fetchAllProducts = async () => {
    try {
      const response = await fetch('/api/admin/products');
      const data = await response.json();
      setAllProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching all products:', error);
    }
  };

  const fetchCoupons = async () => {
    try {
      const response = await fetch('/api/admin/coupons');
      const data = await response.json();
      if (response.ok) {
        setCoupons(data.coupons || []);
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
    }
  };

  const fetchCouponUsage = async () => {
    try {
      const response = await fetch('/api/admin/coupon-usage');
      const data = await response.json();
      if (response.ok) {
        setCouponUsage(data.usage || []);
      }
    } catch (error) {
      console.error('Error fetching coupon usage:', error);
    }
  };

  const createDiscount = async () => {
    try {
      const response = await fetch('/api/admin/dynamic-discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: parseInt(newDiscount.product_id),
          discount_type: newDiscount.discount_type,
          discount_value: parseFloat(newDiscount.discount_value),
          trigger_condition: newDiscount.trigger_condition,
          trigger_value: parseInt(newDiscount.trigger_value)
        })
      });

      if (response.ok) {
        fetchDiscounts();
        setNewDiscount({
          product_id: '',
          discount_type: 'percentage',
          discount_value: '',
          trigger_condition: 'cart_additions_count',
          trigger_value: ''
        });
        alert('Desconto dinâmico criado com sucesso!');
      }
    } catch (error) {
      console.error('Error creating discount:', error);
      alert('Erro ao criar desconto dinâmico');
    }
  };

  const toggleDiscount = async (discountId: number, isActive: boolean) => {
    try {
      await fetch(`/api/admin/dynamic-discounts/${discountId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive })
      });
      fetchDiscounts();
    } catch (error) {
      console.error('Error toggling discount:', error);
    }
  };

  const deleteDiscount = async (discountId: number) => {
    if (confirm('Tem certeza que deseja excluir este desconto dinâmico?')) {
      try {
        await fetch(`/api/admin/dynamic-discounts/${discountId}`, {
          method: 'DELETE'
        });
        fetchDiscounts();
        alert('Desconto dinâmico excluído!');
      } catch (error) {
        console.error('Error deleting discount:', error);
      }
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCoupon.code.trim()) {
      alert('Código do cupom é obrigatório');
      return;
    }
    
    if (newCoupon.discount_value <= 0) {
      alert('Valor do desconto deve ser maior que zero');
      return;
    }

    try {
      const response = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newCoupon,
          usage_limit: newCoupon.usage_limit ? parseInt(newCoupon.usage_limit) : null,
          valid_until: newCoupon.valid_until || null
        }),
      });

      if (response.ok) {
        alert('Cupom criado com sucesso!');
        setShowCreateCoupon(false);
        setNewCoupon({
          code: '',
          discount_type: 'percentage',
          discount_value: 0,
          minimum_order_amount: 0,
          usage_limit: '',
          valid_until: ''
        });
        fetchCoupons();
      } else {
        const data = await response.json();
        alert(data.error || 'Erro ao criar cupom');
      }
    } catch (error) {
      console.error('Error creating coupon:', error);
      alert('Erro ao criar cupom');
    }
  };

  const handleToggleCoupon = async (couponId: number, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/coupons/${couponId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: !isActive
        }),
      });

      if (response.ok) {
        fetchCoupons();
      } else {
        alert('Erro ao atualizar cupom');
      }
    } catch (error) {
      console.error('Error toggling coupon:', error);
      alert('Erro ao atualizar cupom');
    }
  };

  const handleDeleteCoupon = async (couponId: number, couponCode: string) => {
    if (!confirm(`Tem certeza que deseja excluir o cupom "${couponCode}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/coupons/${couponId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Cupom excluído com sucesso!');
        fetchCoupons();
      } else {
        alert('Erro ao excluir cupom');
      }
    } catch (error) {
      console.error('Error deleting coupon:', error);
      alert('Erro ao excluir cupom');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getProductFromAnalytics = (productId: number) => {
    return analytics.find(a => a.product_id === productId);
  };

  const getProductFromCatalog = (productId: number) => {
    return allProducts.find(p => p.id === productId);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Analytics do Carrinho & Descontos</h2>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Analytics de Produtos
              </div>
            </button>
            <button
              onClick={() => setActiveTab('discounts')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'discounts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Descontos Dinâmicos ({discounts.filter(d => d.is_active).length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('coupons')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'coupons'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Cupons de Desconto ({coupons.filter(c => c.is_active).length})
              </div>
            </button>
          </nav>
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Total de Adições</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {analytics.reduce((sum, item) => sum + item.total_additions, 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-green-600 font-medium">Produtos Rastreados</p>
                    <p className="text-2xl font-bold text-green-900">{analytics.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Sessões Únicas</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {analytics.reduce((sum, item) => sum + item.unique_sessions, 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="text-sm text-orange-600 font-medium">Descontos Ativos</p>
                    <p className="text-2xl font-bold text-orange-900">
                      {discounts.filter(d => d.is_active).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Products */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Produtos Mais Adicionados ao Carrinho
              </h3>

              {analytics.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum dado de carrinho disponível ainda</p>
                  <p className="text-sm text-gray-400 mt-2">Os dados aparecerão quando os clientes começarem a adicionar produtos</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {analytics.slice(0, 10).map((item, index) => (
                    <div key={item.product_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-gray-100 text-gray-600' :
                          index === 2 ? 'bg-orange-100 text-orange-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{item.product_name}</h4>
                          <p className="text-sm text-gray-600">{formatPrice(item.product_price)}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-8 text-center">
                        <div>
                          <p className="text-2xl font-bold text-blue-600">{item.total_additions}</p>
                          <p className="text-xs text-gray-500">Adições</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-green-600">{item.total_quantity_added}</p>
                          <p className="text-xs text-gray-500">Qtd Total</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-purple-600">{item.unique_sessions}</p>
                          <p className="text-xs text-gray-500">Sessões</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-orange-600">{item.avg_quantity_per_addition.toFixed(1)}</p>
                          <p className="text-xs text-gray-500">Média/Add</p>
                        </div>
                      </div>

                      <div className="text-right text-sm text-gray-500">
                        <p>Último: {formatDate(item.last_added)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'discounts' && (
          <div className="space-y-6">
            {/* Create New Discount */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Criar Desconto Dinâmico
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <select
                  value={newDiscount.product_id}
                  onChange={(e) => setNewDiscount({...newDiscount, product_id: e.target.value})}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">Selecione um produto</option>
                  <optgroup label="🛒 Produtos com Atividade no Carrinho">
                    {analytics.map((item) => (
                      <option key={`analytics-${item.product_id}`} value={item.product_id}>
                        📊 {item.product_name} ({item.total_additions} adições)
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="📦 Todos os Produtos do Catálogo">
                    {allProducts
                      .filter(product => product.is_active && !analytics.find(a => a.product_id === product.id))
                      .map((product) => (
                        <option key={`catalog-${product.id}`} value={product.id}>
                          💰 {product.name} - {formatPrice(product.price)}
                        </option>
                      ))}
                  </optgroup>
                </select>

                <select
                  value={newDiscount.discount_type}
                  onChange={(e) => setNewDiscount({...newDiscount, discount_type: e.target.value})}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="percentage">Porcentagem (%)</option>
                  <option value="fixed">Valor Fixo (R$)</option>
                </select>

                <input
                  type="number"
                  placeholder="Valor do desconto"
                  value={newDiscount.discount_value}
                  onChange={(e) => setNewDiscount({...newDiscount, discount_value: e.target.value})}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                />

                <input
                  type="number"
                  placeholder="Trigger (ex: 5 adições)"
                  value={newDiscount.trigger_value}
                  onChange={(e) => setNewDiscount({...newDiscount, trigger_value: e.target.value})}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                />

                <button
                  onClick={createDiscount}
                  disabled={!newDiscount.product_id || !newDiscount.discount_value || !newDiscount.trigger_value}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Criar Desconto
                </button>
              </div>

              <p className="text-sm text-blue-700 mt-2">
                ✨ O desconto será aplicado automaticamente quando o produto atingir o número de adições especificado<br />
                📊 Produtos com atividade mostram progresso atual | 📦 Produtos do catálogo aguardam primeiras adições
              </p>
            </div>

            {/* Active Discounts */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-green-600" />
                Descontos Configurados
              </h3>

              {discounts.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum desconto dinâmico configurado</p>
                  <p className="text-sm text-gray-400 mt-2">Crie descontos automáticos baseados no comportamento dos clientes</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {discounts.map((discount) => {
                    const analyticsProduct = getProductFromAnalytics(discount.product_id);
                    const catalogProduct = getProductFromCatalog(discount.product_id);
                    const displayProduct = analyticsProduct || catalogProduct;
                    
                    return (
                      <div key={discount.id} className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                        discount.is_active ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-3 h-3 rounded-full ${discount.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                          <div>
                            <h4 className="font-medium text-gray-900 flex items-center gap-2">
                              {displayProduct ? (
                                <>
                                  {analyticsProduct ? '📊' : '📦'}
                                  {analyticsProduct?.product_name || catalogProduct?.name}
                                </>
                              ) : (
                                `Produto ID: ${discount.product_id} (Não encontrado)`
                              )}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {discount.discount_value}{discount.discount_type === 'percentage' ? '%' : ' reais'} de desconto 
                              quando atingir {discount.trigger_value} adições ao carrinho
                            </p>
                            {analyticsProduct ? (
                              <p className="text-xs text-green-600">
                                📊 Progresso atual: {analyticsProduct.total_additions}/{discount.trigger_value} adições
                              </p>
                            ) : catalogProduct ? (
                              <p className="text-xs text-blue-600">
                                💰 Produto do catálogo: {formatPrice(catalogProduct.price)} | 
                                Aguardando primeiras adições ao carrinho
                              </p>
                            ) : (
                              <p className="text-xs text-red-500">
                                ⚠️ Produto não encontrado no sistema
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleDiscount(discount.id, discount.is_active)}
                            className={`px-3 py-1 rounded text-sm font-medium ${
                              discount.is_active 
                                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                                : 'bg-green-100 text-green-800 hover:bg-green-200'
                            }`}
                          >
                            {discount.is_active ? 'Pausar' : 'Ativar'}
                          </button>
                          <button
                            onClick={() => deleteDiscount(discount.id)}
                            className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm font-medium hover:bg-red-200"
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'coupons' && (
          <div className="space-y-6">
            {/* Coupon Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Total de Cupons</p>
                    <p className="text-2xl font-bold text-purple-900">{coupons.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm text-green-600 font-medium">Cupons Ativos</p>
                    <p className="text-2xl font-bold text-green-900">{coupons.filter(c => c.is_active).length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Usos Totais</p>
                    <p className="text-2xl font-bold text-blue-900">{couponUsage.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Create Coupon Button */}
            <div className="text-center">
              <button
                onClick={() => setShowCreateCoupon(true)}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2 mx-auto"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Criar Novo Cupom
              </button>
            </div>

            {/* Create Coupon Modal */}
            {showCreateCoupon && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-md w-full max-h-96 overflow-y-auto">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900">Criar Novo Cupom</h3>
                      <button
                        onClick={() => setShowCreateCoupon(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form onSubmit={handleCreateCoupon} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Código do Cupom *
                        </label>
                        <input
                          type="text"
                          value={newCoupon.code}
                          onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 uppercase"
                          placeholder="Ex: DESCONTO10"
                          style={{ textTransform: 'uppercase' }}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tipo de Desconto *
                        </label>
                        <select
                          value={newCoupon.discount_type}
                          onChange={(e) => setNewCoupon({ ...newCoupon, discount_type: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option value="percentage">Porcentagem (%)</option>
                          <option value="fixed">Valor Fixo (R$)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Valor do Desconto *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={newCoupon.discount_value}
                          onChange={(e) => setNewCoupon({ ...newCoupon, discount_value: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder={newCoupon.discount_type === 'percentage' ? 'Ex: 10 (para 10%)' : 'Ex: 25.00'}
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {newCoupon.discount_type === 'percentage' ? 'Digite apenas o número (ex: 10 para 10%)' : 'Digite o valor em reais'}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Pedido Mínimo (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={newCoupon.minimum_order_amount}
                          onChange={(e) => setNewCoupon({ ...newCoupon, minimum_order_amount: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="0.00 (sem mínimo)"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Limite de Usos
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={newCoupon.usage_limit}
                          onChange={(e) => setNewCoupon({ ...newCoupon, usage_limit: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="Deixe vazio para uso ilimitado"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Válido Até
                        </label>
                        <input
                          type="datetime-local"
                          value={newCoupon.valid_until}
                          onChange={(e) => setNewCoupon({ ...newCoupon, valid_until: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>

                      <div className="flex gap-3 pt-4">
                        <button
                          type="submit"
                          className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          Criar Cupom
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCreateCoupon(false)}
                          className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Active Coupons List */}
            <div className="bg-white border rounded-lg">
              <div className="p-4 border-b border-gray-200">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Cupons Cadastrados ({coupons.length})
                </h4>
              </div>
              
              <div className="p-4">
                {coupons.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <p>Nenhum cupom cadastrado ainda</p>
                    <p className="text-sm">Clique em "Criar Novo Cupom" para começar</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {coupons.map((coupon) => (
                      <div key={coupon.id} className={`border rounded-lg p-4 ${coupon.is_active ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`px-3 py-1 rounded-full text-sm font-bold ${coupon.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {coupon.code}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs ${coupon.is_active ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                                {coupon.is_active ? '✅ Ativo' : '❌ Inativo'}
                              </span>
                            </div>
                            
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>
                                <strong>Desconto:</strong> {coupon.discount_value}{coupon.discount_type === 'percentage' ? '%' : ' reais'}
                                {coupon.minimum_order_amount > 0 && (
                                  <span className="ml-2 text-blue-600">
                                    (mín. R$ {coupon.minimum_order_amount.toFixed(2)})
                                  </span>
                                )}
                              </p>
                              
                              <div className="flex gap-4">
                                <span>
                                  <strong>Usos:</strong> {coupon.used_count || 0}
                                  {coupon.usage_limit && ` / ${coupon.usage_limit}`}
                                </span>
                                
                                {coupon.valid_until && (
                                  <span>
                                    <strong>Válido até:</strong> {new Date(coupon.valid_until).toLocaleDateString('pt-BR')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleCoupon(coupon.id, coupon.is_active)}
                              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                coupon.is_active 
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            >
                              {coupon.is_active ? 'Desativar' : 'Ativar'}
                            </button>
                            
                            <button
                              onClick={() => handleDeleteCoupon(coupon.id, coupon.code)}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm font-medium hover:bg-red-200 transition-colors"
                            >
                              Excluir
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Coupon Usage */}
            {couponUsage.length > 0 && (
              <div className="bg-white border rounded-lg">
                <div className="p-4 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Usos Recentes de Cupons ({couponUsage.length})
                  </h4>
                </div>
                
                <div className="p-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Cupom</th>
                          <th className="text-left py-2">Cliente</th>
                          <th className="text-left py-2">Telefone</th>
                          <th className="text-left py-2">Desconto</th>
                          <th className="text-left py-2">Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {couponUsage.slice(0, 10).map((usage) => (
                          <tr key={usage.id} className="border-b">
                            <td className="py-2 font-medium text-purple-600">{usage.coupon_code}</td>
                            <td className="py-2">{usage.customer_name || 'N/A'}</td>
                            <td className="py-2">{usage.customer_phone || 'N/A'}</td>
                            <td className="py-2 font-medium text-green-600">
                              -R$ {usage.discount_amount?.toFixed(2)}
                            </td>
                            <td className="py-2 text-gray-600">
                              {new Date(usage.created_at).toLocaleDateString('pt-BR')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Data Management Section - Show for all tabs */}
        <div className="mt-8 border-t border-gray-200 pt-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Limpeza de Dados Analytics
            </h3>

            <p className="text-sm text-red-700 mb-4">
              ⚠️ Use estas opções para limpar dados acumulados e manter o desempenho do sistema. 
              <strong> Ações irreversíveis!</strong>
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded border border-red-300">
                <h4 className="font-medium text-gray-900 mb-2">📊 Dados do Carrinho</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Remove todos os dados de rastreamento de adições ao carrinho
                </p>
                <button
                  onClick={() => handleClearAnalytics('cart_tracking')}
                  className="w-full bg-red-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  Limpar Dados do Carrinho
                </button>
              </div>

              <div className="bg-white p-4 rounded border border-red-300">
                <h4 className="font-medium text-gray-900 mb-2">👥 Sessões de Usuário</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Remove dados de sessões antigas e inativas de usuários
                </p>
                <button
                  onClick={() => handleClearAnalytics('user_sessions')}
                  className="w-full bg-orange-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-orange-700 transition-colors"
                >
                  Limpar Sessões Antigas
                </button>
              </div>

              <div className="bg-white p-4 rounded border border-red-300">
                <h4 className="font-medium text-gray-900 mb-2">🧹 Limpeza Completa</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Remove TODOS os dados de analytics (carrinho + sessões)
                </p>
                <button
                  onClick={() => handleClearAnalytics('all_analytics')}
                  className="w-full bg-red-800 text-white px-3 py-2 rounded text-sm font-medium hover:bg-red-900 transition-colors"
                >
                  Limpeza Completa
                </button>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-xs text-blue-700">
                💡 <strong>Recomendação:</strong> Execute a limpeza de dados mensalmente ou quando notar lentidão no sistema.
                Os descontos dinâmicos ativos não são afetados pela limpeza dos dados de carrinho.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  async function handleClearAnalytics(type: 'cart_tracking' | 'user_sessions' | 'all_analytics') {
    const confirmMessages = {
      cart_tracking: 'Tem certeza que deseja limpar TODOS os dados de rastreamento do carrinho? Isso removerá todo o histórico de analytics de produtos.',
      user_sessions: 'Tem certeza que deseja limpar TODAS as sessões de usuário antigas? Isso removerá dados de usuários online históricos.',
      all_analytics: 'Tem certeza que deseja fazer uma LIMPEZA COMPLETA de todos os dados de analytics? Esta ação é IRREVERSÍVEL e removerá tudo!'
    };

    const actionMessages = {
      cart_tracking: 'limpando dados do carrinho',
      user_sessions: 'limpando sessões antigas', 
      all_analytics: 'executando limpeza completa'
    };

    if (!confirm(confirmMessages[type])) {
      return;
    }

    if (type === 'all_analytics') {
      if (!confirm('🚨 ATENÇÃO FINAL: Você está prestes a APAGAR TODOS OS DADOS DE ANALYTICS! Confirma mesmo?')) {
        return;
      }
    }

    try {
      console.log(`🧹 ANALYTICS CLEANUP: Starting ${actionMessages[type]}`);

      const response = await fetch(`/api/admin/analytics/clear/${type}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✅ Sucesso! ${data.message}`);
        console.log(`🧹 ANALYTICS CLEANUP: Completed ${actionMessages[type]}`, data);
        
        // Refresh the analytics data
        fetchAnalytics();
      } else {
        const error = await response.json();
        alert(`❌ Erro: ${error.error}`);
        console.error(`🧹 ANALYTICS CLEANUP ERROR:`, error);
      }
    } catch (error) {
      console.error('Error clearing analytics:', error);
      alert('❌ Erro ao limpar dados. Tente novamente.');
    }
  }
}
