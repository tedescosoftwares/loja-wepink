import { useState, useEffect } from "react";
import { Link } from "react-router";
import AdminLayout from "@/react-app/components/AdminLayout";
import OnlineUsers from "@/react-app/components/OnlineUsers";
import AwaitingPixOrders from "@/react-app/components/AwaitingPixOrders";
import BannedIpManager from "@/react-app/components/BannedIpManager";
import { useOrderAlerts } from "@/react-app/hooks/useOrderAlerts";
import CartAnalytics from "@/react-app/components/CartAnalytics";
import { 
  ShoppingBag, 
  Package, 
  Image, 
  FolderOpen, 
  Bell, 
  Users, 
  TrendingUp, 
  Clock, 
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Activity,
  BarChart3,
  CreditCard,
  Settings as SettingsIcon,
  Zap,
  TestTube,
  CheckCircle,
  XCircle,
  AlertCircle,
  ZapOff,
  Save
} from "lucide-react";

interface DashboardStats {
  totalOrders: number;
  totalProducts: number;
  totalCategories: number;
  totalBanners: number;
  recentOrders: any[];
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  uniqueCustomers: number;
}

interface Customer {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  status: 'new' | 'regular' | 'vip';
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalProducts: 0,
    totalCategories: 0,
    totalBanners: 0,
    recentOrders: [],
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0,
    uniqueCustomers: 0
  });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cartAnalytics, setCartAnalytics] = useState<any[]>([]);
  const [dynamicDiscounts, setDynamicDiscounts] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [couponUsage, setCouponUsage] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'customers' | 'analytics' | 'coupons' | 'api'>('overview');
  const { newOrdersCount, hasNewAwaitingOrders, markAsSeen } = useOrderAlerts();
  const [banLoading, setBanLoading] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);
  const [minimumOrderValue, setMinimumOrderValue] = useState(200);
  const [isUpdatingMinimum, setIsUpdatingMinimum] = useState(false);
  
  // PagLeve API states
  const [pagLeveSettings, setPagLeveSettings] = useState<any>({});
  const [pagLeveStatus, setPagLeveStatus] = useState<'unknown' | 'connected' | 'disconnected' | 'testing'>('unknown');
  const [pagLeveTestResult, setPagLeveTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    fetchDashboardData();
    fetchPagLeveSettings();
    fetchMinimumOrderValue();
    
    // Debug: Check if components are mounted
    console.log('Dashboard mounted, newOrdersCount:', newOrdersCount);
    console.log('Dashboard mounted, hasNewAwaitingOrders:', hasNewAwaitingOrders);
  }, []);

  const fetchMinimumOrderValue = async () => {
    try {
      const response = await fetch("/api/admin/settings");
      const data = await response.json();
      
      const minimumSetting = data.settings?.find((s: any) => s.setting_key === 'minimum_order_value');
      if (minimumSetting && minimumSetting.setting_value) {
        const value = parseFloat(minimumSetting.setting_value);
        if (!isNaN(value) && value > 0) {
          setMinimumOrderValue(value);
        }
      }
    } catch (error) {
      console.error("Error fetching minimum order value:", error);
    }
  };

  const updateMinimumOrderValue = async () => {
    if (isUpdatingMinimum) return;
    
    setIsUpdatingMinimum(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          settings: {
            minimum_order_value: minimumOrderValue.toString()
          }
        }),
      });

      if (response.ok) {
        alert(`✅ Pedido mínimo atualizado para R$ ${minimumOrderValue.toFixed(2)}`);
        console.log('💰 MINIMUM ORDER: Updated to R$', minimumOrderValue);
      } else {
        throw new Error("Failed to update minimum order value");
      }
    } catch (error) {
      console.error("Error updating minimum order value:", error);
      alert("❌ Erro ao atualizar pedido mínimo. Tente novamente.");
    } finally {
      setIsUpdatingMinimum(false);
    }
  };

  // Debug: Log order alerts changes
  useEffect(() => {
    console.log('Order alerts changed - newOrdersCount:', newOrdersCount, 'hasNew:', hasNewAwaitingOrders);
  }, [newOrdersCount, hasNewAwaitingOrders]);

  const fetchDashboardData = async () => {
    try {
      console.log('Dashboard: Fetching dashboard data...');
      const [ordersRes, productsRes, categoriesRes, bannersRes, analyticsRes, discountsRes, couponsRes, couponUsageRes] = await Promise.all([
        fetch("/api/admin/orders"),
        fetch("/api/admin/products"),
        fetch("/api/admin/categories"),
        fetch("/api/admin/banners"),
        fetch("/api/admin/cart-analytics"),
        fetch("/api/admin/dynamic-discounts"),
        fetch("/api/admin/coupons"),
        fetch("/api/admin/coupon-usage")
      ]);

      console.log('Dashboard: Orders response status:', ordersRes.status);
      console.log('Dashboard: Products response status:', productsRes.status);
      console.log('Dashboard: Categories response status:', categoriesRes.status);
      console.log('Dashboard: Banners response status:', bannersRes.status);
      console.log('Dashboard: Analytics response status:', analyticsRes.status);
      console.log('Dashboard: Discounts response status:', discountsRes.status);
      console.log('Dashboard: Coupons response status:', couponsRes.status);

      const [ordersData, productsData, categoriesData, bannersData, analyticsData, discountsData, couponsData, couponUsageData] = await Promise.all([
        ordersRes.json(),
        productsRes.json(),
        categoriesRes.json(),
        bannersRes.json(),
        analyticsRes.json(),
        discountsRes.json(),
        couponsRes.json(),
        couponUsageRes.json()
      ]);

      console.log('Dashboard: Full orders data received:', ordersData);
      console.log('Dashboard: Orders count:', ordersData.orders?.length || 0);

      const orders = ordersData.orders || [];
      
      // Calculate stats
      const totalRevenue = orders.reduce((sum: number, order: any) => sum + order.total_amount, 0);
      const pendingOrders = orders.filter((order: any) => 
        order.status === 'pending' || order.status === 'awaiting_qr'
      ).length;
      const completedOrders = orders.filter((order: any) => 
        order.status === 'delivered' || order.status === 'confirmed'
      ).length;

      // Extract and organize customers
      const customerMap = new Map<string, Customer>();
      
      orders.forEach((order: any) => {
        const customerKey = order.customer_phone || order.customer_email || `guest_${order.id}`;
        
        if (!customerMap.has(customerKey)) {
          customerMap.set(customerKey, {
            id: customerKey,
            name: order.customer_name,
            phone: order.customer_phone,
            email: order.customer_email,
            address: order.customer_address,
            totalOrders: 0,
            totalSpent: 0,
            lastOrderDate: order.created_at,
            status: 'new'
          });
        }
        
        const customer = customerMap.get(customerKey)!;
        customer.totalOrders += 1;
        customer.totalSpent += order.total_amount;
        
        // Update last order date if this order is newer
        if (new Date(order.created_at) > new Date(customer.lastOrderDate)) {
          customer.lastOrderDate = order.created_at;
        }
        
        // Update customer info with most recent data
        if (order.customer_name && !customer.name) customer.name = order.customer_name;
        if (order.customer_email && !customer.email) customer.email = order.customer_email;
        if (order.customer_address && !customer.address) customer.address = order.customer_address;
      });

      // Classify customers and sort
      const customersArray = Array.from(customerMap.values()).map(customer => {
        if (customer.totalSpent > 500) {
          customer.status = 'vip';
        } else if (customer.totalOrders > 2) {
          customer.status = 'regular';
        } else {
          customer.status = 'new';
        }
        return customer;
      }).sort((a, b) => b.totalSpent - a.totalSpent);

      setStats({
        totalOrders: orders.length,
        totalProducts: productsData.products?.length || 0,
        totalCategories: categoriesData.categories?.length || 0,
        totalBanners: bannersData.banners?.length || 0,
        recentOrders: orders.slice(0, 10),
        totalRevenue,
        pendingOrders,
        completedOrders,
        uniqueCustomers: customersArray.length
      });
      
      setCustomers(customersArray);
      setCartAnalytics(analyticsData.analytics || []);
      setDynamicDiscounts(discountsData.discounts || []);
      setCoupons(couponsData.coupons || []);
      setCouponUsage(couponUsageData.usage || []);
    } catch (error) {
      console.error("Dashboard: Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPagLeveSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings");
      const data = await response.json();
      
      if (data.settings) {
        const settings: Record<string, string> = {};
        data.settings.forEach((setting: any) => {
          settings[setting.setting_key] = setting.setting_value || '';
        });
        setPagLeveSettings(settings);
        
        // Check if PagLeve is configured
        const hasCredentials = settings.pagleve_api_key && settings.pagleve_secret;
        const isEnabled = settings.automatic_payments_enabled === '1';
        
        if (hasCredentials && isEnabled) {
          setPagLeveStatus('connected');
        } else if (hasCredentials) {
          setPagLeveStatus('disconnected');
        } else {
          setPagLeveStatus('unknown');
        }
      }
    } catch (error) {
      console.error("Error fetching PagLeve settings:", error);
      setPagLeveStatus('unknown');
    }
  };

  const testPagLeveConnection = async () => {
    setPagLeveStatus('testing');
    setPagLeveTestResult(null);

    try {
      const response = await fetch("/api/admin/test-pagleve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      setPagLeveTestResult({
        success: data.success,
        message: data.message || data.error
      });
      
      if (data.success) {
        setPagLeveStatus('connected');
      } else {
        setPagLeveStatus('disconnected');
      }
    } catch (error) {
      setPagLeveTestResult({
        success: false,
        message: "Erro ao testar conexão: " + (error as Error).message
      });
      setPagLeveStatus('disconnected');
    }
  };

  const togglePagLeve = async () => {
    if (toggling) return;
    
    setToggling(true);
    
    try {
      const newStatus = pagLeveSettings.automatic_payments_enabled !== '1';
      
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          settings: {
            automatic_payments_enabled: newStatus ? '1' : '0'
          }
        }),
      });

      if (response.ok) {
        setPagLeveSettings((prev: any) => ({
          ...prev,
          automatic_payments_enabled: newStatus ? '1' : '0'
        }));
        
        // Update status
        if (newStatus && pagLeveSettings.pagleve_api_key && pagLeveSettings.pagleve_secret) {
          setPagLeveStatus('connected');
        } else if (newStatus) {
          setPagLeveStatus('disconnected');
        } else {
          setPagLeveStatus('unknown');
        }
        
        console.log(`PagLeve ${newStatus ? 'ativado' : 'desativado'} via dashboard toggle`);
        
        // Show success feedback
        const message = newStatus 
          ? '✅ Sistema PagLeve ativado! PIX será gerado automaticamente.' 
          : '❌ Sistema PagLeve desativado. PIX será adicionado manualmente.';
        
        // You could add a toast notification here if you have one
        console.log(message);
      } else {
        throw new Error("Failed to toggle PagLeve");
      }
    } catch (error) {
      console.error("Error toggling PagLeve:", error);
      alert("Erro ao alterar status do PagLeve. Verifique as configurações.");
    } finally {
      setToggling(false);
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

  const formatDateCompact = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
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
    if (diffInMinutes === 1) return '1 min atrás';
    if (diffInMinutes < 60) return `${diffInMinutes} min atrás`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours === 1) return '1h atrás';
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 dia atrás';
    if (diffInDays < 7) return `${diffInDays} dias atrás`;
    
    return formatDateCompact(dateString);
  };

  const getStatusColor = (status: string, hasPaymentMethod?: boolean) => {
    switch (status) {
      case 'awaiting_qr': return 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse';
      case 'pending': 
        return hasPaymentMethod 
          ? 'bg-green-100 text-green-800 border border-green-300 animate-pulse' 
          : 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'delivering': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string, hasPaymentMethod?: boolean) => {
    switch (status) {
      case 'awaiting_qr': return 'Aguardando PIX';
      case 'pending': 
        return hasPaymentMethod ? '💰 Aguardando Aprovação' : 'Pendente';
      case 'confirmed': return 'Pagamento Aprovado ✅';
      case 'preparing': return 'Preparando';
      case 'delivering': return 'Entregando';
      case 'delivered': return 'Entregue';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const getCustomerStatusColor = (status: string) => {
    switch (status) {
      case 'vip': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'regular': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'new': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCustomerStatusLabel = (status: string) => {
    switch (status) {
      case 'vip': return '⭐ VIP';
      case 'regular': return '👤 Regular';
      case 'new': return '🆕 Novo';
      default: return 'Cliente';
    }
  };

  const handleBanCustomerIP = async (customer: Customer) => {
    if (banLoading) return;

    // Buscar TODOS os pedidos deste cliente no banco de dados para encontrar o IP
    try {
      const response = await fetch('/api/admin/customer-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customer.name,
          customer_phone: customer.phone,
          customer_email: customer.email
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar pedidos do cliente');
      }

      const data = await response.json();
      const customerOrders = data.orders || [];

      // Encontrar o pedido mais recente com IP
      const orderWithIP = customerOrders
        .filter((order: any) => order.customer_ip)
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

      if (!orderWithIP?.customer_ip) {
        alert('Não foi possível encontrar o IP deste cliente. Nenhum pedido com IP capturado foi encontrado.');
        return;
      }

    const confirmMessage = `Tem certeza que deseja banir o IP ${orderWithIP.customer_ip} do cliente?\n\nCliente: ${customer.name || 'Anônimo'}\nTelefone: ${customer.phone || 'N/A'}\nEmail: ${customer.email || 'N/A'}\nTotal gasto: ${formatPrice(customer.totalSpent)}\nÚltimo pedido com IP: #${orderWithIP.id}\n\nEsta ação impedirá o cliente de acessar a loja.`;
      
      if (!confirm(confirmMessage)) return;

      const reason = prompt('Digite o motivo do banimento (opcional):') || 'Banido pelo administrador';

      setBanLoading(customer.id);
      
      const banResponse = await fetch('/api/admin/ban-ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ip_address: orderWithIP.customer_ip,
          reason: reason,
          banned_by: 'Admin Dashboard'
        })
      });

      const banData = await banResponse.json();

      if (banResponse.ok) {
        alert(`✅ IP ${orderWithIP.customer_ip} foi banido com sucesso!\n\nCliente: ${customer.name || 'Anônimo'}\nMotivo: ${reason}\nPedido: #${orderWithIP.id}`);
        // Refresh data to reflect changes
        fetchDashboardData();
      } else {
        alert('❌ Erro ao banir IP: ' + (banData.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Error banning customer IP:', error);
      alert('❌ Erro ao banir IP do cliente: ' + (error as Error).message);
    } finally {
      setBanLoading(null);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-600" />
            Dashboard Central
          </h1>
          <div className="flex items-center gap-4">
            {hasNewAwaitingOrders && (
              <div className="flex items-center gap-2 bg-amber-100 border border-amber-300 text-amber-800 px-3 py-2 rounded-lg animate-pulse">
                <div className="relative">
                  <Bell className="w-4 h-4" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                </div>
                <span className="text-sm font-medium">
                  {newOrdersCount} {newOrdersCount === 1 ? 'pedido aguardando' : 'pedidos aguardando'} QR Code
                </span>
                <button
                  onClick={markAsSeen}
                  className="ml-2 text-amber-600 hover:text-amber-800 underline text-xs"
                >
                  Marcar como visto
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Visão Geral
              </div>
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'orders'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                Pedidos ({stats.totalOrders})
                {hasNewAwaitingOrders && (
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'customers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Clientes ({stats.uniqueCustomers})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Analytics & Descontos
              </div>
            </button>
            <button
              onClick={() => setActiveTab('coupons')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'coupons'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Cupons ({coupons.filter(c => c.is_active).length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'api'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                API PagLeve
                {pagLeveStatus === 'connected' && (
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                )}
                {pagLeveStatus === 'disconnected' && (
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                )}
                {pagLeveStatus === 'testing' && (
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                )}
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Minimum Order Value Configuration */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <SettingsIcon className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Configuração de Pedido Mínimo</h3>
                  <p className="text-sm text-gray-600">Defina o valor mínimo para pedidos dos clientes</p>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label htmlFor="minimum-order" className="block text-sm font-medium text-gray-700 mb-2">
                      Pedido Mínimo (R$)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">R$</span>
                      <input
                        id="minimum-order"
                        type="number"
                        min="0"
                        step="0.01"
                        value={minimumOrderValue}
                        onChange={(e) => setMinimumOrderValue(parseFloat(e.target.value) || 0)}
                        className="pl-8 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="200.00"
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={updateMinimumOrderValue}
                      disabled={isUpdatingMinimum}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isUpdatingMinimum 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-orange-600 text-white hover:bg-orange-700'
                      }`}
                    >
                      {isUpdatingMinimum ? (
                        <>
                          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Salvar
                        </>
                      )}
                    </button>
                    
                    <p className="text-xs text-gray-500 text-center">
                      Atual: {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(minimumOrderValue)}
                    </p>
                  </div>
                </div>
                
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Dica:</strong> Valores menores aumentam as conversões, mas reduzem o ticket médio. 
                    Valores maiores aumentam a margem, mas podem afastar clientes.
                  </p>
                </div>
              </div>
            </div>

            {/* PagLeve Control Card - Prominent Position */}
            <div className={`bg-gradient-to-r ${
              pagLeveSettings.automatic_payments_enabled === '1' 
                ? 'from-green-500 to-emerald-600' 
                : 'from-gray-500 to-gray-600'
            } text-white rounded-xl shadow-lg overflow-hidden relative`}>
              <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-white/10 pointer-events-none"></div>
              
              <div className="relative z-10 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl">
                      <CreditCard className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white mb-1">
                        Sistema PagLeve - Pagamentos Automáticos
                      </h2>
                      <p className={`text-sm ${
                        pagLeveSettings.automatic_payments_enabled === '1' 
                          ? 'text-green-100' 
                          : 'text-gray-300'
                      }`}>
                        {pagLeveSettings.automatic_payments_enabled === '1' 
                          ? '✅ PIX sendo gerado automaticamente para novos pedidos' 
                          : '❌ PIX sendo adicionado manualmente pelos administradores'
                        }
                      </p>
                      {pagLeveSettings.manual_operator_mode === '1' && (
                        <p className="text-yellow-200 text-xs mt-1 font-medium">
                          ⚠️ Modo operador manual está forçado
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {/* Status Indicator */}
                    <div className="text-right mr-4">
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border-2 ${
                        pagLeveSettings.automatic_payments_enabled === '1' 
                          ? 'bg-white/20 border-white/40 text-white' 
                          : 'bg-white/10 border-white/30 text-white/90'
                      }`}>
                        {pagLeveSettings.automatic_payments_enabled === '1' ? (
                          <>
                            <Zap className="w-4 h-4" />
                            SISTEMA ATIVO
                          </>
                        ) : (
                          <>
                            <ZapOff className="w-4 h-4" />
                            SISTEMA INATIVO
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Toggle Switch */}
                    <button
                      onClick={togglePagLeve}
                      disabled={toggling}
                      className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-4 focus:ring-white/30 ${
                        pagLeveSettings.automatic_payments_enabled === '1' 
                          ? 'bg-white/30 shadow-lg' 
                          : 'bg-white/20'
                      } ${toggling ? 'opacity-70 cursor-not-allowed' : 'hover:bg-white/40'}`}
                      title={pagLeveSettings.automatic_payments_enabled === '1' ? 'Clique para desativar' : 'Clique para ativar'}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-md ${
                          pagLeveSettings.automatic_payments_enabled === '1' ? 'translate-x-9' : 'translate-x-1'
                        }`}
                      >
                        <div className="flex items-center justify-center h-full">
                          {toggling ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-gray-400 border-t-transparent border-2"></div>
                          ) : (
                            pagLeveSettings.automatic_payments_enabled === '1' ? (
                              <Zap className="w-3 h-3 text-green-600" />
                            ) : (
                              <ZapOff className="w-3 h-3 text-gray-400" />
                            )
                          )}
                        </div>
                      </span>
                    </button>
                    
                    {/* Settings Link */}
                    <Link
                      to="/admin/settings"
                      className="bg-white/20 backdrop-blur-sm border-2 border-white/40 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/30 transition-all duration-200 flex items-center gap-2"
                    >
                      <SettingsIcon className="w-4 h-4" />
                      Configurar
                    </Link>
                  </div>
                </div>
                
                {/* Quick Info */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        pagLeveSettings.pagleve_api_key && pagLeveSettings.pagleve_secret 
                          ? 'bg-green-400' 
                          : 'bg-red-400'
                      }`}></div>
                      <span className="text-sm text-white/90">
                        Credenciais: {pagLeveSettings.pagleve_api_key && pagLeveSettings.pagleve_secret ? 'Configuradas' : 'Pendentes'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        pagLeveStatus === 'connected' ? 'bg-green-400' : 
                        pagLeveStatus === 'disconnected' ? 'bg-red-400' : 'bg-yellow-400'
                      }`}></div>
                      <span className="text-sm text-white/90">
                        Status: {pagLeveStatus === 'connected' ? 'Conectado' : 
                                pagLeveStatus === 'disconnected' ? 'Desconectado' : 'Verificando...'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        stats.pendingOrders > 0 ? 'bg-amber-400 animate-pulse' : 'bg-green-400'
                      }`}></div>
                      <span className="text-sm text-white/90">
                        Pedidos pendentes: {stats.pendingOrders}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total de Pedidos</p>
                    <p className="text-3xl font-bold">{stats.totalOrders}</p>
                  </div>
                  <ShoppingBag className="w-8 h-8 text-blue-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Receita Total</p>
                    <p className="text-2xl font-bold">{formatPrice(stats.totalRevenue)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-100 text-sm font-medium">Pendentes</p>
                    <p className="text-3xl font-bold">{stats.pendingOrders}</p>
                  </div>
                  <Clock className="w-8 h-8 text-amber-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Clientes Únicos</p>
                    <p className="text-3xl font-bold">{stats.uniqueCustomers}</p>
                  </div>
                  <Users className="w-8 h-8 text-purple-200" />
                </div>
              </div>
            </div>

            {/* Awaiting PIX Orders Alert */}
            <AwaitingPixOrders />

            {/* Online Users and Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Online Users */}
              <div className="lg:col-span-1">
                <OnlineUsers />
              </div>

              {/* Quick Actions */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link to="/admin/products" className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="p-3 bg-blue-100 rounded-lg mr-4">
                        <Package className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Adicionar Produto</h3>
                        <p className="text-sm text-gray-600">Cadastre novos produtos</p>
                      </div>
                    </Link>

                    <Link to="/admin/orders" className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="p-3 bg-green-100 rounded-lg mr-4">
                        <ShoppingBag className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Gerenciar Pedidos</h3>
                        <p className="text-sm text-gray-600">Atualizar status dos pedidos</p>
                      </div>
                    </Link>

                    <Link to="/admin/categories" className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="p-3 bg-purple-100 rounded-lg mr-4">
                        <FolderOpen className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Categorias</h3>
                        <p className="text-sm text-gray-600">Organizar produtos</p>
                      </div>
                    </Link>

                    <Link to="/admin/banners" className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="p-3 bg-orange-100 rounded-lg mr-4">
                        <Image className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Banners</h3>
                        <p className="text-sm text-gray-600">Gerenciar promoções</p>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Cart Analytics Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Top Products in Cart */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                      Top Produtos no Carrinho
                    </h2>
                    <button
                      onClick={() => setActiveTab('analytics')}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Ver analytics completo
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  {cartAnalytics.length === 0 ? (
                    <div className="text-center py-8">
                      <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Nenhum produto rastreado ainda</p>
                      <p className="text-sm text-gray-400 mt-2">Os dados aparecerão quando os clientes adicionarem produtos ao carrinho</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cartAnalytics.slice(0, 5).map((item, index) => (
                        <div key={item.product_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              index === 0 ? 'bg-yellow-100 text-yellow-800' :
                              index === 1 ? 'bg-gray-100 text-gray-600' :
                              index === 2 ? 'bg-orange-100 text-orange-600' :
                              'bg-blue-100 text-blue-600'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">{item.product_name}</h4>
                              <p className="text-xs text-gray-600">{formatPrice(item.product_price)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-blue-600">{item.total_additions}</p>
                            <p className="text-xs text-gray-500">adições</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic Discounts Status */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      Descontos Dinâmicos
                    </h2>
                    <button
                      onClick={() => setActiveTab('analytics')}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Gerenciar descontos
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-sm font-medium text-green-800">Ativos</span>
                      </div>
                      <p className="text-xl font-bold text-green-900 mt-1">
                        {dynamicDiscounts.filter(d => d.is_active).length}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        <span className="text-sm font-medium text-gray-600">Total</span>
                      </div>
                      <p className="text-xl font-bold text-gray-900 mt-1">
                        {dynamicDiscounts.length}
                      </p>
                    </div>
                  </div>
                  
                  {dynamicDiscounts.length === 0 ? (
                    <div className="text-center py-4">
                      <TrendingUp className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">Nenhum desconto dinâmico configurado</p>
                      <button
                        onClick={() => setActiveTab('analytics')}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                      >
                        Criar primeiro desconto
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {dynamicDiscounts.filter(d => d.is_active).slice(0, 3).map((discount) => {
                        const product = cartAnalytics.find(a => a.product_id === discount.product_id);
                        const currentAdditions = product?.total_additions || 0;
                        const progress = Math.min(100, (currentAdditions / discount.trigger_value) * 100);
                        
                        return (
                          <div key={discount.id} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-green-800">
                                {product?.product_name || `Produto #${discount.product_id}`}
                              </span>
                              <span className="text-xs text-green-600">
                                {discount.discount_value}{discount.discount_type === 'percentage' ? '%' : 'R$'}
                              </span>
                            </div>
                            <div className="w-full bg-green-200 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-green-600 mt-1">
                              {currentAdditions}/{discount.trigger_value} adições para ativar
                            </p>
                          </div>
                        );
                      })}
                      {dynamicDiscounts.filter(d => d.is_active).length > 3 && (
                        <p className="text-xs text-gray-500 text-center">
                          +{dynamicDiscounts.filter(d => d.is_active).length - 3} outros descontos ativos
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Banned IPs Manager */}
            <BannedIpManager />
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Awaiting PIX Orders Alert */}
            <AwaitingPixOrders />

            {/* Recent Orders */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Pedidos Recentes</h2>
                  <Link to="/admin/orders" className="text-sm text-blue-600 hover:text-blue-800">
                    Ver todos os pedidos
                  </Link>
                </div>
              </div>

              <div className="p-6">
                {stats.recentOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum pedido encontrado</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stats.recentOrders.map((order: any) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-gray-900">
                              Pedido #{order.id}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status, !!(order.qr_code_url || order.pix_copy_paste))}`}>
                              {getStatusText(order.status, !!(order.qr_code_url || order.pix_copy_paste))}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            {order.customer_name && (
                              <div className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                <span>{order.customer_name}</span>
                              </div>
                            )}
                            {order.customer_phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                <span>{order.customer_phone}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(order.created_at)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span className="text-blue-600 font-medium">{getTimeAgo(order.created_at)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {formatPrice(order.total_amount)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="space-y-6">
            {/* Customer Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Novos Clientes</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {customers.filter(c => c.status === 'new').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Clientes Regulares</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {customers.filter(c => c.status === 'regular').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Clientes VIP</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {customers.filter(c => c.status === 'vip').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer List */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Clientes</h2>
              </div>

              <div className="p-6">
                {customers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum cliente encontrado</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {customers.map((customer) => (
                      <div key={customer.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-medium text-gray-900">
                                {customer.name || 'Cliente Anônimo'}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getCustomerStatusColor(customer.status)}`}>
                                {getCustomerStatusLabel(customer.status)}
                              </span>
                              <button
                                onClick={() => handleBanCustomerIP(customer)}
                                disabled={banLoading === customer.id}
                                className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                                title="Banir IP do cliente"
                              >
                                {banLoading === customer.id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-white border-t-transparent border-2"></div>
                                    Banindo...
                                  </>
                                ) : (
                                  <>🚫 Banir IP</>
                                )}
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                              {customer.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="w-4 h-4" />
                                  <span>{customer.phone}</span>
                                </div>
                              )}
                              {customer.email && (
                                <div className="flex items-center gap-2">
                                  <Mail className="w-4 h-4" />
                                  <span className="truncate">{customer.email}</span>
                                </div>
                              )}
                              {customer.address && (
                                <div className="flex items-center gap-2 md:col-span-2">
                                  <MapPin className="w-4 h-4" />
                                  <span className="truncate">{customer.address}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>🌐 IP será localizado nos pedidos</span>
                              </div>
                            </div>
                            
                            <div className="mt-2 text-xs text-gray-500">
                              Último pedido: {formatDate(customer.lastOrderDate)}
                            </div>
                          </div>
                          
                          <div className="text-right space-y-1">
                            <div>
                              <p className="text-lg font-bold text-gray-900">
                                {formatPrice(customer.totalSpent)}
                              </p>
                              <p className="text-xs text-gray-500">Total gasto</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700">
                                {customer.totalOrders} {customer.totalOrders === 1 ? 'pedido' : 'pedidos'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <CartAnalytics />
          </div>
        )}

        {activeTab === 'coupons' && (
          <div className="space-y-6">
            {/* Coupon Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Total de Cupons</p>
                    <p className="text-3xl font-bold">{coupons.length}</p>
                  </div>
                  <svg className="w-8 h-8 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Cupons Ativos</p>
                    <p className="text-3xl font-bold">{coupons.filter(c => c.is_active).length}</p>
                  </div>
                  <svg className="w-8 h-8 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total de Usos</p>
                    <p className="text-3xl font-bold">{couponUsage.length}</p>
                  </div>
                  <svg className="w-8 h-8 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Economia Total</p>
                    <p className="text-2xl font-bold">
                      {formatPrice(couponUsage.reduce((sum, usage) => sum + (usage.discount_amount || 0), 0))}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-orange-200" />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setActiveTab('analytics')}
                  className="flex items-center p-4 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
                >
                  <div className="p-3 bg-purple-100 rounded-lg mr-4">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-gray-900">Criar Novo Cupom</h3>
                    <p className="text-sm text-gray-600">Adicionar cupom de desconto</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('analytics')}
                  className="flex items-center p-4 border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
                >
                  <div className="p-3 bg-green-100 rounded-lg mr-4">
                    <BarChart3 className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-gray-900">Ver Analytics</h3>
                    <p className="text-sm text-gray-600">Análise completa de cupons</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Active Coupons List */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Cupons Ativos ({coupons.filter(c => c.is_active).length})
                </h2>
              </div>

              <div className="p-6">
                {coupons.filter(c => c.is_active).length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <p className="text-gray-500 mb-4">Nenhum cupom ativo no momento</p>
                    <button
                      onClick={() => setActiveTab('analytics')}
                      className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Criar Primeiro Cupom
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {coupons.filter(c => c.is_active).map((coupon) => (
                      <div key={coupon.id} className="border border-purple-200 rounded-lg p-4 bg-purple-50 hover:bg-purple-100 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                            {coupon.code}
                          </span>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                            Ativo
                          </span>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Desconto:</span>
                            <span className="font-semibold text-purple-800">
                              {coupon.discount_value}{coupon.discount_type === 'percentage' ? '%' : ' reais'}
                            </span>
                          </div>
                          
                          {coupon.minimum_order_amount > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Pedido mín:</span>
                              <span className="text-blue-600 font-medium">
                                {formatPrice(coupon.minimum_order_amount)}
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Usos:</span>
                            <span className="font-medium">
                              {coupon.used_count || 0}
                              {coupon.usage_limit && ` / ${coupon.usage_limit}`}
                            </span>
                          </div>
                          
                          {coupon.valid_until && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Válido até:</span>
                              <span className="text-orange-600 text-xs">
                                {new Date(coupon.valid_until).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Usage */}
            {couponUsage.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Usos Recentes ({couponUsage.length})
                  </h2>
                </div>

                <div className="p-6">
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {couponUsage.slice(0, 10).map((usage) => (
                      <div key={usage.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-purple-600">{usage.coupon_code}</span>
                              <span className="text-gray-500">•</span>
                              <span className="text-sm text-gray-900">{usage.customer_name || 'Cliente'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              {usage.customer_phone && (
                                <>
                                  <Phone className="w-3 h-3" />
                                  <span>{usage.customer_phone}</span>
                                </>
                              )}
                              <span>•</span>
                              <span>{formatDate(usage.created_at)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-green-600">
                            -{formatPrice(usage.discount_amount || 0)}
                          </span>
                          <p className="text-xs text-gray-500">economia</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'api' && (
          <div className="space-y-6">
            {/* PagLeve API Status */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    Sistema PagLeve - Pagamentos Automáticos
                  </h2>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${
                    pagLeveStatus === 'connected' 
                      ? 'bg-green-100 text-green-800' 
                      : pagLeveStatus === 'disconnected'
                      ? 'bg-red-100 text-red-800'
                      : pagLeveStatus === 'testing'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {pagLeveStatus === 'connected' && <CheckCircle className="w-4 h-4" />}
                    {pagLeveStatus === 'disconnected' && <XCircle className="w-4 h-4" />}
                    {pagLeveStatus === 'testing' && <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />}
                    {pagLeveStatus === 'unknown' && <AlertCircle className="w-4 h-4" />}
                    {pagLeveStatus === 'connected' && 'CONECTADO'}
                    {pagLeveStatus === 'disconnected' && 'DESCONECTADO'}
                    {pagLeveStatus === 'testing' && 'TESTANDO...'}
                    {pagLeveStatus === 'unknown' && 'NÃO CONFIGURADO'}
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* Current Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <SettingsIcon className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-900">Pagamentos Automáticos</span>
                    </div>
                    <div className={`flex items-center gap-2 ${
                      pagLeveSettings.automatic_payments_enabled === '1' 
                        ? 'text-green-700' 
                        : 'text-red-700'
                    }`}>
                      {pagLeveSettings.automatic_payments_enabled === '1' ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span className="font-semibold">ATIVADO</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" />
                          <span className="font-semibold">DESATIVADO</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      {pagLeveSettings.automatic_payments_enabled === '1' 
                        ? 'PIX será gerado automaticamente' 
                        : 'PIX será adicionado manualmente'
                      }
                    </p>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-5 h-5 text-purple-600" />
                      <span className="font-medium text-purple-900">Modo Operador</span>
                    </div>
                    <div className={`flex items-center gap-2 ${
                      pagLeveSettings.manual_operator_mode === '1' 
                        ? 'text-orange-700' 
                        : 'text-green-700'
                    }`}>
                      {pagLeveSettings.manual_operator_mode === '1' ? (
                        <>
                          <AlertCircle className="w-4 h-4" />
                          <span className="font-semibold">MANUAL FORÇADO</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span className="font-semibold">AUTOMÁTICO</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-purple-600 mt-1">
                      {pagLeveSettings.manual_operator_mode === '1' 
                        ? 'Força operação manual mesmo com automático ativo' 
                        : 'Segue configuração automática normal'
                      }
                    </p>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-900">Credenciais</span>
                    </div>
                    <div className={`flex items-center gap-2 ${
                      pagLeveSettings.pagleve_api_key && pagLeveSettings.pagleve_secret 
                        ? 'text-green-700' 
                        : 'text-red-700'
                    }`}>
                      {pagLeveSettings.pagleve_api_key && pagLeveSettings.pagleve_secret ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span className="font-semibold">CONFIGURADAS</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" />
                          <span className="font-semibold">PENDENTES</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      {pagLeveSettings.pagleve_api_key && pagLeveSettings.pagleve_secret 
                        ? 'API Key e Secret configurados' 
                        : 'Configure suas credenciais PagLeve'
                      }
                    </p>
                  </div>
                </div>

                {/* Test Connection */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <TestTube className="w-5 h-5 text-blue-600" />
                        Teste de Conexão
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Verifique se sua integração com o PagLeve está funcionando corretamente
                      </p>
                    </div>
                    <button
                      onClick={testPagLeveConnection}
                      disabled={pagLeveStatus === 'testing' || !pagLeveSettings.pagleve_api_key || !pagLeveSettings.pagleve_secret}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {pagLeveStatus === 'testing' ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Testando...
                        </>
                      ) : (
                        <>
                          <TestTube className="w-4 h-4" />
                          Testar Conexão
                        </>
                      )}
                    </button>
                  </div>

                  {pagLeveTestResult && (
                    <div className={`p-4 rounded-lg border ${
                      pagLeveTestResult.success 
                        ? 'bg-green-50 border-green-200 text-green-800' 
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}>
                      <div className="flex items-center gap-2">
                        {pagLeveTestResult.success ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                        <span className="font-medium">
                          {pagLeveTestResult.success ? 'Teste Bem-sucedido!' : 'Teste Falhou'}
                        </span>
                      </div>
                      <p className="mt-2 text-sm">{pagLeveTestResult.message}</p>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link 
                    to="/admin/settings"
                    className="flex items-center p-4 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <div className="p-3 bg-blue-100 rounded-lg mr-4">
                      <SettingsIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Configurar PagLeve</h3>
                      <p className="text-sm text-gray-600">Adicionar credenciais e configurações</p>
                    </div>
                  </Link>

                  <Link 
                    to="/admin/orders"
                    className="flex items-center p-4 border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
                  >
                    <div className="p-3 bg-green-100 rounded-lg mr-4">
                      <ShoppingBag className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Ver Pedidos</h3>
                      <p className="text-sm text-gray-600">Monitorar pagamentos automáticos</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* API Documentation */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-600" />
                  Como Funciona o Sistema Automático
                </h2>
              </div>

              <div className="p-6">
                <div className="space-y-6">
                  {/* Flow Diagram */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-blue-600" />
                      Fluxo de Pagamento Automático
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <span className="text-blue-600 font-bold text-lg">1</span>
                        </div>
                        <h4 className="font-medium text-gray-900 mb-2">Cliente Faz Pedido</h4>
                        <p className="text-sm text-gray-600">Cliente finaliza o checkout no site</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <span className="text-green-600 font-bold text-lg">2</span>
                        </div>
                        <h4 className="font-medium text-gray-900 mb-2">PIX Automático</h4>
                        <p className="text-sm text-gray-600">Sistema gera PIX via PagLeve automaticamente</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <span className="text-purple-600 font-bold text-lg">3</span>
                        </div>
                        <h4 className="font-medium text-gray-900 mb-2">Cliente Paga</h4>
                        <p className="text-sm text-gray-600">Cliente escaneia QR ou usa código PIX</p>
                      </div>
                    </div>
                  </div>

                  {/* Benefits */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Vantagens do Modo Automático
                      </h4>
                      <ul className="space-y-2 text-sm text-green-800">
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                          PIX gerado instantaneamente
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                          Não requer intervenção manual
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                          Cliente recebe pagamento imediatamente
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                          Reduz tempo de processamento
                        </li>
                      </ul>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        Modo Fallback Manual
                      </h4>
                      <ul className="space-y-2 text-sm text-blue-800">
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                          Ativa quando PagLeve está indisponível
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                          Admin adiciona PIX manualmente
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                          Garante que nenhum pedido seja perdido
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                          Pode ser forçado pelo "Modo Operador"
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Configuration Guide */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                      <SettingsIcon className="w-5 h-5" />
                      Guia de Configuração Rápida
                    </h4>
                    <ol className="space-y-2 text-sm text-yellow-800 list-decimal list-inside">
                      <li>Obtenha suas credenciais no painel do PagLeve (API Key e Secret)</li>
                      <li>Acesse <Link to="/admin/settings" className="text-blue-600 hover:text-blue-800 underline">Configurações do Site</Link> e cole suas credenciais</li>
                      <li>Ative "Pagamentos Automáticos" na mesma página</li>
                      <li>Teste a conexão usando o botão "Testar Conexão" acima</li>
                      <li>Faça um pedido teste para verificar se o PIX é gerado automaticamente</li>
                      <li>Use "Modo Operador Manual" apenas para testes ou emergências</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
