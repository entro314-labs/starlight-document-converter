import matter from 'gray-matter'
import type { DocumentMetadata, TocEntry } from '../../types.js'

export class ContentAnalyzer {
  private categoryPatterns: Record<string, string>
  private tagPatterns: Record<string, string[]>

  constructor(categoryPatterns?: Record<string, string>, tagPatterns?: Record<string, string[]>) {
    this.categoryPatterns = categoryPatterns || this.getDefaultCategoryPatterns()
    this.tagPatterns = tagPatterns || this.getDefaultTagPatterns()
  }

  /**
   * Analyze content and generate comprehensive metadata
   */
  analyzeContent(
    content: string,
    filePath: string
  ): {
    metadata: DocumentMetadata
    analysis: {
      wordCount: number
      readingTime: number
      complexity: 'simple' | 'moderate' | 'complex'
      headingStructure: TocEntry[]
      topics: string[]
      suggestedTags: string[]
      contentType: 'guide' | 'reference' | 'tutorial' | 'blog' | 'documentation'
    }
  } {
    let parsedContent: string
    let existingMetadata: DocumentMetadata = {}

    // Parse existing frontmatter if present
    if (content.startsWith('---\n')) {
      try {
        const parsed = matter(content)
        existingMetadata = parsed.data as DocumentMetadata
        parsedContent = parsed.content
      } catch {
        parsedContent = content
      }
    } else {
      parsedContent = content
    }

    // Generate comprehensive analysis
    const analysis = {
      wordCount: this.calculateWordCount(parsedContent),
      readingTime: this.estimateReadingTime(parsedContent),
      complexity: this.assessComplexity(parsedContent),
      headingStructure: this.extractHeadingStructure(parsedContent),
      topics: this.extractTopics(parsedContent, filePath),
      suggestedTags: this.suggestTags(parsedContent, filePath),
      contentType: this.detectContentType(parsedContent, filePath),
    }

    // Generate or enhance metadata
    const metadata: DocumentMetadata = {
      title: existingMetadata.title || this.generateTitle(parsedContent, filePath),
      description:
        existingMetadata.description ||
        this.generateDescription(parsedContent, existingMetadata.title || ''),
      category: existingMetadata.category || this.inferCategory(filePath, analysis.topics),
      tags: existingMetadata.tags || analysis.suggestedTags,
      lastUpdated: existingMetadata.lastUpdated,
    }

    return { metadata, analysis }
  }

