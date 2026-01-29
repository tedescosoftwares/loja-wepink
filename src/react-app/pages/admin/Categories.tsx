import { useState, useEffect } from "react";
import AdminLayout from "@/react-app/components/AdminLayout";
import { Plus, Edit3, Trash2, FolderOpen, Eye, EyeOff, Search, Upload, X, Folder, List, Save, Grid } from "lucide-react";
import ImageUploadManager from "@/react-app/components/ImageUploadManager";

interface Category {
  id: number;
  name: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CategoryItem {
  id: string;
  name: string;
  description: string;
  image_url: string;
  is_active: boolean;
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [bulkSaving, setBulkSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image_url: "",
    is_active: true
  });

  // Bulk add state
  const [categoryList, setCategoryList] = useState<CategoryItem[]>([
    { id: '1', name: '', description: '', image_url: '', is_active: true }
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
    const fileInput = document.getElementById('category-image-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/admin/categories");
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingCategory 
        ? `/api/admin/categories/${editingCategory.id}`
        : "/api/admin/categories";
      
      const method = editingCategory ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchCategories();
        resetForm();
        setShowModal(false);
      }
    } catch (error) {
      console.error("Error saving category:", error);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      image_url: category.image_url || "",
      is_active: category.is_active
    });
    
    // Set preview for existing image
    if (category.image_url) {
      setImagePreview(category.image_url);
      // Determine upload method based on URL format
      if (category.image_url.startsWith('data:')) {
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

  const handleDelete = async (categoryId: number) => {
    if (!confirm("Tem certeza que deseja remover esta categoria?")) return;
    
    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchCategories();
      }
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      image_url: "",
      is_active: true
    });
    setEditingCategory(null);
    setImagePreview("");
    setUploadMethod('url');
    setShowImageManager(false);
    // Reset file input
    const fileInput = document.getElementById('category-image-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  // Bulk operations
  const addCategoryRow = () => {
    const newId = Date.now().toString();
    setCategoryList([...categoryList, { 
      id: newId, 
      name: '', 
      description: '', 
      image_url: '', 
      is_active: true 
    }]);
  };

  const removeCategoryRow = (id: string) => {
    if (categoryList.length > 1) {
      setCategoryList(categoryList.filter(cat => cat.id !== id));
    }
  };

  const updateCategoryItem = (id: string, field: keyof CategoryItem, value: any) => {
    setCategoryList(categoryList.map(cat => 
      cat.id === id ? { ...cat, [field]: value } : cat
    ));
  };

  const saveBulkCategories = async () => {
    setBulkSaving(true);
    
    try {
      let successCount = 0;
      const errors: string[] = [];

      for (const category of categoryList) {
        if (!category.name.trim()) {
          errors.push(`Categoria ${categoryList.indexOf(category) + 1}: Nome é obrigatório`);
          continue;
        }

        try {
          const response = await fetch("/api/admin/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: category.name.trim(),
              description: category.description.trim() || null,
              image_url: category.image_url.trim() || null,
              is_active: category.is_active
            }),
          });

          if (response.ok) {
            successCount++;
          } else {
            const error = await response.json();
            errors.push(`Categoria "${category.name}": ${error.error || 'Erro desconhecido'}`);
          }
        } catch (err) {
          errors.push(`Categoria "${category.name}": Erro de conexão`);
        }
      }

      if (successCount > 0) {
        // Reset form with one empty category
        setCategoryList([{ id: '1', name: '', description: '', image_url: '', is_active: true }]);
        fetchCategories();
        alert(`${successCount} categoria(s) adicionada(s) com sucesso!${errors.length > 0 ? ` ${errors.length} erro(s) encontrado(s).` : ''}`);
      }

