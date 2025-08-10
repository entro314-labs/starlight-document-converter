export interface FileProcessor {
  /** Supported file extensions */
  extensions: string[]
  /** Processing function */
  process: (content: string, context: ProcessingContext) => Promise<string> | string
  /** Plugin metadata */
  metadata: {
    name: string
    version: string
    description: string
    author?: string
  }
  /** Optional validation function */
  validate?: (content: string, context: ProcessingContext) => boolean | Promise<boolean>
  /** Optional preprocessing function */
  preprocess?: (content: string, context: ProcessingContext) => Promise<string> | string
  /** Optional postprocessing function */
  postprocess?: (content: string, context: ProcessingContext) => Promise<string> | string
}

export interface MetadataEnhancer {
  /** Enhancement function */
  enhance: (
    metadata: DocumentMetadata,
    context: ProcessingContext
  ) => Promise<DocumentMetadata> | DocumentMetadata
  /** Plugin metadata */
  metadata: {
    name: string
    version: string
    description: string
    author?: string
  }
  /** Priority for execution order (higher = earlier) */
  priority?: number
}

export interface QualityValidator {
  /** Validation function */
  validate: (
    content: string,
    metadata: DocumentMetadata,
    context: ProcessingContext
  ) => QualityReport
  /** Plugin metadata */
  metadata: {
    name: string
    version: string
    description: string
    author?: string
  }
}

export interface ProcessingContext {
  /** Input file path */
  inputPath: string
  /** Output file path */
  outputPath: string
  /** Original filename */
  filename: string
  /** File extension */
  extension: string
  /** Conversion options */
  options: ConversionOptions
  /** Additional context data */
  data?: Record<string, unknown>
}

export interface QualityReport {
  /** Overall quality score (0-100) */
  score: number
  /** Quality level */
  level: 'high' | 'medium' | 'low'
  /** List of issues found */
  issues: QualityIssue[]
  /** Suggestions for improvement */
  suggestions: string[]
}

export interface QualityIssue {
  /** Issue type */
  type: 'error' | 'warning' | 'info'
  /** Issue message */
  message: string
  /** Optional line number */
  line?: number
  /** Optional column number */
  column?: number
  /** Severity (1-10) */
  severity: number
}

export interface DocumentMetadata {
  title?: string
  description?: string
  category?: string
  tags?: string[]
  lastUpdated?: string
  author?: string
  draft?: boolean
  readingTime?: number
  wordCount?: number
  contentType?: string
  complexity?: string
  [key: string]: unknown
}

export interface ConversionOptions {
  outputDir?: string
  preserveStructure?: boolean
  generateTitles?: boolean
  generateDescriptions?: boolean
  addTimestamps?: boolean
  defaultCategory?: string
  verbose?: boolean
  dryRun?: boolean
  categoryPatterns?: Record<string, string>
  tagPatterns?: Record<string, string[]>
  ignorePatterns?: string[]
  repairMode?: boolean
  validateContent?: boolean
  generateToc?: boolean
  processImages?: boolean
  fixLinks?: boolean
  generateSidebar?: boolean
  maxDescriptionLength?: number
}

export interface PluginRegistry {
  /** Register a file processor plugin */
  registerProcessor: (processor: FileProcessor) => void
  /** Register a metadata enhancer plugin */
  registerEnhancer: (enhancer: MetadataEnhancer) => void
  /** Register a quality validator plugin */
  registerValidator: (validator: QualityValidator) => void
  /** Get all registered processors */
  getProcessors: () => FileProcessor[]
  /** Get processors for specific extension */
  getProcessorsForExtension: (extension: string) => FileProcessor[]
  /** Get all registered enhancers */
  getEnhancers: () => MetadataEnhancer[]
  /** Get all registered validators */
  getValidators: () => QualityValidator[]
  /** Clear all plugins */
  clear: () => void
}
