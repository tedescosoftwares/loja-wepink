import React, { useState, useEffect } from 'react';
import { Upload, Trash2, Image as ImageIcon, X, Eye, Copy, Check } from 'lucide-react';

interface UploadedImage {
  id: number;
  filename: string;
  url: string;
  size: number;
  type: string;
  created_at: string;
}

interface ImageUploadManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (imageUrl: string) => void;
}

export default function ImageUploadManager({ isOpen, onClose, onSelectImage }: ImageUploadManagerProps) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedImage, setSelectedImage] = useState<UploadedImage | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchImages();
    }
  }, [isOpen]);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/images');
      const data = await response.json();
      setImages(data.images || []);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Arquivo muito grande! Máximo 5MB.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        await fetchImages(); // Refresh the list
        alert('Imagem enviada com sucesso!');
      } else {
        alert(data.error || 'Erro ao fazer upload da imagem');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Erro ao fazer upload da imagem');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(handleFileUpload);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(handleFileUpload);
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!confirm('Tem certeza que deseja remover esta imagem?')) return;
    
    try {
      const response = await fetch(`/api/admin/images/${imageId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchImages();
        if (selectedImage?.id === imageId) {
          setSelectedImage(null);
        }
      } else {
        alert('Erro ao remover imagem');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Erro ao remover imagem');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">Gerenciar Imagens</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Upload Area & Image List */}
          <div className="w-1/2 p-6 border-r overflow-y-auto">
            {/* Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 transition-colors ${
                dragOver
                  ? 'border-blue-400 bg-blue-50'
                  : uploading
                  ? 'border-orange-400 bg-orange-50'
                  : 'border-gray-300 hover:border-blue-400'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {uploading ? (
                <div>
                  <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-orange-600 font-medium">Enviando imagem...</p>
                </div>
              ) : (
                <div>
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Arraste imagens aqui ou clique para selecionar
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    JPG, PNG, GIF, WebP até 5MB
                  </p>
                  <label className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 cursor-pointer">
                    Selecionar Arquivos
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Images Grid */}
            <div>
              <h3 className="text-lg font-medium mb-4">
                Imagens Enviadas ({images.length})
              </h3>
              
              {loading ? (
                <div className="grid grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse"></div>
                  ))}
                </div>
              ) : images.length === 0 ? (
                <div className="text-center py-8">
                  <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma imagem enviada ainda</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {images.map((image) => (
                    <div
                      key={image.id}
                      className={`group relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer border-2 transition-colors ${
                        selectedImage?.id === image.id
                          ? 'border-blue-500'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedImage(image)}
                    >
                      <img
                        src={image.url}
                        alt={image.filename}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedImage(image);
                            }}
                            className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700"
                            title="Visualizar"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteImage(image.id);
                            }}
                            className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                            title="Remover"
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

          {/* Preview Area */}
          <div className="w-1/2 p-6 flex flex-col">
            {selectedImage ? (
              <div className="flex flex-col h-full">
                <h3 className="text-lg font-medium mb-4">Preview da Imagem</h3>
                
                <div className="flex-1 bg-gray-100 rounded-lg overflow-hidden mb-4 flex items-center justify-center">
                  <img
                    src={selectedImage.url}
                    alt={selectedImage.filename}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome do Arquivo
                    </label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {selectedImage.filename}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tamanho
                      </label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                        {formatFileSize(selectedImage.size)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo
                      </label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                        {selectedImage.type}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL da Imagem
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1 text-sm text-gray-900 bg-gray-50 p-2 rounded break-all">
                        {selectedImage.url.substring(0, 50)}...
                      </div>
                      <button
                        onClick={() => copyToClipboard(selectedImage.url)}
                        className="bg-gray-100 hover:bg-gray-200 p-2 rounded text-gray-600"
                        title="Copiar URL"
                      >
                        {copiedUrl === selectedImage.url ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        onSelectImage(selectedImage.url);
                        onClose();
                      }}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Usar Esta Imagem
                    </button>
                    <button
                      onClick={() => handleDeleteImage(selectedImage.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Selecione uma imagem para visualizar</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
