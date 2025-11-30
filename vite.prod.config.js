import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import viteCompression from 'vite-plugin-compression';

// Production-optimized configuration
export default defineConfig({
  plugins: [
    react(),
    // Bundle analyzer for production builds
    visualizer({
      filename: 'deploy/bundle-analysis.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
    // Generate compressed assets
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240,
      algorithm: 'gzip',
      ext: '.gz',
    }),
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240,
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
    // Source map generation (only for error tracking, not full maps)
    {
      name: 'minimal-sourcemap',
      generateBundle(options, bundle) {
        // Generate minimal source maps for error tracking
        if (process.env.NODE_ENV === 'production') {
          Object.keys(bundle).forEach(key => {
            if (key.endsWith('.js') && !key.includes('.min.')) {
              const chunk = bundle[key];
              // Add minimal source map reference
              chunk.code += '\n//# sourceMappingURL=' + key.replace('.js', '.min.map');
            }
          });
        }
      }
    }
  ],
  build: {
    outDir: 'deploy',
    sourcemap: false, // Disable full sourcemaps
    minify: 'esbuild', // Use esbuild for faster builds with good optimization
    target: 'es2020', // Modern browsers for better performance
    chunkSizeWarningLimit: 300, // Stricter limit for production
    rollupOptions: {
      output: {
        // Manual chunk splitting for optimal caching
        manualChunks: (id) => {
          // React Core
          if (id.includes('react') || id.includes('react-dom')) {
            return 'react-core';
          }

          // React Router
          if (id.includes('react-router')) {
            return 'router';
          }

          // Development tools (only in development)
          if (id.includes('prop-types') || id.includes('devtools')) {
            return 'dev-tools';
          }

          // Feature-based chunks for better caching
          if (id.includes('src/components/filament')) {
            return 'feature-filament';
          }
          if (id.includes('src/components/models')) {
            return 'feature-models';
          }
          if (id.includes('src/components/prints')) {
            return 'feature-prints';
          }
          if (id.includes('src/components/statistics')) {
            return 'feature-statistics';
          }
          if (id.includes('src/components/testing')) {
            return 'feature-testing';
          }
          if (id.includes('src/components/theme')) {
            return 'feature-theme';
          }
          if (id.includes('src/components/navigation')) {
            return 'feature-navigation';
          }
          if (id.includes('src/components/common')) {
            return 'components-common';
          }

          // Architecture layer chunks
          if (id.includes('src/contexts')) {
            return 'contexts';
          }
          if (id.includes('src/hooks')) {
            return 'hooks';
          }
          if (id.includes('src/utils')) {
            return 'utils';
          }
          if (id.includes('src/config')) {
            return 'config';
          }

          // Vendor libraries
          if (id.includes('node_modules')) {
            return 'vendor';
          }

          // App code
          return 'app';
        },
        // Optimized file naming
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop().replace(/\.[^.]*$/, '')
            : 'chunk';
          return `js/[name]-[hash].js`;
        },
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          // Organize assets by type for better caching
          if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i.test(assetInfo.name)) {
            return `media/[name]-[hash][ext]`;
          }
          if (/\.(png|jpe?g|gif|svg|webp|avif)(\?.*)?$/i.test(assetInfo.name)) {
            return `images/[name]-[hash][ext]`;
          }
          if (/\.(woff2?|eot|ttf|otf)(\?.*)?$/i.test(assetInfo.name)) {
            return `fonts/[name]-[hash][ext]`;
          }
          if (/\.css(\?.*)?$/i.test(assetInfo.name)) {
            return `css/[name]-[hash][ext]`;
          }
          return `assets/[name]-[hash][ext]`;
        },
      },
      // Enhanced tree shaking
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
        preset: 'smallest',
        unknownGlobalSideEffects: false,
      }
    },
    // Esbuild optimization (faster than terser with similar results)
    esbuild: {
      target: 'es2020',
      drop: ['console', 'debugger', 'alert'],
      minifyIdentifiers: true,
      minifySyntax: true,
      minifyWhitespace: true,
      keepNames: false,
      legalComments: 'none',
    },
    // CSS optimization
    cssCodeSplit: true,
    cssMinify: true,
    // Additional optimizations
    reportCompressedSize: true,
    emptyOutDir: true,
    // Generate manifest for Service Worker
    manifest: true,
  },
  // Production-specific server config
  preview: {
    port: 4173,
    host: false, // Don't expose preview server publicly
    cors: false,
  },
  // Advanced optimizations
  define: {
    // Remove development code
    __DEV__: JSON.stringify(false),
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  // Don't optimize dependencies for production (better tree shaking)
  optimizeDeps: {
    disabled: true,
  }
});