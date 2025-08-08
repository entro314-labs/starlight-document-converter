import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/**/*.{ts,js}'
      ],
      exclude: [
        'node_modules/',
        'dist/',
        'examples/',
        'web-ui/**/*',
        'src/starlight-components/**/*',
        '**/*.config.*',
        '**/*.d.ts',
        '**/*.test.ts',
        'src/test-setup.ts',
        // Exclude test helper files
        'test-*.js',
        'src/content/**/*'
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
  }
});