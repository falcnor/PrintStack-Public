import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook for managing image optimization and progressive loading
 * @param {Object} config - Configuration options
 * @returns {Object} Image optimization utilities
 */
export const useImageOptimization = (config = {}) => {
  const {
    defaultQuality = 75,
    enableWebP = true,
    enableAvif = true,
    lazyLoad = true,
    placeholderQuality = 10,
    maxFileSize = 1024 * 1024, // 1MB
    cacheStrategy = 'memory' // 'memory', 'indexeddb', 'none'
  } = config;

  const [imageCache] = useState(() => {
    if (cacheStrategy === 'memory') {
      return new Map();
    }
    return null;
  });

  const [supportedFormats, setSupportedFormats] = useState({
    webp: false,
    avif: false,
    lazyLoadingSupported: false
  });

  // Detect browser capabilities
  useEffect(() => {
    const detectCapabilities = async () => {
      // Detect WebP support
      const webpSupport = await checkFormatSupport('webp');

      // Detect AVIF support
      const avifSupport = await checkFormatSupport('avif');

      // Detect Lazy loading support
      const loadingSupport = 'loading' in HTMLImageElement.prototype;

      setSupportedFormats({
        webp: webpSupport,
        avif: avifSupport,
        lazyLoadingSupported: loadingSupport
      });
    };

    detectCapabilities();
  }, []);

  /**
   * Check if a specific image format is supported
   * @param {string} format - Format to check
   * @returns {Promise<boolean>} Support status
   */
  const checkFormatSupport = (format) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(false);
        return;
      }

      canvas.width = 1;
      canvas.height = 1;

      const imageData = ctx.createImageData(1, 1);
      ctx.putImageData(imageData, 0, 0);

      const dataUrl = format === 'avif'
        ? canvas.toDataURL('image/avif')
        : canvas.toDataURL('image/webp');

      canvas.remove();

      // Check if the data URL indicates support
      resolve(
        dataUrl.indexOf(`data:image/${format}`) === 0 &&
        dataUrl.indexOf('data:image/png') !== 0
      );
    });
  };

  /**
   * Generate optimized image URL
   * @param {string} originalUrl - Original image URL
   * @param {Object} options - Optimization options
   * @returns {string} Optimized URL
   */
  const optimizeImageUrl = useCallback((originalUrl, options = {}) => {
    if (!originalUrl) return originalUrl;

    // Check cache first
    const cacheKey = `${originalUrl}-${JSON.stringify(options)}`;
    if (imageCache && imageCache.has(cacheKey)) {
      return imageCache.get(cacheKey);
    }

    const {
      width,
      height,
      quality = defaultQuality,
      format = 'auto',
      fit = 'cover',
      crop = null
    } = options;

    // If URL already has optimization parameters, return as-is
    if (originalUrl.includes('?') && originalUrl.includes('fm=')) {
      return originalUrl;
    }

    let optimizedUrl = originalUrl;

    // For CDNs that support query parameters (Cloudinary, ImageKit, etc.)
    if (originalUrl.includes('cloudinary.com') || originalUrl.includes('imagekit.io')) {
      const url = new URL(originalUrl);
      const params = new URLSearchParams(url.search);

      if (width) params.set('w', width);
      if (height) params.set('h', height);
      if (format !== 'auto') {
        params.set('fm', format);
      } else if (enableWebP && supportedFormats.webp) {
        params.set('fm', 'webp');
      } else if (enableAvif && supportedFormats.avif) {
        params.set('fm', 'avif');
      }
      if (quality && quality !== 100) params.set('q', quality);
      if (fit) params.set('fit', fit);
      if (crop) params.set('c', crop);

      url.search = params.toString();
      optimizedUrl = url.toString();
    } else {
      // Fallback for other images - try to append basic params
      const separator = originalUrl.includes('?') ? '&' : '?';
      const params = new URLSearchParams();

      if (width) params.set('width', width);
      if (height) params.set('height', height);
      if (format !== 'auto') {
        params.set('format', format);
      }

      const paramString = params.toString();
      if (paramString) {
        optimizedUrl = originalUrl + separator + paramString;
      }
    }

    // Cache the result
    if (imageCache) {
      if (imageCache.size > 100) { // Limit cache size
        const firstKey = imageCache.keys().next().value;
        imageCache.delete(firstKey);
      }
      imageCache.set(cacheKey, optimizedUrl);
    }

    return optimizedUrl;
  }, [defaultQuality, enableWebP, enableAvif, supportedFormats, imageCache]);

  /**
   * Generate low-quality placeholder URL
   * @param {string} originalUrl - Original image URL
   * @param {Object} options - Placeholder options
   * @returns {string} Placeholder URL
   */
  const generatePlaceholderUrl = useCallback((originalUrl, options = {}) => {
    return optimizeImageUrl(originalUrl, {
      width: options.width || 100,
      height: options.height || 100,
      quality: options.quality || placeholderQuality,
      format: 'jpeg',
      ...options
    });
  }, [optimizeImageUrl, placeholderQuality]);

  /**
   * Preload image for better performance
   * @param {string} imageUrl - Image URL to preload
   * @returns {Promise<boolean>} Load success status
   */
  const preloadImage = useCallback(async (imageUrl) => {
    try {
      const img = new Image();

      return new Promise((resolve) => {
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);

        // Use lazy loading if supported and image would be loaded lazily anyway
        if (supportedFormats.lazyLoadingSupported && lazyLoad) {
          img.loading = 'lazy';
        }

        img.src = imageUrl;
      });
    } catch (error) {
      console.error('Failed to preload image:', error);
      return false;
    }
  }, [supportedFormats.lazyLoadingSupported, lazyLoad]);

  /**
   * Get responsive image sources for picture element
   * @param {string} imageUrl - Base image URL
   * @param {Object} options - Responsive options
   * @returns {Array} Sources array
   */
  const generateResponsiveSources = useCallback((imageUrl, options = {}) => {
    const {
      sizes = [400, 600, 800, 1200, 1600],
      aspectRatio = null,
      quality = defaultQuality
    } = options;

    const sources = [];

    sizes.forEach(width => {
      const height = aspectRatio ? Math.round(width / aspectRatio) : undefined;

      // Add WebP source if supported
      if (enableWebP && supportedFormats.webp) {
        sources.push({
          srcset: optimizeImageUrl(imageUrl, {
            width,
            height,
            quality,
            format: 'webp'
          }),
          type: 'image/webp',
          width
        });
      }

      // Add AVIF source if supported
      if (enableAvif && supportedFormats.avif) {
        sources.push({
          srcset: optimizeImageUrl(imageUrl, {
            width,
            height,
            quality,
            format: 'avif'
          }),
          type: 'image/avif',
          width
        });
      }

      // Add fallback JPEG/WebP source
      sources.push({
        srcset: optimizeImageUrl(imageUrl, {
          width,
          height,
          quality,
          format: 'auto'
        }),
        type: supportedFormats.webp ? 'image/webp' : 'image/jpeg',
        width
      });
    });

    return sources;
  }, [enableWebP, enableAvif, supportedFormats, defaultQuality, optimizeImageUrl]);

  /**
   * Validate image before processing
   * @param {string} imageUrl - Image URL to validate
   * @returns {Promise<Object>} Validation result
   */
  const validateImage = useCallback(async (imageUrl) => {
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' });

      if (!response.ok) {
        return {
          valid: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.startsWith('image/')) {
        return {
          valid: false,
          error: 'Not an image file'
        };
      }

      const contentLength = response.headers.get('content-length');
      const size = contentLength ? parseInt(contentLength, 10) : null;

      if (size && size > maxFileSize) {
        return {
          valid: false,
          error: `Image size (${(size / (1024 * 1024)).toFixed(1)}MB) exceeds limit (${(maxFileSize / (1024 * 1024)).toFixed(1)}MB)`
        };
      }

      return {
        valid: true,
        type: contentType,
        size
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }, [maxFileSize]);

  /**
   * Clear image cache
   */
  const clearCache = useCallback(() => {
    if (imageCache) {
      imageCache.clear();
    }
  }, [imageCache]);

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  const getCacheStats = useCallback(() => {
    if (!imageCache) return { enabled: false };

    return {
      enabled: true,
      size: imageCache.size,
      strategy: cacheStrategy,
      memoryUsage: imageCache.size * 100 // Rough estimate
    };
  }, [imageCache, cacheStrategy]);

  return {
    // State
    supportedFormats,
    cacheStats: getCacheStats(),

    // Optimization functions
    optimizeImageUrl,
    generatePlaceholderUrl,
    generateResponsiveSources,

    // Utility functions
    preloadImage,
    validateImage,

    // Cache management
    clearCache,

    // Configuration
    config: {
      defaultQuality,
      enableWebP,
      enableAvif,
      lazyLoad,
      placeholderQuality,
      maxFileSize,
      cacheStrategy
    }
  };
};

/**
 * Hook for image loading states and error handling
 * @param {Object} options - Hook options
 * @returns {Object} Loading state management
 */
export const useImageLoading = (options = {}) => {
  const {
    retryAttempts = 3,
    retryDelay = 1000,
    timeout = 10000
  } = options;

  const [state, setState] = useState({
    loading: false,
    loaded: false,
    error: null,
    retryCount: 0
  });

  const timeoutRef = useRef(null);
  const retryTimeoutRef = useRef(null);

  const loadImage = useCallback(async (imageSrc) => {
    setState({ loading: true, loaded: false, error: null, retryCount: 0 });

    const attemptLoad = (isRetry = false) => {
      return new Promise((resolve, reject) => {
        const img = new Image();

        // Set timeout
        timeoutRef.current = setTimeout(() => {
          reject(new Error(`Load timeout after ${timeout}ms`));
        }, timeout);

        img.onload = () => {
          clearTimeout(timeoutRef.current);
          resolve(img);
        };

        img.onerror = () => {
          clearTimeout(timeoutRef.current);
          reject(new Error('Failed to load image'));
        };

        img.src = imageSrc;
      });
    };

    try {
      await attemptLoad();
      setState({ loading: false, loaded: true, error: null, retryCount: 0 });
    } catch (error) {
      const newRetryCount = state.retryCount + 1;
      const shouldRetry = newRetryCount <= retryAttempts;

      if (shouldRetry) {
        setState(prev => ({
          ...prev,
          retryCount: newRetryCount
        }));

        retryTimeoutRef.current = setTimeout(() => {
          loadImage(imageSrc);
        }, retryDelay);
      } else {
        setState({
          loading: false,
          loaded: false,
          error: error.message,
          retryCount: newRetryCount
        });
      }
    }
  }, [state.retryCount, retryAttempts, retryDelay, timeout]);

  const reset = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);

    setState({
      loading: false,
      loaded: false,
      error: null,
      retryCount: 0
    });
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, []);

  return {
    ...state,
    loadImage,
    reset,
    canRetry: state.retryCount < retryAttempts
  };
};

export default {
  useImageOptimization,
  useImageLoading
};