import { ShoppingCart, Menu, Search } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '@/react-app/hooks/useCart';
import Cart from './Cart';

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const [showCart, setShowCart] = useState(false);
  const { getTotalItems } = useCart();

  return (
    <>
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Menu */}
            <div className="flex items-center">
              <button
                onClick={onMenuToggle}
                className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="flex-shrink-0 ml-2 md:ml-0">
              <div className="flex items-center gap-2">
          <img
            src="https://wepink.vtexassets.com/assets/vtex/assets-builder/wepink.store-theme/4.0.4/svg/logo-primary___ef05671065928b5b01f33e72323ba3b8.svg"
            alt={"Logo"}
            className="h-7 md:h-9 w-auto max-w-[180px] object-contain"
          />
          <h1 className="text-2xl font-bold text-pink-600">
            { ""}
          </h1>
        </div>
              </div>
            </div>

            {/* Search Bar */}
        
            
            {/* Actions */}
            <div className="flex items-center gap-2">
            <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQKeNB7XFnOHKf5jyQ1DU9amoWw_auRHh6_vA&s"
            alt={"Logo"}
            className="h-7 md:h-9 w-auto max-w-[180px] object-contain"
          />
             Ambiente Seguro
            </div>
          </div>
        </div>
      </header>

      <Cart isOpen={showCart} onClose={() => setShowCart(false)} />
    </>
  );
}
