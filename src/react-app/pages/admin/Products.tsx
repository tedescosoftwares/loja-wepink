import { useState, useEffect } from "react";
import AdminLayout from "@/react-app/components/AdminLayout";
import { Plus, Edit3, Trash2, Package, Eye, EyeOff, Star, StarOff, Search, Upload, X, Folder, List, Save, Grid } from "lucide-react";
import ImageUploadManager from "@/react-app/components/ImageUploadManager";

interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  original_price?: number;
  image_url?: string;
  category_id?: number;
  is_featured: boolean;
  is_active: boolean;
  stock_quantity: number;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: number;
  name: string;
}

interface ProductItem {
  id: string;
  name: string;
  description: string;
  price: string;
  original_price: string;
  image_url: string;
  category_id: string;
  is_featured: boolean;
  stock_quantity: string;
  is_active: boolean;
  imagePreview?: string;
  imageUploading?: boolean;
  dragOver?: boolean;
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'bulk'>('table');
  const [bulkSaving, setBulkSaving] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    original_price: "",
    image_url: "",
    category_id: "",
    is_featured: false,
    stock_quantity: "",
    is_active: true
  });

  // Bulk add state
  const [productList, setProductList] = useState<ProductItem[]>([
    { id: '1', name: '', description: '', price: '', original_price: '', image_url: '', category_id: '', is_featured: false, stock_quantity: '', is_active: true, imagePreview: '', imageUploading: false, dragOver: false }
  ]);

  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file' | 'gallery'>('url');
  const [showImageManager, setShowImageManager] = useState(false);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Arquivo muito grande! Máximo 5MB.');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem.');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        setFormData({ ...formData, image_url: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview("");
    setFormData({ ...formData, image_url: "" });
    // Reset file input
    const fileInput = document.getElementById('product-image-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/admin/products");
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/admin/categories");
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingProduct 
        ? `/api/admin/products/${editingProduct.id}`
        : "/api/admin/products";
      
      const method = editingProduct ? "PUT" : "POST";
      
      // Auto-assign filtered category if no category is selected and we have a category filter
      const categoryId = formData.category_id ? 
        parseInt(formData.category_id) : 
        (selectedCategoryFilter || null);
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          original_price: formData.original_price ? parseFloat(formData.original_price) : null,
          stock_quantity: parseInt(formData.stock_quantity) || 0,
          category_id: categoryId,
        }),
      });

      if (response.ok) {
        fetchProducts();
        resetForm();
        setShowModal(false);
      }
    } catch (error) {
      console.error("Error saving product:", error);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      original_price: product.original_price?.toString() || "",
      image_url: product.image_url || "",
      category_id: product.category_id?.toString() || "",
      is_featured: product.is_featured,
      stock_quantity: product.stock_quantity.toString(),
      is_active: product.is_active
    });
    
    // Set preview for existing image
    if (product.image_url) {
      setImagePreview(product.image_url);
      // Determine upload method based on URL format
      if (product.image_url.startsWith('data:')) {
        setUploadMethod('file');
      } else {
        setUploadMethod('url');
      }
    } else {
      setImagePreview("");
      setUploadMethod('url');
    }
    
    setShowModal(true);
  };

  const handleDelete = async (productId: number) => {
    if (!confirm("Tem certeza que deseja remover este produto?")) return;
    
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const data = await response.json();
        console.log(data.message);
        fetchProducts();
      } else {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        alert("Erro ao remover produto: " + (errorData.error || "Erro desconhecido"));
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Erro ao remover produto. Tente novamente.");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      original_price: "",
      image_url: "",
      category_id: selectedCategoryFilter ? selectedCategoryFilter.toString() : "",
      is_featured: false,
      stock_quantity: "",
      is_active: true
    });
    setEditingProduct(null);
    setImagePreview("");
    setUploadMethod('url');
    setShowImageManager(false);
    // Reset file input
    const fileInput = document.getElementById('product-image-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  // Bulk operations
  const addProductRow = () => {
    const newId = Date.now().toString();
    setProductList([...productList, { 
      id: newId, 
      name: '', 
      description: '', 
      price: '', 
      original_price: '', 
      image_url: '', 
      category_id: selectedCategoryFilter ? selectedCategoryFilter.toString() : '', 
      is_featured: false, 
      stock_quantity: '', 
      is_active: true,
      imagePreview: '',
      imageUploading: false,
      dragOver: false
    }]);
  };

  const removeProductRow = (id: string) => {
    if (productList.length > 1) {
      setProductList(productList.filter(prod => prod.id !== id));
    }
  };

  const updateProductItem = (id: string, field: keyof ProductItem, value: any) => {
    setProductList(productList.map(prod => 
      prod.id === id ? { ...prod, [field]: value } : prod
    ));
  };

  // Bulk image upload functions
  const handleBulkImageUpload = async (productId: string, file: File) => {
    console.log('🟡 BULK UPLOAD: Starting upload for product', productId, 'file:', file.name, 'size:', file.size, 'type:', file.type);
    
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Arquivo muito grande! Máximo 5MB.');
      return;
    }

    // Set uploading state
    updateProductItem(productId, 'imageUploading', true);
    console.log('🟡 BULK UPLOAD: Set uploading state for product', productId);

    try {
      const formData = new FormData();
      formData.append('image', file);

      console.log('🟡 BULK UPLOAD: Sending request to /api/admin/upload-image');
      
      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log('🟡 BULK UPLOAD: Server response:', data);
      
      if (response.ok && data.success) {
        console.log('🟢 BULK UPLOAD: Upload successful, image URL:', data.image.url);
        // Update product with uploaded image URL and preview
        updateProductItem(productId, 'image_url', data.image.url);
        updateProductItem(productId, 'imagePreview', data.image.url);
        console.log('🟢 BULK UPLOAD: Updated product item with image URL');
      } else {
        console.error('🔴 BULK UPLOAD: Server error:', data.error);
        alert(data.error || 'Erro ao fazer upload da imagem');
      }
    } catch (error) {
      console.error('🔴 BULK UPLOAD: Network error:', error);
      alert('Erro ao fazer upload da imagem: ' + (error as Error).message);
    } finally {
      updateProductItem(productId, 'imageUploading', false);
      console.log('🟡 BULK UPLOAD: Finished upload process for product', productId);
    }
  };

  const handleBulkImageDrop = (productId: string, e: React.DragEvent) => {
    e.preventDefault();
    console.log('🟡 DRAG DROP: Drop event for product', productId);
    updateProductItem(productId, 'dragOver', false);
    
    const files = Array.from(e.dataTransfer.files);
    console.log('🟡 DRAG DROP: Files dropped:', files.length, files.map(f => f.name));
    
    if (files.length > 0) {
      const file = files[0];
      console.log('🟡 DRAG DROP: Processing first file:', file.name, 'type:', file.type, 'size:', file.size);
      handleBulkImageUpload(productId, file);
    } else {
      console.log('🔴 DRAG DROP: No files in drop event');
    }
  };

  const handleBulkImageDragOver = (productId: string, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🟡 DRAG DROP: Drag over for product', productId);
    updateProductItem(productId, 'dragOver', true);
  };

  const handleBulkImageDragLeave = (productId: string, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🟡 DRAG DROP: Drag leave for product', productId);
    
    // Only set dragOver to false if we're actually leaving the drop zone
    // Check if the related target is still within the drop zone
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      updateProductItem(productId, 'dragOver', false);
    }
  };

  const handleBulkImageFileSelect = (productId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🟡 FILE SELECT: File input changed for product', productId);
    const files = Array.from(e.target.files || []);
    console.log('🟡 FILE SELECT: Files selected:', files.length, files.map(f => f.name));
    
    if (files.length > 0) {
      const file = files[0];
      console.log('🟡 FILE SELECT: Processing file:', file.name, 'type:', file.type, 'size:', file.size);
      handleBulkImageUpload(productId, file);
    }
  };

  const removeBulkImage = (productId: string) => {
    updateProductItem(productId, 'image_url', '');
    updateProductItem(productId, 'imagePreview', '');
    // Reset file input
    const fileInput = document.getElementById(`bulk-image-upload-${productId}`) as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const saveBulkProducts = async () => {
    setBulkSaving(true);
    
    try {
      let successCount = 0;
      const errors: string[] = [];

      for (const product of productList) {
        if (!product.name.trim() || !product.price.trim()) {
          errors.push(`Produto ${productList.indexOf(product) + 1}: Nome e preço são obrigatórios`);
          continue;
        }

        try {
          // Auto-assign filtered category if no category is selected
          const categoryId = product.category_id ? 
            parseInt(product.category_id) : 
            selectedCategoryFilter;

          // Validate and clean up image URL
          let imageUrl = product.image_url.trim();
          if (imageUrl) {
            // Ensure external URLs have proper protocol
            if (!imageUrl.startsWith('http') && !imageUrl.startsWith('/') && !imageUrl.startsWith('data:')) {
              imageUrl = 'https://' + imageUrl;
            }
            
            // Validate URL format for external URLs
            if (imageUrl.startsWith('http')) {
              try {
                new URL(imageUrl);
                console.log('🟢 BULK SAVE: Valid image URL:', imageUrl);
              } catch (e) {
                console.error('🔴 BULK SAVE: Invalid image URL:', imageUrl, e);
                errors.push(`Produto "${product.name}": URL da imagem inválida`);
                continue;
              }
            }
          } else {
            imageUrl = '';
          }

          console.log('🟡 BULK SAVE: Saving product with image URL:', imageUrl);

          const response = await fetch("/api/admin/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: product.name.trim(),
              description: product.description.trim() || null,
              price: parseFloat(product.price),
              original_price: product.original_price ? parseFloat(product.original_price) : null,
              image_url: imageUrl || null,
              category_id: categoryId,
              is_featured: product.is_featured,
              stock_quantity: parseInt(product.stock_quantity) || 0,
              is_active: product.is_active
            }),
          });

          if (response.ok) {
            successCount++;
          } else {
            const error = await response.json();
            errors.push(`Produto "${product.name}": ${error.error || 'Erro desconhecido'}`);
          }
        } catch (err) {
          errors.push(`Produto "${product.name}": Erro de conexão`);
        }
      }

      if (successCount > 0) {
        // Reset form with one empty product
        setProductList([{ id: '1', name: '', description: '', price: '', original_price: '', image_url: '', category_id: selectedCategoryFilter ? selectedCategoryFilter.toString() : '', is_featured: false, stock_quantity: '', is_active: true, imagePreview: '', imageUploading: false, dragOver: false }]);
        fetchProducts();
        alert(`${successCount} produto(s) adicionado(s) com sucesso!${errors.length > 0 ? ` ${errors.length} erro(s) encontrado(s).` : ''}`);
      }

      if (errors.length > 0) {
        console.error("Errors during bulk save:", errors);
      }
    } catch (error) {
      console.error("Error saving bulk products:", error);
      alert("Erro geral na importação");
    } finally {
      setBulkSaving(false);
    }
  };

  const cleanDuplicates = async () => {
    if (!confirm("Deseja remover todas as categorias e produtos duplicados? Esta ação não pode ser desfeita.")) return;
    
    try {
      setLoading(true);
      const response = await fetch("/api/admin/clean-duplicates", {
        method: "DELETE",
      });

      const data = await response.json();
      
      if (response.ok) {
        alert(data.message);
        fetchProducts();
      } else {
        alert("Erro ao limpar duplicatas: " + (data.error || "Erro desconhecido"));
      }
    } catch (error) {
      console.error("Error cleaning duplicates:", error);
      alert("Erro ao limpar duplicatas");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getCategoryName = (categoryId?: number) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Sem categoria';
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategoryFilter === null || 
      product.category_id === selectedCategoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
                <div className="h-40 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
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
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
            {selectedCategoryFilter && (
              <p className="text-sm text-blue-600 mt-1">
                Filtrado por: <strong>{getCategoryName(selectedCategoryFilter)}</strong>
                <button
                  onClick={() => setSelectedCategoryFilter(null)}
                  className="ml-2 text-red-600 hover:text-red-800 underline"
                >
                  Limpar Filtro
                </button>
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Cleanup Buttons */}
            <button
              onClick={cleanDuplicates}
              className="bg-orange-600 text-white px-3 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2 text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Limpar Duplicatas
            </button>
            
            {/* View Mode Toggle */}
            <div className="flex border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 text-sm font-medium rounded-l-lg transition-colors ${
                  viewMode === 'table'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <List className="w-4 h-4 inline mr-1" />
                Lista Compacta
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Grid className="w-4 h-4 inline mr-1" />
                Cards Grandes
              </button>
              <button
                onClick={() => setViewMode('bulk')}
                className={`px-3 py-2 text-sm font-medium rounded-r-lg transition-colors ${
                  viewMode === 'bulk'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Upload className="w-4 h-4 inline mr-1" />
                Adicionar Lista
              </button>
            </div>
            
            {(viewMode === 'grid' || viewMode === 'table') && (
              <button
                onClick={() => setShowModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Adicionar Produto
              </button>
            )}
          </div>
        </div>

        {viewMode === 'table' && (
          <>
            {/* Search and Category Filter */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="w-64">
                <select
                  value={selectedCategoryFilter || ''}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">🏷️ Todas as Categorias</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      📂 {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || selectedCategoryFilter ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm || selectedCategoryFilter ? 
                    'Tente buscar com outros termos ou mudar o filtro de categoria' : 
                    'Adicione produtos para gerenciar sua loja'
                  }
                </p>
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-5 h-5" />
                  Adicionar Produto
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                          Imagem
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nome do Produto
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                          Categoria
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                          Preço
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                          Estoque
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                              {product.image_url ? (
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <div className="text-sm font-semibold text-gray-900 line-clamp-1">
                                {product.name}
                              </div>
                              {product.description && (
                                <div className="text-xs text-gray-600 line-clamp-1 mt-1">
                                  {product.description}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-700">
                              {getCategoryName(product.category_id)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm">
                              <div className="font-semibold text-blue-600">
                                {formatPrice(product.price)}
                              </div>
                              {product.original_price && product.original_price > product.price && (
                                <div className="text-xs text-gray-500 line-through">
                                  {formatPrice(product.original_price)}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-700">
                              {product.stock_quantity}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1">
                                {product.is_active ? (
                                  <Eye className="w-3 h-3 text-green-600" />
                                ) : (
                                  <EyeOff className="w-3 h-3 text-red-600" />
                                )}
                                <span className={`text-xs ${product.is_active ? 'text-green-600' : 'text-red-600'}`}>
                                  {product.is_active ? 'Ativo' : 'Inativo'}
                                </span>
                              </div>
                              {product.is_featured && (
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                  <span className="text-xs text-yellow-600">Destaque</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleEdit(product)}
                                className="bg-blue-50 text-blue-700 p-2 rounded hover:bg-blue-100 transition-colors"
                                title="Editar produto"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(product.id)}
                                className="bg-red-50 text-red-700 p-2 rounded hover:bg-red-100 transition-colors"
                                title="Remover produto"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Table Footer with Summary */}
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>
                      Mostrando {filteredProducts.length} produto(s)
                      {selectedCategoryFilter && ` em ${getCategoryName(selectedCategoryFilter)}`}
                    </span>
                    <span>
                      Total em estoque: {filteredProducts.reduce((sum, p) => sum + p.stock_quantity, 0)} unidades
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {viewMode === 'grid' && (
          <>
            {/* Search and Category Filter */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="w-64">
                <select
                  value={selectedCategoryFilter || ''}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">🏷️ Todas as Categorias</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      📂 {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || selectedCategoryFilter ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm || selectedCategoryFilter ? 
                    'Tente buscar com outros termos ou mudar o filtro de categoria' : 
                    'Adicione produtos para gerenciar sua loja'
                  }
                </p>
                {!searchTerm && !selectedCategoryFilter && (
                  <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
                  >
                    <Plus className="w-5 h-5" />
                    Adicionar Produto
                  </button>
                )}
                {selectedCategoryFilter && (
                  <button
                    onClick={() => {
                      setShowModal(true);
                      setFormData({
                        ...formData,
                        category_id: selectedCategoryFilter.toString()
                      });
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
                  >
                    <Plus className="w-5 h-5" />
                    Adicionar à {getCategoryName(selectedCategoryFilter)}
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                    {/* Product Image */}
                    <div className="aspect-square bg-gray-100 relative">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      
                      {/* Status badges */}
                      <div className="absolute top-2 left-2 flex gap-1">
                        {product.is_featured && (
                          <div className="bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            Destaque
                          </div>
                        )}
                        {!product.is_active && (
                          <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                            Inativo
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <div className="mb-2">
                        <h3 className="font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
                        <p className="text-sm text-gray-600">{getCategoryName(product.category_id)}</p>
                      </div>

                      {product.description && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-700 font-medium line-clamp-3 bg-gradient-to-r from-blue-50 to-transparent px-2 py-1.5 rounded border-l-2 border-blue-200">
                            {product.description}
                          </p>
                        </div>
                      )}

                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-lg font-bold text-blue-600">
                          {formatPrice(product.price)}
                        </span>
                        {product.original_price && product.original_price > product.price && (
                          <span className="text-sm text-gray-500 line-through">
                            {formatPrice(product.original_price)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-gray-600">
                          Estoque: {product.stock_quantity}
                        </span>
                        <div className="flex items-center gap-2">
                          {product.is_active ? (
                            <Eye className="w-4 h-4 text-green-600" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-red-600" />
                          )}
                          {product.is_featured ? (
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          ) : (
                            <StarOff className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-md hover:bg-blue-100 transition-colors text-sm font-medium flex items-center justify-center gap-1"
                        >
                          <Edit3 className="w-4 h-4" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="bg-red-50 text-red-700 p-2 rounded-md hover:bg-red-100 transition-colors flex items-center justify-center"
                          title="Remover produto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {viewMode === 'bulk' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Adicionar Múltiplos Produtos</h2>
                {selectedCategoryFilter && (
                  <p className="text-sm text-blue-600 mt-1">
                    🎯 Adicionando produtos à categoria: <strong>{getCategoryName(selectedCategoryFilter)}</strong>
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={addProductRow}
                  className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Nova Linha
                </button>
                <button
                  onClick={saveBulkProducts}
                  disabled={bulkSaving}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {bulkSaving ? 'Salvando...' : 'Salvar Todos'}
                </button>
              </div>
            </div>

            <div className="bg-white border rounded-lg overflow-x-auto">
              <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b font-medium text-sm text-gray-700 min-w-[1600px]">
                <div className="col-span-2">Nome do Produto *</div>
                <div className="col-span-2">Descrição</div>
                <div className="col-span-1">Preço *</div>
                <div className="col-span-1">Preço Original</div>
                <div className="col-span-2">Imagem do Produto</div>
                <div className="col-span-1">Categoria</div>
                <div className="col-span-1">Estoque</div>
                <div className="col-span-1">Opções</div>
                <div className="col-span-1">Ações</div>
              </div>

              {productList.map((product) => (
                <div key={product.id} className="grid grid-cols-12 gap-4 p-4 border-b last:border-b-0 min-w-[1600px]">
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={product.name}
                      onChange={(e) => updateProductItem(product.id, 'name', e.target.value)}
                      placeholder="Nome do produto"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <textarea
                      value={product.description}
                      onChange={(e) => updateProductItem(product.id, 'description', e.target.value)}
                      placeholder="Descrição do produto"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                    />
                  </div>
                  <div className="col-span-1">
                    <input
                      type="number"
                      step="0.01"
                      value={product.price}
                      onChange={(e) => updateProductItem(product.id, 'price', e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div className="col-span-1">
                    <input
                      type="number"
                      step="0.01"
                      value={product.original_price}
                      onChange={(e) => updateProductItem(product.id, 'original_price', e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    {/* Drag & Drop Image Upload Area */}
                    <div
                      className={`relative border-2 border-dashed rounded-md p-2 text-center transition-colors min-h-[80px] cursor-pointer ${
                        product.dragOver
                          ? 'border-blue-400 bg-blue-50'
                          : product.imageUploading
                          ? 'border-orange-400 bg-orange-50'
                          : product.imagePreview || product.image_url
                          ? 'border-green-400 bg-green-50'
                          : 'border-gray-300 hover:border-blue-400'
                      }`}
                      onDrop={(e) => handleBulkImageDrop(product.id, e)}
                      onDragOver={(e) => handleBulkImageDragOver(product.id, e)}
                      onDragLeave={(e) => handleBulkImageDragLeave(product.id, e)}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('🟡 DRAG DROP: Drag enter for product', product.id);
                      }}
                    >
                      {product.imageUploading ? (
                        <div className="flex flex-col items-center justify-center">
                          <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mb-2"></div>
                          <p className="text-xs text-orange-600 font-medium">Enviando...</p>
                        </div>
                      ) : product.imagePreview || product.image_url ? (
                        <div className="relative">
                          <img
                            src={product.imagePreview || product.image_url}
                            alt="Preview"
                            className="w-full h-16 object-cover rounded"
                          />
                          <button
                            type="button"
                            onClick={() => removeBulkImage(product.id)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                            title="Remover imagem"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-b">
                            Imagem carregada
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          <Upload className="w-6 h-6 text-gray-400 mb-1" />
                          <p className="text-xs text-gray-600 font-medium mb-1">
                            Arraste a imagem aqui
                          </p>
                          <label className="text-xs text-blue-600 hover:text-blue-700 cursor-pointer underline">
                            ou clique para selecionar
                            <input
                              id={`bulk-image-upload-${product.id}`}
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleBulkImageFileSelect(product.id, e)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                    </div>
                    
                    {/* URL Input as alternative */}
                    <div className="mt-1">
                      <input
                        type="url"
                        value={product.image_url}
                        onChange={(e) => {
                          let url = e.target.value.trim();
                          
                          // Auto-add https:// if URL doesn't have protocol and looks like a domain
                          if (url && !url.startsWith('http') && !url.startsWith('/') && !url.startsWith('data:') && url.includes('.')) {
                            url = 'https://' + url;
                          }
                          
                          console.log('🟡 BULK URL INPUT: Original:', e.target.value, 'Processed:', url);
                          
                          updateProductItem(product.id, 'image_url', url);
                          updateProductItem(product.id, 'imagePreview', url);
                        }}
                        placeholder="https://exemplo.com/imagem.jpg"
                        className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="col-span-1">
                    <select
                      value={product.category_id}
                      onChange={(e) => updateProductItem(product.id, 'category_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">Sem categoria</option>
                      {categories.map((category) => (
                        <option 
                          key={category.id} 
                          value={category.id}
                          className={selectedCategoryFilter === category.id ? 'bg-blue-100 font-semibold' : ''}
                        >
                          {selectedCategoryFilter === category.id ? '🎯 ' : ''}{category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-1">
                    <input
                      type="number"
                      value={product.stock_quantity}
                      onChange={(e) => updateProductItem(product.id, 'stock_quantity', e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div className="col-span-1 space-y-2">
                    <label className="flex items-center text-xs">
                      <input
                        type="checkbox"
                        checked={product.is_featured}
                        onChange={(e) => updateProductItem(product.id, 'is_featured', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 mr-1"
                      />
                      Destaque
                    </label>
                    <label className="flex items-center text-xs">
                      <input
                        type="checkbox"
                        checked={product.is_active}
                        onChange={(e) => updateProductItem(product.id, 'is_active', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 mr-1"
                      />
                      Ativo
                    </label>
                  </div>
                  <div className="col-span-1 flex items-center justify-center">
                    <button
                      onClick={() => removeProductRow(product.id)}
                      disabled={productList.length === 1}
                      className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-800 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed p-2 rounded"
                      title="Remover linha"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">💡 Dicas para Adição em Lista:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Nome e Preço:</strong> Campos obrigatórios para todos os produtos</li>
                <li>• <strong>Categoria:</strong> {selectedCategoryFilter ? `🎯 Produtos serão automaticamente adicionados à categoria "${getCategoryName(selectedCategoryFilter)}"` : 'Selecione uma categoria existente ou deixe sem categoria'}</li>
                <li>• <strong>Preços:</strong> Use ponto como separador decimal (ex: 10.50)</li>
                <li>• <strong>Imagens:</strong> 🎯 <strong>ARRASTE</strong> imagens diretamente do seu computador para cada produto ou cole URLs</li>
                <li>• <strong>Upload automático:</strong> As imagens são salvas automaticamente no seu site quando você arrasta</li>
                <li>• <strong>Formatos aceitos:</strong> JPG, PNG, GIF, WebP até 5MB por imagem</li>
                <li>• <strong>Destaque:</strong> Marque para produtos que devem aparecer em destaque na loja</li>
                <li>• <strong>Ativo:</strong> Produtos inativos não aparecem na loja</li>
                <li>• Clique em "Nova Linha" para adicionar mais produtos</li>
                <li>• Use "Salvar Todos" para adicionar todos os produtos preenchidos de uma vez</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Image Upload Manager Modal */}
      <ImageUploadManager
        isOpen={showImageManager}
        onClose={() => setShowImageManager(false)}
        onSelectImage={(imageUrl) => {
          setFormData({ ...formData, image_url: imageUrl });
          setImagePreview(imageUrl);
          setUploadMethod('gallery');
        }}
      />

      {/* Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                {editingProduct ? 'Editar Produto' : 'Adicionar Produto'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preço *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preço Original
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.original_price}
                    onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Imagem do Produto
                  </label>
                  
                  {/* Image Upload Method Selector */}
                  <div className="flex gap-4 mb-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="url"
                        checked={uploadMethod === 'url'}
                        onChange={(e) => {
                          setUploadMethod(e.target.value as 'url' | 'file' | 'gallery');
                          if (e.target.value === 'url') {
                            removeImage();
                          } else {
                            setFormData({ ...formData, image_url: "" });
                            setImagePreview("");
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">URL da Imagem</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="file"
                        checked={uploadMethod === 'file'}
                        onChange={(e) => {
                          setUploadMethod(e.target.value as 'url' | 'file' | 'gallery');
                          if (e.target.value === 'file') {
                            setFormData({ ...formData, image_url: "" });
                            setImagePreview("");
                          } else {
                            removeImage();
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Carregar Arquivo</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="gallery"
                        checked={uploadMethod === 'gallery'}
                        onChange={(e) => {
                          setUploadMethod(e.target.value as 'url' | 'file' | 'gallery');
                          setFormData({ ...formData, image_url: "" });
                          setImagePreview("");
                          removeImage();
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Galeria de Imagens</span>
                    </label>
                  </div>

                  {uploadMethod === 'url' ? (
                    <div>
                      <input
                        type="url"
                        value={formData.image_url}
                        onChange={(e) => {
                          setFormData({ ...formData, image_url: e.target.value });
                          setImagePreview(e.target.value);
                        }}
                        placeholder="https://exemplo.com/imagem.jpg"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Cole a URL de uma imagem externa
                      </p>
                    </div>
                  ) : uploadMethod === 'file' ? (
                    <div>
                      <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center hover:border-blue-400 transition-colors">
                        {imagePreview ? (
                          <div className="relative">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="mx-auto h-32 w-32 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={removeImage}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div>
                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="mt-4">
                              <label htmlFor="product-image-upload" className="cursor-pointer">
                                <span className="mt-2 block text-sm font-medium text-gray-900">
                                  Clique para carregar uma imagem
                                </span>
                                <span className="mt-1 block text-sm text-gray-500">
                                  PNG, JPG, GIF até 5MB
                                </span>
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                      <input
                        id="product-image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Máximo 5MB • Formatos: JPG, PNG, GIF
                      </p>
                    </div>
                  ) : uploadMethod === 'gallery' ? (
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowImageManager(true)}
                        className="w-full border-2 border-dashed border-gray-300 rounded-md p-6 text-center hover:border-blue-400 transition-colors"
                      >
                        <Folder className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-lg font-medium text-gray-900 mb-2">
                          Galeria de Imagens
                        </p>
                        <p className="text-sm text-gray-500 mb-4">
                          Selecione uma imagem da galeria ou envie uma nova
                        </p>
                        <span className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                          Abrir Galeria
                        </span>
                      </button>
                      <p className="text-xs text-gray-500 mt-1">
                        Gerencie todas as suas imagens de produtos em um só lugar
                      </p>
                    </div>
                  ) : null}

                  {imagePreview && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 mb-2">Preview:</p>
                      <img
                        src={imagePreview}
                        alt="Preview da imagem"
                        className="h-20 w-20 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria
                    {selectedCategoryFilter && (
                      <span className="text-blue-600 font-normal"> (Auto-selecionada: {getCategoryName(selectedCategoryFilter)})</span>
                    )}
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sem categoria</option>
                    {categories.map((category) => (
                      <option 
                        key={category.id} 
                        value={category.id}
                        className={selectedCategoryFilter === category.id ? 'bg-blue-100 font-semibold' : ''}
                      >
                        {selectedCategoryFilter === category.id ? '🎯 ' : ''}{category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantidade em Estoque
                  </label>
                  <input
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2 flex gap-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">Produto em destaque</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">Produto ativo</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingProduct ? 'Atualizar' : 'Adicionar'} Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
