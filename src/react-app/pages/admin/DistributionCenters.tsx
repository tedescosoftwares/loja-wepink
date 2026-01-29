import { useState, useEffect } from 'react';
import AdminLayout from '@/react-app/components/AdminLayout';
import { MapPin, Plus, Edit, Trash2, Navigation, Phone, Clock, Target } from 'lucide-react';

interface DistributionCenter {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  operating_hours: string;
  delivery_radius_km: number;
  is_active: boolean;
  created_at: string;
}

interface CustomerLocation {
  id: number;
  session_id: string;
  customer_name: string;
  customer_phone: string;
  latitude: number;
  longitude: number;
  address: string;
  nearest_center_id: number;
  distance_to_center_km: number;
  center_name: string;
  center_address: string;
  created_at: string;
}

export default function DistributionCenters() {
  const [centers, setCenters] = useState<DistributionCenter[]>([]);
  const [customerLocations, setCustomerLocations] = useState<CustomerLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCenter, setEditingCenter] = useState<DistributionCenter | null>(null);
  const [activeTab, setActiveTab] = useState<'centers' | 'locations'>('centers');
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    phone: '',
    email: '',
    operating_hours: '',
    delivery_radius_km: '',
    is_active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [centersRes, locationsRes] = await Promise.all([
        fetch('/api/admin/distribution-centers'),
        fetch('/api/admin/customer-locations')
      ]);
      
      const centersData = await centersRes.json();
      const locationsData = await locationsRes.json();
      
      setCenters(centersData.centers || []);
      setCustomerLocations(locationsData.locations || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingCenter 
        ? `/api/admin/distribution-centers/${editingCenter.id}`
        : '/api/admin/distribution-centers';
      
      const method = editingCenter ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          delivery_radius_km: parseFloat(formData.delivery_radius_km) || 50
        }),
      });

      if (response.ok) {
        await fetchData();
        setShowForm(false);
        setEditingCenter(null);
        setFormData({
          name: '',
          address: '',
          latitude: '',
          longitude: '',
          phone: '',
          email: '',
          operating_hours: '',
          delivery_radius_km: '',
          is_active: true
        });
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao salvar centro de distribuição');
      }
    } catch (error) {
      console.error('Error saving center:', error);
      alert('Erro ao salvar centro de distribuição');
    }
  };

  const handleEdit = (center: DistributionCenter) => {
    setEditingCenter(center);
    setFormData({
      name: center.name,
      address: center.address,
      latitude: center.latitude.toString(),
      longitude: center.longitude.toString(),
      phone: center.phone || '',
      email: center.email || '',
      operating_hours: center.operating_hours || '',
      delivery_radius_km: center.delivery_radius_km.toString(),
      is_active: center.is_active
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja remover este centro de distribuição?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/distribution-centers/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchData();
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao remover centro de distribuição');
      }
    } catch (error) {
      console.error('Error deleting center:', error);
      alert('Erro ao remover centro de distribuição');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const formatDistance = (distance: number) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Centros de Distribuição</h1>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Navigation className="w-8 h-8 text-blue-600" />
            Centros de Distribuição & Geolocalização
          </h1>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingCenter(null);
              setFormData({
                name: '',
                address: '',
                latitude: '',
                longitude: '',
                phone: '',
                email: '',
                operating_hours: '',
                delivery_radius_km: '',
                is_active: true
              });
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Centro
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('centers')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'centers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Centros ({centers.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('locations')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'locations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Localizações dos Clientes ({customerLocations.length})
              </div>
            </button>
          </nav>
        </div>

        {/* Centers Tab */}
        {activeTab === 'centers' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total de Centros</p>
                    <p className="text-2xl font-bold text-gray-900">{centers.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Target className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Centros Ativos</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {centers.filter(c => c.is_active).length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Navigation className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Clientes Localizados</p>
                    <p className="text-2xl font-bold text-gray-900">{customerLocations.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            {showForm && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">
                  {editingCenter ? 'Editar Centro de Distribuição' : 'Novo Centro de Distribuição'}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Centro São Paulo - Vila Olímpia"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Telefone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="(11) 3456-7890"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Endereço *
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Av. Brigadeiro Faria Lima, 1234 - Vila Olímpia, São Paulo - SP"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Latitude *
                      </label>
                      <input
                        type="number"
                        step="any"
                        name="latitude"
                        value={formData.latitude}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="-23.5905"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Longitude *
                      </label>
                      <input
                        type="number"
                        step="any"
                        name="longitude"
                        value={formData.longitude}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="-46.6862"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Raio de Entrega (km)
                      </label>
                      <input
                        type="number"
                        name="delivery_radius_km"
                        value={formData.delivery_radius_km}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Horário de Funcionamento
                    </label>
                    <input
                      type="text"
                      name="operating_hours"
                      value={formData.operating_hours}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Segunda a Sexta: 8h às 18h, Sábado: 8h às 14h"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      E-mail
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="centro@empresa.com"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Centro ativo
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {editingCenter ? 'Atualizar' : 'Criar'} Centro
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Centers List */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Centros de Distribuição</h2>
              </div>

              <div className="p-6">
                {centers.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum centro de distribuição cadastrado</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {centers.map((center) => (
                      <div key={center.id} className={`border rounded-lg p-4 ${center.is_active ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{center.name}</h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                center.is_active 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {center.is_active ? 'Ativo' : 'Inativo'}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                              <div className="space-y-2">
                                <p className="flex items-start gap-2">
                                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                  {center.address}
                                </p>
                                {center.phone && (
                                  <p className="flex items-center gap-2">
                                    <Phone className="w-4 h-4" />
                                    {center.phone}
                                  </p>
                                )}
                              </div>
                              
                              <div className="space-y-2">
                                <p>
                                  <strong>Coordenadas:</strong> {center.latitude}, {center.longitude}
                                </p>
                                <p>
                                  <strong>Raio de entrega:</strong> {center.delivery_radius_km}km
                                </p>
                                {center.operating_hours && (
                                  <p className="flex items-start gap-2">
                                    <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    {center.operating_hours}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => handleEdit(center)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(center.id)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Customer Locations Tab */}
        {activeTab === 'locations' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Localizações dos Clientes</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Dados dos clientes que permitiram compartilhar sua localização
                </p>
              </div>

              <div className="p-6">
                {customerLocations.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhuma localização de cliente registrada</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Localização</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Centro Mais Próximo</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distância</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {customerLocations.map((location) => (
                          <tr key={location.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {location.customer_name || 'Cliente Anônimo'}
                                </div>
                                {location.customer_phone && (
                                  <div className="text-sm text-gray-500">{location.customer_phone}</div>
                                )}
                                <div className="text-xs text-gray-400">ID: {location.session_id}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                              </div>
                              {location.address && (
                                <div className="text-sm text-gray-500">{location.address}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {location.center_name}
                              </div>
                              <div className="text-sm text-gray-500">{location.center_address}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                location.distance_to_center_km <= 30 
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {formatDistance(location.distance_to_center_km)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(location.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
