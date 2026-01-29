// Image upload utilities for Cloudflare Workers
import { optimizeProductImage } from './imageProcessing';

export interface UploadedImage {
  filename: string;
  url: string;
  size: number;
  type: string;
}

export const saveImageToStorage = async (
  file: ArrayBuffer,
  filename: string,
  contentType: string,
  env: any
): Promise<UploadedImage> => {
  try {
    console.log('🟡 IMAGE STORAGE: Starting to save image to local storage');
    console.log('🟡 IMAGE STORAGE: File size:', file.byteLength, 'bytes');
    console.log('🟡 IMAGE STORAGE: Content type:', contentType);
    console.log('🟡 IMAGE STORAGE: Filename:', filename);
    
    // Optimize the image for web display
    console.log('🖼️ IMAGE STORAGE: Optimizing image for web display...');
    const optimized = await optimizeProductImage(file, contentType);
    
    // Use the compressed image for storage
    const finalImage = optimized.compressedData;
    const finalSize = optimized.compressedSize;
    
    console.log('🖼️ IMAGE STORAGE: Image optimized - Original:', file.byteLength, 'bytes, Compressed:', finalSize, 'bytes');
    
    // Convert optimized image to base64
    const base64 = arrayBufferToBase64(finalImage);
    console.log('🟡 IMAGE STORAGE: Base64 conversion complete, length:', base64.length);
    
    // Create a data URL for immediate use
    const dataUrl = `data:image/jpeg;base64,${base64}`;
    
    // Generate a public URL path for the image
    const publicUrl = `/uploads/products/${filename}`;
    
    console.log('🟡 IMAGE STORAGE: Public URL created:', publicUrl);
    console.log('🟡 IMAGE STORAGE: Saving to database...');
    
    // Store both the base64 data and public URL in database
    const result = await env.DB.prepare(`
      INSERT INTO uploaded_images (filename, url, public_url, base64_data, size, type, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      filename,
      dataUrl,          // Data URL for immediate use
      publicUrl,        // Public URL path
      base64,           // Raw base64 data (compressed)
      finalSize,        // Compressed size
      'image/jpeg',     // Always JPEG after optimization
      new Date().toISOString()
    ).run();
    
    console.log('🟡 IMAGE STORAGE: Database save result:', result);
    
    if (!result.success) {
      console.error('🔴 IMAGE STORAGE: Database save failed');
      throw new Error('Failed to save image to database');
    }
    
    console.log('🟢 IMAGE STORAGE: Image saved successfully to local storage system');
    
    return {
      filename,
      url: publicUrl,  // Return public URL instead of data URL
      size: finalSize,
      type: 'image/jpeg'
    };
  } catch (error) {
    console.error('🔴 IMAGE STORAGE: Error saving image:', error);
    console.error('🔴 IMAGE STORAGE: Error stack:', (error as Error).stack);
    throw error;
  }
};

export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  try {
    console.log('🟡 BASE64: Converting ArrayBuffer to base64, size:', buffer.byteLength);
    
    const bytes = new Uint8Array(buffer);
    let binary = '';
    
    // Process in chunks to avoid stack overflow for large images
    const chunkSize = 8192; // 8KB chunks
    for (let i = 0; i < bytes.byteLength; i += chunkSize) {
      const chunk = bytes.slice(i, i + chunkSize);
      for (let j = 0; j < chunk.length; j++) {
        binary += String.fromCharCode(chunk[j]);
      }
    }
    
    console.log('🟡 BASE64: Binary string created, length:', binary.length);
    
    const base64 = btoa(binary);
    console.log('🟢 BASE64: Base64 conversion complete, length:', base64.length);
    
    return base64;
  } catch (error) {
    console.error('🔴 BASE64: Error converting to base64:', error);
    throw error;
  }
};

export const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  try {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  } catch (error) {
    console.error('🔴 BASE64: Error converting base64 to ArrayBuffer:', error);
    throw error;
  }
};

export const generateFileName = (originalName: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop() || 'jpg';
  return `product_${timestamp}_${random}.${extension}`;
};

export const validateImage = (file: File): { valid: boolean; error?: string } => {
  console.log('🟡 VALIDATION: Validating file:', file.name, 'size:', file.size, 'type:', file.type);
  
  // Check file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    console.error('🔴 VALIDATION: File too large:', file.size);
    return { valid: false, error: 'Imagem muito grande. Máximo 5MB.' };
  }
  
  // Check file type
  if (!file.type.startsWith('image/')) {
    console.error('🔴 VALIDATION: Invalid file type:', file.type);
    return { valid: false, error: 'Formato inválido. Envie apenas imagens.' };
  }
  
  // Check supported formats
  const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!supportedTypes.includes(file.type)) {
    console.error('🔴 VALIDATION: Unsupported format:', file.type);
    return { valid: false, error: 'Formato não suportado. Use JPG, PNG, GIF ou WebP.' };
  }
  
  console.log('🟢 VALIDATION: File validation passed');
  return { valid: true };
};
