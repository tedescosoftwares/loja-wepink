import React, { useState, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
  loading?: 'lazy' | 'eager';
  sizes?: string;
}

export default function OptimizedImage({
  src,
  alt,
  className = '',
  fallbackIcon,
  onLoad,
  onError,
  loading = 'lazy',
  sizes
}: OptimizedImageProps) {
  const [imageStatus, setImageStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [imageSrc, setImageSrc] = useState<string>('');

  useEffect(() => {
    if (!src) {
      setImageStatus('error');
      return;
    }

    // Reset state when src changes
    setImageStatus('loading');
    setImageSrc('');

    // Optimize the image URL
    let optimizedSrc = src;
    
    // Debug logging for bulk images
    console.log('🖼️ OPTIMIZED IMAGE: Processing image URL:', src);
    
    // If it's our local image system, ensure it's properly formatted
    if (src.startsWith('/uploads/')) {
      optimizedSrc = src;
      console.log('🖼️ OPTIMIZED IMAGE: Local upload detected');
    } else if (src.startsWith('data:')) {
      // Data URLs are already optimized
      optimizedSrc = src;
      console.log('🖼️ OPTIMIZED IMAGE: Data URL detected');
    } else if (src.includes('http')) {
      // External URLs - ensure proper format and add CORS proxy if needed
      try {
        const url = new URL(src);
        optimizedSrc = url.href; // Normalize the URL
        console.log('🖼️ OPTIMIZED IMAGE: External URL detected and normalized:', optimizedSrc);
      } catch (e) {
        console.error('🔴 OPTIMIZED IMAGE: Invalid URL format:', src, e);
        setImageStatus('error');
        return;
      }
    } else {
      // If it's a relative path, make it absolute
      if (src.startsWith('/')) {
        optimizedSrc = src;
      } else {
        console.error('🔴 OPTIMIZED IMAGE: Unrecognized image format:', src);
        setImageStatus('error');
        return;
      }
    }

    // Preload the image
    const img = new Image();
    img.onload = () => {
      console.log('🟢 OPTIMIZED IMAGE: Image loaded successfully:', optimizedSrc);
      setImageSrc(optimizedSrc);
      setImageStatus('loaded');
      onLoad?.();
    };
    img.onerror = (e) => {
      console.error('🔴 OPTIMIZED IMAGE: Image failed to load:', optimizedSrc, e);
      setImageStatus('error');
      onError?.();
    };
    
    // Add crossOrigin for external images to handle CORS
    if (optimizedSrc.includes('http') && !optimizedSrc.includes(window.location.hostname)) {
      img.crossOrigin = 'anonymous';
    }
    
    img.src = optimizedSrc;

  }, [src, onLoad, onError]);

  if (imageStatus === 'error' || !src) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400 ${className}`}>
        {fallbackIcon || (
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )}
      </div>
    );
  }

  if (imageStatus === 'loading') {
    return (
      <div className={`bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse ${className}`}>
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={`image-optimized image-responsive transition-opacity duration-300 ${className}`}
      loading={loading}
      decoding="async"
      sizes={sizes}
      style={{
        opacity: imageStatus === 'loaded' ? 1 : 0
      }}
    />
  );
}
