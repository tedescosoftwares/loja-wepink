import { useState, useEffect } from "react";
import AdminLayout from "@/react-app/components/AdminLayout";
import { useOrderAlerts } from "@/react-app/hooks/useOrderAlerts";
import { ShoppingBag, Phone, Mail, User, Clock, CheckCircle, X, Package, Truck, AlertCircle, QrCode, Edit3, Trash2, Bell, Zap, Timer, Receipt, ExternalLink, Send, Ban, Globe } from "lucide-react";

interface Order {
  id: number;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_address?: string;
  customer_cep?: string;
  customer_ip?: string;
  items: Array<{
    product: {
      name: string;
      price: number;
    };
    quantity: number;
  }>;
  total_amount: number;
  status: string;
  notes?: string;
  qr_code_url?: string;
  pix_copy_paste?: string;
  coupon_code?: string;
  discount_amount?: number;
  final_amount?: number;
  created_at: string;
  updated_at: string;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const [addingQrCode, setAddingQrCode] = useState<number | null>(null);
  const [pixInputs, setPixInputs] = useState<{[key: number]: string}>({});
  const [editingPixOrder, setEditingPixOrder] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editFormData, setEditFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    customer_address: '',
    customer_cep: '',
    notes: ''
  });
  
  const { newOrdersCount, hasNewAwaitingOrders, playAlertSound, markAsSeen } = useOrderAlerts();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/admin/orders");
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    setUpdatingStatus(orderId);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Update the orders list locally
        setOrders(prev => 
          prev.map(order => 
            order.id === orderId 
              ? { ...order, status: newStatus }
              : order
          )
        );
        
        // Show success message for admin when approving
        if (newStatus === 'confirmed') {
          const successDiv = document.createElement('div');
          successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce';
          successDiv.innerHTML = `✅ Pedido #${orderId} aprovado! Cliente foi notificado.`;
          document.body.appendChild(successDiv);
          
          setTimeout(() => {
            if (document.body.contains(successDiv)) {
              document.body.removeChild(successDiv);
            }
          }, 4000);
        }
      }
    } catch (error) {
      console.error("Error updating order status:", error);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const addPixPayment = async (orderId: number) => {
    const pixCode = pixInputs[orderId];
    if (!pixCode?.trim()) {
      alert('Por favor, insira o código PIX copia e cola');
      return;
    }

    setAddingQrCode(orderId);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/pix-payment`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          pix_copy_paste: pixCode,
          type: 'copy_paste' 
        }),
      });

      if (response.ok) {
        setOrders(prev => 
          prev.map(order => 
            order.id === orderId 
              ? { 
                  ...order, 
                  pix_copy_paste: pixCode,
                  status: 'pending' 
                }
              : order
          )
        );
        
        // Clear the input after successful submission
        setPixInputs(prev => ({ ...prev, [orderId]: '' }));
        
        // Show success message with auto-hide
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce';
        successDiv.innerHTML = `✅ PIX enviado para pedido #${orderId}!`;
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
          document.body.removeChild(successDiv);
        }, 3000);
      }
    } catch (error) {
      console.error("Error adding PIX payment:", error);
      alert('Erro ao adicionar PIX');
    } finally {
      setAddingQrCode(null);
    }
  };

  const handleEditPix = (orderId: number, currentPix: string) => {
    setEditingPixOrder(orderId);
    setPixInputs(prev => ({ ...prev, [orderId]: currentPix }));
  };

  const updatePixPayment = async (orderId: number) => {
    const pixCode = pixInputs[orderId];
    if (!pixCode?.trim()) {
      alert('Por favor, insira o código PIX copia e cola');
      return;
    }

    setAddingQrCode(orderId);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/pix-payment`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          pix_copy_paste: pixCode,
          type: 'copy_paste' 
        }),
      });

      if (response.ok) {
        setOrders(prev => 
          prev.map(order => 
            order.id === orderId 
              ? { 
                  ...order, 
                  pix_copy_paste: pixCode
                }
              : order
          )
        );
        
        // Clear the input and editing state
        setPixInputs(prev => ({ ...prev, [orderId]: '' }));
        setEditingPixOrder(null);
        
        // Show success message with auto-hide
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce';
        successDiv.innerHTML = `✅ PIX atualizado para pedido #${orderId}!`;
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
          if (document.body.contains(successDiv)) {
            document.body.removeChild(successDiv);
          }
        }, 3000);
      }
    } catch (error) {
      console.error("Error updating PIX payment:", error);
      alert('Erro ao atualizar PIX');
    } finally {
      setAddingQrCode(null);
    }
  };

  const cancelPixEdit = (orderId: number) => {
    setEditingPixOrder(null);
    setPixInputs(prev => ({ ...prev, [orderId]: '' }));
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setEditFormData({
      customer_name: order.customer_name || '',
      customer_phone: order.customer_phone || '',
      customer_email: order.customer_email || '',
      customer_address: order.customer_address || '',
      customer_cep: order.customer_cep || '',
      notes: order.notes || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    try {
      const response = await fetch(`/api/admin/orders/${editingOrder.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editFormData),
      });

      if (response.ok) {
        setOrders(prev => 
          prev.map(order => 
            order.id === editingOrder.id 
              ? { ...order, ...editFormData }
              : order
          )
        );
        setShowEditModal(false);
        setEditingOrder(null);
        alert('Pedido atualizado com sucesso!');
      }
    } catch (error) {
      console.error("Error updating order:", error);
      alert('Erro ao atualizar pedido');
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (!confirm("Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.")) return;
    
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setOrders(prev => prev.filter(order => order.id !== orderId));
        alert('Pedido excluído com sucesso!');
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      alert('Erro ao excluir pedido');
    }
  };

  const copyOrderLink = async (orderId: number) => {
    const orderLink = `${window.location.origin}/order-tracking?id=${orderId}`;
    
    try {
      await navigator.clipboard.writeText(orderLink);
      
      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce';
      successDiv.innerHTML = `✅ Link do pedido copiado! Envie para o cliente.`;
      document.body.appendChild(successDiv);
      
      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 3000);
    } catch (error) {
      console.error('Error copying link:', error);
      alert('Erro ao copiar link');
    }
  };

  const sendOrderLinkWhatsApp = (order: Order) => {
    const orderLink = `${window.location.origin}/order-tracking?id=${order.id}`;
    const customerPhone = order.customer_phone?.replace(/\D/g, ''); // Remove non-digits
    
    if (!customerPhone) {
      alert('Cliente não possui telefone cadastrado');
      return;
    }
    
    // Format phone for WhatsApp (add 55 if needed)
    const formattedPhone = customerPhone.startsWith('55') ? customerPhone : `55${customerPhone}`;
    
    let message = '';
    
    if (order.status === 'delivered') {
      message = `Olá ${order.customer_name || 'Cliente'}! 🎉

Seu pedido #${order.id} foi finalizado e entregue com sucesso! ✅

📦 *Detalhes da Entrega:*
• Pedido: #${order.id}
• Valor: ${formatPrice(order.total_amount)}
• Status: Entregue

🔗 *Acompanhe seu pedido:*
${orderLink}

Obrigado pela sua compra! 🙏

*Equipe AmBev*`;
    } else {
      const statusText = order.status === 'confirmed' ? 'confirmado' : 
                        order.status === 'preparing' ? 'sendo preparado' : 
                        order.status === 'delivering' ? 'saiu para entrega' : 
                        order.status === 'pending' ? 'aguardando pagamento' :
                        'em processamento';
      
      message = `Olá ${order.customer_name || 'Cliente'}! 📦

Aqui está o link para acompanhar seu pedido #${order.id}:

📊 *Status atual:* ${statusText}
💰 *Valor:* ${formatPrice(order.total_amount)}
📅 *Data:* ${formatDate(order.created_at)}

🔗 *Acompanhe em tempo real:*
${orderLink}

Você receberá atualizações automáticas conforme o pedido avança!

*Equipe AmBev* 🍺`;
    }
    
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const banCustomerIp = async (order: Order) => {
    if (!order.customer_ip || order.customer_ip === 'unknown') {
      alert('IP do cliente não disponível para banimento');
      return;
    }

    if (!confirm(`Tem certeza que deseja banir o IP ${order.customer_ip}?\n\nIsso impedirá que este cliente acesse a loja novamente.\n\nPedido: #${order.id}\nCliente: ${order.customer_name || 'Anônimo'}`)) {
      return;
    }

    const reason = prompt('Motivo do banimento:', `Cliente do pedido #${order.id} - comportamento inadequado`) || `Banido via pedido #${order.id}`;

    try {
      const response = await fetch('/api/admin/ban-ip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ip_address: order.customer_ip,
          reason: reason,
          banned_by: 'Admin - Pedido #' + order.id
        }),
      });

      if (response.ok) {
        // Show success message
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce';
        successDiv.innerHTML = `🚫 IP ${order.customer_ip} foi banido! Cliente não poderá mais acessar a loja.`;
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
          if (document.body.contains(successDiv)) {
            document.body.removeChild(successDiv);
          }
        }, 5000);
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao banir IP');
      }
    } catch (error) {
      console.error('Error banning IP:', error);
      alert('Erro ao banir IP');
    }
  };

  const generateInvoice = (order: Order) => {
    const invoiceWindow = window.open('', '_blank');
    if (!invoiceWindow) return;

    const subtotal = order.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const discount = order.discount_amount || 0;
    const finalAmount = order.final_amount || order.total_amount;

    const invoiceHTML = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Nota Fiscal - Pedido #${order.id}</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          <style>
              * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
              }
              
              body {
                  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  line-height: 1.5;
                  color: #1f2937;
                  max-width: 210mm;
                  margin: 0 auto;
                  padding: 10mm;
                  background: #ffffff;
                  font-size: 14px;
              }
              
              .invoice-container {
                  background: white;
                  border: 2px solid #e5e7eb;
                  box-shadow: 0 0 20px rgba(0, 0, 0, 0.05);
                  position: relative;
                  overflow: hidden;
              }
              
              .watermark {
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%) rotate(-45deg);
                  font-size: 8em;
                  color: rgba(37, 99, 235, 0.03);
                  font-weight: 900;
                  z-index: 1;
                  pointer-events: none;
                  user-select: none;
              }
              
              .invoice-content {
                  position: relative;
                  z-index: 2;
              }
              
              .invoice-header {
                  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%);
                  color: white;
                  padding: 30px 40px;
                  position: relative;
                  overflow: hidden;
              }
              
              .invoice-header::before {
                  content: '';
                  position: absolute;
                  top: -50%;
                  right: -50%;
                  width: 200%;
                  height: 200%;
                  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
                  transform: rotate(45deg);
              }
              
              .header-content {
                  position: relative;
                  z-index: 2;
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
              }
              
              .company-info {
                  flex: 1;
              }
              
              .company-logo {
                  font-size: 3.5em;
                  margin-bottom: 8px;
                  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
              }
              
              .company-name {
                  font-size: 2.2em;
                  font-weight: 700;
                  margin-bottom: 5px;
                  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
              }
              
              .company-tagline {
                  font-size: 1.1em;
                  opacity: 0.95;
                  font-weight: 300;
                  letter-spacing: 0.5px;
              }
              
              .invoice-meta {
                  text-align: right;
                  background: rgba(255,255,255,0.15);
                  padding: 20px;
                  border-radius: 12px;
                  backdrop-filter: blur(10px);
                  border: 1px solid rgba(255,255,255,0.2);
              }
              
              .invoice-number {
                  font-size: 1.8em;
                  font-weight: 700;
                  margin-bottom: 5px;
              }
              
              .invoice-date {
                  font-size: 0.95em;
                  opacity: 0.9;
              }
              
              .invoice-body {
                  padding: 50px 40px;
              }
              
              .section-divider {
                  height: 3px;
                  background: linear-gradient(90deg, #3b82f6, #60a5fa, #93c5fd);
                  margin: 30px 0;
                  border-radius: 2px;
              }
              
              .invoice-info {
                  display: grid;
                  grid-template-columns: 1fr 1fr 1fr;
                  gap: 40px;
                  margin-bottom: 40px;
              }
              
              .info-section {
                  position: relative;
              }
              
              .info-section::before {
                  content: '';
                  position: absolute;
                  left: -10px;
                  top: 0;
                  bottom: 0;
                  width: 4px;
                  background: linear-gradient(to bottom, #3b82f6, #60a5fa);
                  border-radius: 2px;
              }
              
              .info-section h3 {
                  color: #1e40af;
                  margin-bottom: 20px;
                  font-size: 1.1em;
                  font-weight: 600;
                  text-transform: uppercase;
                  letter-spacing: 1px;
                  display: flex;
                  align-items: center;
                  gap: 8px;
              }
              
              .info-section p {
                  margin-bottom: 10px;
                  font-size: 0.95em;
                  padding-left: 5px;
              }
              
              .info-section strong {
                  color: #374151;
                  font-weight: 600;
              }
              
              .items-section {
                  margin: 40px 0;
              }
              
              .items-section h3 {
                  color: #1e40af;
                  margin-bottom: 25px;
                  font-size: 1.3em;
                  font-weight: 600;
                  text-transform: uppercase;
                  letter-spacing: 1px;
                  border-bottom: 2px solid #e5e7eb;
                  padding-bottom: 10px;
              }
              
              .items-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-bottom: 30px;
                  background: white;
                  border-radius: 12px;
                  overflow: hidden;
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
              }
              
              .items-table thead {
                  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
              }
              
              .items-table th {
                  padding: 18px 15px;
                  text-align: left;
                  font-weight: 600;
                  color: #1e40af;
                  text-transform: uppercase;
                  font-size: 0.85em;
                  letter-spacing: 0.5px;
                  border-bottom: 2px solid #e5e7eb;
              }
              
              .items-table td {
                  padding: 16px 15px;
                  border-bottom: 1px solid #f3f4f6;
              }
              
              .items-table tbody tr {
                  transition: all 0.2s ease;
              }
              
              .items-table tbody tr:hover {
                  background: #f8fafc;
              }
              
              .items-table tbody tr:last-child td {
                  border-bottom: none;
              }
              
              .text-right {
                  text-align: right;
              }
              
              .text-center {
                  text-align: center;
              }
              
              .product-name {
                  font-weight: 600;
                  color: #374151;
              }
              
              .quantity-badge {
                  background: #eff6ff;
                  color: #1e40af;
                  padding: 4px 12px;
                  border-radius: 20px;
                  font-weight: 600;
                  font-size: 0.9em;
              }
              
              .price-cell {
                  font-weight: 600;
                  color: #059669;
              }
              
              .totals-section {
                  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
                  border: 2px solid #e5e7eb;
                  border-radius: 16px;
                  padding: 30px;
                  margin-bottom: 30px;
                  position: relative;
              }
              
              .totals-section::before {
                  content: '';
                  position: absolute;
                  top: 0;
                  left: 0;
                  right: 0;
                  height: 4px;
                  background: linear-gradient(90deg, #3b82f6, #60a5fa, #93c5fd);
                  border-radius: 16px 16px 0 0;
              }
              
              .totals-title {
                  color: #1e40af;
                  font-size: 1.2em;
                  font-weight: 600;
                  margin-bottom: 20px;
                  text-transform: uppercase;
                  letter-spacing: 1px;
              }
              
              .totals-row {
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 12px;
                  font-size: 1em;
                  padding: 8px 0;
              }
              
              .totals-row.discount {
                  color: #dc2626;
                  font-weight: 600;
              }
              
              .totals-row.final {
                  border-top: 3px solid #3b82f6;
                  padding-top: 20px;
                  margin-top: 20px;
                  font-weight: 700;
                  font-size: 1.4em;
                  color: #1e40af;
              }
              
              .status-section {
                  background: linear-gradient(135deg, #ecfdf5, #d1fae5);
                  border: 2px solid #a7f3d0;
                  border-radius: 16px;
                  padding: 25px;
                  margin-bottom: 30px;
                  position: relative;
              }
              
              .status-section::before {
                  content: '✓';
                  position: absolute;
                  top: -15px;
                  left: 25px;
                  background: #10b981;
                  color: white;
                  width: 30px;
                  height: 30px;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: bold;
                  font-size: 1.2em;
              }
              
              .status-title {
                  color: #065f46;
                  font-size: 1.1em;
                  font-weight: 600;
                  margin-bottom: 15px;
                  text-transform: uppercase;
                  letter-spacing: 1px;
              }
              
              .status-badge {
                  display: inline-block;
                  padding: 10px 20px;
                  border-radius: 25px;
                  font-weight: 600;
                  font-size: 0.95em;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              
              .status-confirmed {
                  background: linear-gradient(135deg, #d1fae5, #a7f3d0);
                  color: #065f46;
              }
              
              .status-pending {
                  background: linear-gradient(135deg, #fef3c7, #fde68a);
                  color: #92400e;
              }
              
              .status-awaiting {
                  background: linear-gradient(135deg, #fed7aa, #fdba74);
                  color: #9a3412;
              }
              
              .notes-section {
                  background: linear-gradient(135deg, #fffbeb, #fef3c7);
                  border: 2px solid #fed7aa;
                  border-radius: 16px;
                  padding: 25px;
                  margin-bottom: 30px;
              }
              
              .notes-title {
                  color: #92400e;
                  font-size: 1.1em;
                  font-weight: 600;
                  margin-bottom: 15px;
                  text-transform: uppercase;
                  letter-spacing: 1px;
              }
              
              .footer {
                  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
                  padding: 30px 40px;
                  text-align: center;
                  border-top: 3px solid #3b82f6;
                  margin-top: 40px;
              }
              
              .footer-logo {
                  font-size: 2em;
                  margin-bottom: 10px;
              }
              
              .footer-title {
                  font-size: 1.3em;
                  font-weight: 700;
                  color: #1e40af;
                  margin-bottom: 8px;
              }
              
              .footer-subtitle {
                  color: #6b7280;
                  margin-bottom: 15px;
                  font-style: italic;
              }
              
              .footer p {
                  margin-bottom: 5px;
                  color: #6b7280;
                  font-size: 0.9em;
              }
              
              .print-button {
                  background: linear-gradient(135deg, #3b82f6, #2563eb);
                  color: white;
                  border: none;
                  padding: 15px 30px;
                  border-radius: 30px;
                  font-size: 1.1em;
                  cursor: pointer;
                  margin: 30px auto;
                  display: block;
                  font-weight: 600;
                  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                  transition: all 0.3s ease;
                  text-transform: uppercase;
                  letter-spacing: 1px;
              }
              
              .print-button:hover {
                  background: linear-gradient(135deg, #2563eb, #1d4ed8);
                  transform: translateY(-2px);
                  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
              }
              
              @media print {
                  body {
                      background: white;
                      padding: 0;
                      font-size: 12px;
                  }
                  
                  .print-button {
                      display: none;
                  }
                  
                  .invoice-container {
                      box-shadow: none;
                      border: 1px solid #000;
                  }
                  
                  .watermark {
                      display: none;
                  }
                  
                  .invoice-header {
                      background: #1e40af !important;
                      -webkit-print-color-adjust: exact;
                      color-adjust: exact;
                  }
                  
                  .totals-section,
                  .status-section,
                  .notes-section,
                  .footer {
                      background: #f8f9fa !important;
                      -webkit-print-color-adjust: exact;
                      color-adjust: exact;
                  }
              }
          </style>
      </head>
      <body>
          <div class="invoice-container">
              <div class="watermark">NOTA</div>
              
              <div class="invoice-content">
                  <header class="invoice-header">
                      <div class="header-content">
                          <div class="company-info">
                              <h1 class="company-name">Nota Fiscal</h1>
                              <p class="company-tagline">Comprovante de Compra</p>
                          </div>
                          
                          <div class="invoice-meta">
                              <div class="invoice-number">NOTA FISCAL #${String(order.id).padStart(6, '0')}</div>
                              <div class="invoice-date">${formatDate(order.created_at)}</div>
                          </div>
                      </div>
                  </header>
                  
                  <div class="invoice-body">
                      <div class="invoice-info">
                          <div class="info-section">
                              <h3>Dados da Nota</h3>
                              <p><strong>Tipo:</strong> Nota Fiscal de Venda</p>
                              <p><strong>Natureza:</strong> Venda de Mercadorias</p>
                              <p><strong>Regime:</strong> Normal</p>
                              <p><strong>Modalidade:</strong> Presencial/Online</p>
                              <p><strong>Sistema:</strong> Automatizado</p>
                          </div>
                          
                          <div class="info-section">
                              <h3>Dados do Cliente</h3>
                              <p><strong>Nome:</strong> ${order.customer_name || 'Cliente não informado'}</p>
                              ${order.customer_phone ? `<p><strong>Telefone:</strong> ${order.customer_phone}</p>` : ''}
                              ${order.customer_email ? `<p><strong>Email:</strong> ${order.customer_email}</p>` : ''}
                              ${order.customer_address ? `<p><strong>Endereço:</strong> ${order.customer_address}</p>` : ''}
                              ${order.customer_cep ? `<p><strong>CEP:</strong> ${order.customer_cep}</p>` : ''}
                              <p><strong>Documento:</strong> CPF/CNPJ não informado</p>
                          </div>
                          
                          <div class="info-section">
                              <h3>Dados do Pedido</h3>
                              <p><strong>Número:</strong> #${String(order.id).padStart(6, '0')}</p>
                              <p><strong>Data Emissão:</strong> ${formatDate(order.created_at)}</p>
                              <p><strong>Data Atualização:</strong> ${formatDate(order.updated_at)}</p>
                              <p><strong>Itens:</strong> ${order.items.length} produto${order.items.length !== 1 ? 's' : ''}</p>
                              <p><strong>Pagamento:</strong> PIX</p>
                          </div>
                      </div>
                      
                      <div class="section-divider"></div>
                      
                      <div class="items-section">
                          <h3>📦 Produtos e Serviços</h3>
                          <table class="items-table">
                              <thead>
                                  <tr>
                                      <th>Descrição do Produto</th>
                                      <th class="text-center">Qtd</th>
                                      <th class="text-right">Valor Unitário</th>
                                      <th class="text-right">Valor Total</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  ${order.items.map(item => `
                                      <tr>
                                          <td class="product-name">${item.product.name}</td>
                                          <td class="text-center">
                                              <span class="quantity-badge">${item.quantity}x</span>
                                          </td>
                                          <td class="text-right price-cell">${formatPrice(item.product.price)}</td>
                                          <td class="text-right price-cell">${formatPrice(item.product.price * item.quantity)}</td>
                                      </tr>
                                  `).join('')}
                              </tbody>
                          </table>
                      </div>
                      
                      <div class="totals-section">
                          <h4 class="totals-title">💰 Resumo Financeiro</h4>
                          <div class="totals-row">
                              <span>Subtotal dos Produtos:</span>
                              <span>${formatPrice(subtotal)}</span>
                          </div>
                          ${discount > 0 ? `
                              <div class="totals-row discount">
                                  <span>🎟️ Desconto Aplicado${order.coupon_code ? ` (Cupom: ${order.coupon_code.toUpperCase()})` : ''}:</span>
                                  <span>- ${formatPrice(discount)}</span>
                              </div>
                              <div class="totals-row" style="color: #059669; font-weight: 600;">
                                  <span>💚 Cliente Economizou:</span>
                                  <span>${formatPrice(discount)}</span>
                              </div>
                          ` : ''}
                          <div class="totals-row">
                              <span>📦 Taxa de Entrega:</span>
                              <span style="color: #059669; font-weight: 600;">Grátis</span>
                          </div>
                          <div class="totals-row final">
                              <span>💵 VALOR TOTAL PAGO:</span>
                              <span>${formatPrice(finalAmount)}</span>
                          </div>
                          ${discount > 0 ? `
                              <div style="margin-top: 15px; padding: 15px; background: linear-gradient(135deg, #d1fae5, #a7f3d0); border-radius: 8px; border: 2px solid #10b981;">
                                  <div style="text-align: center; color: #065f46;">
                                      <div style="font-size: 1.1em; font-weight: 700; margin-bottom: 5px;">🎉 CUPOM APLICADO COM SUCESSO!</div>
                                      <div style="font-size: 0.9em;">Desconto de ${formatPrice(discount)} foi aplicado ao pedido</div>
                                      <div style="font-size: 0.8em; margin-top: 5px; opacity: 0.8;">Código: ${order.coupon_code?.toUpperCase()}</div>
                                  </div>
                              </div>
                          ` : ''}
                      </div>
                      
                      <div class="status-section">
                          <h4 class="status-title">Status do Pedido</h4>
                          <span class="status-badge ${order.status === 'confirmed' ? 'status-confirmed' : order.status === 'pending' ? 'status-pending' : 'status-awaiting'}">
                              ${getStatusText(order.status, !!(order.qr_code_url || order.pix_copy_paste)).replace(/[⏳💰✅]/g, '')}
                          </span>
                          <p style="margin-top: 15px; font-size: 0.95em;">
                              <strong>Última atualização:</strong> ${formatDate(order.updated_at)}
                          </p>
                          <p style="margin-top: 5px; font-size: 0.9em; color: #6b7280;">
                              Status atualizado automaticamente conforme progresso do pedido
                          </p>
                      </div>
                      
                      
                      
                      <div class="section-divider"></div>
                  </div>
                  
                  <footer class="footer">
                      <p style="margin-top: 15px; font-size: 0.85em; color: #9ca3af;">
                          Documento gerado automaticamente pelo sistema
                      </p>
                  </footer>
              </div>
          </div>
          
          <button class="print-button" onclick="window.print()">🖨️ Imprimir Nota</button>
          
          <script>
              // Auto focus and print option
              window.addEventListener('load', function() {
                  // Optional: auto-print when page loads
                  // window.print();
              });
          </script>
      </body>
      </html>
    `;

    invoiceWindow.document.write(invoiceHTML);
    invoiceWindow.document.close();
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

  

  const getStatusColor = (status: string, hasPaymentMethod?: boolean) => {
    if (status === 'awaiting_qr') return 'bg-amber-100 text-amber-800 border-amber-200';
    if (status === 'pending') {
      return hasPaymentMethod 
        ? 'bg-green-100 text-green-800 border-green-200 animate-pulse' 
        : 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
    if (status === 'confirmed') return 'bg-blue-100 text-blue-800 border-blue-200';
    if (status === 'preparing') return 'bg-orange-100 text-orange-800 border-orange-200';
    if (status === 'delivering') return 'bg-purple-100 text-purple-800 border-purple-200';
    if (status === 'delivered') return 'bg-green-100 text-green-800 border-green-200';
    if (status === 'cancelled') return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'awaiting_qr') return <Clock className="w-4 h-4" />;
    if (status === 'pending') return <Clock className="w-4 h-4" />;
    if (status === 'confirmed') return <CheckCircle className="w-4 h-4" />;
    if (status === 'preparing') return <Package className="w-4 h-4" />;
    if (status === 'delivering') return <Truck className="w-4 h-4" />;
    if (status === 'delivered') return <CheckCircle className="w-4 h-4" />;
    if (status === 'cancelled') return <X className="w-4 h-4" />;
    return <AlertCircle className="w-4 h-4" />;
  };

  const getStatusText = (status: string, hasPaymentMethod?: boolean) => {
    if (status === 'awaiting_qr') return '⏳ Aguardando PIX';
    if (status === 'pending') {
      return hasPaymentMethod ? '💰 Aguardando Aprovação' : 'Pendente';
    }
    if (status === 'confirmed') return 'Pagamento Aprovado ✅';
    if (status === 'preparing') return 'Preparando';
    if (status === 'delivering') return 'Entregando';
    if (status === 'delivered') return 'Entregue';
    if (status === 'cancelled') return 'Cancelado';
    return status;
  };

  

  // Separate orders by status for organized sections
  const awaitingOrders = orders.filter(order => order.status === 'awaiting_qr');
  const pendingOrders = orders.filter(order => order.status === 'pending' && (order.qr_code_url || order.pix_copy_paste));
  const progressOrders = orders.filter(order => ['confirmed', 'preparing', 'delivering'].includes(order.status));
  const completedOrders = orders.filter(order => order.status === 'delivered');
  const cancelledOrders = orders.filter(order => order.status === 'cancelled');

  // Component for rendering order cards in organized sections
  const OrderCard = ({ order, variant }: { order: Order; variant: 'urgent' | 'approval' | 'progress' | 'completed' | 'cancelled' }) => {
    const getVariantStyles = () => {
      switch (variant) {
        case 'urgent':
          return 'bg-white border-2 border-amber-300 shadow-amber-100 hover:shadow-amber-200';
        case 'approval':
          return 'bg-white border-2 border-green-300 shadow-green-100 hover:shadow-green-200';
        case 'progress':
          return 'bg-white border-2 border-blue-300 shadow-blue-100 hover:shadow-blue-200';
        case 'completed':
          return 'bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-300 shadow-emerald-100 hover:shadow-emerald-200';
        case 'cancelled':
          return 'bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 shadow-red-100 hover:shadow-red-200';
        default:
          return 'bg-white border-2 border-gray-300';
      }
    };

    return (
      <div className={`rounded-xl transition-all hover:shadow-xl ${getVariantStyles()}`}>
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-gray-900">
                  Pedido #{order.id}
                </h3>
                <div className={`px-3 py-1 rounded-full border text-sm font-medium flex items-center gap-1 ${getStatusColor(order.status, !!(order.qr_code_url || order.pix_copy_paste))}`}>
                  {getStatusIcon(order.status)}
                  {getStatusText(order.status, !!(order.qr_code_url || order.pix_copy_paste))}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-gray-600">
                {order.customer_name && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span className="font-medium">{order.customer_name}</span>
                  </div>
                )}
                {order.customer_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{order.customer_phone}</span>
                  </div>
                )}
                {order.customer_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{order.customer_email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{formatDate(order.created_at)}</span>
                </div>
              </div>

              {/* IP Address display for admin */}
              {order.customer_ip && order.customer_ip !== 'unknown' && (
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  <Globe className="w-3 h-3" />
                  <span className="font-mono">IP: {order.customer_ip}</span>
                </div>
              )}

              {/* Items compactos */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">{order.items.length} itens:</span>
                  {order.discount_amount && order.discount_amount > 0 && (
                    <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">
                      🎟️ -{formatPrice(order.discount_amount)}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  {order.items.slice(0, 3).map((item, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{item.quantity}x {item.product.name}</span>
                      <span>{formatPrice(item.product.price * item.quantity)}</span>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <div className="text-center text-gray-400">
                      +{order.items.length - 3} itens...
                    </div>
                  )}
                  
                  {/* Linha de desconto se aplicado */}
                  {order.discount_amount && order.discount_amount > 0 && (
                    <>
                      <div className="border-t border-gray-300 pt-1 mt-2">
                        <div className="flex justify-between text-gray-600">
                          <span>Subtotal:</span>
                          <span className={order.discount_amount > 0 ? 'line-through' : ''}>
                            {formatPrice(order.total_amount)}
                          </span>
                        </div>
                        <div className="flex justify-between text-green-600 font-bold">
                          <span>Cupom {order.coupon_code?.toUpperCase()}:</span>
                          <span>-{formatPrice(order.discount_amount)}</span>
                        </div>
                        <div className="flex justify-between text-green-700 font-bold text-sm border-t border-green-200 pt-1">
                          <span>Total Final:</span>
                          <span>{formatPrice(order.final_amount || order.total_amount)}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-3 ml-6">
              <div className="text-right">
                {/* Exibir desconto de cupom se aplicado */}
                {order.discount_amount && order.discount_amount > 0 ? (
                  <div className="space-y-1">
                    <div className="text-sm text-gray-500 line-through">
                      {formatPrice(order.total_amount)}
                    </div>
                    <div className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs font-bold border border-green-200 flex items-center gap-1">
                      🎟️ {order.coupon_code?.toUpperCase()} 
                      <span className="text-green-600">-{formatPrice(order.discount_amount)}</span>
                    </div>
                    <div className="text-3xl font-bold text-green-600">
                      {formatPrice(order.final_amount || order.total_amount)}
                    </div>
                    <div className="text-xs text-green-600 font-medium">
                      Economizou {formatPrice(order.discount_amount)} 🎉
                    </div>
                  </div>
                ) : (
                  <div className="text-3xl font-bold text-gray-900">
                    {formatPrice(order.total_amount)}
                  </div>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                </p>
              </div>
              
              {/* Link de acompanhamento sempre visível */}
              <div className="w-full p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-center">
                  <p className="text-xs text-blue-600 font-medium mb-1">🔗 Link do Cliente</p>
                  <div className="flex items-center gap-2 text-xs text-blue-700">
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    <span className="font-mono text-xs truncate">
                      /order-tracking?id={order.id}
                    </span>
                  </div>
                  <div className="flex gap-1 mt-2">
                    <button
                      onClick={() => copyOrderLink(order.id)}
                      className="flex-1 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                      title="Copiar link completo"
                    >
                      📋 Copiar
                    </button>
                    {order.customer_phone && (
                      <button
                        onClick={() => sendOrderLinkWhatsApp(order)}
                        className="flex-1 bg-green-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-green-700 transition-colors"
                        title="Enviar via WhatsApp"
                      >
                        📱 Zap
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Link de acompanhamento sempre visível */}
              <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-xs text-blue-700">
                  <ExternalLink className="w-3 h-3" />
                  <span className="font-mono text-xs truncate">
                    {window.location.origin}/order-tracking?id={order.id}
                  </span>
                </div>
              </div>
              
              {/* Action buttons baseados no variant */}
              <div className="flex gap-2 flex-wrap">
                {variant === 'urgent' && (
                  <button
                    onClick={() => addPixPayment(order.id)}
                    disabled={addingQrCode === order.id || !pixInputs[order.id]?.trim()}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all text-sm font-bold flex items-center gap-2 shadow-md"
                  >
                    {addingQrCode === order.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <QrCode className="w-4 h-4" />
                        PIX
                      </>
                    )}
                  </button>
                )}
                
                {variant === 'approval' && (
                  <>
                    <button
                      onClick={() => updateOrderStatus(order.id, 'confirmed')}
                      disabled={updatingStatus === order.id}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all text-sm font-medium flex items-center gap-2 shadow-md"
                    >
                      {updatingStatus === order.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Aprovar
                        </>
                      )}
                    </button>
                    {(order.qr_code_url || order.pix_copy_paste) && (
                      <button
                        onClick={() => handleEditPix(order.id, order.pix_copy_paste || '')}
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-3 py-2 rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all text-sm font-medium flex items-center gap-1 shadow-md"
                        title="Editar PIX"
                      >
                        <Edit3 className="w-4 h-4" />
                        PIX
                      </button>
                    )}
                  </>
                )}
                
                {variant === 'progress' && (
                  <select
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                    disabled={updatingStatus === order.id}
                    className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="confirmed">Confirmado</option>
                    <option value="preparing">Preparando</option>
                    <option value="delivering">Entregando</option>
                    <option value="delivered">Entregue</option>
                  </select>
                )}
                
                {order.customer_phone && (
                  <button
                    onClick={() => sendOrderLinkWhatsApp(order)}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-2 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all text-sm font-medium flex items-center gap-1 shadow-md"
                    title="Enviar link via WhatsApp"
                  >
                    <Send className="w-4 h-4" />
                    Zap
                  </button>
                )}
                
                <button
                  onClick={() => generateInvoice(order)}
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-3 py-2 rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all text-sm font-medium flex items-center gap-1 shadow-md"
                  title="Gerar nota"
                >
                  <Receipt className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => copyOrderLink(order.id)}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-3 py-2 rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all text-sm font-medium flex items-center gap-1 shadow-md"
                  title="Copiar link do pedido para enviar ao cliente"
                >
                  <ExternalLink className="w-4 h-4" />
                  Link
                </button>
                
                <button
                  onClick={() => handleEditOrder(order)}
                  className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium flex items-center gap-1"
                  title="Editar pedido"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => handleDeleteOrder(order.id)}
                  className="bg-red-50 text-red-700 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium flex items-center gap-1"
                  title="Excluir pedido"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                
                {/* Banir IP - disponível para todos os variants */}
                {order.customer_ip && order.customer_ip !== 'unknown' && (
                  <button
                    onClick={() => banCustomerIp(order)}
                    className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm font-medium flex items-center gap-1 shadow-md"
                    title={`Banir IP ${order.customer_ip}`}
                  >
                    <Ban className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* PIX input para pedidos urgentes */}
          {variant === 'urgent' && (
            <div className="mt-4 pt-4 border-t border-amber-200">
              <textarea
                value={pixInputs[order.id] || ''}
                onChange={(e) => setPixInputs(prev => ({ ...prev, [order.id]: e.target.value }))}
                placeholder="Cole o PIX copia e cola aqui..."
                rows={2}
                className="w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm resize-none font-mono"
                disabled={addingQrCode === order.id}
              />
            </div>
          )}

          {/* PIX info para pedidos aprovados */}
          {variant === 'approval' && (order.qr_code_url || order.pix_copy_paste) && (
            <div className="mt-4 pt-4 border-t border-green-200">
              {editingPixOrder === order.id ? (
                <div className="space-y-3">
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <label className="block text-sm font-medium text-blue-800 mb-2">
                      Atualizar PIX Copia e Cola:
                    </label>
                    <textarea
                      value={pixInputs[order.id] || ''}
                      onChange={(e) => setPixInputs(prev => ({ ...prev, [order.id]: e.target.value }))}
                      placeholder="Cole o novo PIX copia e cola aqui..."
                      rows={3}
                      className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none font-mono"
                      disabled={addingQrCode === order.id}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updatePixPayment(order.id)}
                      disabled={addingQrCode === order.id || !pixInputs[order.id]?.trim()}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all text-sm font-medium flex items-center justify-center gap-2"
                    >
                      {addingQrCode === order.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Atualizando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Atualizar PIX
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => cancelPixEdit(order.id)}
                      className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-all text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-green-100 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-800 font-medium">✅ PIX enviado ao cliente</p>
                      <p className="text-xs text-green-600 mt-1">Cliente pode efetuar o pagamento</p>
                      {order.pix_copy_paste && (
                        <p className="text-xs text-green-700 mt-2 font-mono bg-green-50 p-2 rounded border">
                          PIX: {order.pix_copy_paste.substring(0, 50)}...
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleEditPix(order.id, order.pix_copy_paste || '')}
                      className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 transition-colors text-xs font-medium flex items-center gap-1"
                      title="Editar PIX"
                    >
                      <Edit3 className="w-3 h-3" />
                      Editar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
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
        {/* Header com estatísticas */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-blue-600" />
            Gerenciar Pedidos
          </h1>
          <div className="flex items-center gap-4">
            {hasNewAwaitingOrders && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-lg animate-pulse shadow-lg">
                  <div className="relative">
                    <Bell className="w-5 h-5" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                  </div>
                  <span className="font-bold">
                    🚨 {newOrdersCount} pedidos aguardando PIX
                  </span>
                </div>
                <button
                  onClick={playAlertSound}
                  className="bg-blue-100 text-blue-700 px-3 py-2 rounded-md hover:bg-blue-200 transition-colors text-sm font-medium flex items-center gap-1"
                  title="Reproduzir som de alerta"
                >
                  <Bell className="w-4 h-4" />
                  Som
                </button>
                <button
                  onClick={markAsSeen}
                  className="bg-gray-100 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-200 transition-colors text-sm"
                >
                  OK
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Resumo de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total de Pedidos</p>
                <p className="text-3xl font-bold">{orders.length}</p>
              </div>
              <ShoppingBag className="w-8 h-8 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium">Aguardando PIX</p>
                <p className="text-3xl font-bold">{awaitingOrders.length}</p>
              </div>
              <Timer className="w-8 h-8 text-amber-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Para Aprovar</p>
                <p className="text-3xl font-bold">{pendingOrders.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Total Vendas</p>
                <p className="text-2xl font-bold">
                  {formatPrice(orders.reduce((sum, order) => sum + (order.final_amount || order.total_amount), 0))}
                </p>
                {orders.some(order => order.discount_amount && order.discount_amount > 0) && (
                  <div className="mt-1">
                    <p className="text-xs text-purple-200">
                      💰 Descontos: -{formatPrice(orders.reduce((sum, order) => sum + (order.discount_amount || 0), 0))}
                    </p>
                  </div>
                )}
              </div>
              <Package className="w-8 h-8 text-purple-200" />
            </div>
          </div>
        </div>

        {/* Seção de PIX Rápido para pedidos aguardando */}
        {awaitingOrders.length > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-amber-900">⚡ PIX Express</h2>
                <p className="text-amber-700">Adicione PIX rapidamente para múltiplos pedidos</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {awaitingOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-lg p-4 border-2 border-amber-200 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-amber-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                        #{order.id}
                      </span>
                      <div className="text-sm">
                        <div className="font-semibold text-gray-900">
                          {order.customer_name || 'Cliente'}
                        </div>
                        <div className="text-gray-500">
                          {order.customer_phone || 'Sem telefone'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-amber-900">
                        {formatPrice(order.total_amount)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {order.items.length} itens
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <textarea
                      value={pixInputs[order.id] || ''}
                      onChange={(e) => setPixInputs(prev => ({ ...prev, [order.id]: e.target.value }))}
                      placeholder="Cole o PIX copia e cola aqui..."
                      rows={3}
                      className="w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm resize-none"
                      disabled={addingQrCode === order.id}
                    />
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => addPixPayment(order.id)}
                        disabled={addingQrCode === order.id || !pixInputs[order.id]?.trim()}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-md hover:from-amber-600 hover:to-orange-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all text-sm font-bold flex items-center justify-center gap-2 shadow-md"
                      >
                        {addingQrCode === order.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Enviando...
                          </>
                        ) : (
                          <>
                            <QrCode className="w-4 h-4" />
                            Enviar PIX
                          </>
                        )}
                      </button>
                      
                      {order.customer_ip && order.customer_ip !== 'unknown' && (
                        <button
                          onClick={() => banCustomerIp(order)}
                          className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm font-medium flex items-center gap-1 shadow-md"
                          title={`Banir IP ${order.customer_ip}`}
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Organized Order Sections */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum pedido encontrado</h3>
            <p className="text-gray-500">Os pedidos dos clientes aparecerão aqui</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Seção de Pedidos Aguardando PIX */}
            {awaitingOrders.length > 0 && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Timer className="w-6 h-6 text-white" />
                      <h2 className="text-xl font-bold text-white">
                        🚨 Pedidos Aguardando PIX ({awaitingOrders.length})
                      </h2>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                      <span className="text-white font-bold">URGENTE</span>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {awaitingOrders.map((order) => (
                    <OrderCard key={order.id} order={order} variant="urgent" />
                  ))}
                </div>
              </div>
            )}

            {/* Seção de Pedidos Para Aprovar */}
            {pendingOrders.length > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-white" />
                      <h2 className="text-xl font-bold text-white">
                        💰 Pedidos Para Aprovar ({pendingOrders.length})
                      </h2>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                      <span className="text-white font-bold">PIX RECEBIDO</span>
                    </div>
                  </div>
                  <p className="text-green-100 text-sm mt-2">
                    💡 Dica: Você pode editar o PIX antes de aprovar o pagamento se necessário
                  </p>
                </div>
                <div className="p-6 space-y-4">
                  {pendingOrders.map((order) => (
                    <OrderCard key={order.id} order={order} variant="approval" />
                  ))}
                </div>
              </div>
            )}

            {/* Seção de Pedidos em Andamento */}
            {progressOrders.length > 0 && (
              <div className="bg-white border-2 border-blue-200 rounded-xl overflow-hidden shadow-lg">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Package className="w-6 h-6 text-white" />
                      <h2 className="text-xl font-bold text-white">
                        🔄 Pedidos em Andamento ({progressOrders.length})
                      </h2>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                      <span className="text-white font-bold">EM PROCESSO</span>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {progressOrders.map((order) => (
                    <OrderCard key={order.id} order={order} variant="progress" />
                  ))}
                </div>
              </div>
            )}

            {/* Seção de Pedidos Concluídos */}
            {completedOrders.length > 0 && (
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-300 rounded-xl overflow-hidden shadow-lg">
                <div className="bg-gradient-to-r from-emerald-500 to-green-500 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-white" />
                      <h2 className="text-xl font-bold text-white">
                        ✅ Pedidos Entregues ({completedOrders.length})
                      </h2>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                      <span className="text-white font-bold">CONCLUÍDO</span>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                  {completedOrders.map((order) => (
                    <OrderCard key={order.id} order={order} variant="completed" />
                  ))}
                </div>
              </div>
            )}

            {/* Seção de Pedidos Cancelados */}
            {cancelledOrders.length > 0 && (
              <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-red-500 to-pink-500 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <X className="w-6 h-6 text-white" />
                      <h2 className="text-xl font-bold text-white">
                        ❌ Pedidos Cancelados ({cancelledOrders.length})
                      </h2>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4 max-h-64 overflow-y-auto">
                  {cancelledOrders.map((order) => (
                    <OrderCard key={order.id} order={order} variant="cancelled" />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Edit Order Modal */}
        {showEditModal && editingOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">
                    Editar Pedido #{editingOrder.id}
                  </h2>
                  {editingOrder.customer_ip && editingOrder.customer_ip !== 'unknown' && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                        <Globe className="w-4 h-4" />
                        <span className="font-mono">{editingOrder.customer_ip}</span>
                      </div>
                      <button
                        onClick={() => banCustomerIp(editingOrder)}
                        className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm font-medium flex items-center gap-2"
                        title={`Banir IP ${editingOrder.customer_ip}`}
                      >
                        <Ban className="w-4 h-4" />
                        Banir IP
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <form onSubmit={handleUpdateOrder} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome do Cliente
                    </label>
                    <input
                      type="text"
                      value={editFormData.customer_name}
                      onChange={(e) => setEditFormData({ ...editFormData, customer_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      value={editFormData.customer_phone}
                      onChange={(e) => setEditFormData({ ...editFormData, customer_phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editFormData.customer_email}
                      onChange={(e) => setEditFormData({ ...editFormData, customer_email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CEP
                    </label>
                    <input
                      type="text"
                      value={editFormData.customer_cep}
                      onChange={(e) => setEditFormData({ ...editFormData, customer_cep: e.target.value })}
                      placeholder="00000-000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Endereço
                    </label>
                    <input
                      type="text"
                      value={editFormData.customer_address}
                      onChange={(e) => setEditFormData({ ...editFormData, customer_address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Observações
                    </label>
                    <textarea
                      value={editFormData.notes}
                      onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingOrder(null);
                    }}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Atualizar Pedido
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
