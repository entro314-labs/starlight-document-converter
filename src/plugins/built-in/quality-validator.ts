import type {
  DocumentMetadata,
  ProcessingContext,
  QualityIssue,
  QualityReport,
  QualityValidator,
} from '../types.js'

/**
 * Comprehensive quality validator for generated content
 */
export const contentQualityValidator: QualityValidator = {
  metadata: {
    name: 'content-quality-validator',
    version: '1.0.0',
    description: 'Validates content quality and provides improvement suggestions',
    author: 'Starlight Document Converter',
  },

  validate: (
    content: string,
    metadata: DocumentMetadata,
    _context: ProcessingContext
  ): QualityReport => {
    const issues: QualityIssue[] = []
    let score = 100

    // Validate metadata quality
    const metadataScore = validateMetadata(metadata, issues)

    // Validate content structure
    const structureScore = validateContentStructure(content, issues)

    // Validate content quality
    const contentScore = validateContentQuality(content, issues)

    // Validate accessibility
    const accessibilityScore = validateAccessibility(content, issues)

    // Calculate weighted score
    score = Math.round(
      metadataScore * 0.25 + structureScore * 0.3 + contentScore * 0.35 + accessibilityScore * 0.1
    )

    // Determine quality level
    const level: 'high' | 'medium' | 'low' = score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low'

    // Generate suggestions
    const suggestions = generateSuggestions(issues, metadata, content)

    return {
      score,
      level,
      issues,
      suggestions,
    }
  },
}

function validateMetadata(metadata: DocumentMetadata, issues: QualityIssue[]): number {
  let score = 100

  // Title validation
  if (!metadata.title) {
    issues.push({
      type: 'error',
      message: 'Missing title',
      severity: 9,
    })
    score -= 30
  } else if (metadata.title.length < 5) {
    issues.push({
      type: 'warning',
      message: 'Title is very short (less than 5 characters)',
      severity: 6,
    })
    score -= 15
  } else if (metadata.title.length > 100) {
    issues.push({
      type: 'warning',
      message: 'Title is very long (over 100 characters)',
      severity: 4,
    })
    score -= 10
  }

  // Description validation
  if (!metadata.description) {
    issues.push({
      type: 'warning',
      message: 'Missing description',
      severity: 7,
    })
    score -= 20
  } else if (metadata.description.length < 20) {
    issues.push({
      type: 'warning',
      message: 'Description is very short (less than 20 characters)',
      severity: 5,
    })
    score -= 10
  } else if (metadata.description.length > 300) {
    issues.push({
      type: 'info',
      message: 'Description is quite long (over 300 characters)',
      severity: 2,
    })
    score -= 5
  }

  // Category validation
  if (!metadata.category) {
    issues.push({
      type: 'info',
      message: 'No category specified',
      severity: 3,
    })
    score -= 5
  }

  // Tags validation
  if (!metadata.tags || metadata.tags.length === 0) {
    issues.push({
      type: 'info',
      message: 'No tags specified',
      severity: 2,
    })
    score -= 5
  } else if (metadata.tags.length > 10) {
    issues.push({
      type: 'warning',
      message: 'Too many tags (over 10)',
      severity: 3,
    })
    score -= 5
  }

  return Math.max(0, score)
}

