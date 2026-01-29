import { useState, useEffect } from "react";
import AdminLayout from "@/react-app/components/AdminLayout";
import { Settings as SettingsIcon, Save, Upload, X, Eye, Image, Type, TestTube } from "lucide-react";

interface SiteSetting {
  setting_key: string;
  setting_value: string | null;
}

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [logoMethod, setLogoMethod] = useState<'text' | 'image'>('text');
  const [imagePreview, setImagePreview] = useState<string>("");

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    // Set logo method based on current settings
    if (settings.site_logo_url && settings.site_logo_url.trim()) {
      setLogoMethod('image');
      setImagePreview(settings.site_logo_url);
    } else {
      setLogoMethod('text');
      setImagePreview("");
    }
  }, [settings]);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings");
      const data = await response.json();
      
      if (data.settings) {
        const settingsMap: Record<string, string> = {};
        data.settings.forEach((setting: SiteSetting) => {
          settingsMap[setting.setting_key] = setting.setting_value || '';
        });
        setSettings(settingsMap);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

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
        setSettings({ ...settings, site_logo_url: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview("");
    setSettings({ ...settings, site_logo_url: "" });
    // Reset file input
    const fileInput = document.getElementById('logo-image-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ settings }),
      });

      if (response.ok) {
        alert("Configurações salvas com sucesso!");
        // Refresh page to show changes
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        throw new Error("Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Erro ao salvar configurações. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = () => {
    setSettings({
      ...settings,
      site_name: 'Distribuidora AmBev',
      site_logo_text: '🥤 Distribuidora AmBev',
      site_logo_url: '',
      site_logo_link: '',
      automatic_payments_enabled: '0',
      manual_operator_mode: '0',
      pagleve_api_key: '',
      pagleve_secret: '',
      pagleve_base_url: 'https://api.pagaleve.com.br'
    });
    setImagePreview("");
    setLogoMethod('text');
  };

  const testPagLeveConnection = async () => {
    if (!settings.pagleve_api_key || !settings.pagleve_secret) {
      setTestResult({
        success: false,
        message: "Configure as credenciais PagLeve antes de testar"
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch("/api/admin/test-pagleve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      setTestResult({
        success: data.success,
        message: data.message || data.error
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: "Erro ao testar conexão: " + (error as Error).message
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Configurações do Site</h1>
          <div className="bg-white p-6 rounded-lg shadow animate-pulse">
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
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
          <h1 className="text-2xl font-bold text-gray-900">Configurações do Site</h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Site Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Site
            </label>
            <input
              type="text"
              value={settings.site_name || ''}
              onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
              placeholder="Ex: Distribuidora AmBev"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Nome que aparece no título das páginas
            </p>
          </div>

          {/* Logo Configuration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Logo do Site
            </label>
            
            {/* Logo Type Selector */}
            <div className="flex gap-4 mb-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="text"
                  checked={logoMethod === 'text'}
                  onChange={(e) => {
                    setLogoMethod(e.target.value as 'text' | 'image');
                    if (e.target.value === 'text') {
                      setSettings({ ...settings, site_logo_url: "" });
                      setImagePreview("");
                    }
                  }}
                  className="mr-2"
                />
                <Type className="w-4 h-4 mr-1" />
                <span className="text-sm text-gray-700">Logo de Texto</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="image"
                  checked={logoMethod === 'image'}
                  onChange={(e) => {
                    setLogoMethod(e.target.value as 'text' | 'image');
                    if (e.target.value === 'image') {
                      setSettings({ ...settings, site_logo_text: "" });
                    }
                  }}
                  className="mr-2"
                />
                <Image className="w-4 h-4 mr-1" />
                <span className="text-sm text-gray-700">Logo Imagem</span>
              </label>
            </div>

            {logoMethod === 'text' ? (
              <div>
                <input
                  type="text"
                  value={settings.site_logo_text || ''}
                  onChange={(e) => setSettings({ ...settings, site_logo_text: e.target.value })}
                  placeholder="Ex: 🥤 Distribuidora AmBev"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Texto que aparece como logo (pode incluir emojis)
                </p>
              </div>
            ) : (
              <div>
                {/* Image Upload Options */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL da Imagem
                    </label>
                    <input
                      type="url"
                      value={settings.site_logo_url || ''}
                      onChange={(e) => {
                        setSettings({ ...settings, site_logo_url: e.target.value });
                        setImagePreview(e.target.value);
                      }}
                      placeholder="https://exemplo.com/logo.png"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Cole a URL de uma imagem ou carregue um arquivo abaixo
                    </p>
                  </div>

                  <div className="text-center text-sm text-gray-500">OU</div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Carregar Arquivo
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center hover:border-blue-400 transition-colors">
                      {imagePreview ? (
                        <div className="relative inline-block">
                          <img
                            src={imagePreview}
                            alt="Preview do logo"
                            className="h-20 max-w-48 object-contain rounded-lg"
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
                            <label htmlFor="logo-image-upload" className="cursor-pointer">
                              <span className="mt-2 block text-sm font-medium text-gray-900">
                                Clique para carregar um logo
                              </span>
                              <span className="mt-1 block text-sm text-gray-500">
                                PNG, JPG, SVG até 5MB
                              </span>
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                    <input
                      id="logo-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Recomendado: altura máxima 60px para melhor visualização
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Logo Link */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Link do Logo (opcional)
              </label>
              <input
                type="url"
                value={settings.site_logo_link || ''}
                onChange={(e) => setSettings({ ...settings, site_logo_link: e.target.value })}
                placeholder="https://exemplo.com ou /pagina-interna"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                URL para onde o logo deve redirecionar quando clicado. Deixe vazio para não ter link.
              </p>
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pré-visualização do Logo
            </label>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center">
                {settings.site_logo_link ? (
                  <div className="flex items-center gap-2">
                    {logoMethod === 'image' && settings.site_logo_url ? (
                      <img
                        src={settings.site_logo_url}
                        alt={settings.site_name || 'Logo'}
                        className="h-10 max-w-48 object-contain cursor-pointer hover:opacity-80 transition-opacity"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="text-xl font-bold text-blue-600 cursor-pointer hover:opacity-80 transition-opacity">
                        {settings.site_logo_text || '🥤 Distribuidora AmBev'}
                      </span>
                    )}
                    <span className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded">
                      🔗 Link: {settings.site_logo_link}
                    </span>
                  </div>
                ) : (
                  <>
                    {logoMethod === 'image' && settings.site_logo_url ? (
                      <img
                        src={settings.site_logo_url}
                        alt={settings.site_name || 'Logo'}
                        className="h-10 max-w-48 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="text-xl font-bold text-blue-600">
                        {settings.site_logo_text || '🥤 Distribuidora AmBev'}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* PagLeve Payment Integration */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              💳 Integração PagLeve (Pagamentos Automáticos)
            </h3>
            
            {/* Enable/Disable Automatic Payments */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.automatic_payments_enabled === '1'}
                      onChange={(e) => setSettings({ 
                        ...settings, 
                        automatic_payments_enabled: e.target.checked ? '1' : '0' 
                      })}
                      className="rounded border-gray-300 text-green-600 shadow-sm focus:border-green-300 focus:ring focus:ring-green-200 focus:ring-opacity-50 mr-3"
                    />
                    <div>
                      <span className="text-sm font-semibold text-gray-900">Ativar Pagamentos Automáticos</span>
                      <p className="text-xs text-gray-600 mt-1">
                        Quando ativado, o sistema gera PIX automaticamente via PagLeve para novos pedidos
                      </p>
                    </div>
                  </label>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  settings.automatic_payments_enabled === '1' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {settings.automatic_payments_enabled === '1' ? '✅ ATIVO' : '❌ INATIVO'}
                </div>
              </div>

              {/* PagLeve API Credentials */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PagLeve API Key *
                  </label>
                  <input
                    type="text"
                    value={settings.pagleve_api_key || ''}
                    onChange={(e) => setSettings({ ...settings, pagleve_api_key: e.target.value })}
                    placeholder="Sua API Key do PagLeve"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Chave de API fornecida pelo PagLeve
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PagLeve Secret *
                  </label>
                  <input
                    type="password"
                    value={settings.pagleve_secret || ''}
                    onChange={(e) => setSettings({ ...settings, pagleve_secret: e.target.value })}
                    placeholder="Seu Secret do PagLeve"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Chave secreta fornecida pelo PagLeve
                  </p>
                </div>
              </div>

              {/* Test Connection Button */}
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={testPagLeveConnection}
                  disabled={testing || !settings.pagleve_api_key || !settings.pagleve_secret}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {testing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Testando...
                    </>
                  ) : (
                    <>
                      <TestTube className="w-4 h-4" />
                      Testar Conexão
                    </>
                  )}
                </button>

                {testResult && (
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                    testResult.success 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {testResult.success ? '✅' : '❌'}
                    {testResult.message}
                  </div>
                )}
              </div>

              {/* PagLeve Base URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PagLeve API URL
                </label>
                <input
                  type="url"
                  value={settings.pagleve_base_url || 'https://api.pagleve.com'}
                  onChange={(e) => setSettings({ ...settings, pagleve_base_url: e.target.value })}
                  placeholder="https://api.pagaleve.com.br"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL base da API do PagLeve (deixe padrão se não souber)
                </p>
              </div>

              {/* Fallback Mode */}
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.manual_operator_mode === '1'}
                      onChange={(e) => setSettings({ 
                        ...settings, 
                        manual_operator_mode: e.target.checked ? '1' : '0' 
                      })}
                      className="rounded border-gray-300 text-yellow-600 shadow-sm focus:border-yellow-300 focus:ring focus:ring-yellow-200 focus:ring-opacity-50 mr-3"
                    />
                    <div>
                      <span className="text-sm font-semibold text-gray-900">Modo Operador Manual</span>
                      <p className="text-xs text-gray-600 mt-1">
                        Força operação manual mesmo com automático ativo (para teste/emergência)
                      </p>
                    </div>
                  </label>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  settings.manual_operator_mode === '1' 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {settings.manual_operator_mode === '1' ? '🔧 MANUAL' : '🤖 AUTO'}
                </div>
              </div>

              {/* Status Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">
                  📊 Status da Configuração
                </h4>
                <div className="space-y-1 text-sm text-blue-800">
                  {settings.automatic_payments_enabled === '1' ? (
                    settings.manual_operator_mode === '1' ? (
                      <p>⚠️ <strong>Modo Manual Forçado:</strong> PIX será adicionado manualmente mesmo com automático ativo</p>
                    ) : (
                      <p>✅ <strong>Modo Automático:</strong> PIX será gerado automaticamente via PagLeve</p>
                    )
                  ) : (
                    <p>❌ <strong>Modo Manual:</strong> PIX será adicionado manualmente pelo admin</p>
                  )}
                  
                  {settings.pagleve_api_key && settings.pagleve_secret ? (
                    <p>🔑 Credenciais PagLeve configuradas</p>
                  ) : (
                    <p>⚠️ Credenciais PagLeve necessárias para modo automático</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <button
              onClick={resetToDefault}
              className="text-gray-600 hover:text-gray-800 underline"
            >
              Restaurar Configurações Padrão
            </button>
            
            <div className="flex gap-3">
              <button
                onClick={() => window.open('/', '_blank')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                <Eye className="w-4 h-4" />
                Ver Site
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <SettingsIcon className="w-5 h-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-blue-800 mb-1">
                Dicas de Configuração
              </h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>Logo:</strong> Use emojis para texto (🥤 🍺 🧃) ou PNG transparente para imagem</li>
                <li>• <strong>PagLeve:</strong> Obtenha suas credenciais no painel do PagLeve</li>
                <li>• <strong>Modo Manual:</strong> Use para testes ou quando o automático estiver indisponível</li>
                <li>• <strong>Teste:</strong> Faça um pedido teste após configurar o PagLeve</li>
                <li>• <strong>Backup:</strong> Mantenha sempre a opção manual disponível</li>
              </ul>
            </div>
          </div>
        </div>

        {/* PagLeve Integration Guide */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="w-5 h-5 text-green-400 mt-0.5 mr-3 flex-shrink-0">💳</div>
            <div>
              <h3 className="text-sm font-medium text-green-800 mb-1">
                Como Configurar o PagLeve
              </h3>
              <ol className="text-sm text-green-700 space-y-1 list-decimal list-inside">
                <li>Acesse seu painel PagLeve e vá em Configurações → API</li>
                <li>Copie sua <strong>API Key</strong> e <strong>Secret</strong></li>
                <li>Cole as credenciais nos campos acima</li>
                <li>Ative "Pagamentos Automáticos"</li>
                <li>Teste criando um pedido para verificar se o PIX é gerado automaticamente</li>
                <li>Se houver problemas, ative "Modo Operador Manual" temporariamente</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
