import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';
import compression from 'vite-plugin-compression2';

export default defineConfig({
  plugins: [
    angular(),
    compression({
      algorithm: 'gzip',
      exclude: [/\.(br)$/, /\.(gz)$/],
      deleteOriginalAssets: false,
    }),
    compression({
      algorithm: 'brotliCompress',
      exclude: [/\.(br)$/, /\.(gz)$/],
      deleteOriginalAssets: false,
    }),
  ],
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          'angular-core': [
            '@angular/core',
            '@angular/common',
            '@angular/platform-browser',
          ],
          'angular-material': ['@angular/material'],
          'angular-router': ['@angular/router'],
          vendor: ['gsap', 'rxjs', '@fortawesome/fontawesome-svg-core'],
        },
      },
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  server: {
    fs: {
      strict: false,
    },
  },
});
