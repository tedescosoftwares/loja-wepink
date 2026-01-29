import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Users, Clock, User, Minimize2, Maximize2, Settings, Search, Filter, Volume2, VolumeX, X, RotateCcw, Archive } from 'lucide-react';

interface ChatMessage {
  id: number;
  sender_type: 'customer' | 'admin';
  sender_name: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface ChatSession {
  id: number;
  session_id: string;
  customer_name?: string;
  customer_email?: string;
  is_active: boolean;
  last_activity_at: string;
  unread_count?: number;
  last_message?: string;
}

export default function AdminChatManager() {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [adminName, setAdminName] = useState('Suporte');
  const [isMinimized, setIsMinimized] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);
  const [showInactiveChats, setShowInactiveChats] = useState(false);
  const [closingSession, setClosingSession] = useState<number | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageCountRef = useRef<number>(0);

  useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      fetchMessages(selectedSession.session_id);
      markSessionAsRead(selectedSession.session_id);
    }
  }, [selectedSession]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Play notification sound for new messages
  useEffect(() => {
    const totalUnread = getTotalUnreadCount();
    if (totalUnread > lastMessageCountRef.current && soundEnabled && !isMinimized) {
      playNotificationSound();
    }
    lastMessageCountRef.current = totalUnread;
  }, [chatSessions, soundEnabled, isMinimized]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const playNotificationSound = () => {
    if (!soundEnabled) return;
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaOZnZ8sF8JwUtfMzz2YIyBSGH0Oy6ajokbLzw7Z5NGhgQ');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (e) {
      console.log('🔔 Nova mensagem no chat!');
    }
  };

  const startPolling = () => {
    stopPolling();
    fetchChatSessions();
    pollingRef.current = setInterval(() => {
      fetchChatSessions();
      if (selectedSession) {
        fetchMessages(selectedSession.session_id);
      }
    }, 1500); // Poll every 1.5 seconds for better real-time feel
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const fetchChatSessions = async () => {
    try {
      const response = await fetch('/api/admin/chat/sessions');
      if (response.ok) {
        const data = await response.json();
        setChatSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
    }
  };

  const fetchMessages = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/admin/chat/messages/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const markSessionAsRead = async (sessionId: string) => {
    try {
      await fetch(`/api/admin/chat/sessions/${sessionId}/read`, {
        method: 'PUT'
      });
      // Refresh sessions to update unread count
      setTimeout(fetchChatSessions, 500);
    } catch (error) {
      console.error('Error marking session as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedSession) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    // Optimistic update
    const tempMessage: ChatMessage = {
      id: Date.now(),
      sender_type: 'admin',
      sender_name: adminName,
      message: messageText,
      is_read: true,
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, tempMessage]);

    try {
      const response = await fetch('/api/admin/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: selectedSession.session_id,
          message: messageText,
          sender_type: 'admin',
          sender_name: adminName,
        }),
      });

      if (response.ok) {
        await fetchMessages(selectedSession.session_id);
        await fetchChatSessions(); // Update session list
      } else {
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
        throw new Error('Erro ao enviar mensagem');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Erro ao enviar mensagem. Tente novamente.');
      setNewMessage(messageText);
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'agora';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const getTotalUnreadCount = () => {
    return chatSessions.reduce((total, session) => total + (session.unread_count || 0), 0);
  };

  const closeChat = async (sessionId: string, sessionDbId: number) => {
    if (closingSession) return;
    
    setClosingSession(sessionDbId);
    
    try {
      const response = await fetch(`/api/admin/chat/sessions/${sessionId}/close`, {
        method: 'PUT'
      });
      
      if (response.ok) {
        // If this was the selected session, clear selection
        if (selectedSession?.id === sessionDbId) {
          setSelectedSession(null);
        }
        // Refresh sessions
        await fetchChatSessions();
      } else {
        throw new Error('Erro ao fechar chat');
      }
    } catch (error) {
      console.error('Error closing chat:', error);
      alert('Erro ao fechar chat. Tente novamente.');
    } finally {
      setClosingSession(null);
    }
  };

  const reopenChat = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/admin/chat/sessions/${sessionId}/reopen`, {
        method: 'PUT'
      });
      
      if (response.ok) {
        await fetchChatSessions();
      } else {
        throw new Error('Erro ao reabrir chat');
      }
    } catch (error) {
      console.error('Error reopening chat:', error);
      alert('Erro ao reabrir chat. Tente novamente.');
    }
  };

  const getFilteredSessions = () => {
    let filtered = chatSessions;
    
    // Filter by active/inactive status
    if (!showInactiveChats) {
      filtered = filtered.filter(session => session.is_active);
    }
    
    if (showOnlyUnread) {
      filtered = filtered.filter(session => (session.unread_count || 0) > 0);
    }
    
    if (searchTerm.trim()) {
      filtered = filtered.filter(session => 
        (session.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (session.customer_email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (session.last_message?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Remove potential duplicates by grouping by customer name + email and keeping the most recent
    const uniqueCustomers = new Map();
    
    for (const session of filtered) {
      const customerKey = `${session.customer_name || 'anonymous'}_${session.customer_email || 'no-email'}`.toLowerCase();
      
      if (!uniqueCustomers.has(customerKey)) {
        uniqueCustomers.set(customerKey, session);
      } else {
        // Keep the session with the most recent activity
        const existing = uniqueCustomers.get(customerKey);
        if (new Date(session.last_activity_at) > new Date(existing.last_activity_at)) {
          uniqueCustomers.set(customerKey, session);
        }
      }
    }
    
    // Convert back to array and sort by last activity
    const uniqueFiltered = Array.from(uniqueCustomers.values());
    uniqueFiltered.sort((a, b) => new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime());
    
    return uniqueFiltered;
  };

  // Minimized state - Chat button
  if (isMinimized) {
    return (
      <div 
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-full shadow-lg cursor-pointer z-40 transform hover:scale-110 transition-all duration-300 group"
        onClick={() => setIsMinimized(false)}
        title="Abrir Chat Administrativo"
      >
        <div className="relative">
          <MessageCircle className="w-7 h-7" />
          {getTotalUnreadCount() > 0 && (
            <>
              <div className="absolute -top-2 -right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse min-w-[20px] h-5 flex items-center justify-center">
                {getTotalUnreadCount()}
              </div>
              <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30"></div>
            </>
          )}
        </div>
        
        {/* Enhanced tooltip */}
        <div className="absolute bottom-full right-0 mb-3 px-4 py-3 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap shadow-xl">
          <div className="flex flex-col items-center">
            <span className="font-semibold">💬 Chat Admin</span>
            <span className="text-xs text-gray-300">
              {chatSessions.length} {chatSessions.length === 1 ? 'conversa' : 'conversas'}
            </span>
            {getTotalUnreadCount() > 0 && (
              <span className="text-xs text-red-300 font-medium">
                {getTotalUnreadCount()} mensagens não lidas
              </span>
            )}
          </div>
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
        </div>
      </div>
    );
  }

  const containerWidth = isExpanded ? 'w-[800px]' : 'w-[500px]';
  const containerHeight = isExpanded ? 'h-[700px]' : 'h-[600px]';

  return (
    <div className={`fixed bottom-6 right-6 ${containerWidth} ${containerHeight} bg-white rounded-2xl shadow-2xl border border-gray-200 z-40 flex transition-all duration-300`}>
      {/* Sessions List */}
      <div className={`${isExpanded ? 'w-1/2' : 'w-2/5'} border-r border-gray-200 flex flex-col bg-gray-50 rounded-l-2xl`}>
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-tl-2xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span className="font-semibold">Conversas</span>
              {getTotalUnreadCount() > 0 && (
                <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse">
                  {getTotalUnreadCount()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="text-white hover:bg-blue-800 p-1.5 rounded-lg transition-colors"
                title={soundEnabled ? 'Desativar som' : 'Ativar som'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-white hover:bg-blue-800 p-1.5 rounded-lg transition-colors"
                title={isExpanded ? 'Compactar' : 'Expandir'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsMinimized(true)}
                className="text-white hover:bg-blue-800 p-1.5 rounded-lg transition-colors"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Search and Filters */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-200" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar conversas..."
                className="w-full pl-10 pr-3 py-2 bg-blue-800 text-white placeholder-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowOnlyUnread(!showOnlyUnread)}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs transition-colors ${
                  showOnlyUnread 
                    ? 'bg-blue-800 text-white' 
                    : 'bg-blue-700 text-blue-100 hover:bg-blue-800'
                }`}
              >
                <Filter className="w-3 h-3" />
                Não lidas
              </button>
              <button
                onClick={() => setShowInactiveChats(!showInactiveChats)}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs transition-colors ${
                  showInactiveChats 
                    ? 'bg-blue-800 text-white' 
                    : 'bg-blue-700 text-blue-100 hover:bg-blue-800'
                }`}
              >
                <Archive className="w-3 h-3" />
                {showInactiveChats ? 'Todos' : 'Fechados'}
              </button>
              <span className="text-xs text-blue-200">
                {getFilteredSessions().length} de {chatSessions.length}
              </span>
            </div>
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto">
          {getFilteredSessions().length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="font-medium">Nenhuma conversa</p>
              <p className="text-sm">
                {searchTerm ? 'Nenhum resultado encontrado' : 'Aguardando clientes...'}
              </p>
            </div>
          ) : (
            getFilteredSessions().map((session) => (
              <div
                key={session.id}
                className={`relative border-b border-gray-200 hover:bg-white transition-colors ${
                  selectedSession?.id === session.id ? 'bg-white border-l-4 border-l-blue-500' : ''
                } ${!session.is_active ? 'opacity-60 bg-gray-50' : ''}`}
              >
                <button
                  onClick={() => setSelectedSession(session)}
                  className="w-full p-4 text-left"
                >
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 bg-gradient-to-r ${session.is_active ? 'from-blue-500 to-purple-600' : 'from-gray-400 to-gray-500'} rounded-full flex items-center justify-center text-white text-sm font-semibold`}>
                        {(session.customer_name || 'C')[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 text-sm">
                            {session.customer_name || 'Cliente Anônimo'}
                          </span>
                          {!session.is_active && (
                            <span className="bg-gray-500 text-white px-2 py-1 rounded-full text-xs">
                              Fechado
                            </span>
                          )}
                        </div>
                        {session.customer_email && (
                          <p className="text-xs text-gray-500">{session.customer_email}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {session.unread_count && session.unread_count > 0 && (
                        <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse">
                          {session.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                
                {session.last_message && (
                  <p className="text-xs text-gray-600 truncate mb-2 pl-10">
                    {session.last_message.length > 50 
                      ? session.last_message.substring(0, 50) + '...' 
                      : session.last_message}
                  </p>
                )}
                
                <div className="flex items-center gap-1 text-xs text-gray-500 pl-10">
                    <Clock className="w-3 h-3" />
                    {formatTime(session.last_activity_at)}
                  </div>
                </button>
                
                {/* Chat Actions */}
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  {session.is_active ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closeChat(session.session_id, session.id);
                      }}
                      disabled={closingSession === session.id}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                      title="Fechar chat"
                    >
                      {closingSession === session.id ? (
                        <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <X className="w-3 h-3" />
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        reopenChat(session.session_id);
                      }}
                      className="p-1.5 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-md transition-colors"
                      title="Reabrir chat"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${isExpanded ? 'w-1/2' : 'w-3/5'} flex flex-col`}>
        {selectedSession ? (
          <>
            {/* Enhanced Chat Header */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b border-gray-200 rounded-tr-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-gradient-to-r ${selectedSession.is_active ? 'from-green-500 to-blue-600' : 'from-gray-400 to-gray-500'} rounded-full flex items-center justify-center text-white font-semibold`}>
                    {(selectedSession.customer_name || 'C')[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">
                        {selectedSession.customer_name || 'Cliente Anônimo'}
                      </h3>
                      {!selectedSession.is_active && (
                        <span className="bg-gray-500 text-white px-2 py-1 rounded-full text-xs">
                          Chat Fechado
                        </span>
                      )}
                    </div>
                    {selectedSession.customer_email && (
                      <p className="text-sm text-gray-600">{selectedSession.customer_email}</p>
                    )}
                    <div className={`flex items-center gap-2 text-xs ${selectedSession.is_active ? 'text-green-600' : 'text-gray-500'}`}>
                      <div className={`w-2 h-2 ${selectedSession.is_active ? 'bg-green-500 animate-pulse' : 'bg-gray-400'} rounded-full`}></div>
                      <span>{selectedSession.is_active ? 'Online agora' : 'Chat inativo'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {selectedSession.is_active ? (
                    <button
                      onClick={() => closeChat(selectedSession.session_id, selectedSession.id)}
                      disabled={closingSession === selectedSession.id}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Fechar chat"
                    >
                      {closingSession === selectedSession.id ? (
                        <div className="w-4 h-4 border border-red-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => reopenChat(selectedSession.session_id)}
                      className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                      title="Reabrir chat"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                  <Settings className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Enhanced Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gradient-to-b from-gray-50 to-white">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Inicie a conversa enviando uma mensagem</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-md px-4 py-3 rounded-2xl text-sm shadow-sm transition-all hover:shadow-md ${
                        message.sender_type === 'admin'
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-md'
                          : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                      }`}
                    >
                      {message.sender_type === 'customer' && (
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-5 h-5 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                            <User className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-xs font-medium text-blue-600">
                            {message.sender_name}
                          </span>
                        </div>
                      )}
                      <p className="leading-relaxed">{message.message}</p>
                      <p className={`text-xs mt-2 ${
                        message.sender_type === 'admin' 
                          ? 'text-blue-100' 
                          : 'text-gray-500'
                      }`}>
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Enhanced Message Input */}
            <div className={`p-4 border-t border-gray-200 bg-white rounded-br-2xl ${!selectedSession.is_active ? 'opacity-60' : ''}`}>
              {selectedSession.is_active ? (
                <>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      placeholder="Seu nome"
                      className="text-sm px-3 py-2 border border-gray-300 rounded-lg flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Digite sua resposta..."
                        rows={2}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                      />
                    </div>
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 disabled:hover:scale-100"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span>Pressione Enter para enviar</span>
                    <span>{newMessage.length}/500</span>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 mb-3">Este chat foi fechado</p>
                  <button
                    onClick={() => reopenChat(selectedSession.session_id)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 mx-auto"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reabrir Chat
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Enhanced No Session Selected */
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-tr-2xl rounded-br-2xl">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-700 mb-2">Chat Administrativo</h3>
              <p className="text-sm text-gray-500 mb-4">Selecione uma conversa para começar</p>
              <div className="text-xs text-gray-400">
                💡 Receba notificações em tempo real de novas mensagens
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