function validateContentStructure(content: string, issues: QualityIssue[]): number {
  let score = 100

  // Check for headings
  const headings = content.match(/^#{1,6}\s+.+$/gm) || []

  if (headings.length === 0) {
    issues.push({
      type: 'warning',
      message: 'No headings found - content may lack structure',
      severity: 6,
    })
    score -= 20
  } else if (headings.length > 20) {
    issues.push({
      type: 'info',
      message: 'Many headings found - consider consolidating content',
      severity: 2,
    })
    score -= 5
  }

  // Check heading hierarchy
  const headingLevels = headings.map((h) => h.match(/^#+/)?.[0]?.length || 0)
  let prevLevel = 0
  let hierarchyIssues = 0

  headingLevels.forEach((level, index) => {
    if (index > 0 && level > prevLevel + 1) {
      hierarchyIssues++
    }
    prevLevel = level
  })

  if (hierarchyIssues > 0) {
    issues.push({
      type: 'warning',
      message: 'Heading hierarchy has gaps (e.g., H1 followed by H3)',
      severity: 4,
    })
    score -= 10
  }

  // Check content length
  const wordCount = content.split(/\s+/).length

  if (wordCount < 50) {
    issues.push({
      type: 'warning',
      message: 'Content is very short (less than 50 words)',
      severity: 5,
    })
    score -= 15
  } else if (wordCount > 5000) {
    issues.push({
      type: 'info',
      message: 'Content is very long (over 5000 words) - consider splitting',
      severity: 2,
    })
    score -= 5
  }

  // Check for code blocks
  const codeBlocks = content.match(/```[\s\S]*?```/g) || []
  const inlineCode = content.match(/`[^`]+`/g) || []

  if (codeBlocks.length > 0 || inlineCode.length > 0) {
    // Check if code blocks have language specified
    const unspecifiedCodeBlocks = content.match(/```\n/g) || []
    if (unspecifiedCodeBlocks.length > 0) {
      issues.push({
        type: 'info',
        message: 'Some code blocks lack language specification',
        severity: 1,
      })
      score -= 2
    }
  }

  return Math.max(0, score)
}

function validateContentQuality(content: string, issues: QualityIssue[]): number {
  let score = 100

  // Check for placeholder text
  const placeholders = [
    'lorem ipsum',
    'todo',
    'tbd',
    'fixme',
    'xxx',
    'placeholder',
    'coming soon',
    'under construction',
  ]

  const lowerContent = content.toLowerCase()
  placeholders.forEach((placeholder) => {
    if (lowerContent.includes(placeholder)) {
      issues.push({
        type: 'warning',
        message: `Found placeholder text: "${placeholder}"`,
        severity: 7,
      })
      score -= 15
    }
  })

  // Check for broken links (basic pattern matching)
  const links = content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || []
  links.forEach((link) => {
    const url = link.match(/\]\(([^)]+)\)/)?.[1]
    if (url?.includes('example.com') || url?.includes('localhost')) {
      issues.push({
        type: 'warning',
        message: 'Found example or localhost link that may need updating',
        severity: 4,
      })
      score -= 5
    }
  })

  // Check for broken internal links
  const internalLinks = links.filter(
    (link) => link.includes('](./') || link.includes('](../') || link.includes('](/')
  )

  if (internalLinks.length > 0) {
    issues.push({
      type: 'info',
      message: 'Internal links found - verify they point to existing files',
      severity: 3,
    })
  }

  // Check for repetitive content
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 10)
  const duplicateSentences = sentences.filter(
    (sentence, index) => sentences.indexOf(sentence) !== index
  )

  if (duplicateSentences.length > 0) {
    issues.push({
      type: 'info',
      message: 'Found potentially duplicate sentences',
      severity: 2,
    })
    score -= 5
  }

  return Math.max(0, score)
}

function validateAccessibility(content: string, issues: QualityIssue[]): number {
  let score = 100

  // Check for images without alt text
  const images = content.match(/!\[([^\]]*)\]\([^)]+\)/g) || []
  const imagesWithoutAlt = images.filter((img) => {
    const altText = img.match(/!\[([^\]]*)\]/)?.[1]
    return !altText || altText.trim().length === 0
  })

  if (imagesWithoutAlt.length > 0) {
    issues.push({
      type: 'warning',
      message: `${imagesWithoutAlt.length} image(s) without alt text`,
      severity: 6,
    })
    score -= 20
  }

  // Check for tables without headers
  const tables = content.match(/\|[^|\n]*\|/g) || []
  if (tables.length > 0) {
    const hasTableHeaders = content.includes('|--') || content.includes('| --')
    if (!hasTableHeaders) {
      issues.push({
        type: 'warning',
        message: 'Tables found without proper headers',
        severity: 4,
      })
      score -= 10
    }
  }

  // Check for color-only information
  const colorWords = ['red', 'green', 'blue', 'yellow', 'orange', 'purple']
  const colorOnlyReferences = colorWords.some((color) => {
    const pattern = new RegExp(`\\b${color}\\s+(indicates?|means?|shows?)`, 'i')
    return pattern.test(content)
  })

  if (colorOnlyReferences) {
    issues.push({
      type: 'info',
      message: 'Content may rely on color alone for meaning',
      severity: 3,
    })
    score -= 5
  }

  return Math.max(0, score)
}

function generateSuggestions(
  issues: QualityIssue[],
  metadata: DocumentMetadata,
  content: string
): string[] {
  const suggestions: string[] = []

  // Generate suggestions based on issues
  const errorCount = issues.filter((i) => i.type === 'error').length
  const warningCount = issues.filter((i) => i.type === 'warning').length

  if (errorCount > 0) {
    suggestions.push('Fix critical errors first, especially missing titles or descriptions')
  }

  if (warningCount > 0) {
    suggestions.push('Address warnings to improve content quality and user experience')
  }

  if (!metadata.title || (metadata.title && metadata.title.length < 10)) {
    suggestions.push('Consider a more descriptive title that clearly explains the content')
  }

  if (!metadata.description || (metadata.description && metadata.description.length < 50)) {
    suggestions.push('Add a comprehensive description that summarizes the key points')
  }

  const headingCount = (content.match(/^#+/gm) || []).length
  if (headingCount === 0) {
    suggestions.push('Add headings to improve content structure and readability')
  }

  const wordCount = content.split(/\s+/).length
  if (wordCount < 100) {
    suggestions.push('Consider expanding the content with more details and examples')
  }

  if (!metadata.tags || metadata.tags.length === 0) {
    suggestions.push('Add relevant tags to improve discoverability')
  }

  const codeBlockCount = (content.match(/```/g) || []).length / 2
  if (codeBlockCount > 0) {
    suggestions.push('Ensure all code blocks specify their programming language')
  }

  return suggestions
}
