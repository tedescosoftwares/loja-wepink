import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, Product } from '@/shared/types';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getMinimumOrder: () => number;
  getRemainingForMinimum: () => number;
  isMinimumOrderMet: () => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'ambev-cart-items';
const MINIMUM_ORDER_VALUE = 200; // Default R$ 200 pedido mínimo

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [minimumOrderValue, setMinimumOrderValue] = useState(MINIMUM_ORDER_VALUE);

  // Load cart from localStorage and fetch minimum order value on mount
  useEffect(() => {
    const loadCartAndSettings = async () => {
      try {
        // Load cart from localStorage
        const savedCart = localStorage.getItem(CART_STORAGE_KEY);
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          setItems(parsedCart);
        }

        // Fetch minimum order value from settings
        try {
          const response = await fetch('/api/settings');
          const data = await response.json();
          const minimumSetting = data.settings?.find((s: any) => s.setting_key === 'minimum_order_value');
          if (minimumSetting && minimumSetting.setting_value) {
            const newMinimum = parseFloat(minimumSetting.setting_value);
            if (!isNaN(newMinimum) && newMinimum > 0) {
              setMinimumOrderValue(newMinimum);
              console.log('📊 CART: Updated minimum order value to R$', newMinimum);
            }
          }
        } catch (settingsError) {
          console.log('📊 CART: Using default minimum order value:', MINIMUM_ORDER_VALUE);
        }
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadCartAndSettings();
  }, []);

  // Save cart to localStorage whenever items change (but only after initial load)
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      } catch (error) {
        console.error('Error saving cart to localStorage:', error);
      }
    }
  }, [items, isLoaded]);

  const addToCart = (product: Product, quantity = 1) => {
    // Track cart addition for analytics
    trackCartAddition(product, quantity);
    
    setItems(prev => {
      const existingItem = prev.find(item => item.product.id === product.id);
      
      if (existingItem) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      
      return [...prev, { product, quantity }];
    });
  };

  const trackCartAddition = async (product: Product, quantity: number) => {
    try {
      // Generate or get session ID
      let sessionId = localStorage.getItem('user-session-id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('user-session-id', sessionId);
      }

      const response = await fetch('/api/cart-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          product_id: product.id,
          product_name: product.name,
          product_price: product.price,
          quantity_added: quantity,
          user_agent: navigator.userAgent
        })
      });

      // Check for triggered discounts
      const data = await response.json();
      if (data.triggered_discounts && data.triggered_discounts.length > 0) {
        console.log(`🎯 DYNAMIC DISCOUNTS TRIGGERED:`, data.triggered_discounts);
        // You could emit an event here or show a notification
      }

      console.log(`📊 CART TRACKING: Product ${product.name} added to cart (qty: ${quantity})`);
    } catch (error) {
      console.error('Error tracking cart addition:', error);
      // Don't break the cart functionality if tracking fails
    }
  };

  const removeFromCart = (productId: number) => {
    setItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setItems(prev =>
      prev.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing cart from localStorage:', error);
    }
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + item.product.price * item.quantity, 0);
  };

  const getMinimumOrder = () => {
    return minimumOrderValue;
  };

  const getRemainingForMinimum = () => {
    const currentTotal = getTotalPrice();
    const remaining = minimumOrderValue - currentTotal;
    return Math.max(0, remaining);
  };

  const isMinimumOrderMet = () => {
    return getTotalPrice() >= minimumOrderValue;
  };

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotalItems,
      getTotalPrice,
      getMinimumOrder,
      getRemainingForMinimum,
      isMinimumOrderMet,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
