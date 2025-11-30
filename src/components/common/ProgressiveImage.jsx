import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import styles from './ProgressiveImage.module.css';

/**
 * Progressive Image Component with loading states and optimization
 * @param {Object} props - Component props
 * @param {string} props.src - High-quality image source
 * @param {string} props.placeholder - Low-quality placeholder source (optional)
 * @param {string} props.alt - Image alt text
 * @param {number} props.width - Image width
 * @param {number} props.height - Image height
 * @param {string} props.fit - Object fit style
 * @param {boolean} props.lazyLoad - Enable lazy loading
 * @param {number} props.threshold - Lazy load threshold
 * @param {Function} props.onLoad - Load callback
 * @param {Function} props.onError - Error callback
 * @param {boolean} props.showSpinner - Show loading spinner
 * @param {boolean} props.enableBlur - Enable blur effect during load
 * @param {string} objectPosition - CSS object-position
 */
const ProgressiveImage = ({
  src,
  placeholder = null,
  alt = '',
  width = '100%',
  height = 'auto',
  fit = 'cover',
  lazyLoad = true,
  threshold = 0.1,
  onLoad,
  onError,
  showSpinner = true,
  enableBlur = true,
  objectPosition = 'center',
  ...props
}) => {
  const [loadingState, setLoadingState] = useState('loading'); // loading, loaded, error
  const [placeholderLoaded, setPlaceholderLoaded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isInView, setIsInView] = useState(!lazyLoad);

  const imgRef = useRef(null);
  const placeholderRef = useRef(null);
  const observerRef = useRef(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazyLoad || !imgRef.current) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (observerRef.current) {
            observerRef.current.disconnect();
          }
        }
      },
      { threshold, rootMargin: '50px 0px' } // Start loading 50px before entering viewport
    );

    observerRef.current.observe(imgRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [lazyLoad, threshold]);

  // Load placeholder
  useEffect(() => {
    if (!placeholder) {
      setPlaceholderLoaded(true);
      return;
    }

    const placeholderImg = new Image();
    placeholderImg.onload = () => {
      setPlaceholderLoaded(true);
    };
    placeholderImg.src = placeholder;
  }, [placeholder]);

  // Load main image
  useEffect(() => {
    if (!isInView || !src) return;

    const img = new Image();

    img.onload = () => {
      setImageLoaded(true);
      setLoadingState('loaded');
      if (onLoad) onLoad(img);
    };

    img.onerror = (error) => {
      setLoadingState('error');
      if (onError) onError(error);
    };

    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [isInView, src, onLoad, onError]);

  // Generate placeholder image if none provided
  const generatePlaceholder = useCallback(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Set canvas size
    canvas.width = 100;
    canvas.height = 100;

    // Draw gradient placeholder
    const gradient = ctx.createLinearGradient(0, 0, 100, 100);
    gradient.addColorStop(0, '#f0f0f0');
    gradient.addColorStop(1, '#e0e0e0');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 100, 100);

    return canvas.toDataURL('image/jpeg', 0.3);
  }, []);

  const placeholderSrc = placeholder || generatePlaceholder();

  return (
    <div
      ref={imgRef}
      className={`${styles.progressiveImage} ${styles[loadingState]}`}
      style={{ width, height, position: 'relative', overflow: 'hidden' }}
      {...props}
    >
      {/* Placeholder image */}
      {placeholder && (
        <img
          ref={placeholderRef}
          src={placeholderSrc}
          alt=""
          className={`${styles.placeholder} ${placeholderLoaded && styles.visible} ${enableBlur && imageLoaded ? styles faded : ''}`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: fit,
            objectPosition,
            transition: enableBlur ? 'opacity 0.3s ease-in-out' : 'none'
          }}
          aria-hidden="true"
        />
      )}

      {/* Main image */}
      {(isInView || !lazyLoad) && (
        <img
          src={src}
          alt={alt}
          className={`${styles.mainImage} ${imageLoaded ? styles.visible : ''}`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: fit,
            objectPosition,
            opacity: imageLoaded ? 1 : 0,
            transition: enableBlur ? 'opacity 0.3s ease-in-out' : 'none'
          }}
          loading="lazy"
        />
      )}

      {/* Loading spinner */}
      {showSpinner && loadingState === 'loading' && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
        </div>
      )}

      {/* Error state */}
      {loadingState === 'error' && (
        <div className={styles.errorOverlay}>
          <div className={styles.errorIcon}>⚠️</div>
          <span className={styles.errorText}>Failed to load image</span>
        </div>
      )}

      {/* Accessibility fallback */}
      <span className={styles.srOnly}>
        {loadingState === 'loading' && 'Loading image'}
        {loadingState === 'error' && 'Image failed to load'}
      </span>
    </div>
  );
};

