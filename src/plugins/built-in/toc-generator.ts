import type { TocEntry } from '../../types.js';

export class TocGenerator {
  private maxDepth: number;
  private minEntries: number;

  constructor(maxDepth = 4, minEntries = 2) {
    this.maxDepth = maxDepth;
    this.minEntries = minEntries;
  }

  /**
   * Generate table of contents from markdown content
   */
  generateToc(content: string): TocEntry[] {
    const headings = this.extractHeadings(content);
    
    if (headings.length < this.minEntries) {
      return [];
    }

    return this.buildTocTree(headings);
  }

  /**
   * Generate table of contents with custom anchor generation
   */
  generateTocWithCustomAnchors(content: string, anchorGenerator?: (title: string) => string): TocEntry[] {
    const headings = this.extractHeadings(content, anchorGenerator);
    
    if (headings.length < this.minEntries) {
      return [];
    }

    return this.buildTocTree(headings);
  }

  /**
   * Insert table of contents into content
   */
  insertTocIntoContent(content: string, tocPosition: 'top' | 'after-title' | 'custom' = 'after-title', customMarker?: string): string {
    const toc = this.generateToc(content);
    
    if (toc.length === 0) {
      return content;
    }

    const tocMarkdown = this.renderTocAsMarkdown(toc);
    
    switch (tocPosition) {
      case 'top':
        return this.insertAtTop(content, tocMarkdown);
      case 'after-title':
        return this.insertAfterTitle(content, tocMarkdown);
      case 'custom':
        if (customMarker) {
          return content.replace(customMarker, tocMarkdown);
        }
        return this.insertAfterTitle(content, tocMarkdown);
      default:
        return this.insertAfterTitle(content, tocMarkdown);
    }
  }

  /**
   * Extract headings from content
   */
  private extractHeadings(content: string, anchorGenerator?: (title: string) => string): Array<{ level: number; title: string; anchor: string }> {
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const headings: Array<{ level: number; title: string; anchor: string }> = [];
    
    let match;
    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length;
      const title = this.cleanHeadingText(match[2]);
      
      if (level <= this.maxDepth) {
        const anchor = anchorGenerator ? anchorGenerator(title) : this.generateAnchor(title);
        headings.push({ level, title, anchor });
      }
    }
    