  /**
   * Generate intelligent title from content
   */
  private generateTitle(content: string, filePath: string): string {
    // Try first heading
    const firstHeading = content.match(/^#\s+(.+)$/m)
    if (firstHeading) {
      return this.cleanTitle(firstHeading[1])
    }

    // Try to find title-like patterns
    const titlePatterns = [
      /^(.+)\n=+$/m, // Setext-style H1
      /^\*\*(.+)\*\*$/m, // Bold text at start
      /^(.+)(?:\n-{3,})?$/m, // First line
    ]

    for (const pattern of titlePatterns) {
      const match = content.match(pattern)
      if (match && match[1].length < 100) {
        return this.cleanTitle(match[1])
      }
    }

    // Generate from filename
    const fileName =
      filePath
        .split('/')
        .pop()
        ?.replace(/\.[^.]+$/, '') || 'Untitled'
    return this.humanizeFilename(fileName)
  }

  /**
   * Generate intelligent description from content
   */
  private generateDescription(content: string, title: string): string {
    // Remove code blocks and other noise
    const cleanContent = content
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/`[^`]+`/g, '') // Remove inline code
      .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text

    // Find meaningful paragraphs
    const paragraphs = cleanContent
      .split('\n\n')
      .map((p) => p.replace(/\n/g, ' ').trim())
      .filter(
        (p) =>
          p.length > 30 &&
          !p.startsWith('#') &&
          !p.startsWith('*') &&
          !p.startsWith('|') &&
          !p.match(/^\d+\./) &&
          !p.includes('TODO') &&
          !p.includes('FIXME')
      )

    if (paragraphs.length > 0) {
      let description = paragraphs[0]

      // Clean up markdown formatting
      description = description
        .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
        .replace(/\*(.*?)\*/g, '$1') // Italic
        .replace(/_([^_]+)_/g, '$1') // Underscore emphasis
        .replace(/~([^~]+)~/g, '$1') // Strikethrough

      // Truncate to appropriate length
      if (description.length > 155) {
        const truncated = description.substring(0, 152)
        const lastSpace = truncated.lastIndexOf(' ')
        description = lastSpace > 100 ? truncated.substring(0, lastSpace) : truncated
        description += '...'
      }

      // Ensure it ends with punctuation
      if (!/[.!?]$/.test(description)) {
        description += '.'
      }

      return description
    }

    // Generate contextual fallback descriptions
    return this.generateFallbackDescription(title, content)
  }

  /**
   * Infer category from file path and content
   */
  private inferCategory(filePath: string, topics: string[]): string {
    // Check path-based patterns first
    const pathParts = filePath.toLowerCase().split('/')

    for (const part of pathParts) {
      for (const [pattern, category] of Object.entries(this.categoryPatterns)) {
        if (part.includes(pattern)) {
          return category
        }
      }
    }

    // Check content-based topics
    const topicCategories = {
      'AI & ML': ['ai', 'machine learning', 'llm', 'neural', 'model'],
      Development: ['code', 'programming', 'function', 'class', 'method'],
      Guides: ['tutorial', 'guide', 'how to', 'step', 'setup'],
      Reference: ['api', 'reference', 'documentation', 'spec'],
      Design: ['ui', 'ux', 'design', 'style', 'component'],
    }

    for (const [category, keywords] of Object.entries(topicCategories)) {
      if (keywords.some((keyword) => topics.some((topic) => topic.includes(keyword)))) {
        return category
      }
    }

    return 'Documentation'
  }

  /**
   * Suggest relevant tags based on content analysis
   */
  private suggestTags(content: string, filePath: string): string[] {
    const contentLower = content.toLowerCase()
    const pathLower = filePath.toLowerCase()
    const suggestedTags = new Set<string>()

    // Check against tag patterns
    for (const [tag, patterns] of Object.entries(this.tagPatterns)) {
      if (
        patterns.some((pattern) => contentLower.includes(pattern) || pathLower.includes(pattern))
      ) {
        suggestedTags.add(tag)
      }
    }

    // Extract technology mentions
    const techKeywords = [
      'react',
      'vue',
      'angular',
      'svelte',
      'astro',
      'typescript',
      'javascript',
      'python',
      'rust',
      'go',
      'node',
      'npm',
      'pnpm',
      'webpack',
      'vite',
      'api',
      'rest',
      'graphql',
      'database',
      'sql',
      'docker',
      'kubernetes',
      'aws',
      'azure',
      'gcp',
    ]

    for (const keyword of techKeywords) {
      if (contentLower.includes(keyword)) {
        suggestedTags.add(keyword)
      }
    }

    // Limit to reasonable number of tags
    return Array.from(suggestedTags).slice(0, 8)
  }

  /**
   * Detect content type based on structure and keywords
   */
  private detectContentType(
    content: string,
    filePath: string
  ): 'guide' | 'reference' | 'tutorial' | 'blog' | 'documentation' {
    const contentLower = content.toLowerCase()
    const pathLower = filePath.toLowerCase()

    // Check filename patterns
    if (pathLower.includes('tutorial') || pathLower.includes('guide')) {
      return contentLower.includes('step') ? 'tutorial' : 'guide'
    }
    if (pathLower.includes('api') || pathLower.includes('reference')) {
      return 'reference'
    }
    if (pathLower.includes('blog') || pathLower.includes('post')) {
      return 'blog'
    }

    // Check content patterns
    const tutorialIndicators = ['step 1', 'first, ', 'next, ', 'finally, ', 'prerequisites']
    const referenceIndicators = ['parameters', 'returns', 'example', 'usage', 'api']
    const guideIndicators = ['overview', 'introduction', 'getting started', 'how to']

    const tutorialScore = tutorialIndicators.reduce(
      (score, indicator) => score + (contentLower.includes(indicator) ? 1 : 0),
      0
    )
    const referenceScore = referenceIndicators.reduce(
      (score, indicator) => score + (contentLower.includes(indicator) ? 1 : 0),
      0
    )
    const guideScore = guideIndicators.reduce(
      (score, indicator) => score + (contentLower.includes(indicator) ? 1 : 0),
      0
    )

    if (tutorialScore >= 2) return 'tutorial'
    if (referenceScore >= 2) return 'reference'
    if (guideScore >= 2) return 'guide'

    return 'documentation'
  }

  /**
   * Extract topics and keywords from content
   */
  private extractTopics(content: string, filePath: string): string[] {
    const topics = new Set<string>()

    // Extract from headings
    const headings = content.match(/^#+\s+(.+)$/gm) || []
    for (const heading of headings) {
      const title = heading.replace(/^#+\s+/, '').toLowerCase()
      topics.add(title)
    }

    // Extract emphasized terms
    const emphasizedTerms = content.match(/\*\*(.*?)\*\*/g) || []
    for (const term of emphasizedTerms) {
      const cleaned = term.replace(/\*\*/g, '').trim()
      if (cleaned.length > 2 && cleaned.length < 30) {
        topics.add(cleaned.toLowerCase())
      }
    }

    // Extract from file path
    const pathParts = filePath
      .split('/')
      .map((part) => part.replace(/[-_]/g, ' ').replace(/\.[^.]+$/, ''))
    pathParts.forEach((part) => topics.add(part.toLowerCase()))

    return Array.from(topics)
      .filter((topic) => topic.length > 2)
      .slice(0, 10)
  }

  /**
   * Calculate reading time estimate
   */
  private estimateReadingTime(content: string): number {
    const wordsPerMinute = 200
    const wordCount = this.calculateWordCount(content)
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute))
  }

  /**
   * Calculate word count
   */
  private calculateWordCount(content: string): number {
    // Remove code blocks and other non-text content
    const textContent = content
      .replace(/```[\s\S]*?```/g, '') // Code blocks
      .replace(/`[^`]+`/g, '') // Inline code
      .replace(/!\[.*?\]\(.*?\)/g, '') // Images
      .replace(/\[.*?\]\(.*?\)/g, '') // Links
      .replace(/[#*_~`]/g, '') // Markdown formatting

    return textContent.trim().split(/\s+/).length
  }

  /**
   * Assess content complexity
   */
  private assessComplexity(content: string): 'simple' | 'moderate' | 'complex' {
    const wordCount = this.calculateWordCount(content)
    const headingCount = (content.match(/^#+/gm) || []).length
    const codeBlockCount = (content.match(/```/g) || []).length / 2
    const linkCount = (content.match(/\[.*?\]\(.*?\)/g) || []).length

    const complexityScore =
      (wordCount > 1000 ? 1 : 0) +
      (headingCount > 5 ? 1 : 0) +
      (codeBlockCount > 3 ? 1 : 0) +
      (linkCount > 10 ? 1 : 0)

    if (complexityScore >= 3) return 'complex'
    if (complexityScore >= 1) return 'moderate'
    return 'simple'
  }

  /**
   * Extract heading structure
   */
  private extractHeadingStructure(content: string): TocEntry[] {
    const headings = content.match(/^(#+)\s+(.+)$/gm) || []

    return headings
      .map((heading) => {
        const match = heading.match(/^(#+)\s+(.+)$/)
        if (!match) return null

        const level = match[1].length
        const title = match[2].trim()
        const anchor = this.generateAnchor(title)

        return { level, title, anchor }
      })
      .filter((entry): entry is TocEntry => entry !== null)
  }

  /**
   * Generate URL-friendly anchor
   */
  private generateAnchor(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  /**
   * Clean and format title
   */
  private cleanTitle(title: string): string {
    return title
      .replace(/[#*_`]/g, '') // Remove markdown
      .replace(/\[([^\]]+)\]/g, '$1') // Remove link formatting
      .trim()
      .substring(0, 60) // Limit length
  }

  /**
   * Humanize filename for title generation
   */
  private humanizeFilename(filename: string): string {
    return filename
      .replace(/[-_]/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, (l) => l.toUpperCase())
      .trim()
  }

  /**
   * Generate fallback description based on content type
   */
  private generateFallbackDescription(title: string, content: string): string {
    const titleLower = title.toLowerCase()

    if (titleLower.includes('api') || content.includes('endpoint')) {
      return `API documentation and reference for ${title.replace(/api/i, '').trim()}.`
    }
    if (titleLower.includes('guide')) {
      return `Comprehensive guide covering ${title.toLowerCase().replace('guide', '').trim()}.`
    }
    if (titleLower.includes('tutorial')) {
      return `Step-by-step tutorial for ${title.toLowerCase().replace('tutorial', '').trim()}.`
    }
    if (titleLower.includes('reference')) {
      return `Reference documentation for ${title.replace(/reference/i, '').trim()}.`
    }

    return `Documentation and information about ${title.toLowerCase()}.`
  }

  /**
   * Default category patterns
   */
  private getDefaultCategoryPatterns(): Record<string, string> {
    return {
      ai: 'AI & ML',
      ml: 'AI & ML',
      claude: 'AI & ML',
      guide: 'Guides',
      tutorial: 'Guides',
      howto: 'Guides',
      reference: 'Reference',
      api: 'Reference',
      docs: 'Reference',
      design: 'Design System',
      ui: 'Design System',
      component: 'Design System',
      project: 'Projects',
      blog: 'Blog',
      post: 'Blog',
      news: 'Blog',
    }
  }

  /**
   * Default tag patterns
   */
  private getDefaultTagPatterns(): Record<string, string[]> {
    return {
      javascript: ['javascript', 'js', 'node.js', 'npm', 'pnpm'],
      typescript: ['typescript', 'ts'],
      react: ['react', 'jsx', 'react.js'],
      vue: ['vue', 'vue.js', 'nuxt'],
      astro: ['astro', 'starlight'],
      css: ['css', 'scss', 'sass', 'tailwind'],
      api: ['api', 'rest', 'graphql', 'endpoint'],
      database: ['database', 'sql', 'mongodb', 'postgres', 'supabase'],
      ai: ['ai', 'machine learning', 'llm', 'claude', 'gpt'],
      guide: ['guide', 'tutorial', 'how-to', 'documentation'],
      reference: ['reference', 'docs'],
      business: ['business', 'plan', 'strategy'],
      security: ['security', 'auth', 'authentication'],
      performance: ['performance', 'optimization', 'cache'],
      testing: ['test', 'testing', 'jest', 'vitest'],
    }
  }
}
