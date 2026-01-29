import { useState, useEffect } from "react";
import AdminLayout from "@/react-app/components/AdminLayout";
import { Plus, Edit3, Trash2, Image, Eye, EyeOff } from "lucide-react";

interface Banner {
  id: number;
  title: string;
  subtitle?: string;
  image_url?: string;
  image_mobile_url?: string;
  link_url?: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export default function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    image_url: "",
    image_mobile_url: "",
    link_url: "",
    display_order: "",
    is_active: true
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const response = await fetch("/api/admin/banners");
      const data = await response.json();
      setBanners(data.banners || []);
    } catch (error) {
      console.error("Error fetching banners:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingBanner
        ? `/api/admin/banners/${editingBanner.id}`
        : "/api/admin/banners";

      const method = editingBanner ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          display_order: parseInt(formData.display_order) || 0,
        }),
      });

      if (response.ok) {
        fetchBanners();
        resetForm();
        setShowModal(false);
      }
    } catch (error) {
      console.error("Error saving banner:", error);
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || "",
      image_url: banner.image_url || "",
      image_mobile_url: banner.image_mobile_url || "", // ✅ novo
      link_url: banner.link_url || "",
      display_order: banner.display_order.toString(),
      is_active: banner.is_active
    });
    setShowModal(true);
  };

  const handleDelete = async (bannerId: number) => {
    if (!confirm("Tem certeza que deseja remover este banner?")) return;

    try {
      const response = await fetch(`/api/admin/banners/${bannerId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchBanners();
      }
    } catch (error) {
      console.error("Error deleting banner:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      subtitle: "",
      image_url: "",
      image_mobile_url: "", // ✅ novo
      link_url: "",
      display_order: "",
      is_active: true
    });
    setEditingBanner(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Banners</h1>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
                <div className="h-40 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
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
          <h1 className="text-2xl font-bold text-gray-900">Banners</h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Adicionar Banner
          </button>
        </div>

        {banners.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Image className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum banner cadastrado</h3>
            <p className="text-gray-500 mb-6">
              Adicione banners promocionais para destacar produtos e ofertas
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              Adicionar Banner
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {banners.map((banner) => (
              <div key={banner.id} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <div className="md:flex">
                  {/* Banner Preview */}
                  <div className="md:w-1/2 aspect-[2/1] bg-gray-100 relative">
                    {banner.image_url ? (
                      <img
                        src={banner.image_url}
                        alt={banner.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
                        {(banner.title || banner.subtitle) ? (
                          <div className="text-center text-white">
                            {banner.title && (
                              <h3 className="text-xl font-bold">{banner.title}</h3>
                            )}
                            {banner.subtitle && (
                              <p className="text-sm opacity-90 mt-1">{banner.subtitle}</p>
                            )}
                          </div>
                        ) : (
                          <div className="text-center text-white">
                            <h3 className="text-xl font-bold">Banner sem título</h3>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Status overlay */}
                    <div className="absolute top-2 left-2">
                      {banner.is_active ? (
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

                    {/* Order indicator */}
                    <div className="absolute top-2 right-2 bg-white bg-opacity-90 text-gray-800 px-2 py-1 rounded text-xs font-medium">
                      Ordem: {banner.display_order}
                    </div>
                  </div>

                  {/* Banner Info */}
                  <div className="md:w-1/2 p-6">
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {banner.title || 'Banner sem título'}
                      </h3>
                      {banner.subtitle && (
                        <p className="text-gray-600 mb-3">{banner.subtitle}</p>
                      )}

                      {banner.link_url && (
                        <p className="text-sm text-blue-600 mb-3">
                          <strong>Link:</strong> {banner.link_url}
                        </p>
                      )}

                      <div className="text-sm text-gray-500 space-y-1">
                        <p><strong>Criado:</strong> {formatDate(banner.created_at)}</p>
                        <p><strong>Atualizado:</strong> {formatDate(banner.updated_at)}</p>
                      </div>
                    </div>

                    {/* Banner Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(banner)}
                        className="flex-1 bg-blue-50 text-blue-700 px-4 py-2 rounded-md hover:bg-blue-100 transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        <Edit3 className="w-4 h-4" />
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(banner.id)}
                        className="bg-red-50 text-red-700 p-2 rounded-md hover:bg-red-100 transition-colors flex items-center justify-center"
                        title="Remover banner"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Banner Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                {editingBanner ? 'Editar Banner' : 'Adicionar Banner'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título do Banner
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Promoção de Verão!"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subtítulo
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="Ex: Até 30% de desconto em bebidas selecionadas"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL da Imagem
                  </label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://exemplo.com/banner.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Recomendamos imagens com proporção 16:9 (1200x675px ou similar)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL da Imagem (Mobile)
                  </label>
                  <input
                    type="url"
                    value={formData.image_mobile_url}
                    onChange={(e) => setFormData({ ...formData, image_mobile_url: e.target.value })}
                    placeholder="https://exemplo.com/banner-mobile.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Opcional. Se vazio, o mobile usa a imagem desktop.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link do Banner
                  </label>
                  <input
                    type="text"
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    placeholder="Ex: /produtos ou https://exemplo.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ordem de Exibição
                    </label>
                    <input
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Números menores aparecem primeiro
                    </p>
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">Banner ativo</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Preview */}
             {(formData.title || formData.image_url || formData.image_mobile_url) && (
  <div className="border-t pt-4">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Pré-visualização
    </label>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Desktop Preview */}
      <div>
        <p className="text-xs text-gray-500 mb-2">Desktop</p>
        <div className="aspect-[2/1] bg-gray-100 rounded-lg overflow-hidden relative">
          {formData.image_url ? (
            <img
              src={formData.image_url}
              alt={formData.title}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600" />
          )}

          <div className="absolute inset-0 bg-black bg-opacity-30"></div>
          {(formData.title || formData.subtitle) && (
            <div className="absolute inset-0 flex items-center justify-center text-white text-center p-4">
              <div>
                {formData.title && <h3 className="text-xl font-bold drop-shadow-lg">{formData.title}</h3>}
                {formData.subtitle && <p className="text-sm opacity-90 drop-shadow-md mt-1">{formData.subtitle}</p>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Preview */}
      <div>
        <p className="text-xs text-gray-500 mb-2">
          Mobile {formData.image_mobile_url ? "" : "(fallback = desktop)"}
        </p>

        <div className="aspect-[4/5] bg-gray-100 rounded-lg overflow-hidden relative">
          {(formData.image_mobile_url || formData.image_url) ? (
            <img
              src={formData.image_mobile_url || formData.image_url}
              alt={formData.title}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600" />
          )}

          <div className="absolute inset-0 bg-black bg-opacity-30"></div>
          {(formData.title || formData.subtitle) && (
            <div className="absolute inset-0 flex items-center justify-center text-white text-center p-4">
              <div>
                {formData.title && <h3 className="text-xl font-bold drop-shadow-lg">{formData.title}</h3>}
                {formData.subtitle && <p className="text-sm opacity-90 drop-shadow-md mt-1">{formData.subtitle}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
)}

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
                  {editingBanner ? 'Atualizar' : 'Adicionar'} Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
