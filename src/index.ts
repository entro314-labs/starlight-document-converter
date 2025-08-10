// Main exports for the package

// Utility exports for advanced usage
export { default as mammoth } from 'mammoth'
export { default as TurndownService } from 'turndown'

export { DocumentConverter } from './converter.js'
export {
  starlightDocumentConverter as default,
  starlightDocumentConverter,
} from './integration.js'
// Plugin system exports
export * from './plugins/index.js'

// Type exports
export type {
  ConversionContext,
  ConversionOptions,
  ConversionResult,
  ConversionStats,
  DocumentMetadata,
  FileProcessor,
  StarlightIntegrationConfig,
  SupportedFormat,
} from './types.js'
