import { useState, useEffect, useCallback, useRef } from 'react';

interface Order {
  id: number;
  status: string;
  created_at: string;
  customer_name?: string;
  customer_phone?: string;
  total_amount: number;
}

interface UseOrderAlertsReturn {
  newOrdersCount: number;
  hasNewAwaitingOrders: boolean;
  playAlertSound: () => void;
  markAsSeen: () => void;
}

// Generate alert sound using Web Audio API
const createAlertSound = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  return () => {
    // Create oscillator for a pleasant notification sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Sound parameters for a pleasant alert tone
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };
};

export function useOrderAlerts(): UseOrderAlertsReturn {
  const [orders, setOrders] = useState<Order[]>([]);
  const [lastCheckTime, setLastCheckTime] = useState<Date>(new Date());
  const [seenOrderIds, setSeenOrderIds] = useState<Set<number>>(new Set());
  const playAlertSoundRef = useRef<(() => void) | null>(null);

  // Initialize alert sound
  useEffect(() => {
    try {
      playAlertSoundRef.current = createAlertSound();
    } catch (error) {
      console.warn('Could not create alert sound:', error);
      // Fallback to browser beep
      playAlertSoundRef.current = () => {
        try {
          // Try to play a simple beep sound
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaOZnZ8sF8JwUtfMzz2YIyBSGH0Oy6ajokbLzw7Z5NGhgQ');
          audio.volume = 0.3;
          audio.play().catch(() => {
            // If audio play fails, just continue silently
          });
        } catch (e) {
          // Fallback to console beep if nothing else works
          console.log('🔔 New order alert!');
        }
      };
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      console.log('🟢 ORDER ALERTS: Fetching orders...');
      const response = await fetch('/api/admin/orders');
      
      if (!response.ok) {
        console.error('🔴 ORDER ALERTS: Response not ok:', response.status);
        return;
      }
      
      const data = await response.json();
      console.log('🟢 ORDER ALERTS: Orders response:', data);
      
      if (data.orders && Array.isArray(data.orders)) {
        const currentOrders = data.orders as Order[];
        
        // Check for new orders with 'awaiting_qr' status
        const awaitingOrders = currentOrders.filter(order => order.status === 'awaiting_qr');
        const newAwaitingOrders = awaitingOrders.filter(order => 
          new Date(order.created_at) > lastCheckTime && !seenOrderIds.has(order.id)
        );
        
        console.log('🟢 ORDER ALERTS: Total orders:', currentOrders.length);
        console.log('🟢 ORDER ALERTS: Awaiting orders:', awaitingOrders.length);
        console.log('🟢 ORDER ALERTS: New awaiting orders:', newAwaitingOrders.length);
        
        // Play sound and show notification if there are new awaiting orders
        if (newAwaitingOrders.length > 0) {
          if (playAlertSoundRef.current) {
            playAlertSoundRef.current();
          }
          
          console.log(`🔔 ORDER ALERTS: New order alert! ${newAwaitingOrders.length} orders awaiting QR code`);
          
          // Show browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('🚨 Novos Pedidos PIX!', {
              body: `${newAwaitingOrders.length} ${newAwaitingOrders.length === 1 ? 'pedido aguarda' : 'pedidos aguardam'} seu PIX`,
              icon: '/favicon.ico',
              requireInteraction: true
            });
          }
        }
        
        setOrders(currentOrders);
      } else {
        console.log('🔴 ORDER ALERTS: No orders array in response');
      }
    } catch (error) {
      console.error('🔴 ORDER ALERTS: Error fetching orders:', error);
    }
  }, [lastCheckTime, seenOrderIds]);

  // Poll for new orders every 10 seconds
  useEffect(() => {
    const interval = setInterval(fetchOrders, 10000);
    
    // Initial fetch
    fetchOrders();
    
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const awaitingOrders = orders.filter(order => order.status === 'awaiting_qr');
  const newAwaitingOrders = awaitingOrders.filter(order => !seenOrderIds.has(order.id));

  const playAlertSound = useCallback(() => {
    if (playAlertSoundRef.current) {
      playAlertSoundRef.current();
    }
  }, []);

  const markAsSeen = useCallback(() => {
    const newSeenIds = new Set(seenOrderIds);
    awaitingOrders.forEach(order => newSeenIds.add(order.id));
    setSeenOrderIds(newSeenIds);
    setLastCheckTime(new Date());
  }, [awaitingOrders, seenOrderIds]);

  return {
    newOrdersCount: awaitingOrders.length,
    hasNewAwaitingOrders: newAwaitingOrders.length > 0,
    playAlertSound,
    markAsSeen,
  };
}
