import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'deploy',
    sourcemap: true, // Enable sourcemaps for debugging in production
    minify: 'terser', // More aggressive minification
    target: 'es2015', // Target modern browsers
    chunkSizeWarningLimit: 1000, // Adjust warning limit
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Separate vendor libraries
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('react-router')) {
              return 'router';
            }
            if (id.includes('prop-types')) {
              return 'validation';
            }
            return 'vendor';
          }

          // Separate components by feature
          if (id.includes('src/components/models')) {
            return 'models';
          }
          if (id.includes('src/components/filament')) {
            return 'filament';
          }
          if (id.includes('src/components/prints')) {
            return 'prints';
          }
          if (id.includes('src/components/common')) {
            return 'common';
          }
          if (id.includes('src/contexts')) {
            return 'contexts';
          }
          if (id.includes('src/hooks')) {
            return 'hooks';
          }
          if (id.includes('src/utils')) {
            return 'utils';
          }
        }
      }
    },
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log']
      }
    }
  },
  server: {
    port: 5173,
    open: true
  },
  preview: {
    port: 4173,
    outDir: 'deploy'
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'prop-types']
  }
});
