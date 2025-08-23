import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./setup.ts'],
    // Add React environment configuration
    environmentOptions: {
      happyDOM: {
        settings: {
          disableJavaScriptEvaluation: false,
          disableJavaScriptFileLoading: false,
          disableCSSFileLoading: false,
          disableIframePageLoading: false,
          disableComputedStyleRendering: false
        }
      }
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        '../site/src/**/*.{ts,tsx}',
        '../site/src/bgModules/**/*.{ts,tsx}',
        '../site/src/contexts/**/*.{ts,tsx}',
        '../site/src/components/**/*.{ts,tsx}'
      ],
      exclude: [
        'node_modules/',
        'coverage/',
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/fixtures/**',
        '**/e2e/**',
        '**/*.config.{ts,js}',
        '**/.eslintrc.js',
        '**/gatsby-*.{ts,js}'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  },
  resolve: {
    alias: {
      '@site': path.resolve(__dirname, '../site/src'),
      '@': path.resolve(__dirname, '../site/src'),
      '@/components': path.resolve(__dirname, '../site/src/components'),
      '@/contexts': path.resolve(__dirname, '../site/src/contexts'),
      '@/utils': path.resolve(__dirname, '../site/src/utils'),
      '@/bgModules': path.resolve(__dirname, '../site/src/bgModules'),
      '@/types': path.resolve(__dirname, '../site/src/types'),
      '@/hooks': path.resolve(__dirname, '../site/src/hooks'),
      '@/assets': path.resolve(__dirname, '../site/src/assets')
    }
  }
})