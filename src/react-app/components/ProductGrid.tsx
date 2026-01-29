import { useEffect, useState } from 'react';
import ProductCard from './ProductCard';
import { Package } from 'lucide-react';
import { Product } from '@/shared/types';

interface ProductGridProps {
  categoryId?: number;
  featured?: boolean;
  title?: string;
  searchTerm?: string;
}

export default function ProductGrid({ categoryId, featured, title, searchTerm }: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, [categoryId, featured, searchTerm]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let url = "/api/products";
      const params = new URLSearchParams();
      
      if (categoryId) {
        params.append("category", categoryId.toString());
      }
      
      if (featured) {
        params.append("featured", "true");
      }
      
      if (params.toString()) {
        url += "?" + params.toString();
      }
      
      console.log('🟡 PRODUCT GRID: Fetching products from:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('🟢 PRODUCT GRID: Received products:', data.products?.length || 0);
      
      let filteredProducts = data.products || [];
      
      // Apply search filter if provided
      if (searchTerm && searchTerm.trim()) {
        const search = searchTerm.toLowerCase().trim();
        filteredProducts = filteredProducts.filter((product: Product) => 
          product.name.toLowerCase().includes(search) ||
          (product.description && product.description.toLowerCase().includes(search))
        );
        console.log('🟡 PRODUCT GRID: Filtered by search term:', filteredProducts.length);
      }
      
      // Debug image URLs
      filteredProducts.forEach((product: Product, index: number) => {
        if (product.image_url) {
          console.log(`🖼️ PRODUCT GRID: Product ${index + 1} "${product.name}" image:`, product.image_url);
        } else {
          console.log(`⚠️ PRODUCT GRID: Product ${index + 1} "${product.name}" has no image`);
        }
      });
      
      setProducts(filteredProducts);
    } catch (error) {
      console.error("🔴 PRODUCT GRID: Error fetching products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {title && <h2 className="text-2xl font-bold text-gray-900">{title}</h2>}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-4 md:gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-gray-200"></div>
              <div className="p-5 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-full"></div>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="space-y-6">
        {title && <h2 className="text-2xl font-bold text-gray-900">{title}</h2>}
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto disponível'}
          </h3>
          <p className="text-gray-500">
            {searchTerm 
              ? `Não encontramos produtos para "${searchTerm}". Tente outros termos de busca.`
              : 'Não há produtos disponíveis no momento.'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {title && (
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <span className="text-sm text-gray-500">
            {products.length} produto{products.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-2 sm:gap-2 md:gap-2">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
