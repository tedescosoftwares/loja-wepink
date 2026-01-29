import { useState, useEffect } from 'react';
import { Category } from '@/shared/types';

interface CategoryGridProps {
  onCategorySelect: (categoryId: number | null) => void;
  selectedCategory: number | null;
}

export default function CategoryGrid({ onCategorySelect, selectedCategory }: CategoryGridProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 md:gap-3">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-100 p-1 md:p-2 animate-pulse">
            <div className="aspect-[4/5] bg-gradient-to-br from-gray-200 to-gray-300 rounded-md mb-1 md:mb-2" />
            <div className="h-2 md:h-3 bg-gray-200 rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 md:gap-3">
      {/* Categoria "Todos" */}
      <button
        onClick={() => onCategorySelect(null)}
        className={`bg-white rounded-lg shadow-sm border transition-all duration-200 p-1 md:p-2 text-center hover:shadow-md hover:scale-[1.02] ${
          selectedCategory === null
            ? 'border-blue-500 ring-1 ring-blue-200 bg-blue-50'
            : 'border-gray-100 hover:border-gray-200'
        }`}
        title="Ver todos os produtos"
      >
        <div className="aspect-[4/5] bg-gradient-to-br from-blue-400 to-purple-500 rounded-md mb-1 md:mb-2 flex items-center justify-center">
          <svg className="w-3 h-3 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className={`font-medium text-xs leading-tight ${
          selectedCategory === null ? 'text-blue-700' : 'text-gray-700'
        }`}>
          Todos
        </h3>
      </button>

      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategorySelect(category.id)}
          className={`bg-white rounded-lg shadow-sm border transition-all duration-200 p-1 md:p-2 text-center hover:shadow-md hover:scale-[1.02] ${
            selectedCategory === category.id
              ? 'border-blue-500 ring-1 ring-blue-200 bg-blue-50'
              : 'border-gray-100 hover:border-gray-200'
          }`}
          title={`Ver produtos de ${category.name}`}
        >
          <div className="aspect-[4/5] rounded-md mb-1 md:mb-2 overflow-hidden bg-gray-100">
            {category.image_url ? (
              <img
                src={category.image_url}
                alt={category.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                <svg className="w-3 h-3 md:w-5 md:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            )}
          </div>
          <h3 className={`font-medium text-xs line-clamp-2 leading-tight ${
            selectedCategory === category.id ? 'text-blue-700' : 'text-gray-700'
          }`}>
            {category.name}
          </h3>
        </button>
      ))}
    </div>
  );
}
