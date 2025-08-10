import { describe, expect, it } from 'vitest'

describe('Enhanced Conversion Features', () => {
  describe('Description Quality Enhancement', () => {
    const extractDescription = (content: string): string | undefined => {
      if (!content || content.trim().length === 0) {
        return
      }

      // Remove frontmatter if present
      const withoutFrontmatter = content.replace(/^---[\s\S]*?---\s*/, '')

      // Split into paragraphs and clean up
      const paragraphs = withoutFrontmatter
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0)

      if (paragraphs.length === 0) {
        return
      }

      // Skip the first paragraph if it looks like a title
      let startIndex = 0
      if (
        paragraphs.length > 1 &&
        paragraphs[0].length < 100 &&
        !paragraphs[0].endsWith('.') &&
        !paragraphs[0].includes('\n')
      ) {
        startIndex = 1
      }

      // Find the first meaningful paragraph
      for (let i = startIndex; i < paragraphs.length; i++) {
        const paragraph = paragraphs[i]

        // Skip headings
        if (paragraph.startsWith('#')) {
          continue
        }

        // Skip very short paragraphs
        if (paragraph.length < 20) {
          continue
        }

        // Clean up markdown formatting
        const cleaned = paragraph
          .replace(/[*_`]/g, '')
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
          .replace(/#+\s*/g, '')
          .trim()

        if (cleaned.length >= 20) {
          // Limit description length
          if (cleaned.length > 150) {
            const truncated = `${cleaned.substring(0, 147)}...`
            return truncated
          }
          return cleaned
        }
      }

      return
    }

    it('should extract description from simple content', () => {
      const content =
        '# Title\n\nThis is a description paragraph that explains what the document is about.\n\n## Section\n\nMore content here.'

      const description = extractDescription(content)
      expect(description).toBe(
        'This is a description paragraph that explains what the document is about.'
      )
    })

    it('should skip title-like first paragraphs', () => {
      const content =
        'Getting Started\n\nThis guide will help you set up your development environment quickly and efficiently.\n\n## Prerequisites'

      const description = extractDescription(content)
      expect(description).toBe(
        'This guide will help you set up your development environment quickly and efficiently.'
      )
    })

    it('should remove frontmatter before extracting', () => {
      const content =
        '---\ntitle: Test\ndescription: Old desc\n---\n\n# Test Document\n\nThis is the actual description from content.\n\n## More'

      const description = extractDescription(content)
      expect(description).toBe('This is the actual description from content.')
    })

    it('should clean markdown formatting', () => {
      const content =
        '# Title\n\nThis is a **bold** description with *italic* text and `code` and [links](http://example.com).\n\n## Section'

      const description = extractDescription(content)
      expect(description).toBe('This is a bold description with italic text and code and links.')
    })

    it('should skip headings when looking for description', () => {
      const content =
        '# Main Title\n\n## Subtitle\n\n### Another heading\n\nFinally, here is the actual content paragraph.\n\nMore content.'

      const description = extractDescription(content)
      expect(description).toBe('Finally, here is the actual content paragraph.')
    })

    it('should truncate long descriptions', () => {
      const longContent =
        'This is a very long description that exceeds the maximum allowed length for descriptions and should be truncated to fit within the recommended limits for good user experience and readability.'
      const content = `# Title\n\n${longContent}\n\n## Section`

      const description = extractDescription(content)
      expect(description).toContain('...')
      expect(description?.length).toBeLessThanOrEqual(150)
    })

    it('should handle empty content', () => {
      expect(extractDescription('')).toBeUndefined()
      expect(extractDescription('   ')).toBeUndefined()
      expect(extractDescription('# Title only')).toBeUndefined()
    })
  })

  describe('Advanced Category Detection', () => {
    const detectCategory = (filePath: string, content: string): string => {
      const pathLower = filePath.toLowerCase()
      const contentLower = content.toLowerCase()

      // Path-based detection
      if (pathLower.includes('/guide') || pathLower.includes('/tutorial')) {
        return 'Guides'
      }
      if (pathLower.includes('/api') || pathLower.includes('/reference')) {
        return 'Reference'
      }
      if (pathLower.includes('/blog') || pathLower.includes('/post')) {
        return 'Blog'
      }

      // Content-based detection
      if (
        contentLower.includes('tutorial') ||
        contentLower.includes('how to') ||
        contentLower.includes('step by step')
      ) {
        return 'Guides'
      }
      if (
        contentLower.includes('api') ||
        contentLower.includes('endpoint') ||
        contentLower.includes('reference')
      ) {
        return 'Reference'
      }
      if (
        contentLower.includes('introduction') ||
        contentLower.includes('getting started') ||
        contentLower.includes('overview')
      ) {
        return 'Getting Started'
      }

      return 'Documentation'
    }

    it('should detect category from file path', () => {
      expect(detectCategory('/docs/guide/setup.md', 'Content')).toBe('Guides')
      expect(detectCategory('/api/users.md', 'Content')).toBe('Reference')
      expect(detectCategory('/blog/announcement.md', 'Content')).toBe('Blog')
    })

    it('should detect category from content', () => {
      expect(detectCategory('file.md', 'This is a tutorial on how to...')).toBe('Guides')
      expect(detectCategory('file.md', 'API endpoint documentation')).toBe('Reference')
      expect(detectCategory('file.md', 'Getting started with our platform')).toBe('Getting Started')
    })

    it('should fallback to default category', () => {
      expect(detectCategory('random.md', 'Some random content')).toBe('Documentation')
    })
  })

  describe('Comprehensive Tag Generation', () => {
    const generateTags = (content: string): string[] => {
      const contentLower = content.toLowerCase()
      const tags: Set<string> = new Set()

      // Technology patterns
      const techPatterns = {
        javascript: /\b(javascript|js|node\.?js)\b/g,
        typescript: /\b(typescript|ts)\b/g,
        react: /\breact\b/g,
        vue: /\bvue\.?js\b/g,
        angular: /\bangular\b/g,
        astro: /\bastro\b/g,
        python: /\bpython\b/g,
        api: /\b(api|rest|graphql|endpoint)\b/g,
        database: /\b(database|sql|mongodb|postgres)\b/g,
        docker: /\bdocker\b/g,
        git: /\bgit\b/g,
      }

      // Content type patterns
      const typePatterns = {
        guide: /\b(guide|tutorial|how-to|walkthrough)\b/g,
        reference: /\b(reference|documentation|docs|api)\b/g,
        configuration: /\b(config|configuration|setup|install)\b/g,
        troubleshooting: /\b(troubleshoot|debug|fix|error|problem)\b/g,
      }

      // Check technology patterns
      for (const [tag, pattern] of Object.entries(techPatterns)) {
        if (pattern.test(contentLower)) {
          tags.add(tag)
        }
      }

      // Check content type patterns
      for (const [tag, pattern] of Object.entries(typePatterns)) {
        if (pattern.test(contentLower)) {
          tags.add(tag)
        }
      }

      // Ensure at least one tag
      if (tags.size === 0) {
        tags.add('documentation')
      }

      return Array.from(tags).slice(0, 5) // Limit to 5 tags
    }

    it('should detect technology tags', () => {
      const content = 'This guide shows how to use JavaScript and React with TypeScript.'
      const tags = generateTags(content)

      expect(tags).toContain('javascript')
      expect(tags).toContain('react')
      expect(tags).toContain('typescript')
    })

    it('should detect content type tags', () => {
      const content = 'This is a configuration guide for setting up the API.'
      const tags = generateTags(content)

      expect(tags).toContain('guide')
      expect(tags).toContain('configuration')
      expect(tags).toContain('api')
    })

    it('should limit number of tags', () => {
      const content =
        'JavaScript TypeScript React Vue Angular API database Docker Git tutorial guide reference configuration troubleshooting'
      const tags = generateTags(content)

      expect(tags.length).toBeLessThanOrEqual(5)
    })

    it('should provide fallback tag', () => {
      const content = 'Some random content without specific technologies.'
      const tags = generateTags(content)

      expect(tags).toContain('documentation')
    })
  })

  describe('Content Quality Validation', () => {
    const validateContent = (frontmatter: Record<string, unknown>, content: string) => {
      const issues: string[] = []
      let score = 100

      // Check title
      if (!frontmatter.title) {
        issues.push('Missing title')
        score -= 20
      } else if (frontmatter.title.length < 5) {
        issues.push('Title too short')
        score -= 15
      }

      // Check description
      if (!frontmatter.description) {
        issues.push('Missing description')
        score -= 25
      } else if (frontmatter.description.length < 20) {
        issues.push('Description too short')
        score -= 15
      }

      // Check tags
      if (!frontmatter.tags || frontmatter.tags.length === 0) {
        issues.push('Missing tags')
        score -= 15
      }

      // Check content structure
      const headings = content.match(/^#+\s+.+$/gm)
      if (!headings || headings.length === 0) {
        issues.push('No headings found')
        score -= 10
      }

      // Content length
      if (content.length < 100) {
        issues.push('Content too short')
        score -= 15
      }

      const level = score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low'
      const emoji = level === 'high' ? '🟢' : level === 'medium' ? '🟡' : '🔴'

      return {
        score: Math.max(0, score),
        level,
        emoji,
        issues,
      }
    }

    it('should validate complete content', () => {
      const frontmatter = {
        title: 'Getting Started Guide',
        description: 'This comprehensive guide will help you get started with our platform.',
        tags: ['guide', 'tutorial', 'getting-started'],
      }

      const content = `# Getting Started Guide

This is a comprehensive guide.

## Prerequisites

- Node.js
- npm

## Installation

Run the following command...`

      const validation = validateContent(frontmatter, content)

      expect(validation.level).toBe('high')
      expect(validation.score).toBeGreaterThanOrEqual(80)
      expect(validation.emoji).toBe('🟢')
      expect(validation.issues).toHaveLength(0)
    })

    it('should identify missing elements', () => {
      const frontmatter = {}
      const content = 'Short content'

      const validation = validateContent(frontmatter, content)

      expect(validation.level).toBe('low')
      expect(validation.issues).toContain('Missing title')
      expect(validation.issues).toContain('Missing description')
      expect(validation.issues).toContain('Missing tags')
      expect(validation.issues).toContain('No headings found')
      expect(validation.issues).toContain('Content too short')
    })

    it('should handle medium quality content', () => {
      const frontmatter = {
        title: 'Test',
        description: 'Short description',
        tags: ['test'],
      }

      const content = `# Test

This is medium length content with some structure but could be improved with more details and better organization.`

      const validation = validateContent(frontmatter, content)

      expect(validation.level).toBe('medium')
      expect(validation.emoji).toBe('🟡')
    })
  })

  describe('YAML Formatting Improvements', () => {
    const generateYAML = (frontmatter: Record<string, unknown>): string => {
      let yaml = ''

      Object.entries(frontmatter).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          yaml += `${key}:\n${value.map((item) => `  - ${item}`).join('\n')}\n`
        } else if (typeof value === 'string') {
          // Escape quotes and handle multiline
          const escaped = value.replace(/"/g, '\\"')
          if (value.includes('\n') || value.length > 100) {
            // Use block scalar for long/multiline content
            yaml += `${key}: |\n  ${escaped.split('\n').join('\n  ')}\n`
          } else {
            yaml += `${key}: "${escaped}"\n`
          }
        } else {
          yaml += `${key}: ${value}\n`
        }
      })

      return yaml
    }

    it('should format simple frontmatter correctly', () => {
      const frontmatter = {
        title: 'Test Title',
        description: 'Short description',
        category: 'Documentation',
      }

      const yaml = generateYAML(frontmatter)

      expect(yaml).toContain('title: "Test Title"')
      expect(yaml).toContain('description: "Short description"')
      expect(yaml).toContain('category: "Documentation"')
    })

    it('should format arrays correctly', () => {
      const frontmatter = {
        title: 'Test',
        tags: ['javascript', 'tutorial', 'guide'],
      }

      const yaml = generateYAML(frontmatter)

      expect(yaml).toContain('tags:')
      expect(yaml).toContain('  - javascript')
      expect(yaml).toContain('  - tutorial')
      expect(yaml).toContain('  - guide')
    })

    it('should escape quotes properly', () => {
      const frontmatter = {
        title: 'API "REST" Guide',
        description: 'Learn about "RESTful" APIs',
      }

      const yaml = generateYAML(frontmatter)

      expect(yaml).toContain('title: "API \\"REST\\" Guide"')
      expect(yaml).toContain('description: "Learn about \\"RESTful\\" APIs"')
    })

    it('should handle long content with block scalars', () => {
      const frontmatter = {
        title: 'Test',
        description:
          'This is a very long description that exceeds the normal length and should be formatted as a block scalar for better readability and proper YAML formatting.',
      }

      const yaml = generateYAML(frontmatter)

      expect(yaml).toContain('description: |')
      expect(yaml).toContain('  This is a very long description')
    })

    it('should handle multiline content', () => {
      const frontmatter = {
        title: 'Test',
        description: 'Line 1\nLine 2\nLine 3',
      }

      const yaml = generateYAML(frontmatter)

      expect(yaml).toContain('description: |')
      expect(yaml).toContain('  Line 1')
      expect(yaml).toContain('  Line 2')
      expect(yaml).toContain('  Line 3')
    })
  })
})