ProgressiveImage.propTypes = {
  src: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  alt: PropTypes.string,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  fit: PropTypes.oneOf(['contain', 'cover', 'fill', 'none', 'scale-down']),
  lazyLoad: PropTypes.bool,
  threshold: PropTypes.number,
  onLoad: PropTypes.func,
  onError: PropTypes.func,
  showSpinner: PropTypes.bool,
  enableBlur: PropTypes.bool,
  objectPosition: PropTypes.string
};

/**
 * Optimized Gallery Component with progressive loading
 */
const ProgressiveGallery = ({
  images = [],
  columns = 'auto',
  gap = '1rem',
  maxWidth = '1200px',
  lazyLoad = true,
  imageProps = {}
}) => {
  const [loadedImages, setLoadedImages] = useState(new Set());

  const handleImageLoad = useCallback((index) => {
    setLoadedImages(prev => new Set([...prev, index]));
  }, []);

  const getGalleryColumns = () => {
    if (columns === 'auto') {
      return {
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(300px, 1fr))`,
        gap,
        maxWidth,
        margin: '0 auto'
      };
    }

    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap,
      maxWidth,
      margin: '0 auto'
    };
  };

  return (
    <div className={styles.gallery} style={getGalleryColumns()}>
      {images.map((image, index) => (
        <div
          key={image.id || index}
          className={`${styles.galleryItem} ${loadedImages.has(index) ? styles.loaded : ''}`}
        >
          <ProgressiveImage
            src={image.src}
            placeholder={image.placeholder}
            alt={image.alt || `Gallery image ${index + 1}`}
            lazyLoad={lazyLoad}
            height={image.height || '200px'}
            fit="cover"
            onLoad={() => handleImageLoad(index)}
            {...imageProps}
          />
          {image.title && (
            <div className={styles.imageCaption}>
              <h4>{image.title}</h4>
              {image.description && <p>{image.description}</p>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

ProgressiveGallery.propTypes = {
  images: PropTypes.arrayOf(
    PropTypes.shape({
      src: PropTypes.string.isRequired,
      placeholder: PropTypes.string,
      alt: PropTypes.string,
      title: PropTypes.string,
      description: PropTypes.string,
      height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    })
  ).isRequired,
  columns: PropTypes.oneOfType([PropTypes.number, PropTypes.oneOf(['auto'])]),
  gap: PropTypes.string,
  maxWidth: PropTypes.string,
  lazyLoad: PropTypes.bool,
  imageProps: PropTypes.object
};

/**
 * Image optimization utilities
 */
export const imageOptimization = {
  /**
   * Optimize image URL for different formats and sizes
   * @param {string} baseUrl - Base image URL
   * @param {Object} options - Optimization options
   * @returns {string} Optimized URL
   */
  optimizeUrl: (baseUrl, options = {}) => {
    const {
      width = null,
      height = null,
      quality = 80,
      format = 'auto',
      crop = null
    } = options;

    if (!baseUrl) return baseUrl;

    // If using an image CDN that supports query parameters
    const url = new URL(baseUrl, window.location.origin);
    const params = new URLSearchParams(url.search);

    if (width) params.set('w', width);
    if (height) params.set('h', height);
    if (quality && quality !== 100) params.set('q', quality);
    if (format !== 'auto') params.set('f', format);
    if (crop) params.set('c', crop);

    // Replace search params
    url.search = params.toString();
    return url.toString();
  },

  /**
   * Generate responsive image sources
   * @param {Object} image - Image object
   * @returns {Array} Array of source objects
   */
  generateResponsiveSources: (image) => {
    const sources = [];
    const baseSizes = [400, 600, 800, 1200, 1600];
    const aspectRatio = image.aspectRatio || (image.height / image.width);

    baseSizes.forEach(width => {
      const height = Math.round(width * aspectRatio);
      sources.push({
        srcset: imageOptimization.optimizeUrl(image.src, { width, height }),
        width,
        type: 'image/jpeg'
      });
    });

    return sources;
  },

  /**
   * Generate low-quality placeholder
   * @param {string} imageUrl - Original image URL
   * @param {number} quality - Compression quality (1-10)
   * @returns {string} Placeholder URL
   */
  generatePlaceholder: (imageUrl, quality = 10) => {
    if (!imageUrl) return null;
    return imageOptimization.optimizeUrl(imageUrl, {
      quality,
      width: 100,
      format: 'jpeg'
    });
  },

  /**
   * Preload image for better performance
   * @param {string} imageUrl - Image URL to preload
   * @returns {Promise} Load promise
   */
  preload: (imageUrl) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = imageUrl;
    });
  }
};

export {
  ProgressiveImage,
  ProgressiveGallery,
  imageOptimization
};

export default ProgressiveImage;