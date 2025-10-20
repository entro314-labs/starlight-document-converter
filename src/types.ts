export interface ConversionOptions {
  /** Output directory for converted files */
  outputDir?: string
  /** Preserve directory structure */
  preserveStructure?: boolean
  /** Auto-generate titles from content */
  generateTitles?: boolean
  /** Auto-generate descriptions from content */
  generateDescriptions?: boolean
  /** Add lastUpdated timestamps */
  addTimestamps?: boolean
  /** Default category for documents */
  defaultCategory?: string
  /** Enable verbose logging */
  verbose?: boolean
  /** Dry run mode (no file writes) */
  dryRun?: boolean
  /** Custom category patterns */
  categoryPatterns?: Record<string, string>
  /** Custom tag patterns */
  tagPatterns?: Record<string, string[]>
  /** Files to ignore */
  ignorePatterns?: string[]
  /** Repair existing frontmatter */
  repairMode?: boolean
  /** Validate content structure */
  validateContent?: boolean
  /** Generate table of contents */
  generateToc?: boolean
  /** Process images and copy them */
  processImages?: boolean
  /** Fix internal links */
  fixLinks?: boolean
  /** Auto-generate sidebar configuration */
  generateSidebar?: boolean
  /** Maximum description length */
  maxDescriptionLength?: number
  /** MDX conversion mode */
  mdxMode?: boolean
  /** MDX conversion options */
  mdxOptions?: MDXConversionOptions
}

export interface MDXConversionOptions {
  /** Convert callouts/alerts to JSX components */
  convertCallouts?: boolean
  /** Convert tabs to JSX components */
  convertTabs?: boolean
  /** Convert code groups to JSX components */
  convertCodeGroups?: boolean
  /** Add component imports automatically */
  autoImports?: boolean
  /** Custom component mappings */
  componentMappings?: Record<string, string>
  /** Preserve existing JSX */
  preserveJSX?: boolean
  /** Transform GitHub-flavored alerts */
  githubAlerts?: boolean
  /** Transform admonitions (Docusaurus-style) */
  admonitions?: boolean
  /** Transform details/summary to expandable sections */
  expandableSections?: boolean
  /** Transform link cards */
  linkCards?: boolean
  /** Transform file trees */
  fileTrees?: boolean
  /** Output as .mdx extension */
  outputMdx?: boolean
}

export interface ConversionStats {
  processed: number
  skipped: number
  errors: number
  formats: Map<string, number>
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
  /** MDX-specific metadata */
  format?: 'md' | 'mdx'
  mdxComponents?: string[]
  componentCount?: number
  mdxComplexity?: 'low' | 'medium' | 'high'
  isInteractive?: boolean
  interactiveFeatures?: string[]
  hasFrontmatter?: boolean
  hasImports?: boolean
  [key: string]: unknown
}

export interface ConversionResult {
  success: boolean
  inputPath: string
  outputPath: string
  skipped?: boolean
  error?: string
  errorMessage?: string
  metadata?: DocumentMetadata
}

export interface StarlightIntegrationConfig {
  /** Enable the document converter integration */
  enabled?: boolean
  /** Conversion options */
  converter?: ConversionOptions
  /** Watch for file changes and auto-convert */
  watch?: boolean
  /** Input directories to monitor */
  inputDirs?: string[]
}

export type SupportedFormat = '.docx' | '.doc' | '.txt' | '.html' | '.htm' | '.md' | '.mdx' | '.rtf'

export interface FileProcessor {
  extensions: SupportedFormat[]
  process: (filePath: string, options: ConversionOptions) => Promise<string>
}

export interface ConversionContext {
  inputPath: string
  outputPath: string
  filename: string
  extension: SupportedFormat
  content: string
  options: ConversionOptions
}

export interface ValidationResult {
  valid: boolean
  issues: ValidationIssue[]
  metadata?: DocumentMetadata
  score?: QualityScore
}

export interface ValidationIssue {
  type: 'error' | 'warning'
  field?: string
  message: string
  suggestion?: string
}

export interface QualityScore {
  overall: 'good' | 'fair' | 'poor'
  titleScore: number
  descriptionScore: number
  contentScore: number
  structureScore: number
  suggestions: string[]
}

export interface RepairResult {
  success: boolean
  fixed: boolean
  issues: string[]
  originalContent: string
  repairedContent: string
}

export interface TocEntry {
  level: number
  title: string
  anchor: string
  children?: TocEntry[]
}

export interface LinkInfo {
  original: string
  resolved: string
  isInternal: boolean
  exists: boolean
  needsRepair: boolean
}

export interface ImageInfo {
  original: string
  resolved: string
  copied: boolean
  outputPath?: string
  alt?: string
}