    return headings;
  }

  /**
   * Build hierarchical TOC tree
   */
  private buildTocTree(headings: Array<{ level: number; title: string; anchor: string }>): TocEntry[] {
    const root: TocEntry[] = [];
    const stack: TocEntry[] = [];

    for (const heading of headings) {
      const entry: TocEntry = {
        level: heading.level,
        title: heading.title,
        anchor: heading.anchor,
        children: []
      };

      // Find the appropriate parent level
      while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
        stack.pop();
      }

      if (stack.length === 0) {
        // This is a top-level heading
        root.push(entry);
      } else {
        // This is a child heading
        const parent = stack[stack.length - 1];
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(entry);
      }

      stack.push(entry);
    }

    return root;
  }

  /**
   * Clean heading text (remove markdown formatting)
   */
  private cleanHeadingText(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1')     // Remove italic
      .replace(/`(.*?)`/g, '$1')       // Remove code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
      .trim();
  }

  /**
   * Generate URL-friendly anchor from title
   */
  private generateAnchor(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-')         // Replace spaces with hyphens
      .replace(/-+/g, '-')          // Remove multiple consecutive hyphens
      .replace(/^-|-$/g, '');       // Remove leading/trailing hyphens
  }

  /**
   * Render TOC as markdown
   */
  renderTocAsMarkdown(toc: TocEntry[]): string {
    const lines = ['## Table of Contents', ''];
    this.renderTocLevel(toc, lines, 0);
    return lines.join('\n') + '\n';
  }

  /**
   * Render TOC as HTML
   */
  renderTocAsHtml(toc: TocEntry[]): string {
    const lines = ['<nav class="table-of-contents">', '<h2>Table of Contents</h2>'];
    lines.push('<ul>');
    this.renderTocLevelHtml(toc, lines, 1);
    lines.push('</ul>');
    lines.push('</nav>');
    return lines.join('\n');
  }

  /**
   * Render TOC as JSON for Starlight sidebar
   */
  renderTocForStarlightSidebar(toc: TocEntry[]): any[] {
    return toc.map(entry => this.tocEntryToStarlightFormat(entry));
  }

  /**
   * Render a level of TOC in markdown format
   */
  private renderTocLevel(entries: TocEntry[], lines: string[], depth: number): void {
    for (const entry of entries) {
      const indent = '  '.repeat(depth);
      lines.push(`${indent}- [${entry.title}](#${entry.anchor})`);
      
      if (entry.children && entry.children.length > 0) {
        this.renderTocLevel(entry.children, lines, depth + 1);
      }
    }
  }

  /**
   * Render a level of TOC in HTML format
   */
  private renderTocLevelHtml(entries: TocEntry[], lines: string[], depth: number): void {
    for (const entry of entries) {
      const indent = '  '.repeat(depth);
      lines.push(`${indent}<li><a href="#${entry.anchor}">${entry.title}</a>`);
      
      if (entry.children && entry.children.length > 0) {
        lines.push(`${indent}  <ul>`);
        this.renderTocLevelHtml(entry.children, lines, depth + 1);
        lines.push(`${indent}  </ul>`);
      }
      
      lines.push(`${indent}</li>`);
    }
  }

  /**
   * Convert TOC entry to Starlight sidebar format
   */
  private tocEntryToStarlightFormat(entry: TocEntry): any {
    const result: any = {
      label: entry.title,
      link: `#${entry.anchor}`
    };

    if (entry.children && entry.children.length > 0) {
      result.items = entry.children.map(child => this.tocEntryToStarlightFormat(child));
    }

    return result;
  }

  /**
   * Insert TOC at the top of content
   */
  private insertAtTop(content: string, tocMarkdown: string): string {
    // Skip frontmatter if present
    if (content.startsWith('---\n')) {
      const frontmatterEnd = content.indexOf('\n---\n', 4);
      if (frontmatterEnd !== -1) {
        const frontmatter = content.substring(0, frontmatterEnd + 5);
        const body = content.substring(frontmatterEnd + 5);
        return frontmatter + '\n' + tocMarkdown + '\n' + body.trim();
      }
    }
    
    return tocMarkdown + '\n' + content;
  }

  /**
   * Insert TOC after the first heading
   */
  private insertAfterTitle(content: string, tocMarkdown: string): string {
    // Skip frontmatter if present
    let workingContent = content;
    let frontmatter = '';
    
    if (content.startsWith('---\n')) {
      const frontmatterEnd = content.indexOf('\n---\n', 4);
      if (frontmatterEnd !== -1) {
        frontmatter = content.substring(0, frontmatterEnd + 5);
        workingContent = content.substring(frontmatterEnd + 5);
      }
    }

    // Find first heading
    const headingMatch = workingContent.match(/^(#+\s+.+)$/m);
    
    if (headingMatch) {
      const headingEnd = headingMatch.index! + headingMatch[0].length;
      const beforeHeading = workingContent.substring(0, headingEnd);
      const afterHeading = workingContent.substring(headingEnd);
      
      return frontmatter + beforeHeading + '\n\n' + tocMarkdown + '\n' + afterHeading.trim();
    }
    
    // No heading found, insert at top
    return frontmatter + '\n' + tocMarkdown + '\n' + workingContent.trim();
  }

  /**
   * Check if content already has a table of contents
   */
  hasExistingToc(content: string): boolean {
    const tocPatterns = [
      /^##?\s+table\s+of\s+contents/im,
      /^##?\s+contents/im,
      /^##?\s+toc/im,
      /<nav[^>]*table-of-contents/i
    ];

    return tocPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Remove existing table of contents from content
   */
  removeExistingToc(content: string): string {
    // Remove markdown TOC sections
    let processedContent = content.replace(
      /^##?\s+(?:table\s+of\s+contents|contents|toc)\s*\n(?:\s*-\s+\[.*?\]\(.*?\)\s*\n)*/gim,
      ''
    );

    // Remove HTML TOC sections
    processedContent = processedContent.replace(
      /<nav[^>]*table-of-contents[^>]*>[\s\S]*?<\/nav>/gi,
      ''
    );

    return processedContent;
  }

  /**
   * Generate navigation structure for Starlight
   */
  generateStarlightNavigation(tocEntries: TocEntry[], baseUrl = ''): any[] {
    return tocEntries.map(entry => ({
      label: entry.title,
      link: baseUrl + '#' + entry.anchor,
      ...(entry.children && entry.children.length > 0 && {
        items: this.generateStarlightNavigation(entry.children, baseUrl)
      })
    }));
  }

  /**
   * Extract headings for automated sidebar generation
   */
  extractHeadingsForSidebar(content: string, filePath: string): {
    title: string;
    headings: Array<{ title: string; anchor: string; level: number }>;
  } {
    const headings = this.extractHeadings(content);
    const title = headings.length > 0 ? headings[0].title : this.generateTitleFromPath(filePath);
    
    // Skip the first heading if it's H1 (document title)
    const tocHeadings = headings.filter(h => h.level > 1 || headings[0].level > 1);
    
    return {
      title,
      headings: tocHeadings
    };
  }

  /**
   * Generate title from file path
   */
  private generateTitleFromPath(filePath: string): string {
    const fileName = filePath.split('/').pop()?.replace(/\.[^.]+$/, '') || 'Untitled';
    return fileName
      .replace(/[-_]/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, l => l.toUpperCase());
  }
}