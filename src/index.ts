// Main exports for the package
export { DocumentConverter } from './converter.js';
export { starlightDocumentConverter as default } from './integration.js';
export { starlightDocumentConverter } from './integration.js';

// Plugin system exports
export * from './plugins/index.js';

// Type exports
export type {
  ConversionOptions,
  ConversionStats,
  ConversionResult,
  DocumentMetadata,
  StarlightIntegrationConfig,
  SupportedFormat,
  FileProcessor,
  ConversionContext
} from './types.js';

// Utility exports for advanced usage
export { default as mammoth } from 'mammoth';
export { default as TurndownService } from 'turndown';