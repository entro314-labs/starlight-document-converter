import type { FileProcessor, ProcessingContext } from '../types.js'

/**
 * MDX Converter Plugin
 * Converts Markdown to MDX format with JSX component support
 */

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
  /** Format JSX with prettier-style formatting */
  formatJSX?: boolean
}

interface ComponentImport {
  name: string
  source: string
  isDefault?: boolean
}

export class MDXConverter implements FileProcessor {
  extensions = ['.md', '.mdx']
  metadata = {
    name: 'mdx-converter',
    version: '1.0.0',
    description: 'Converts Markdown to MDX with JSX component support',
    author: 'entro314 labs',
  }

  private options: Required<MDXConversionOptions>
  private detectedImports: Set<ComponentImport> = new Set()

  constructor(options: MDXConversionOptions = {}) {
    this.options = {
      convertCallouts: options.convertCallouts ?? true,
      convertTabs: options.convertTabs ?? true,
      convertCodeGroups: options.convertCodeGroups ?? true,
      autoImports: options.autoImports ?? true,
      componentMappings: options.componentMappings || this.getDefaultMappings(),
      preserveJSX: options.preserveJSX ?? true,
      formatJSX: options.formatJSX ?? true,
    }
  }

  private getDefaultMappings(): Record<string, string> {
    return {
      // Starlight components
      note: 'Aside',
      tip: 'Aside',
      caution: 'Aside',
      danger: 'Aside',
      warning: 'Aside',
      // Common MDX components
      tabs: 'Tabs',
      tab: 'TabItem',
      card: 'Card',
      'card-grid': 'CardGrid',
      steps: 'Steps',
      badge: 'Badge',
      icon: 'Icon',
    }
  }

  async process(content: string, context: ProcessingContext): Promise<string> {
    this.detectedImports.clear()

    // Skip if already has JSX and we want to preserve
    if (this.options.preserveJSX && this.hasJSXContent(content)) {
      return content
    }

    let processed = content

    // Convert Markdown patterns to JSX components
    if (this.options.convertCallouts) {
      processed = this.convertCallouts(processed)
    }

    if (this.options.convertTabs) {
      processed = this.convertTabs(processed)
    }

    if (this.options.convertCodeGroups) {
      processed = this.convertCodeGroups(processed)
    }

    // Convert other common patterns
    processed = this.convertCards(processed)
    processed = this.convertSteps(processed)
    processed = this.convertBadges(processed)

    // Add imports at the top if auto-imports enabled
    if (this.options.autoImports && this.detectedImports.size > 0) {
      processed = this.addImports(processed)
    }

    return processed
  }

