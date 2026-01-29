import { useState, useEffect } from 'react';
import { Shield, Ban, RotateCcw, Search, Trash2, Clock, User } from 'lucide-react';

interface BannedIp {
  id: number;
  ip_address: string;
  reason?: string;
  banned_by?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function BannedIpManager() {
  const [bannedIps, setBannedIps] = useState<BannedIp[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newIp, setNewIp] = useState('');
  const [newReason, setNewReason] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBannedIps();
  }, []);

  const fetchBannedIps = async () => {
    try {
      const response = await fetch('/api/admin/banned-ips');
      const data = await response.json();
      setBannedIps(data.banned_ips || []);
    } catch (error) {
      console.error('Error fetching banned IPs:', error);
    } finally {
      setLoading(false);
    }
  };

  const banIp = async (ipAddress: string, reason: string = '') => {
    try {
      setSubmitting(true);
      const response = await fetch('/api/admin/ban-ip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ip_address: ipAddress,
          reason: reason,
          banned_by: 'Admin'
        }),
      });

      if (response.ok) {
        await fetchBannedIps();
        setNewIp('');
        setNewReason('');
        setShowAddForm(false);
        alert('IP banido com sucesso!');
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao banir IP');
      }
    } catch (error) {
      console.error('Error banning IP:', error);
      alert('Erro ao banir IP');
    } finally {
      setSubmitting(false);
    }
  };

  const unbanIp = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/unban-ip/${id}`, {
        method: 'PUT',
      });

      if (response.ok) {
        await fetchBannedIps();
        alert('IP desbanido com sucesso!');
      } else {
        alert('Erro ao desbanir IP');
      }
    } catch (error) {
      console.error('Error unbanning IP:', error);
      alert('Erro ao desbanir IP');
    }
  };

  const deleteIp = async (id: number) => {
    if (!confirm('Tem certeza que deseja remover este IP da lista?')) return;

    try {
      const response = await fetch(`/api/admin/banned-ips/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchBannedIps();
        alert('IP removido da lista!');
      } else {
        alert('Erro ao remover IP');
      }
    } catch (error) {
      console.error('Error deleting banned IP:', error);
      alert('Erro ao remover IP');
    }
  };

  const handleAddIp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIp.trim()) return;
    
    // Basic IP validation
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    if (!ipRegex.test(newIp.trim())) {
      alert('Por favor, insira um endereço IP válido (ex: 192.168.1.1)');
      return;
    }

    banIp(newIp.trim(), newReason.trim());
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
          🚫 Banido
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
          ✅ Desbanido
        </span>
      );
    }
  };

  const filteredIps = bannedIps.filter(ip => 
    ip.ip_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ip.reason && ip.reason.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-900">IPs Banidos</h3>
          <div className="animate-pulse bg-gray-200 rounded-full w-6 h-6"></div>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-semibold text-gray-900">Gerenciar IPs Banidos</h3>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-red-600">{bannedIps.filter(ip => ip.is_active).length} ativos</span>
              </div>
              {bannedIps.filter(ip => !ip.is_active).length > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-600">{bannedIps.filter(ip => !ip.is_active).length} desbanidos</span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <Ban className="w-4 h-4" />
            Banir IP
          </button>
        </div>

        {/* Add IP Form */}
        {showAddForm && (
          <form onSubmit={handleAddIp} className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-red-800 mb-3">Banir Novo IP</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-red-700 mb-1">
                  Endereço IP *
                </label>
                <input
                  type="text"
                  value={newIp}
                  onChange={(e) => setNewIp(e.target.value)}
                  placeholder="192.168.1.1"
                  className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-red-700 mb-1">
                  Motivo (opcional)
                </label>
                <input
                  type="text"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="Comportamento suspeito, spam, etc."
                  className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <button
                type="submit"
                disabled={submitting || !newIp.trim()}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" />
                    Banindo...
                  </>
                ) : (
                  <>
                    <Ban className="w-4 h-4" />
                    Banir IP
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setNewIp('');
                  setNewReason('');
                }}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por IP ou motivo..."
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="p-6">
        {filteredIps.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm ? 'Nenhum IP encontrado com os critérios de busca' : 'Nenhum IP banido no momento'}
            </p>
            {!searchTerm && (
              <div className="space-y-2">
                <p className="text-sm text-gray-400">
                  Use o botão "Banir IP" para adicionar IPs à lista de bloqueio
                </p>
                <p className="text-xs text-gray-400">
                  💡 Dica: IPs banidos podem ser desbanidos a qualquer momento
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredIps.map((bannedIp) => (
              <div key={bannedIp.id} className={`border rounded-lg p-4 transition-colors ${
                bannedIp.is_active 
                  ? 'border-red-200 bg-red-50' 
                  : 'border-gray-200 bg-gray-50 opacity-60'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-lg font-semibold text-gray-900">
                        {bannedIp.ip_address}
                      </span>
                      {getStatusBadge(bannedIp.is_active)}
                    </div>
                    
                    {bannedIp.reason && (
                      <div className="mb-2">
                        <p className="text-sm text-gray-700">
                          <strong>Motivo:</strong> {bannedIp.reason}
                        </p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600">
                      {bannedIp.banned_by && (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>Banido por: {bannedIp.banned_by}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Em: {formatDate(bannedIp.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {bannedIp.is_active ? (
                      <button
                        onClick={() => unbanIp(bannedIp.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-sm font-medium border border-green-200"
                        title="Desbanir este IP"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Desbanir
                      </button>
                    ) : (
                      <button
                        onClick={() => banIp(bannedIp.ip_address, bannedIp.reason || '')}
                        className="flex items-center gap-1 px-3 py-1.5 text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-sm font-medium border border-red-200"
                        title="Banir novamente este IP"
                      >
                        <Ban className="w-4 h-4" />
                        Banir
                      </button>
                    )}
                    <button
                      onClick={() => deleteIp(bannedIp.id)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Remover permanentemente da lista"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {filteredIps.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                Mostrando {filteredIps.length} de {bannedIps.length} IPs
              </span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  {bannedIps.filter(ip => ip.is_active).length} banidos
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  {bannedIps.filter(ip => !ip.is_active).length} desbanidos
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
