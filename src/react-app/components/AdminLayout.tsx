import { ReactNode, useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router";
import { useAdminAuth } from "@/react-app/hooks/useAdminAuth";
import AdminChatManager from "@/react-app/components/AdminChatManager";
import { 
  Home, 
  ShoppingBag, 
  Package, 
  Image, 
  LogOut, 
  Menu, 
  X,
  User,
  FolderOpen,
  Upload,
  Settings,
  Navigation,
  Power,
  Zap,
  ZapOff
} from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { isAuthenticated, isLoading, logout: adminLogout } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pagLeveEnabled, setPagLeveEnabled] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    // Check admin password authentication
    console.log('AdminLayout: isLoading:', isLoading, 'isAuthenticated:', isAuthenticated);
    if (!isLoading && !isAuthenticated) {
      console.log('AdminLayout: Redirecting to admin-password');
      navigate("/admin-password");
      return;
    }
  }, [navigate, isAuthenticated, isLoading]);

  useEffect(() => {
    // Fetch PagLeve status on mount
    if (isAuthenticated) {
      fetchPagLeveStatus();
    }
  }, [isAuthenticated]);

  const fetchPagLeveStatus = async () => {
    try {
      const response = await fetch("/api/admin/settings");
      const data = await response.json();
      
      if (data.settings) {
        const automaticPayments = data.settings.find((s: any) => s.setting_key === 'automatic_payments_enabled');
        setPagLeveEnabled(automaticPayments?.setting_value === '1');
      }
    } catch (error) {
      console.error("Error fetching PagLeve status:", error);
    }
  };

  const togglePagLeve = async () => {
    if (toggling) return;
    
    setToggling(true);
    
    try {
      const newStatus = !pagLeveEnabled;
      
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
        setPagLeveEnabled(newStatus);
        console.log(`PagLeve ${newStatus ? 'enabled' : 'disabled'} via quick toggle`);
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

  const handleLogout = async () => {
    adminLogout();
    navigate("/");
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: Home },
    { name: "Pedidos", href: "/admin/orders", icon: ShoppingBag },
    { name: "Produtos", href: "/admin/products", icon: Package },
    { name: "Categorias", href: "/admin/categories", icon: FolderOpen },
    { name: "Banners", href: "/admin/banners", icon: Image },
    { name: "Centros de Distribuição", href: "/admin/distribution-centers", icon: Navigation },
    { name: "Importação em Massa", href: "/admin/bulk-import", icon: Upload },
    { name: "Configurações", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 z-50 lg:relative lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-blue-600">🥤 AmBev Admin</h1>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1 rounded-md hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-6">
            <div className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-800'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* User info and logout */}
          <div className="p-6 border-t">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  Administrador
                </p>
                <p className="text-xs text-gray-500">Distribuidora AmBev</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Link
                to="/"
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <Home className="w-4 h-4" />
                Ver Loja
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Desktop header with PagLeve toggle */}
        <div className="hidden lg:block bg-white shadow-sm border-b px-6 py-3">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Painel Administrativo</h2>
            
            {/* PagLeve Quick Toggle */}
            <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-lg border">
              <div className="flex items-center gap-2">
                <Power className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">API PagLeve:</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${pagLeveEnabled ? 'text-green-700' : 'text-gray-500'}`}>
                  {pagLeveEnabled ? 'ATIVO' : 'INATIVO'}
                </span>
                
                <button
                  onClick={togglePagLeve}
                  disabled={toggling}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    pagLeveEnabled ? 'bg-green-600' : 'bg-gray-300'
                  } ${toggling ? 'opacity-50 cursor-not-allowed animate-pulse' : 'hover:bg-opacity-80'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-lg ${
                      pagLeveEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                
                {pagLeveEnabled ? (
                  <Zap className="w-5 h-5 text-green-600" />
                ) : (
                  <ZapOff className="w-5 h-5 text-gray-400" />
                )}
              </div>
              
              <Link
                to="/admin/settings"
                className="text-xs text-blue-600 hover:text-blue-800 underline ml-2"
              >
                Configurar
              </Link>
            </div>
          </div>
        </div>
        
        {/* Mobile header */}
        <div className="lg:hidden bg-white shadow-sm border-b px-4 py-3 flex justify-between items-center">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          {/* Mobile PagLeve Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">PagLeve</span>
            <button
              onClick={togglePagLeve}
              disabled={toggling}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                pagLeveEnabled ? 'bg-green-600' : 'bg-gray-200'
              } ${toggling ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  pagLeveEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            {pagLeveEnabled ? (
              <Zap className="w-4 h-4 text-green-600" />
            ) : (
              <ZapOff className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>

      <AdminChatManager />
    </div>
  );
}