  private hasJSXContent(content: string): boolean {
    // Check for existing JSX components
    const jsxPatterns = [
      /<[A-Z][a-zA-Z0-9]*[\s\/>]/, // Component tags
      /import\s+.*\s+from\s+['"]/, // Import statements
      /export\s+(default\s+)?/, // Export statements
    ]
    return jsxPatterns.some((pattern) => pattern.test(content))
  }

  /**
   * Convert Markdown callouts/alerts to Aside components
   * Examples:
   *   > [!NOTE]
   *   > This is a note
   * Becomes:
   *   <Aside type="note">
   *   This is a note
   *   </Aside>
   */
  private convertCallouts(content: string): string {
    const calloutTypes = ['note', 'tip', 'caution', 'danger', 'warning', 'info']
    const calloutPattern = new RegExp(
      `^>\\s*\\[!(${calloutTypes.join('|')})\\]\\s*\n((?:>.*\n?)+)`,
      'gim'
    )

    return content.replace(calloutPattern, (match, type, blockContent) => {
      const lines = blockContent
        .split('\n')
        .map((line: string) => line.replace(/^>\s*/, '').trim())
        .filter((line: string) => line)
        .join('\n')

      this.addImport('Aside', '@astrojs/starlight/components')

      const formattedType = type.toLowerCase()
      return `<Aside type="${formattedType}">\n${lines}\n</Aside>\n`
    })
  }

  /**
   * Convert tab-like structures to Tabs components
   * Example:
   *   ### Tab: JavaScript
   *   code here
   *   ### Tab: TypeScript
   *   code here
   */
  private convertTabs(content: string): string {
    // Match tab groups (consecutive ### Tab: patterns)
    const tabGroupPattern = /(?:^###\s+Tab:\s*(.+?)\s*$\n((?:(?!^###\s+Tab:).*\n?)*?))+/gm

    return content.replace(tabGroupPattern, (match) => {
      const tabs: { label: string; content: string }[] = []
      const tabPattern = /^###\s+Tab:\s*(.+?)\s*$\n((?:(?!^###\s+Tab:).*\n?)*)/gm

      let tabMatch: RegExpExecArray | null
      while ((tabMatch = tabPattern.exec(match)) !== null) {
        tabs.push({
          label: tabMatch[1].trim(),
          content: tabMatch[2].trim(),
        })
      }

      if (tabs.length === 0) return match

      this.addImport('Tabs', '@astrojs/starlight/components')
      this.addImport('TabItem', '@astrojs/starlight/components')

      let result = '<Tabs>\n'
      for (const tab of tabs) {
        result += `  <TabItem label="${tab.label}">\n`
        result += this.indentContent(tab.content, 4)
        result += '\n  </TabItem>\n'
      }
      result += '</Tabs>\n'

      return result
    })
  }

  /**
   * Convert code groups (multiple consecutive code blocks) to code tabs
   */
  private convertCodeGroups(content: string): string {
    // Match consecutive code blocks with different languages
    const codeGroupPattern = /((?:```\w+\n(?:.*?\n)*?```\n?){2,})/gm

    return content.replace(codeGroupPattern, (match) => {
      const codeBlocks: { lang: string; code: string; filename?: string }[] = []
      const blockPattern = /```(\w+)(?:\s+title="([^"]+)")?\n(.*?)\n```/gs

      let blockMatch: RegExpExecArray | null
      while ((blockMatch = blockPattern.exec(match)) !== null) {
        codeBlocks.push({
          lang: blockMatch[1],
          filename: blockMatch[2],
          code: blockMatch[3],
        })
      }

      // Only convert if we have multiple code blocks with different languages
      if (codeBlocks.length < 2) return match

      const uniqueLangs = new Set(codeBlocks.map((b) => b.lang))
      if (uniqueLangs.size < 2) return match

      this.addImport('Tabs', '@astrojs/starlight/components')
      this.addImport('TabItem', '@astrojs/starlight/components')

      let result = '<Tabs>\n'
      for (const block of codeBlocks) {
        const label = block.filename || block.lang
        result += `  <TabItem label="${label}">\n\n`
        result += `\`\`\`${block.lang}\n${block.code}\n\`\`\`\n\n`
        result += '  </TabItem>\n'
      }
      result += '</Tabs>\n'

      return result
    })
  }

  /**
   * Convert card patterns to Card components
   * Example:
   *   ::: card Title
   *   Content here
   *   :::
   */
  private convertCards(content: string): string {
    const cardPattern = /^:::+\s*card(?:\s+(.+?))?\s*$\n((?:(?!^:::).*\n?)*?)^:::+\s*$/gm

    return content.replace(cardPattern, (match, title, cardContent) => {
      this.addImport('Card', '@astrojs/starlight/components')

      const titleAttr = title ? ` title="${title.trim()}"` : ''
      return `<Card${titleAttr}>\n${cardContent.trim()}\n</Card>\n`
    })
  }

  /**
   * Convert numbered lists that look like steps to Steps component
   */
  private convertSteps(content: string): string {
    // Look for numbered lists with step-like content
    const stepsPattern =
      /^(?:#{2,3}\s+Steps?\s*$\n)?((?:^\d+\.\s+.+$\n(?:(?!^\d+\.).*\n)*)+)/gm

    return content.replace(stepsPattern, (match, stepsList, offset) => {
      // Only convert if explicitly marked as "Steps" or has 3+ items
      const hasStepsHeading = match.startsWith('##')
      const steps = stepsList.match(/^\d+\.\s+/gm)

      if (!hasStepsHeading && (!steps || steps.length < 3)) {
        return match
      }

      const stepItems: string[] = []
      const stepPattern = /^\d+\.\s+(.+?)(?=^\d+\.\s+|\Z)/gms

      let stepMatch: RegExpExecArray | null
      while ((stepMatch = stepPattern.exec(stepsList)) !== null) {
        stepItems.push(stepMatch[1].trim())
      }

      if (stepItems.length === 0) return match

      this.addImport('Steps', '@astrojs/starlight/components')

      let result = '<Steps>\n'
      for (const item of stepItems) {
        result += `\n${item}\n`
      }
      result += '</Steps>\n'

      return result
    })
  }

  /**
   * Convert badge patterns to Badge components
   * Example: [badge: New] or [badge type="success"]New[/badge]
   */
  private convertBadges(content: string): string {
    const badgePattern = /\[badge(?:\s+type="(.*?)")?\](.+?)\[\/badge\]/g

    return content.replace(badgePattern, (match, type, text) => {
      this.addImport('Badge', '@astrojs/starlight/components')

      const typeAttr = type ? ` variant="${type}"` : ''
      return `<Badge${typeAttr}>${text.trim()}</Badge>`
    })
  }

  private addImport(componentName: string, source: string, isDefault = false): void {
    this.detectedImports.add({
      name: componentName,
      source,
      isDefault,
    })
  }

  private addImports(content: string): string {
    // Group imports by source
    const importsBySource = new Map<string, Set<string>>()

    for (const imp of this.detectedImports) {
      if (!importsBySource.has(imp.source)) {
        importsBySource.set(imp.source, new Set())
      }
      importsBySource.get(imp.source)?.add(imp.name)
    }

    // Generate import statements
    const importStatements: string[] = []
    for (const [source, components] of importsBySource) {
      const componentList = Array.from(components).sort().join(', ')
      importStatements.push(`import { ${componentList} } from '${source}';`)
    }

    // Check if content already has frontmatter
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

  private indentContent(content: string, spaces: number): string {
    const indent = ' '.repeat(spaces)
    return content
      .split('\n')
      .map((line) => (line.trim() ? indent + line : line))
      .join('\n')
  }
}

export const mdxConverter = new MDXConverter()
