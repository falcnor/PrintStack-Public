import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';

  return {
    plugins: [react()],
    define: {
      __ENV__: JSON.stringify(isProd ? 'production' : 'development')
    },
    build: {
      outDir: 'dist',
      sourcemap: !isProd, // Disable sourcemaps in production for smaller bundle
      minify: isProd ? 'terser' : false, // More aggressive minification in production
      target: 'es2018', // Target modern browsers with better performance
      chunkSizeWarningLimit: 500, // Stricter warning limit for better performance
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Core React libraries (always needed)
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-core';
            }

            // Router functionality
            if (id.includes('react-router') || id.includes('react-router-dom')) {
              return 'router';
            }

            // Development and validation tools
            if (id.includes('prop-types')) {
              return 'dev-tools';
            }

            // Separate components by feature for better caching
            if (id.includes('src/components/models')) {
              return 'feature-models';
            }
            if (id.includes('src/components/filament')) {
              return 'feature-filament';
            }
            if (id.includes('src/components/prints')) {
              return 'feature-prints';
            }
            if (id.includes('src/components/statistics')) {
              return 'feature-statistics';
            }
            if (id.includes('src/components/common')) {
              return 'components-common';
            }

            // Separate logic layers
            if (id.includes('src/contexts')) {
              return 'contexts';
            }
            if (id.includes('src/hooks')) {
              return 'hooks';
            }
            if (id.includes('src/utils')) {
              return 'utils';
            }

            // Other vendor libraries
            if (id.includes('node_modules')) {
              return 'vendor';
            }

            // Default chunk for app code
            return 'app';
          },
          // Optimize chunk naming for better caching
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
            return `assets/[name]-${facadeModuleId}-[hash].js`;
          },
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            const extType = info[info.length - 1];

            if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i.test(assetInfo.name)) {
              return `assets/media/[name]-[hash][ext]`;
            }
            if (/\.(png|jpe?g|gif|svg|webp|avif)(\?.*)?$/i.test(assetInfo.name)) {
              return `assets/images/[name]-[hash][ext]`;
            }
            if (/\.(woff2?|eot|ttf|otf)(\?.*)?$/i.test(assetInfo.name)) {
              return `assets/fonts/[name]-[hash][ext]`;
            }
            return `assets/${extType}/[name]-[hash][ext]`;
          }
        },
        // Additional Rollup optimizations
        treeshake: {
          moduleSideEffects: false,
          propertyReadSideEffects: false,
          tryCatchDeoptimization: false
        }
      },
      // Optimized Terser configuration
      terserOptions: isProd ? {
        compress: {
          drop_console: true, // Remove console.log in production
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug'],
          passes: 2, // Multiple compression passes for better optimization
          dead_code: true,
          unused: true,
          hoist_funs: true,
          hoist_props: true,
          reduce_funcs: true,
          reduce_vars: true,
          booleans: true,
          conditionals: true,
          evaluate: true,
          if_return: true,
          inline: 2,
          join_vars: true,
          collapse_vars: true,
          keep_fargs: false,
          keep_fnames: false,
          loops: true,
          negate_iife: true,
          properties: true,
          sequences: true,
          side_effects: true,
          switches: true,
          typeofs: true,
          arrows: true,
          module: true
        },
        mangle: {
          safari10: true,
          toplevel: true
        },
        format: {
          comments: false
        }
      } : {},
      // Enable CSS code splitting
      cssCodeSplit: true,
      // Generate manifest for service worker
      manifest: true,
      // Report compressed sizes
      reportCompressedSize: true
    },
    server: {
      port: 5173,
      host: true, // Enable network access for mobile testing
      strictPort: false,
      open: false, // Don't auto-open to avoid distractions
      hmr: {
        overlay: true // Show errors in browser
      }
    },
    preview: {
      port: 4173,
      host: true,
      outDir: 'dist'
    },
    // Dependency optimization
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'prop-types'
      ]
    },
    // Performance optimization
    esbuild: {
      target: 'es2018',
      drop: isProd ? ['console', 'debugger'] : [],
      // Additional loader optimizations
      loader: 'jsx',
      jsx: 'automatic',
      minify: isProd
    },
    // Asset optimization
    assetsInlineLimit: 4096, // Inline assets smaller than 4KB
    // Experimental features for better performance
    experimental: {
      renderBuiltUrl: (filename, { hostType }) => {
        if (hostType === 'js') {
          return { js: `/${filename}` };
        } else {
          return { relative: true };
        }
      }
    }
  };
});