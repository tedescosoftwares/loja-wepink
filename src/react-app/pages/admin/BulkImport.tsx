import { useState } from "react";
import AdminLayout from "@/react-app/components/AdminLayout";
import { Plus, Trash2, Upload, Package, FolderOpen, Check, X, FileText, AlertTriangle, Download } from "lucide-react";
import * as XLSX from 'xlsx';

interface CategoryItem {
  id: string;
  name: string;
  description: string;
  image_url: string;
  is_active: boolean;
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
}

export default function AdminBulkImport() {
  const [activeTab, setActiveTab] = useState<'categories' | 'products' | 'file-import'>('categories');
  const [categories, setCategories] = useState<CategoryItem[]>([
    { id: '1', name: '', description: '', image_url: '', is_active: true }
  ]);
  const [products, setProducts] = useState<ProductItem[]>([
    { id: '1', name: '', description: '', price: '', original_price: '', image_url: '', category_id: '', is_featured: false, stock_quantity: '', is_active: true }
  ]);
  const [loading, setLoading] = useState(false);
  const [importResults, setImportResults] = useState<{success: number, errors: string[]} | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<any[]>([]);

  const addCategory = () => {
    const newId = Date.now().toString();
    setCategories([...categories, { 
      id: newId, 
      name: '', 
      description: '', 
      image_url: '', 
      is_active: true 
    }]);
  };

  const removeCategory = (id: string) => {
    if (categories.length > 1) {
      setCategories(categories.filter(cat => cat.id !== id));
    }
  };

  const updateCategory = (id: string, field: keyof CategoryItem, value: any) => {
    setCategories(categories.map(cat => 
      cat.id === id ? { ...cat, [field]: value } : cat
    ));
  };

  const addProduct = () => {
    const newId = Date.now().toString();
    setProducts([...products, { 
      id: newId, 
      name: '', 
      description: '', 
      price: '', 
      original_price: '', 
      image_url: '', 
      category_id: '', 
      is_featured: false, 
      stock_quantity: '', 
      is_active: true 
    }]);
  };

  const removeProduct = (id: string) => {
    if (products.length > 1) {
      setProducts(products.filter(prod => prod.id !== id));
    }
  };

  const updateProduct = (id: string, field: keyof ProductItem, value: any) => {
    setProducts(products.map(prod => 
      prod.id === id ? { ...prod, [field]: value } : prod
    ));
  };

  const importCategories = async () => {
    setLoading(true);
    setImportResults(null);
    
    try {
      let successCount = 0;
      const errors: string[] = [];

      for (const category of categories) {
        if (!category.name.trim()) {
          errors.push(`Categoria ${categories.indexOf(category) + 1}: Nome é obrigatório`);
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

      setImportResults({ success: successCount, errors });
      
      if (successCount > 0) {
        // Reset form with one empty category
        setCategories([{ id: '1', name: '', description: '', image_url: '', is_active: true }]);
      }
    } catch (error) {
      console.error("Error importing categories:", error);
      setImportResults({ success: 0, errors: ['Erro geral na importação'] });
    } finally {
      setLoading(false);
    }
  };

  const deleteAllProducts = async () => {
    if (!confirm('ATENÇÃO: Isso irá deletar TODOS os produtos do site. Esta ação não pode ser desfeita. Tem certeza que deseja continuar?')) {
      return;
    }
    
    if (!confirm('Última confirmação: Deletar TODOS os produtos permanentemente?')) {
      return;
    }
    
    setDeleteLoading(true);
    
    try {
      const response = await fetch("/api/admin/products/delete-all", {
        method: "DELETE",
      });
      
      if (response.ok) {
        const result = await response.json();
        setImportResults({ success: result.deleted_count, errors: [] });
      } else {
        const error = await response.json();
        setImportResults({ success: 0, errors: [error.error || 'Erro ao deletar produtos'] });
      }
    } catch (error) {
      console.error("Error deleting all products:", error);
      setImportResults({ success: 0, errors: ['Erro de conexão ao deletar produtos'] });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setUploadedFile(file);
    
    const reader = new FileReader();
    
    if (file.name.endsWith('.xlsx')) {
      reader.onload = (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const parsedData = parseXLSX(arrayBuffer);
          setFilePreview(parsedData.slice(0, 5)); // Show first 5 items as preview
        } catch (error) {
          console.error("Error parsing XLSX file:", error);
          alert('Erro ao ler o arquivo Excel. Verifique o formato.');
          setUploadedFile(null);
          setFilePreview([]);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          let parsedData: any[] = [];
          
          if (file.name.endsWith('.json')) {
            parsedData = JSON.parse(content);
          } else if (file.name.endsWith('.csv')) {
            parsedData = parseCSV(content);
          }
          
          setFilePreview(parsedData.slice(0, 5)); // Show first 5 items as preview
        } catch (error) {
          console.error("Error parsing file:", error);
          alert('Erro ao ler o arquivo. Verifique o formato.');
          setUploadedFile(null);
          setFilePreview([]);
        }
      };
      reader.readAsText(file);
    }
  };

  const parseCSV = (csv: string): any[] => {
    const lines = csv.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const item: any = {};
      
      headers.forEach((header, index) => {
        item[header] = values[index] || '';
      });
      
      data.push(item);
    }
    
    return data;
  };

  const parseXLSX = (arrayBuffer: ArrayBuffer): any[] => {
    try {
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to JSON with header mapping
      const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      return data as any[];
    } catch (error) {
      console.error("Error parsing XLSX:", error);
      throw new Error("Erro ao ler arquivo Excel");
    }
  };

  const importFromFile = async (importType: 'products' | 'categories' = 'products') => {
    if (!uploadedFile) return;
    
    setLoading(true);
    setImportResults(null);
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          let parsedData: any[] = [];
          
          if (uploadedFile.name.endsWith('.xlsx')) {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            parsedData = parseXLSX(arrayBuffer);
          } else {
            const content = e.target?.result as string;
            if (uploadedFile.name.endsWith('.json')) {
              parsedData = JSON.parse(content);
            } else if (uploadedFile.name.endsWith('.csv')) {
              parsedData = parseCSV(content);
            }
          }
          
          let successCount = 0;
          const errors: string[] = [];
          
          if (importType === 'products') {
            for (const item of parsedData) {
              if (!item.name || !item.price) {
                errors.push(`Item ${parsedData.indexOf(item) + 1}: Nome e preço são obrigatórios`);
                continue;
              }
              
              try {
                const response = await fetch("/api/admin/products", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name: item.name?.trim() || '',
                    description: item.description?.trim() || null,
                    price: parseFloat(item.price) || 0,
                    original_price: item.original_price ? parseFloat(item.original_price) : null,
                    image_url: item.image_url?.trim() || null,
                    category_id: item.category_id ? parseInt(item.category_id) : null,
                    is_featured: item.is_featured === 'true' || item.is_featured === true || false,
                    stock_quantity: parseInt(item.stock_quantity) || 0,
                    is_active: item.is_active !== 'false' && item.is_active !== false
                  }),
                });
                
                if (response.ok) {
                  successCount++;
                } else {
                  const error = await response.json();
                  errors.push(`Produto "${item.name}": ${error.error || 'Erro desconhecido'}`);
                }
              } catch (err) {
                errors.push(`Produto "${item.name}": Erro de conexão`);
              }
            }
          } else {
            // Import categories
            for (const item of parsedData) {
              if (!item.name) {
                errors.push(`Item ${parsedData.indexOf(item) + 1}: Nome é obrigatório`);
                continue;
              }
              
              try {
                const response = await fetch("/api/admin/categories", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name: item.name?.trim() || '',
                    description: item.description?.trim() || null,
                    image_url: item.image_url?.trim() || null,
                    is_active: item.is_active !== 'false' && item.is_active !== false
                  }),
                });
                
                if (response.ok) {
                  successCount++;
                } else {
                  const error = await response.json();
                  errors.push(`Categoria "${item.name}": ${error.error || 'Erro desconhecido'}`);
                }
              } catch (err) {
                errors.push(`Categoria "${item.name}": Erro de conexão`);
              }
            }
          }
          
          setImportResults({ success: successCount, errors });
          
          if (successCount > 0) {
            setUploadedFile(null);
            setFilePreview([]);
            // Reset file input
            const fileInput = document.getElementById('file-upload') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
          }
        } catch (error) {
          console.error("Error processing file:", error);
          setImportResults({ success: 0, errors: ['Erro ao processar arquivo'] });
        } finally {
          setLoading(false);
        }
      };
      
      if (uploadedFile.name.endsWith('.xlsx')) {
        reader.readAsArrayBuffer(uploadedFile);
      } else {
        reader.readAsText(uploadedFile);
      }
    } catch (error) {
      console.error("Error importing from file:", error);
      setImportResults({ success: 0, errors: ['Erro geral na importação do arquivo'] });
      setLoading(false);
    }
  };

  const downloadTemplate = (type: 'csv' | 'json' | 'xlsx', dataType: 'products' | 'categories' = 'products') => {
    let sampleData: any[] = [];
    
    if (dataType === 'products') {
      sampleData = [
        {
          name: "Coca-Cola 350ml",
          description: "Refrigerante tradicional lata 350ml",
          price: "3.50",
          original_price: "4.00",
          image_url: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400",
          category_id: "1",
          is_featured: "true",
          stock_quantity: "100",
          is_active: "true"
        },
        {
          name: "Guaraná Antarctica 2L",
          description: "Guaraná Antarctica garrafa 2 litros",
          price: "8.90",
          original_price: "9.90",
          image_url: "https://images.unsplash.com/photo-1624552184280-8816bbeb5293?w=400",
          category_id: "1",
          is_featured: "false",
          stock_quantity: "50",
          is_active: "true"
        }
      ];
    } else {
      sampleData = [
        {
          name: "Refrigerantes",
          description: "Coca-Cola, Pepsi, Guaraná e outras bebidas gaseificadas",
          image_url: "https://images.unsplash.com/photo-1546173159-315724a31696?w=400",
          is_active: "true"
        },
        {
          name: "Águas",
          description: "Água mineral, com gás e saborizada",
          image_url: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400",
          is_active: "true"
        }
      ];
    }
    
    let content = '';
    let filename = '';
    let mimeType = '';
    
    if (type === 'csv') {
      const headers = Object.keys(sampleData[0]).join(',');
      const rows = sampleData.map(item => Object.values(item).map(v => `"${v}"`).join(','));
      content = [headers, ...rows].join('\n');
      filename = dataType === 'products' ? 'template-produtos.csv' : 'template-categorias.csv';
      mimeType = 'text/csv';
    } else if (type === 'xlsx') {
      // Create Excel file
      const worksheet = XLSX.utils.json_to_sheet(sampleData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, dataType === 'products' ? 'Produtos' : 'Categorias');
      
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = dataType === 'products' ? 'template-produtos.xlsx' : 'template-categorias.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    } else {
      content = JSON.stringify(sampleData, null, 2);
      filename = dataType === 'products' ? 'template-produtos.json' : 'template-categorias.json';
      mimeType = 'application/json';
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importProducts = async () => {
    setLoading(true);
    setImportResults(null);
    
    try {
      let successCount = 0;
      const errors: string[] = [];

      for (const product of products) {
        if (!product.name.trim() || !product.price.trim()) {
          errors.push(`Produto ${products.indexOf(product) + 1}: Nome e preço são obrigatórios`);
          continue;
        }

        try {
          const response = await fetch("/api/admin/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: product.name.trim(),
              description: product.description.trim() || null,
              price: parseFloat(product.price),
              original_price: product.original_price ? parseFloat(product.original_price) : null,
              image_url: product.image_url.trim() || null,
              category_id: product.category_id ? parseInt(product.category_id) : null,
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

      setImportResults({ success: successCount, errors });
      
      if (successCount > 0) {
        // Reset form with one empty product
        setProducts([{ id: '1', name: '', description: '', price: '', original_price: '', image_url: '', category_id: '', is_featured: false, stock_quantity: '', is_active: true }]);
      }
    } catch (error) {
      console.error("Error importing products:", error);
      setImportResults({ success: 0, errors: ['Erro geral na importação'] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Importação em Massa</h1>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('categories')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'categories'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FolderOpen className="w-4 h-4 inline mr-2" />
              Categorias
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'products'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Package className="w-4 h-4 inline mr-2" />
              Produtos
            </button>
            <button
              onClick={() => setActiveTab('file-import')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'file-import'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Upload de Arquivo
            </button>
          </nav>
        </div>

        {/* Import Results */}
        {importResults && (
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              {importResults.success > 0 ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <X className="w-5 h-5 text-red-600" />
              )}
              <h3 className="font-medium">Resultado da Importação</h3>
            </div>
            
            {importResults.success > 0 && (
              <p className="text-green-600 mb-2">
                ✓ {importResults.success} item(s) importado(s) com sucesso
              </p>
            )}
            
            {importResults.errors.length > 0 && (
              <div>
                <p className="text-red-600 font-medium mb-2">Erros encontrados:</p>
                <ul className="text-red-600 text-sm space-y-1">
                  {importResults.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Adicionar Categorias</h2>
              <div className="flex gap-2">
                <button
                  onClick={addCategory}
                  className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Linha
                </button>
                <button
                  onClick={importCategories}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {loading ? 'Importando...' : 'Importar Categorias'}
                </button>
              </div>
            </div>

            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b font-medium text-sm text-gray-700">
                <div className="col-span-3">Nome *</div>
                <div className="col-span-4">Descrição</div>
                <div className="col-span-3">URL da Imagem</div>
                <div className="col-span-1">Ativo</div>
                <div className="col-span-1">Ações</div>
              </div>

              {categories.map((category) => (
                <div key={category.id} className="grid grid-cols-12 gap-4 p-4 border-b last:border-b-0">
                  <div className="col-span-3">
                    <input
                      type="text"
                      value={category.name}
                      onChange={(e) => updateCategory(category.id, 'name', e.target.value)}
                      placeholder="Nome da categoria"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div className="col-span-4">
                    <textarea
                      value={category.description}
                      onChange={(e) => updateCategory(category.id, 'description', e.target.value)}
                      placeholder="Descrição da categoria"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="url"
                      value={category.image_url}
                      onChange={(e) => updateCategory(category.id, 'image_url', e.target.value)}
                      placeholder="https://exemplo.com/imagem.jpg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div className="col-span-1 flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={category.is_active}
                      onChange={(e) => updateCategory(category.id, 'is_active', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600"
                    />
                  </div>
                  <div className="col-span-1 flex items-center justify-center">
                    <button
                      onClick={() => removeCategory(category.id)}
                      disabled={categories.length === 1}
                      className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-800 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed p-1 rounded"
                      title="Remover linha"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Adicionar Produtos</h2>
              <div className="flex gap-2">
                <button
                  onClick={addProduct}
                  className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Linha
                </button>
                <button
                  onClick={importProducts}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {loading ? 'Importando...' : 'Importar Produtos'}
                </button>
              </div>
            </div>

            <div className="bg-white border rounded-lg overflow-x-auto">
              <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b font-medium text-sm text-gray-700 min-w-[1200px]">
                <div className="col-span-2">Nome *</div>
                <div className="col-span-2">Descrição</div>
                <div className="col-span-1">Preço *</div>
                <div className="col-span-1">Preço Original</div>
                <div className="col-span-2">URL da Imagem</div>
                <div className="col-span-1">Categoria</div>
                <div className="col-span-1">Estoque</div>
                <div className="col-span-1">Opções</div>
                <div className="col-span-1">Ações</div>
              </div>

              {products.map((product) => (
                <div key={product.id} className="grid grid-cols-12 gap-4 p-4 border-b last:border-b-0 min-w-[1200px]">
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={product.name}
                      onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                      placeholder="Nome do produto"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <textarea
                      value={product.description}
                      onChange={(e) => updateProduct(product.id, 'description', e.target.value)}
                      placeholder="Descrição do produto"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div className="col-span-1">
                    <input
                      type="number"
                      step="0.01"
                      value={product.price}
                      onChange={(e) => updateProduct(product.id, 'price', e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div className="col-span-1">
                    <input
                      type="number"
                      step="0.01"
                      value={product.original_price}
                      onChange={(e) => updateProduct(product.id, 'original_price', e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="url"
                      value={product.image_url}
                      onChange={(e) => updateProduct(product.id, 'image_url', e.target.value)}
                      placeholder="https://exemplo.com/imagem.jpg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div className="col-span-1">
                    <input
                      type="text"
                      value={product.category_id}
                      onChange={(e) => updateProduct(product.id, 'category_id', e.target.value)}
                      placeholder="ID da categoria"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div className="col-span-1">
                    <input
                      type="number"
                      value={product.stock_quantity}
                      onChange={(e) => updateProduct(product.id, 'stock_quantity', e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div className="col-span-1 space-y-2">
                    <label className="flex items-center text-xs">
                      <input
                        type="checkbox"
                        checked={product.is_featured}
                        onChange={(e) => updateProduct(product.id, 'is_featured', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 mr-1"
                      />
                      Destaque
                    </label>
                    <label className="flex items-center text-xs">
                      <input
                        type="checkbox"
                        checked={product.is_active}
                        onChange={(e) => updateProduct(product.id, 'is_active', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 mr-1"
                      />
                      Ativo
                    </label>
                  </div>
                  <div className="col-span-1 flex items-center justify-center">
                    <button
                      onClick={() => removeProduct(product.id)}
                      disabled={products.length === 1}
                      className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-800 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed p-1 rounded"
                      title="Remover linha"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Dicas para Produtos:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Para categoria, use o ID numérico da categoria (ex: 1, 2, 3...)</li>
                <li>• Preços devem usar ponto como separador decimal (ex: 10.50)</li>
                <li>• URLs de imagens devem começar com http:// ou https://</li>
                <li>• Deixe o preço original vazio se não houver promoção</li>
              </ul>
            </div>
          </div>
        )}

        {/* File Import Tab */}
        {activeTab === 'file-import' && (
          <div className="space-y-6">
            {/* Warning Section */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-orange-600 mt-1" />
                <div>
                  <h3 className="font-medium text-orange-900 mb-2">Atenção: Reset Completo</h3>
                  <p className="text-orange-800 mb-4">
                    Use esta opção para deletar TODOS os produtos existentes e importar uma nova lista completa via arquivo.
                  </p>
                  <button
                    onClick={deleteAllProducts}
                    disabled={deleteLoading}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    {deleteLoading ? 'Deletando...' : 'Deletar TODOS os Produtos'}
                  </button>
                </div>
              </div>
            </div>

            {/* Templates Section */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="font-medium text-gray-900 mb-4">1. Baixar Template</h3>
              <p className="text-gray-600 mb-4">
                Baixe um arquivo template com o formato correto para importar seus dados:
              </p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Templates para Produtos:</h4>
                  <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={() => downloadTemplate('csv', 'products')}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Produtos CSV
                    </button>
                    <button
                      onClick={() => downloadTemplate('xlsx', 'products')}
                      className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Produtos Excel
                    </button>
                    <button
                      onClick={() => downloadTemplate('json', 'products')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Produtos JSON
                    </button>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Templates para Categorias:</h4>
                  <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={() => downloadTemplate('csv', 'categories')}
                      className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Categorias CSV
                    </button>
                    <button
                      onClick={() => downloadTemplate('xlsx', 'categories')}
                      className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Categorias Excel
                    </button>
                    <button
                      onClick={() => downloadTemplate('json', 'categories')}
                      className="bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Categorias JSON
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* File Upload Section */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="font-medium text-gray-900 mb-4">2. Upload do Arquivo</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
                    Selecione o arquivo (CSV, Excel ou JSON)
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".csv,.xlsx,.json"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>

                {uploadedFile && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-medium text-gray-900 mb-2">
                      Arquivo: {uploadedFile.name}
                    </p>
                    <p className="text-sm text-gray-600 mb-3">
                      Tamanho: {(uploadedFile.size / 1024).toFixed(1)} KB
                    </p>
                    
                    {filePreview.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Preview (primeiros 5 items):</h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-xs">
                            <thead>
                              <tr className="bg-gray-100">
                                {Object.keys(filePreview[0]).map(key => (
                                  <th key={key} className="px-2 py-1 text-left font-medium text-gray-900">
                                    {key}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {filePreview.map((item, index) => (
                                <tr key={index} className="border-b">
                                  {Object.values(item).map((value: any, i) => (
                                    <td key={i} className="px-2 py-1 text-gray-700">
                                      {String(value).substring(0, 30)}
                                      {String(value).length > 30 ? '...' : ''}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => importFromFile('products')}
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        <Package className="w-4 h-4" />
                        {loading ? 'Importando...' : 'Importar como Produtos'}
                      </button>
                      <button
                        onClick={() => importFromFile('categories')}
                        disabled={loading}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        <FolderOpen className="w-4 h-4" />
                        {loading ? 'Importando...' : 'Importar como Categorias'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Formato para Produtos:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>name</strong>: Nome do produto (obrigatório)</li>
                  <li>• <strong>description</strong>: Descrição do produto</li>
                  <li>• <strong>price</strong>: Preço do produto (obrigatório, usar ponto decimal)</li>
                  <li>• <strong>original_price</strong>: Preço original (opcional)</li>
                  <li>• <strong>image_url</strong>: URL da imagem do produto</li>
                  <li>• <strong>category_id</strong>: ID da categoria (número)</li>
                  <li>• <strong>is_featured</strong>: true/false para produto em destaque</li>
                  <li>• <strong>stock_quantity</strong>: Quantidade em estoque (número)</li>
                  <li>• <strong>is_active</strong>: true/false para produto ativo</li>
                </ul>
              </div>
              
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <h3 className="font-medium text-emerald-900 mb-2">Formato para Categorias:</h3>
                <ul className="text-sm text-emerald-800 space-y-1">
                  <li>• <strong>name</strong>: Nome da categoria (obrigatório)</li>
                  <li>• <strong>description</strong>: Descrição da categoria (opcional)</li>
                  <li>• <strong>image_url</strong>: URL da imagem da categoria (opcional)</li>
                  <li>• <strong>is_active</strong>: true/false para categoria ativa (padrão: true)</li>
                </ul>
                <div className="mt-3 p-2 bg-emerald-100 rounded text-xs text-emerald-700">
                  <strong>Dica:</strong> Importe primeiro as categorias, depois os produtos usando os IDs das categorias criadas.
                </div>
              </div>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-medium text-amber-900 mb-2">📋 Como usar o Upload em Massa:</h3>
              <ol className="text-sm text-amber-800 space-y-1 ml-4">
                <li>1. <strong>Baixe o template</strong> CSV, Excel ou JSON do tipo que deseja importar</li>
                <li>2. <strong>Preencha seus dados</strong> no arquivo baixado seguindo o formato</li>
                <li>3. <strong>Faça upload do arquivo</strong> preenchido (.csv, .xlsx ou .json)</li>
                <li>4. <strong>Escolha o tipo de importação</strong> (Produtos ou Categorias)</li>
                <li>5. <strong>Verifique o resultado</strong> da importação</li>
              </ol>
              <div className="mt-3 p-2 bg-amber-100 rounded text-xs text-amber-700">
                <strong>✨ Novo:</strong> Agora suporta arquivos Excel (.xlsx) além de CSV e JSON!
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
