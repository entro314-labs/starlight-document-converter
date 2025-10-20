import type { FileProcessor, ProcessingContext } from '../types.js'

/**
 * JSX Transformer Plugin
 * Advanced transformations for converting Markdown patterns to JSX
 */

export interface JSXTransformOptions {
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
  /** Custom transformation rules */
  customRules?: TransformRule[]
}

export interface TransformRule {
  /** Pattern to match */
  pattern: RegExp
  /** Replacement function or string */
  replacement: string | ((match: string, ...groups: string[]) => string)
  /** Component to import if transformation is applied */
  imports?: Array<{ name: string; source: string }>
}

export class JSXTransformer implements FileProcessor {
  extensions = ['.md', '.mdx']
  metadata = {
    name: 'jsx-transformer',
    version: '1.0.0',
    description: 'Advanced JSX transformations for Markdown content',
    author: 'entro314 labs',
  }

  private options: Required<JSXTransformOptions>
  private appliedImports: Set<string> = new Set()

  constructor(options: JSXTransformOptions = {}) {
    this.options = {
      githubAlerts: options.githubAlerts ?? true,
      admonitions: options.admonitions ?? true,
      expandableSections: options.expandableSections ?? true,
      linkCards: options.linkCards ?? true,
      fileTrees: options.fileTrees ?? true,
      customRules: options.customRules || [],
    }
  }

  async process(content: string, context: ProcessingContext): Promise<string> {
    this.appliedImports.clear()
    let processed = content

    // Apply transformations in order
    if (this.options.githubAlerts) {
      processed = this.transformGitHubAlerts(processed)
    }

    if (this.options.admonitions) {
      processed = this.transformAdmonitions(processed)
    }

    if (this.options.expandableSections) {
      processed = this.transformExpandableSections(processed)
    }

    if (this.options.linkCards) {
      processed = this.transformLinkCards(processed)
    }

    if (this.options.fileTrees) {
      processed = this.transformFileTrees(processed)
    }

    // Apply custom rules
    for (const rule of this.options.customRules) {
      processed = this.applyCustomRule(processed, rule)
    }

    // Add imports
    if (this.appliedImports.size > 0) {
      processed = this.addImportsToContent(processed)
    }

    return processed
  }

  /**
   * Transform GitHub-style alerts
   * > [!NOTE]
   * > Content
   */
  private transformGitHubAlerts(content: string): string {
    const alertTypes = {
      NOTE: 'note',
      TIP: 'tip',
      IMPORTANT: 'note',
      WARNING: 'caution',
      CAUTION: 'caution',
    }

    const alertPattern = /^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*\n((?:>.*\n?)*)/gim

    return content.replace(alertPattern, (match, type, alertContent) => {
      const lines = alertContent
        .split('\n')
        .map((line: string) => line.replace(/^>\s*/, ''))
        .filter((line: string) => line.trim())
        .join('\n')

      this.addImport('Aside', '@astrojs/starlight/components')

      const mappedType = alertTypes[type as keyof typeof alertTypes] || 'note'
      return `<Aside type="${mappedType}">\n${lines}\n</Aside>\n`
    })
  }

  /**
   * Transform Docusaurus-style admonitions
   * :::note Title
   * Content
   * :::
   */
  private transformAdmonitions(content: string): string {
    const admonitionPattern =
      /^:::+\s*(note|tip|info|caution|danger|warning)(?:\s+(.+?))?\s*$\n((?:(?!^:::).*\n?)*?)^:::+\s*$/gim

    return content.replace(admonitionPattern, (match, type, title, admonitionContent) => {
      this.addImport('Aside', '@astrojs/starlight/components')

      const titleAttr = title ? ` title="${title.trim()}"` : ''
      return `<Aside type="${type}"${titleAttr}>\n${admonitionContent.trim()}\n</Aside>\n`
    })
  }

