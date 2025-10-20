import type { MetadataEnhancer, ProcessingContext, DocumentMetadata } from '../types.js'

/**
 * MDX Metadata Enhancer Plugin
 * Enhances document metadata with MDX-specific information
 */

export interface MDXEnhancementOptions {
  /** Detect and tag component usage */
  detectComponents?: boolean
  /** Analyze JSX complexity */
  analyzeComplexity?: boolean
  /** Add MDX-specific tags */
  addMdxTags?: boolean
  /** Detect interactive features */
  detectInteractivity?: boolean
}

export class MDXEnhancer implements MetadataEnhancer {
  metadata = {
    name: 'mdx-enhancer',
    version: '1.0.0',
    description: 'Enhances metadata for MDX documents',
    author: 'entro314 labs',
  }

  priority = 10

  private options: Required<MDXEnhancementOptions>

  constructor(options: MDXEnhancementOptions = {}) {
    this.options = {
      detectComponents: options.detectComponents ?? true,
      analyzeComplexity: options.analyzeComplexity ?? true,
      addMdxTags: options.addMdxTags ?? true,
      detectInteractivity: options.detectInteractivity ?? true,
    }
  }

  async enhance(
    metadata: DocumentMetadata,
    context: ProcessingContext
  ): Promise<DocumentMetadata> {
    // Only enhance MDX files
    if (context.extension !== '.mdx') {
      return metadata
    }

    const enhanced = { ...metadata }
    const content = context.data?.content as string || ''

    if (this.options.detectComponents) {
      const components = this.detectComponents(content)
      enhanced.mdxComponents = components
      enhanced.componentCount = components.length
    }

    if (this.options.analyzeComplexity) {
      const complexity = this.analyzeComplexity(content)
      enhanced.mdxComplexity = complexity
    }

    if (this.options.addMdxTags) {
      enhanced.tags = this.addMdxTags(enhanced.tags || [], content)
    }

    if (this.options.detectInteractivity) {
      const interactivity = this.detectInteractivity(content)
      enhanced.isInteractive = interactivity.isInteractive
      enhanced.interactiveFeatures = interactivity.features
    }

    // Add format indicator
    enhanced.format = 'mdx'
    enhanced.hasFrontmatter = this.hasFrontmatter(content)
    enhanced.hasImports = this.hasImports(content)

    return enhanced
  }

  /**
   * Detect JSX components used in the content
   */
  private detectComponents(content: string): string[] {
    const components = new Set<string>()

    // Match JSX component tags
    const componentPattern = /<([A-Z][a-zA-Z0-9]*)/g
    let match: RegExpExecArray | null

    while ((match = componentPattern.exec(content)) !== null) {
      components.add(match[1])
    }

    return Array.from(components).sort()
  }

  /**
   * Analyze JSX complexity
   */
  private analyzeComplexity(content: string): 'low' | 'medium' | 'high' {
    let complexityScore = 0

    // Count JSX components
    const componentCount = (content.match(/<[A-Z][a-zA-Z0-9]*/g) || []).length
    complexityScore += componentCount * 2

    // Count imports
    const importCount = (content.match(/^import\s+/gm) || []).length
    complexityScore += importCount * 3

    // Count exports
    const exportCount = (content.match(/^export\s+/gm) || []).length
    complexityScore += exportCount * 5

    // Count JSX expressions
    const expressionCount = (content.match(/\{[^}]+\}/g) || []).length
    complexityScore += expressionCount

    // Count nested components
    const nestedPattern = /<[A-Z][a-zA-Z0-9]*[^>]*>[\s\S]*?<[A-Z][a-zA-Z0-9]*/g
    const nestedCount = (content.match(nestedPattern) || []).length
    complexityScore += nestedCount * 3

    if (complexityScore < 10) return 'low'
    if (complexityScore < 30) return 'medium'
    return 'high'
  }

  /**
   * Add MDX-specific tags based on content analysis
   */
  private addMdxTags(existingTags: string[], content: string): string[] {
    const tags = new Set(existingTags)

    // Add 'mdx' tag
    tags.add('mdx')

    // Detect component types
    const componentPatterns = [
      { pattern: /<(Tabs|TabItem)/i, tag: 'tabs' },
      { pattern: /<(Card|CardGrid|LinkCard)/i, tag: 'cards' },
      { pattern: /<(Aside|Details)/i, tag: 'callouts' },
      { pattern: /<(Steps|Step)/i, tag: 'steps' },
      { pattern: /<(Badge|Icon)/i, tag: 'badges' },
      { pattern: /<(FileTree)/i, tag: 'file-tree' },
      { pattern: /<(Code|Pre)/i, tag: 'code-examples' },
    ]

    for (const { pattern, tag } of componentPatterns) {
      if (pattern.test(content)) {
        tags.add(tag)
      }
    }

    // Detect interactive elements
    if (/onClick|onChange|onSubmit/i.test(content)) {
      tags.add('interactive')
    }

    // Detect data visualization
    if (/<(Chart|Graph|Diagram)/i.test(content)) {
      tags.add('visualization')
    }

    // Detect forms
    if (/<(Form|Input|Button|Select)/i.test(content)) {
      tags.add('forms')
    }

    return Array.from(tags)
  }

  /**
   * Detect interactive features in the content
   */
  private detectInteractivity(content: string): {
    isInteractive: boolean
    features: string[]
  } {
    const features: string[] = []

    // Check for event handlers
    if (/on[A-Z][a-zA-Z]*=/i.test(content)) {
      features.push('event-handlers')
    }

    // Check for state management
    if (/useState|useReducer|useContext/i.test(content)) {
      features.push('state-management')
    }

    // Check for effects
    if (/useEffect|useLayoutEffect/i.test(content)) {
      features.push('side-effects')
    }

    // Check for forms
    if (/<(form|input|button|select|textarea)/i.test(content)) {
      features.push('forms')
    }

    // Check for dynamic imports
    if (/import\s*\(/i.test(content)) {
      features.push('dynamic-imports')
    }

    // Check for client directives (Astro-specific)
    if (/client:(load|idle|visible|media|only)/i.test(content)) {
      features.push('client-hydration')
    }

    return {
      isInteractive: features.length > 0,
      features,
    }
  }

  /**
   * Check if content has frontmatter
   */
  private hasFrontmatter(content: string): boolean {
    return /^---\n[\s\S]+?\n---/.test(content)
  }

  /**
   * Check if content has import statements
   */
  private hasImports(content: string): boolean {
    return /^import\s+/m.test(content)
  }
}

export const mdxEnhancer = new MDXEnhancer()
