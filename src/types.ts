export interface ConversionOptions {
  /** Output directory for converted files */
  outputDir?: string;
  /** Preserve directory structure */
  preserveStructure?: boolean;
  /** Auto-generate titles from content */
  generateTitles?: boolean;
  /** Auto-generate descriptions from content */
  generateDescriptions?: boolean;
  /** Add lastUpdated timestamps */
  addTimestamps?: boolean;
  /** Default category for documents */
  defaultCategory?: string;
  /** Enable verbose logging */
  verbose?: boolean;
  /** Dry run mode (no file writes) */
  dryRun?: boolean;
  /** Custom category patterns */
  categoryPatterns?: Record<string, string>;
  /** Custom tag patterns */
  tagPatterns?: Record<string, string[]>;
  /** Files to ignore */
  ignorePatterns?: string[];
}

export interface ConversionStats {
  processed: number;
  skipped: number;
  errors: number;
  formats: Map<string, number>;
}

export interface DocumentMetadata {
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  lastUpdated?: string;
}

export interface ConversionResult {
  success: boolean;
  inputPath: string;
  outputPath: string;
  skipped?: boolean;
  error?: string;
  errorMessage?: string;
  metadata?: DocumentMetadata;
}

export interface StarlightIntegrationConfig {
  /** Enable the document converter integration */
  enabled?: boolean;
  /** Conversion options */
  converter?: ConversionOptions;
  /** Watch for file changes and auto-convert */
  watch?: boolean;
  /** Input directories to monitor */
  inputDirs?: string[];
}

export type SupportedFormat =
  | '.docx'
  | '.doc'
  | '.txt'
  | '.html'
  | '.htm'
  | '.md'
  | '.mdx'
  | '.rtf';

export interface FileProcessor {
  extensions: SupportedFormat[];
  process: (filePath: string, options: ConversionOptions) => Promise<string>;
}

export interface ConversionContext {
  inputPath: string;
  outputPath: string;
  filename: string;
  extension: SupportedFormat;
  content: string;
  options: ConversionOptions;
}