  /**
   * Transform details/summary to Details component
   * <details>
   * <summary>Title</summary>
   * Content
   * </details>
   */
  private transformExpandableSections(content: string): string {
    const detailsPattern = /<details>\s*<summary>(.+?)<\/summary>\s*([\s\S]*?)<\/details>/gi

    return content.replace(detailsPattern, (match, summary, detailsContent) => {
      this.addImport('Details', '@astrojs/starlight/components')

      return `<Details summary="${summary.trim()}">\n${detailsContent.trim()}\n</Details>\n`
    })
  }

  /**
   * Transform link patterns to LinkCard components
   * [card: Title](url)
   * Description here
   * [/card]
   */
  private transformLinkCards(content: string): string {
    const cardPattern = /\[card:\s*(.+?)\]\((.+?)\)\s*\n((?:(?!\[\/card\]).*\n?)*)\[\/card\]/gi

    return content.replace(cardPattern, (match, title, href, description) => {
      this.addImport('LinkCard', '@astrojs/starlight/components')

      const desc = description.trim()
      const descAttr = desc ? ` description="${desc.replace(/"/g, '&quot;')}"` : ''

      return `<LinkCard title="${title.trim()}" href="${href.trim()}"${descAttr} />\n`
    })
  }

  /**
   * Transform file tree structures
   * ```tree
   * src/
   *   components/
   *     Button.tsx
   * ```
   */
  private transformFileTrees(content: string): string {
    const treePattern = /```tree\s*\n([\s\S]*?)```/gi

    return content.replace(treePattern, (match, treeContent) => {
      this.addImport('FileTree', '@astrojs/starlight/components')

      // Convert indentation to FileTree items
      const lines = treeContent.split('\n').filter((line: string) => line.trim())
      let result = '<FileTree>\n'

      for (const line of lines) {
        const indent = line.match(/^\s*/)?.[0].length || 0
        const name = line.trim()

        // Determine if it's a directory (ends with /) or file
        const isDir = name.endsWith('/')
        const cleanName = isDir ? name.slice(0, -1) : name

        const spaces = ' '.repeat(indent)
        result += `${spaces}- ${cleanName}${isDir ? '/' : ''}\n`
      }

      result += '</FileTree>\n'
      return result
    })
  }

  /**
   * Apply custom transformation rule
   */
  private applyCustomRule(content: string, rule: TransformRule): string {
    const result = content.replace(rule.pattern, rule.replacement as any)

    // Track if the rule was applied
    if (result !== content && rule.imports) {
      for (const imp of rule.imports) {
        this.addImport(imp.name, imp.source)
      }
    }

    return result
  }

  private addImport(componentName: string, source: string): void {
    this.appliedImports.add(`${componentName}:${source}`)
  }

  private addImportsToContent(content: string): string {
    // Group imports by source
    const importsBySource = new Map<string, Set<string>>()

    for (const imp of this.appliedImports) {
      const [componentName, source] = imp.split(':')
      if (!importsBySource.has(source)) {
        importsBySource.set(source, new Set())
      }
      importsBySource.get(source)?.add(componentName)
    }

    // Generate import statements
    const importStatements: string[] = []
    for (const [source, components] of importsBySource) {
      const componentList = Array.from(components).sort().join(', ')
      importStatements.push(`import { ${componentList} } from '${source}';`)
    }

    // Check if content already has imports
    const existingImportMatch = content.match(/^(import\s+.*\n)+/m)
    if (existingImportMatch) {
      // Don't duplicate imports
      return content
    }

    // Check if content has frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/)

    if (frontmatterMatch) {
      // Insert imports after frontmatter
      const frontmatterEnd = frontmatterMatch[0].length
      return (
        content.slice(0, frontmatterEnd) +
        '\n' +
        importStatements.join('\n') +
        '\n' +
        content.slice(frontmatterEnd)
      )
    }

    // Insert imports at the beginning
    return importStatements.join('\n') + '\n\n' + content
  }
}

export const jsxTransformer = new JSXTransformer()
