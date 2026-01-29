import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Minimize2, Maximize2, User, Zap, Check, CheckCheck, Loader2, Mail } from 'lucide-react';

interface ChatMessage {
  id: number;
  sender_type: 'customer' | 'admin';
  sender_name: string;
  message: string;
  created_at: string;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [sessionId, setSessionId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!sessionId) {
      const newSessionId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);
    }
  }, []);

  useEffect(() => {
    if (isOpen && sessionId && isConnected) {
      startPolling();
      setConnectionStatus('connected');
    } else {
      stopPolling();
    }

    return () => stopPolling();
  }, [isOpen, sessionId, isConnected]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Play notification sound for new admin messages
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender_type === 'admin' && !isOpen) {
        playNotificationSound();
        setHasUnreadMessages(true);
      }
    }
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaOZnZ8sF8JwUtfMzz2YIyBSGH0Oy6ajokbLzw7Z5NGhgQ');
      audio.volume = 0.3;
      audio.play().catch(() => {}); // Ignore errors if audio play fails
    } catch (e) {
      // Silent fallback
    }
  };

  const startPolling = () => {
    stopPolling();
    fetchMessages(); // Initial fetch
    pollingRef.current = setInterval(fetchMessages, 1000); // Poll every 1 second for real-time feel
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const startChat = async () => {
    if (!customerName.trim()) {
      alert('Por favor, digite seu nome para iniciar o chat.');
      return;
    }

    setLoading(true);
    setConnectionStatus('connecting');
    
    try {
      const response = await fetch('/api/chat/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          customer_name: customerName.trim(),
          customer_email: customerEmail.trim() || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // If the backend returned a different session_id (reused existing), update our sessionId
        if (data.session_id && data.session_id !== sessionId) {
          console.log(`💬 CHAT WIDGET: Switching to existing session ${data.session_id} from ${sessionId}`);
          setSessionId(data.session_id);
        }
        
        if (data.reused_existing) {
          console.log('💬 CHAT WIDGET: Reusing existing chat session - customer will see previous messages');
        }
        
        setIsConnected(true);
        setConnectionStatus('connected');
        // Use the potentially updated session ID for fetching messages
        await fetchMessages(data.session_id || sessionId);
      } else {
        throw new Error('Erro ao iniciar chat');
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      setConnectionStatus('error');
      alert('Erro ao conectar ao chat. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (currentSessionId?: string) => {
    const activeSessionId = currentSessionId || sessionId;
    if (!activeSessionId || !isConnected) return;

    try {
      const response = await fetch(`/api/chat/messages/${activeSessionId}`);
      if (response.ok) {
        const data = await response.json();
        const newMessages = data.messages || [];
        
        // Check for new messages from admin
        if (newMessages.length > messages.length) {
          const hasNewAdminMessages = newMessages.some((msg: ChatMessage) => 
            msg.sender_type === 'admin' && 
            !messages.find(existingMsg => existingMsg.id === msg.id)
          );
          
          if (hasNewAdminMessages && !isOpen) {
            setHasUnreadMessages(true);
          }
        }
        
        setMessages(newMessages);
        
        // Update last seen for admin messages
        const adminMessages = newMessages.filter((msg: ChatMessage) => msg.sender_type === 'admin');
        if (adminMessages.length > 0) {
          // Handle last seen if needed in the future
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setConnectionStatus('error');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !isConnected) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    // Optimistic update - add message immediately for better UX
    const tempMessage: ChatMessage = {
      id: Date.now(), // Temporary ID
      sender_type: 'customer',
      sender_name: customerName,
      message: messageText,
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, tempMessage]);

    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          message: messageText,
          sender_type: 'customer',
          sender_name: customerName,
        }),
      });

      if (response.ok) {
        // Remove temp message and fetch real messages
        await fetchMessages();
      } else {
        // Remove temp message on error
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
        throw new Error('Erro ao enviar mensagem');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Erro ao enviar mensagem. Tente novamente.');
      setNewMessage(messageText); // Restore message
      // Remove temp message
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isConnected) {
        sendMessage();
      } else {
        startChat();
      }
    }
  };

  const openChat = () => {
    setIsOpen(true);
    setIsMinimized(false);
    setHasUnreadMessages(false);
  };

  const closeChat = () => {
    setIsOpen(false);
    setIsMinimized(false);
    stopPolling();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500 animate-pulse';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Online';
      case 'connecting': return 'Conectando...';
      case 'error': return 'Erro de conexão';
      default: return 'Offline';
    }
  };

  // Chat button with improved design
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={openChat}
          className={`relative p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group transform hover:scale-110 ${
            hasUnreadMessages 
              ? 'bg-gradient-to-r from-red-500 to-red-600 animate-bounce' 
              : 'bg-gradient-to-r from-pink-600 to-[#ff0080]'
          } text-white`}
          title="Abrir Chat de Suporte"
        >
          <MessageCircle className="w-6 h-6" />
          
          {hasUnreadMessages && (
            <>
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center animate-pulse">!</span>
              <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30"></div>
            </>
          )}
          
          {/* Enhanced tooltip */}
          <div className="absolute bottom-full right-0 mb-3 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap shadow-lg">
            💬 Chat de Suporte
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
          </div>
        </button>
      </div>
    );
  }

  // Enhanced chat window with modern design
  return (
    <div className={`fixed bottom-6 right-6 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 transition-all duration-300 ${
      isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
    }`}>
      {/* Modern Header */}
      <div className="bg-gradient-to-r from-pink-500 to-[#ff0080] text-white p-4 rounded-t-2xl flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="relative">
            <MessageCircle className="w-6 h-6" />
            {isConnected && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-pink-600 animate-pulse"></div>
            )}
          </div>
          <div>
            <h3 className="font-semibold">Chat de Suporte</h3>
            {isConnected && (
              <div className="flex items-center gap-2 text-xs text-pink-100">
                <div className={`w-2 h-2 rounded-full ${getConnectionStatusColor()}`}></div>
                <span>{getConnectionStatusText()}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-white hover:bg-pink-800 p-2 rounded-lg transition-colors"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={closeChat}
            className="text-white hover:bg-red-500 p-2 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <>
          {!isConnected ? (
            /* Enhanced Connection Form */
            <div className="p-6 space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-pink-100 to-pink-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-[#ff0080]" />
                </div>
                <h4 className="font-semibold text-[#ff0080] mb-2">Bem-vindo ao Chat!</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Conecte-se conosco para receber suporte em tempo real
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#ff0080] mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Como você gostaria de ser chamado?"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#ff0080] mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                     Email (opcional)
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="seu@email.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm transition-all"
                  />
                </div>
                
                <button
                  onClick={startChat}
                  disabled={loading || !customerName.trim()}
                  className="w-full bg-gradient-to-r from-pink-600 to-[#ff0080] text-white py-3 px-4 rounded-lg hover:from-[#ff0080] hover:to-pink-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium transition-all transform hover:scale-105 disabled:hover:scale-100"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Conectando...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      Iniciar Conversa
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Enhanced Chat Interface */
            <>
              {/* Messages Area */}
              <div className="p-4 h-[420px] overflow-y-auto space-y-4 bg-gradient-to-b from-gray-50 to-white">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-12">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="w-10 h-10 text-pink-600" />
                    </div>
                    <h4 className="font-medium text-gray-700 mb-2">Conversa iniciada! 🎉</h4>
                    <p className="text-sm">Digite sua mensagem abaixo para começar</p>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_type === 'customer' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-3 rounded-2xl text-sm shadow-sm transition-all hover:shadow-md ${
                          message.sender_type === 'customer'
                            ? 'bg-gradient-to-r from-pink-600 to-[#ff0080] text-white rounded-br-md'
                            : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                        }`}
                      >
                        {message.sender_type === 'admin' && (
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 bg-gradient-to-r from-[#ff0080] to-pink-500 rounded-full flex items-center justify-center">
                              <User className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-xs font-medium text-pink-600">
                              {message.sender_name || 'Suporte'}
                            </span>
                          </div>
                        )}
                        <p className="leading-relaxed">{message.message}</p>
                        <div className="flex items-center justify-between mt-2">
                          <p className={`text-xs ${
                            message.sender_type === 'customer' 
                              ? 'text-blue-100' 
                              : 'text-gray-500'
                          }`}>
                            {formatTime(message.created_at)}
                          </p>
                          {message.sender_type === 'customer' && (
                            <div className="flex items-center gap-1">
                              {index === messages.length - 1 ? (
                                <CheckCheck className="w-3 h-3 text-pink-200" />
                              ) : (
                                <Check className="w-3 h-3 text-pink-200" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Enhanced Message Input */}
              <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={handleInputChange}
                      onKeyPress={handleKeyPress}
                      placeholder="Digite sua mensagem..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm transition-all resize-none"
                    />
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="bg-gradient-to-r from-pink-600 to-[#ff0080] text-white p-3 rounded-xl hover:from-pink-700 hover:to-[#ff0080] disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 disabled:hover:scale-100"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Connection status indicator */}
                <div className="flex items-center justify-center mt-2 text-xs text-gray-500">
                  <div className={`w-2 h-2 rounded-full mr-2 ${getConnectionStatusColor()}`}></div>
                  {getConnectionStatusText()}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