      if (errors.length > 0) {
        console.error("Errors during bulk save:", errors);
      }
    } catch (error) {
      console.error("Error saving bulk categories:", error);
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
        fetchCategories();
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

  const forceCleanDuplicates = async () => {
    if (!confirm("ATENÇÃO: Esta é uma limpeza FORÇADA que irá remover TODAS as duplicatas de forma agressiva. Tem certeza?")) return;
    
    try {
      setLoading(true);
      const response = await fetch("/api/admin/force-clean-duplicates", {
        method: "DELETE",
      });

      const data = await response.json();
      
      if (response.ok) {
        alert(data.message);
        fetchCategories();
      } else {
        alert("Erro na limpeza forçada: " + (data.error || "Erro desconhecido"));
      }
    } catch (error) {
      console.error("Error in force cleanup:", error);
      alert("Erro na limpeza forçada");
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Categorias</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
                <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
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
          <h1 className="text-2xl font-bold text-gray-900">Categorias</h1>
          <div className="flex items-center gap-3">
            {/* Cleanup Buttons */}
            <button
              onClick={cleanDuplicates}
              className="bg-orange-600 text-white px-3 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2 text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Limpar Duplicatas
            </button>
            
            <button
              onClick={forceCleanDuplicates}
              className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2 text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Limpeza Forçada
            </button>
            
            {/* View Mode Toggle */}
            <div className="flex border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 text-sm font-medium rounded-l-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Grid className="w-4 h-4 inline mr-1" />
                Visualizar
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm font-medium rounded-r-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <List className="w-4 h-4 inline mr-1" />
                Adicionar Lista
              </button>
            </div>
            
            {viewMode === 'grid' && (
              <button
                onClick={() => setShowModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Adicionar Categoria
              </button>
            )}
          </div>
        </div>

        {viewMode === 'grid' && (
          <>
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Buscar categorias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {filteredCategories.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'Nenhuma categoria encontrada' : 'Nenhuma categoria cadastrada'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm ? 'Tente buscar com outros termos' : 'Adicione categorias para organizar seus produtos'}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
                  >
                    <Plus className="w-5 h-5" />
                    Adicionar Categoria
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCategories.map((category) => (
                  <div key={category.id} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                    {/* Category Image */}
                    <div className="aspect-video bg-gray-100 relative">
                      {category.image_url ? (
                        <img
                          src={category.image_url}
                          alt={category.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FolderOpen className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      
                      {/* Status badge */}
                      <div className="absolute top-2 right-2">
                        {category.is_active ? (
                          <div className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            Ativo
                          </div>
                        ) : (
                          <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                            <EyeOff className="w-3 h-3" />
                            Inativo
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Category Info */}
                    <div className="p-4">
                      <div className="mb-3">
                        <h3 className="font-semibold text-gray-900 text-lg">{category.name}</h3>
                      </div>

                      {category.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {category.description}
                        </p>
                      )}

                      <div className="text-xs text-gray-500 mb-4">
                        Criado em: {new Date(category.created_at).toLocaleDateString('pt-BR')}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(category)}
                          className="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-md hover:bg-blue-100 transition-colors text-sm font-medium flex items-center justify-center gap-1"
                        >
                          <Edit3 className="w-4 h-4" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="bg-red-50 text-red-700 p-2 rounded-md hover:bg-red-100 transition-colors flex items-center justify-center"
                          title="Remover categoria"
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

        {viewMode === 'list' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Adicionar Múltiplas Categorias</h2>
              <div className="flex gap-2">
                <button
                  onClick={addCategoryRow}
                  className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Nova Linha
                </button>
                <button
                  onClick={saveBulkCategories}
                  disabled={bulkSaving}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {bulkSaving ? 'Salvando...' : 'Salvar Todas'}
                </button>
              </div>
            </div>

            <div className="bg-white border rounded-lg overflow-x-auto">
              <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b font-medium text-sm text-gray-700 min-w-[800px]">
                <div className="col-span-3">Nome da Categoria *</div>
                <div className="col-span-4">Descrição</div>
                <div className="col-span-3">URL da Imagem</div>
                <div className="col-span-1">Ativo</div>
                <div className="col-span-1">Ações</div>
              </div>

              {categoryList.map((category) => (
                <div key={category.id} className="grid grid-cols-12 gap-4 p-4 border-b last:border-b-0 min-w-[800px]">
                  <div className="col-span-3">
                    <input
                      type="text"
                      value={category.name}
                      onChange={(e) => updateCategoryItem(category.id, 'name', e.target.value)}
                      placeholder="Nome da categoria"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div className="col-span-4">
                    <textarea
                      value={category.description}
                      onChange={(e) => updateCategoryItem(category.id, 'description', e.target.value)}
                      placeholder="Descrição da categoria"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="url"
                      value={category.image_url}
                      onChange={(e) => updateCategoryItem(category.id, 'image_url', e.target.value)}
                      placeholder="https://exemplo.com/imagem.jpg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div className="col-span-1 flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={category.is_active}
                      onChange={(e) => updateCategoryItem(category.id, 'is_active', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600"
                    />
                  </div>
                  <div className="col-span-1 flex items-center justify-center">
                    <button
                      onClick={() => removeCategoryRow(category.id)}
                      disabled={categoryList.length === 1}
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
                <li>• <strong>Nome:</strong> Campo obrigatório - será usado para identificar a categoria</li>
                <li>• <strong>Descrição:</strong> Opcional - explique o tipo de produtos desta categoria</li>
                <li>• <strong>URL da Imagem:</strong> Opcional - use imagens com proporção 16:9 para melhor visual</li>
                <li>• <strong>Ativo:</strong> Controla se a categoria aparece na loja (marcado = visível)</li>
                <li>• Clique em "Nova Linha" para adicionar mais categorias</li>
                <li>• Use "Salvar Todas" para adicionar todas as categorias preenchidas de uma vez</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Category Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                {editingCategory ? 'Editar Categoria' : 'Adicionar Categoria'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Refrigerantes, Águas, Sucos..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descreva esta categoria de produtos..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Imagem da Categoria
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
                      Recomendado: imagem com proporção 16:9 (ex: 800x450px)
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
                            className="mx-auto h-32 w-48 object-cover rounded-lg"
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
                            <label htmlFor="category-image-upload" className="cursor-pointer">
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
                      id="category-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Máximo 5MB • Formatos: JPG, PNG, GIF • Recomendado: 16:9 (800x450px)
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
                      Gerencie todas as suas imagens de categorias em um só lugar
                    </p>
                  </div>
                ) : null}

                {imagePreview && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-2">Preview:</p>
                    <img
                      src={imagePreview}
                      alt="Preview da imagem"
                      className="h-20 w-32 object-cover rounded-lg border"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">Categoria ativa</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Categorias inativas não aparecem na loja
                </p>
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
                  {editingCategory ? 'Atualizar' : 'Adicionar'} Categoria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
    </AdminLayout>
  );
}
