import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@getmocha/users-service/react";
import { CartProvider } from "@/react-app/hooks/useCart";
import Placeholder from "@/react-app/pages/Placeholder";
import { Navigate } from "react-router-dom";

import HomePage from "@/react-app/pages/Home";
import AdminPassword from "@/react-app/pages/AdminPassword";
import AdminDashboard from "@/react-app/pages/admin/Dashboard";
import AdminOrders from "@/react-app/pages/admin/Orders";
import AdminProducts from "@/react-app/pages/admin/Products";
import AdminCategories from "@/react-app/pages/admin/Categories";
import AdminBanners from "@/react-app/pages/admin/Banners";
import AdminBulkImport from "@/react-app/pages/admin/BulkImport";
import AdminSettings from "@/react-app/pages/admin/Settings";
import AdminDistributionCenters from "@/react-app/pages/admin/DistributionCenters";
import Checkout from "@/react-app/pages/Checkout";
import TestOrder from "@/react-app/pages/TestOrder";
import TestCheckout from "@/react-app/pages/TestCheckout";
import TestRealFlow from "@/react-app/pages/TestRealFlow";
import SystemTest from "@/react-app/pages/SystemTest";
import AdminDirect from "@/react-app/pages/AdminDirect";
import OrderApproved from "@/react-app/pages/OrderApproved";
import OrderTracking from "@/react-app/pages/OrderTracking";
import HomeRedirect from "@/react-app/pages/HomeRedirect";

import ProductPage from "@/react-app/pages/ProductPage"; // ajuste o path se necessário

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />


            {/* Aliases de categoria (não dá 404 agora) */}
            <Route path="/perfumaria" element={<Placeholder />} />
            <Route path="/body-splash" element={<Placeholder />} />
            <Route path="/corpo" element={<Placeholder />} />
            <Route path="/skincare" element={<Placeholder />} />
            <Route path="/kits" element={<Placeholder />} />
            <Route path="/mais-vendidos" element={<Placeholder />} />
            <Route path="/novidades" element={<Placeholder />} />
            <Route path="/ofertas" element={<Placeholder />} />

            {/* Institucionais (não dá 404 agora) */}
            <Route path="/sobre" element={<Placeholder />} />
            <Route path="/ajuda" element={<Placeholder />} />

            {/* Atalhos que redirecionam pras rotas reais que você já tem */}
            <Route path="/rastrear" element={<Navigate to="/order-tracking" replace />} />
            <Route path="/pedido-aprovado" element={<Navigate to="/order-approved" replace />} />

            {/* ✅ ROTA DO PRODUTO */}
            <Route path="/produto/:id" element={<ProductPage />} />

            <Route path="/admin-password" element={<AdminPassword />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/banners" element={<AdminBanners />} />
            <Route path="/admin/bulk-import" element={<AdminBulkImport />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/distribution-centers" element={<AdminDistributionCenters />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/test-order" element={<TestOrder />} />
            <Route path="/test-checkout" element={<TestCheckout />} />
            <Route path="/test-real-flow" element={<TestRealFlow />} />
            <Route path="/system-test" element={<SystemTest />} />
            <Route path="/admin-direct" element={<AdminDirect />} />
            <Route path="/order-approved" element={<OrderApproved />} />
            <Route path="/order-tracking" element={<OrderTracking />} />
            <Route path="/home" element={<HomeRedirect />} />
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}
