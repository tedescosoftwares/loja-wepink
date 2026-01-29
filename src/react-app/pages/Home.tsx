import { useState, useEffect } from 'react';
import { TrendingUp, Zap, Grid3X3, Heart } from 'lucide-react';
import DynamicHeader from '@/react-app/components/DynamicHeader';
import Sidebar from '@/react-app/components/Sidebar';
import Banner from '@/react-app/components/Banner';
import ProductGrid from '@/react-app/components/ProductGrid';
import CategoryGrid from '@/react-app/components/CategoryGrid';
import ChatWidget from '@/react-app/components/ChatWidget';
import LocationFinder from '@/react-app/components/LocationFinder';
import FeaturedSection from "@/react-app/components/FeaturedSection";
import FeaturedBanner from "@/react-app/components/FeaturedBanner";
import FooterWepink from "@/react-app/components/FooterWepink";
import { useSessionTracking } from '@/react-app/hooks/useSessionTracking';
import { Category } from '@/shared/types';

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [initializingData, setInitializingData] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);
  // Track user session for real-time monitoring
  useSessionTracking();

  // Handle category selection with scroll to products
  const handleCategorySelect = (categoryId: number | null) => {
    setSelectedCategory(categoryId);

    if (categoryId === null) {
      setSelectedCategoryName(null);
      return;
    }

    const name = categories.find((c) => c.id === categoryId)?.name ?? 'Categoria';
    setSelectedCategoryName(name);

    setTimeout(() => {
      const productsSection = document.getElementById('products-section');
      productsSection?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest',
      });
    }, 100);
  };

  useEffect(() => {
    initializeApp();
  }, []);
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/categories');
        const d = await r.json();
        setCategories(d.categories || []);
      } catch (e) {
        console.error('Error fetching categories in Home:', e);
        setCategories([]);
      }
    })();
  }, []);

  const initializeApp = async () => {
    try {
      // Try to fetch any products first to check if data exists
      const response = await fetch('/api/products');
      const data = await response.json();

      // If no products exist, initialize sample data
      if (!data.products || data.products.length === 0) {
        setInitializingData(true);
        await fetch('/api/init-sample-data', { method: 'POST' });
        setInitializingData(false);
      }
    } catch (error) {
      console.error('Error initializing app:', error);
      setInitializingData(false);
    }
  };



  return (
    <div className="min-h-screen bg-gray-50">
       <DynamicHeader onMenuToggle={() => setSidebarOpen(true)} />
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        selectedCategory={selectedCategory}
        onCategorySelect={handleCategorySelect}
      />
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      
     
    <div className="flex min-w-0">
    <main className="flex-1 min-w-0 md:ml-0">
          {initializingData && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mx-4 mt-4">
              <div className="flex items-center">
                <Zap className="w-5 h-5 text-pink-600 mr-2" />
                <p className="text-pink-700">Inicializando loja ...</p>
              </div>
            </div>
          )}

          {/* Hero Banner */}
          <section className="mt-0 pb-6 md:mt-0 md:py-0">
            <Banner />
          </section>

          <section className="py-8 px-4 md:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <FeaturedSection title="queridinhos da wepink"  limit={10} />
            </div>
          </section>

          {/* Location Finder */}
          <section className="py-8">
  <FeaturedBanner
    productId={43} // <- ID do produto destaque
    tag="#destaque do mês"
    subline="lapidado para impactar!"
    buttonText="eu quero!"
  />
</section>

          {/* Categories 
          <section className="py-8 px-4 md:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-2 mb-6">
                <Heart className="w-6 h-6 text-pink-600" />
                <h2 className="text-2xl font-bold text-gray-900">Categorias</h2>
              </div>

              <CategoryGrid
                onCategorySelect={handleCategorySelect}
                selectedCategory={selectedCategory}
              />
            </div>
          </section>
*/}
          {/* All Products */}

          <section
            id="products-section" className="py-8 px-4 md:px-6 lg:px-8 scroll-mt-[160px] md:scroll-mt-[170px]">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Heart className="w-6 h-6 text-pink-600" />
                  <h2 className="text-4xl font-bold text-[#ff0080]">
                    {selectedCategory
                      ? `${selectedCategoryName ?? 'Categoria'}`
                      : 'todos os produtos'}
                  </h2>
                </div>

                {selectedCategory && (
                  <button
                    onClick={() => handleCategorySelect(null)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Limpar Filtro
                  </button>
                )}
              </div>

              <ProductGrid categoryId={selectedCategory || undefined} />
            </div>
          </section>

          {/* Features */}
          <FooterWepink />
        </main>
      </div>

      <ChatWidget />
    </div>
    </div>
  );
}
