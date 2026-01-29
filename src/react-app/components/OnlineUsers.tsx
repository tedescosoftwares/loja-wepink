import { useState, useEffect } from 'react';
import { Users, Eye, Clock, Globe, Ban } from 'lucide-react';

interface OnlineUser {
  id: number;
  session_id: string;
  page_url: string;
  user_agent: string;
  ip_address: string;
  last_activity_at: string;
  created_at: string;
}

export default function OnlineUsers() {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOnlineUsers();
    
    // Refresh every 5 seconds
    const interval = setInterval(fetchOnlineUsers, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchOnlineUsers = async () => {
    try {
      const response = await fetch('/api/admin/sessions/online');
      const data = await response.json();
      setOnlineUsers(data.sessions || []);
    } catch (error) {
      console.error('Error fetching online users:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds}s atrás`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}m atrás`;
    } else {
      return `${Math.floor(diffInSeconds / 3600)}h atrás`;
    }
  };

  const getBrowserFromUserAgent = (userAgent: string) => {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Desconhecido';
  };

  const getDeviceFromUserAgent = (userAgent: string) => {
    if (userAgent.includes('Mobile')) return 'Mobile';
    if (userAgent.includes('Tablet')) return 'Tablet';
    return 'Desktop';
  };

  const banIpAddress = async (ipAddress: string) => {
    if (!confirm(`Tem certeza que deseja banir o IP ${ipAddress}? Essa ação impedirá que este usuário acesse a loja.`)) {
      return;
    }

    const reason = prompt('Motivo do banimento (opcional):') || 'Banido via painel de usuários online';

    try {
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
        alert(`IP ${ipAddress} foi banido com sucesso!`);
        // Refresh the user list
        fetchOnlineUsers();
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao banir IP');
      }
    } catch (error) {
      console.error('Error banning IP:', error);
      alert('Erro ao banir IP');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-green-500" />
          <h3 className="text-lg font-semibold text-gray-900">Usuários Online</h3>
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
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-green-500" />
          <h3 className="text-lg font-semibold text-gray-900">Usuários Online</h3>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-600">{onlineUsers.length}</span>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          Atualiza a cada 5s
        </div>
      </div>

      {onlineUsers.length === 0 ? (
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum usuário online no momento</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {onlineUsers.map((user) => (
            <div key={user.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-900 truncate">
                      Usuário #{user.id}
                    </span>
                    <span className="text-xs text-gray-500">
                      {getDeviceFromUserAgent(user.user_agent)}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Eye className="w-3 h-3" />
                      <span className="truncate">{user.page_url || '/'}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Globe className="w-3 h-3" />
                      <span>{getBrowserFromUserAgent(user.user_agent)}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>Última atividade: {formatTimeAgo(user.last_activity_at)}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                      <Globe className="w-3 h-3" />
                      <span className="font-mono">{user.ip_address}</span>
                    </div>
                  </div>
                </div>
                
                {/* Ban IP Button */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => banIpAddress(user.ip_address)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors group"
                    title={`Banir IP ${user.ip_address}`}
                  >
                    <Ban className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {onlineUsers.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Total de sessões ativas: {onlineUsers.length}</span>
            <span>Mostrando usuários ativos nos últimos 2 minutos</span>
          </div>
        </div>
      )}
    </div>
  );
}
