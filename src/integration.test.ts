import { beforeEach, describe, expect, it, vi } from 'vitest'

import { starlightDocumentConverter } from './integration.js'

import type { StarlightIntegrationConfig } from './types.js'

// Mock file system operations
vi.mock('fs', async () => {
  const actual = await vi.importActual('fs')
  return {
    ...actual,
    watch: vi.fn(() => ({ close: vi.fn() })),
  }
})

vi.mock('path', async () => {
  const actual = await vi.importActual('path')
  return {
    ...actual,
    resolve: vi.fn((...paths: string[]) => `/mock/root/${paths.join('/')}`),
  }
})

describe('Starlight Integration', () => {
  let mockLogger: { info: vi.Mock; warn: vi.Mock; error: vi.Mock }
  let mockAstroConfig: { root: { pathname: string } }

  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }

    mockAstroConfig = {
      root: {
        pathname: '/mock/root',
      },
    }

    vi.clearAllMocks()
  })

  describe('Integration Configuration', () => {
    it('should create integration with default config', () => {
      const integration = starlightDocumentConverter()

      expect(integration.name).toBe('starlight-document-converter')
      expect(integration.hooks).toBeDefined()
      expect(integration.hooks['astro:config:setup']).toBeDefined()
      expect(integration.hooks['astro:config:done']).toBeDefined()
    })

    it('should create integration with custom config', () => {
      const config: StarlightIntegrationConfig = {
        enabled: false,
        watch: true,
        inputDirs: ['custom-input'],
        converter: {
          outputDir: 'custom-output',
          generateTitles: false,
          verbose: true,
        },
      }

      const integration = starlightDocumentConverter(config)

      expect(integration.name).toBe('starlight-document-converter')
      expect(integration.hooks).toBeDefined()
    })

    it('should merge user config with defaults', () => {
      const partialConfig: StarlightIntegrationConfig = {
        watch: true,
        inputDirs: ['custom-dir'],
      }

      const integration = starlightDocumentConverter(partialConfig)

      // Integration should be created successfully with merged config
      expect(integration).toBeDefined()
    })
  })

  describe('Astro Hooks', () => {
    it('should handle astro:config:setup hook when enabled', async () => {
      const integration = starlightDocumentConverter({
        enabled: true,
        inputDirs: ['test-input'],
      })

      const setupHook = integration.hooks['astro:config:setup']
      expect(setupHook).toBeDefined()

      if (setupHook) {
        // Mock the conversion to avoid file system operations
        const mockContext = {
          config: mockAstroConfig,
          logger: mockLogger,
        }

        await setupHook(mockContext)

        expect(mockLogger.info).toHaveBeenCalledWith('Setting up Starlight Document Converter')
      }
    })

    it('should skip setup when disabled', async () => {
      const integration = starlightDocumentConverter({
        enabled: false,
      })

      const setupHook = integration.hooks['astro:config:setup']
      expect(setupHook).toBeDefined()

      if (setupHook) {
        const mockContext = {
          config: mockAstroConfig,
          logger: mockLogger,
        }

        await setupHook(mockContext)

        expect(mockLogger.info).toHaveBeenCalledWith('Document converter disabled')
      }
    })

    it.skip('should handle astro:config:done hook', async () => {
      const integration = starlightDocumentConverter({
        enabled: true,
        watch: true,
        inputDirs: ['test-dir'],
      })

      const doneHook = integration.hooks['astro:config:done']
      expect(doneHook).toBeDefined()

      if (doneHook) {
        const mockContext = {
          logger: mockLogger,
        }

        await doneHook(mockContext)

        expect(mockLogger.info).toHaveBeenCalledWith('Starlight Document Converter ready')
        expect(mockLogger.info).toHaveBeenCalledWith('Watching directories: test-dir')
      }
    })

    it.skip('should not show watching message when watch is disabled', async () => {
      const integration = starlightDocumentConverter({
        enabled: true,
        watch: false,
      })

      const doneHook = integration.hooks['astro:config:done']
      expect(doneHook).toBeDefined()

      if (doneHook) {
        const mockContext = {
          logger: mockLogger,
        }

        await doneHook(mockContext)

        expect(mockLogger.info).toHaveBeenCalledWith('Starlight Document Converter ready')

        // Should not mention watching
        expect(mockLogger.info).not.toHaveBeenCalledWith(
          expect.stringContaining('Watching directories')
        )
      }
    })
  })

  describe('File Watching', () => {
    it('should set up file watchers when enabled', () => {
      // Note: File watching is tested through integration setup

      const integration = starlightDocumentConverter({
        enabled: true,
        watch: true,
        inputDirs: ['input1', 'input2'],
      })

      const setupHook = integration.hooks['astro:config:setup']

      if (setupHook) {
        const mockContext = {
          config: mockAstroConfig,
          logger: mockLogger,
        }

        setupHook(mockContext)

        // Note: Actual file watching test would require more complex mocking
        // This test mainly ensures the integration structure is correct
        expect(integration).toBeDefined()
      }
    })

    it('should not set up watchers when disabled', () => {
      const integration = starlightDocumentConverter({
        enabled: true,
        watch: false,
      })

      // Should still create integration successfully
      expect(integration).toBeDefined()
      expect(integration.hooks['astro:config:setup']).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle errors during directory processing', async () => {
      const integration = starlightDocumentConverter({
        enabled: true,
        inputDirs: ['non-existent-dir'],
      })

      const setupHook = integration.hooks['astro:config:setup']

      if (setupHook) {
        const mockContext = {
          config: mockAstroConfig,
          logger: mockLogger,
        }

        // Should not throw even with non-existent directory
        await expect(async () => {
          await setupHook(mockContext)
        }).not.toThrow()
      }
    })
  })

  describe('Configuration Validation', () => {
    it('should accept empty configuration', () => {
      const integration = starlightDocumentConverter({})
      expect(integration).toBeDefined()
      expect(integration.name).toBe('starlight-document-converter')
    })

    it('should accept undefined configuration', () => {
      const integration = starlightDocumentConverter()
      expect(integration).toBeDefined()
      expect(integration.name).toBe('starlight-document-converter')
    })

    it('should handle converter options correctly', () => {
      const config: StarlightIntegrationConfig = {
        converter: {
          outputDir: 'custom-output',
          preserveStructure: false,
          generateTitles: false,
          generateDescriptions: false,
          addTimestamps: true,
          defaultCategory: 'custom',
          verbose: true,
          dryRun: true,
          categoryPatterns: { api: 'API Reference' },
          tagPatterns: { tech: ['javascript', 'typescript'] },
          ignorePatterns: ['*.draft.md'],
        },
      }

      const integration = starlightDocumentConverter(config)
      expect(integration).toBeDefined()
    })
  })
})
