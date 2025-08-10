import { describe, expect, it } from 'vitest'

import { DocumentConverter, starlightDocumentConverter } from './index.js'

import type { ConversionResult, ConverterOptions, StarlightIntegrationConfig } from './index.js'

describe('Package Exports', () => {
  it('should export DocumentConverter class', () => {
    expect(DocumentConverter).toBeDefined()
    expect(typeof DocumentConverter).toBe('function')
  })

  it('should export starlightDocumentConverter function', () => {
    expect(starlightDocumentConverter).toBeDefined()
    expect(typeof starlightDocumentConverter).toBe('function')
  })

  it('should be able to instantiate DocumentConverter', () => {
    const converter = new DocumentConverter()
    expect(converter).toBeInstanceOf(DocumentConverter)
  })

  it('should be able to create Starlight integration', () => {
    const integration = starlightDocumentConverter()
    expect(integration).toBeDefined()
    expect(integration.name).toBe('starlight-document-converter')
  })

  it('should export TypeScript types', () => {
    // Test that types are accessible by using them
    const options: ConverterOptions = {
      outputDir: 'test',
      preserveStructure: true,
    }

    const result: ConversionResult = {
      success: true,
      inputPath: 'input.md',
      outputPath: 'output.md',
      content: 'test content',
    }

    const config: StarlightIntegrationConfig = {
      enabled: true,
      watch: false,
    }

    expect(options).toBeDefined()
    expect(result).toBeDefined()
    expect(config).toBeDefined()
  })
})

describe('Integration Usage', () => {
  it('should work with default options', () => {
    const converter = new DocumentConverter()
    expect(converter).toBeDefined()
  })

  it('should work with custom options', () => {
    const options: ConverterOptions = {
      outputDir: 'custom-output',
      preserveStructure: false,
      generateTitles: true,
      generateDescriptions: true,
      addTimestamps: true,
      verbose: true,
    }

    const converter = new DocumentConverter(options)
    expect(converter).toBeDefined()
  })

  it('should create integration with options', () => {
    const config: StarlightIntegrationConfig = {
      enabled: true,
      watch: true,
      inputDirs: ['docs-input'],
      converter: {
        outputDir: 'src/content/docs',
        generateTitles: true,
        generateDescriptions: true,
      },
    }

    const integration = starlightDocumentConverter(config)
    expect(integration).toBeDefined()
    expect(integration.name).toBe('starlight-document-converter')
    expect(integration.hooks).toBeDefined()
  })

  it('should handle empty integration config', () => {
    const integration = starlightDocumentConverter({})
    expect(integration).toBeDefined()
    expect(integration.name).toBe('starlight-document-converter')
  })
})

describe('Package API Consistency', () => {
  it('should provide consistent API surface', () => {
    // Ensure the main exports are what we expect
    const exports = {
      DocumentConverter,
      starlightDocumentConverter,
    }

    expect(Object.keys(exports)).toContain('DocumentConverter')
    expect(Object.keys(exports)).toContain('starlightDocumentConverter')
  })

  it('should handle edge cases in constructor', () => {
    // Test with undefined options
    const converter1 = new DocumentConverter(undefined)
    expect(converter1).toBeDefined()

    // Test with empty options
    const converter2 = new DocumentConverter({})
    expect(converter2).toBeDefined()
  })
})
