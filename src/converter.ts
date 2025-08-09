import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, join } from 'node:path';
import chalk from 'chalk';
import matter from 'gray-matter';
import mammoth from 'mammoth';
import TurndownService from 'turndown';
import type {
  ConversionOptions,
  ConversionResult,
  ConversionStats,
  DocumentMetadata,
  SupportedFormat,
} from './types.js';

export class DocumentConverter {
  private options: Required<ConversionOptions>;
  private stats: ConversionStats;
  private turndownService: TurndownService;

  constructor(options: ConversionOptions = {}) {
    this.options = {
      outputDir: options.outputDir || 'src/content/docs',
      preserveStructure: options.preserveStructure ?? true,
      generateTitles: options.generateTitles ?? true,
      generateDescriptions: options.generateDescriptions ?? true,
      addTimestamps: options.addTimestamps ?? false,
      defaultCategory: options.defaultCategory || 'documentation',
      verbose: options.verbose ?? false,
      dryRun: options.dryRun ?? false,
      categoryPatterns: options.categoryPatterns || this.getDefaultCategoryPatterns(),
      tagPatterns: options.tagPatterns || this.getDefaultTagPatterns(),
      ignorePatterns: options.ignorePatterns || this.getDefaultIgnorePatterns(),
      repairMode: options.repairMode ?? false,
      validateContent: options.validateContent ?? false,
      generateToc: options.generateToc ?? false,
      processImages: options.processImages ?? false,
      fixLinks: options.fixLinks ?? false,
      generateSidebar: options.generateSidebar ?? false,
      maxDescriptionLength: options.maxDescriptionLength ?? 160,
    };

    this.stats = {
      processed: 0,
      skipped: 0,
      errors: 0,
      formats: new Map(),
    };

    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '-',
    });
  }

  private getDefaultCategoryPatterns(): Record<string, string> {
    return {
      claude: 'Claude Code',
      guide: 'Guides',
      tutorial: 'Guides',
      reference: 'Reference',
      api: 'Reference',
      ai: 'AI & ML',
      ml: 'AI & ML',
      design: 'Design System',
      project: 'Projects',
      blog: 'Blog',
      docs: 'Documentation',
    };
  }

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
    };
  }

  private getDefaultIgnorePatterns(): string[] {
    return ['node_modules/**', '.git/**', 'dist/**', '.astro/**', '**/*.log', '**/.*'];
  }

  private log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    if (this.options.verbose || level === 'error') {
      const timestamp = new Date().toISOString().slice(11, 19);
      const coloredMessage =
        level === 'error'
          ? chalk.red(message)
          : level === 'warn'
            ? chalk.yellow(message)
            : chalk.blue(message);

      console.log(`[${chalk.gray(timestamp)}] ${coloredMessage}`);
    }
  }

  private extractTitle(content: string, filename: string): string | undefined {
    if (!this.options.generateTitles) return undefined;

    // Try to find title in HTML first (highest priority for HTML docs)
    const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) return titleMatch[1].trim();

    // For plain text, try to find the first line that looks like a title
    const lines = content.split('\n').filter((line) => line.trim());
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      // If first line is not a heading marker and looks like a title
      if (!firstLine.startsWith('#') && firstLine.length > 0 && firstLine.length < 100) {
        // Check if it's likely a title (no period at end, reasonable length)
        if (!firstLine.endsWith('.') && !firstLine.includes('\n')) {
          return firstLine;
        }
      }
    }

    // Try to find H1 heading in markdown
    const h1Match = content.match(/^#\s+(.+)$/m);
    if (h1Match) return h1Match[1].trim();

    // Try to find any heading
    const headingMatch = content.match(/^#{1,6}\s+(.+)$/m);
    if (headingMatch) return headingMatch[1].trim();

    // Use filename as fallback
    return filename
      .replace(/\.[^/.]+$/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }

  private extractDescription(content: string): string | undefined {
    if (!this.options.generateDescriptions) return undefined;

    const paragraphs = this.extractParagraphs(content);
    const startIndex = this.getDescriptionStartIndex(paragraphs);

    for (let i = startIndex; i < paragraphs.length; i++) {
      const result = this.processDescriptionParagraph(paragraphs[i]);
      if (result) return result;
    }

    return undefined;
  }

  private extractParagraphs(content: string): string[] {
    const withoutFrontmatter = content.replace(/^---[\s\S]*?---/, '').trim();
    return withoutFrontmatter
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  }

  private getDescriptionStartIndex(paragraphs: string[]): number {
    if (
      paragraphs.length > 1 &&
      paragraphs[0].length < 100 &&
      !paragraphs[0].endsWith('.') &&
      !paragraphs[0].includes('\n')
    ) {
      return 1;
    }
    return 0;
  }

  private isStructuralElement(paragraph: string): boolean {
    return (
      paragraph.startsWith('#') ||
      paragraph.startsWith('```') ||
      paragraph.startsWith('-') ||
      paragraph.startsWith('*') ||
      paragraph.startsWith('|') ||
      paragraph.match(/^\d+\./) !== null ||
      paragraph.startsWith('>') ||
      paragraph.match(/^Table|^Figure|^Image|^Code|^Example:/i) !== null
    );
  }

  private cleanParagraph(paragraph: string): string {
    return paragraph
      .replace(/[#*_`[\]]/g, '')
      .replace(/\s+/g, ' ')
      .replace(/^\s*[-*]\s*/, '')
      .trim();
  }

  private processDescriptionParagraph(paragraph: string): string | undefined {
    if (this.isStructuralElement(paragraph)) {
      return undefined;
    }

    const cleanParagraph = this.cleanParagraph(paragraph);
    if (cleanParagraph.length < 20) return undefined;

    if (cleanParagraph.length > 200) {
      return this.truncateDescription(cleanParagraph);
    }

    const result = cleanParagraph.endsWith('.') ? cleanParagraph : `${cleanParagraph}.`;

    if (result.length >= 20 && !result.match(/^(Table|Figure|Image|Code|Example):/i)) {
      return result;
    }

    return undefined;
  }

  private truncateDescription(text: string): string {
    const truncated = text.substring(0, 150);
    const lastSpace = truncated.lastIndexOf(' ');
    const result = lastSpace > 100 ? truncated.substring(0, lastSpace) : truncated;
    return `${result}...`;
  }

  private extractTags(content: string, filename: string, category: string): string[] {
    const tags = new Set<string>();
    const text = content.toLowerCase();

    this.addTechTags(tags, text);
    this.addCategoryTags(tags, category);
    this.addContentTypeTags(tags, text);
    this.addFilenameTags(tags, filename);
    this.addComplexityTags(tags, content, text);

    return Array.from(tags)
      .filter((tag) => tag.length > 2)
      .slice(0, 8);
  }

  private getTechPatterns(): Record<string, string[]> {
    return {
      react: ['react', 'jsx', 'usestate', 'useeffect', 'component'],
      vue: ['vue', 'vuejs', 'vue.js', 'nuxt'],
      angular: ['angular', 'ng-', '@component'],
      svelte: ['svelte', 'sveltekit'],
      nodejs: ['node.js', 'nodejs', 'npm', 'express', 'fastify'],
      python: ['python', 'django', 'flask', 'fastapi', 'pip'],
      typescript: ['typescript', 'ts', '.ts'],
      javascript: ['javascript', 'js', '.js'],
      java: ['java', 'spring', 'maven', 'gradle'],
      rust: ['rust', 'cargo', 'rustc'],
      go: ['golang', 'go mod', 'go get'],
      postgresql: ['postgres', 'postgresql', 'psql'],
      mysql: ['mysql', 'mariadb'],
      mongodb: ['mongo', 'mongodb', 'nosql'],
      supabase: ['supabase', 'supabase.js'],
      aws: ['aws', 'amazon web services', 's3', 'ec2', 'lambda'],
      docker: ['docker', 'container', 'dockerfile'],
      kubernetes: ['kubernetes', 'k8s', 'kubectl'],
      terraform: ['terraform', 'infrastructure as code'],
      ai: ['artificial intelligence', 'machine learning', 'llm', 'gpt', 'claude'],
      openai: ['openai', 'gpt-3', 'gpt-4', 'chatgpt'],
      api: ['api', 'endpoint', 'rest', 'graphql'],
      guide: ['tutorial', 'guide', 'walkthrough', 'how-to'],
      reference: ['reference', 'documentation', 'docs'],
    };
  }

  private addTechTags(tags: Set<string>, text: string): void {
    const techPatterns = this.getTechPatterns();
    for (const [tag, patterns] of Object.entries(techPatterns)) {
      if (patterns.some((pattern) => text.includes(pattern))) {
        tags.add(tag);
      }
    }
  }

  private addCategoryTags(tags: Set<string>, category: string): void {
    if (category && category !== 'documentation') {
      tags.add(category.toLowerCase().replace(/\s+/g, '-'));
    }
  }

  private addContentTypeTags(tags: Set<string>, text: string): void {
    const contentPatterns = [
      { pattern: /install|setup|configuration/, tag: 'setup' },
      { pattern: /deploy|production|release/, tag: 'deployment' },
      { pattern: /security|auth|permission/, tag: 'security' },
      { pattern: /performance|optimization|speed/, tag: 'performance' },
      { pattern: /test|testing|unit test/, tag: 'testing' },
      { pattern: /debug|troubleshoot|error/, tag: 'debugging' },
      { pattern: /business|strategy|plan/, tag: 'business' },
      { pattern: /market|revenue|funding/, tag: 'business-strategy' },
    ];

    for (const { pattern, tag } of contentPatterns) {
      if (text.match(pattern)) {
        tags.add(tag);
      }
    }
  }

  private addFilenameTags(tags: Set<string>, filename: string): void {
    const filenameLower = filename.toLowerCase();
    const filenamePatterns = [
      { includes: 'readme', tag: 'overview' },
      { includes: 'changelog', tag: 'changelog' },
      { includes: 'contributing', tag: 'contributing' },
      { includes: 'license', tag: 'legal' },
    ];

    for (const { includes, tag } of filenamePatterns) {
      if (filenameLower.includes(includes)) {
        tags.add(tag);
      }
    }
  }

  private addComplexityTags(tags: Set<string>, content: string, text: string): void {
    const codeBlocks = (content.match(/```/g) || []).length / 2;
    if (codeBlocks > 3) tags.add('code-heavy');
    if (content.length > 5000) tags.add('comprehensive');
    if (text.includes('beginner') || text.includes('getting started')) tags.add('beginner');
    if (text.includes('advanced') || text.includes('expert')) tags.add('advanced');
  }

  private generateCategory(content: string, _filename: string, filePath: string): string {
    // Path-based detection (existing logic)
    const pathParts = filePath.split('/').filter((p) => p && p !== '.');
    for (const [pattern, categoryName] of Object.entries(this.options.categoryPatterns)) {
      if (pathParts.some((p) => p.toLowerCase().includes(pattern.toLowerCase()))) {
        return categoryName;
      }
    }

    // Content-based analysis
    const text = content.toLowerCase();

    // API/Reference detection
    if (
      text.includes('endpoint') ||
      text.includes('api') ||
      text.match(/get|post|put|delete.*\//) ||
      text.includes('parameter') ||
      text.includes('response')
    ) {
      return 'Reference';
    }

    // Tutorial/Guide detection
    if (
      text.includes('step') ||
      text.includes('tutorial') ||
      text.includes('getting started') ||
      text.includes('walkthrough') ||
      text.match(/\d+\.\s/) ||
      text.includes('how to')
    ) {
      return 'Guides';
    }

    // Business/Planning detection
    if (
      text.includes('business plan') ||
      text.includes('strategy') ||
      text.includes('market') ||
      text.includes('revenue') ||
      text.includes('funding') ||
      text.includes('investor')
    ) {
      return 'Business';
    }

    // Technical/Architecture detection
    if (
      text.includes('architecture') ||
      text.includes('design pattern') ||
      text.includes('implementation') ||
      text.includes('technical') ||
      text.includes('database') ||
      text.includes('infrastructure')
    ) {
      return 'Architecture';
    }

    // Configuration/Setup detection
    if (
      text.includes('config') ||
      text.includes('setup') ||
      text.includes('installation') ||
      text.includes('environment')
    ) {
      return 'Configuration';
    }

    return this.options.defaultCategory;
  }

  private generateFrontmatterYaml(metadata: DocumentMetadata): string {
    const yamlLines: string[] = [];

    // Title - always quoted and escaped
    if (metadata.title) {
      const escapedTitle = metadata.title.replace(/"/g, '\\"').replace(/\n/g, ' ');
      yamlLines.push(`title: "${escapedTitle}"`);
    }

    // Description - handle multiline and special characters
    if (metadata.description) {
      const desc = metadata.description.replace(/"/g, '\\"').replace(/\n/g, ' ');
      if (desc.length > 80) {
        // Use literal block scalar for long descriptions
        yamlLines.push('description: |');
        yamlLines.push(`  ${desc}`);
      } else {
        yamlLines.push(`description: "${desc}"`);
      }
    }

    // Category
    if (metadata.category && metadata.category !== 'documentation') {
      yamlLines.push(`category: "${metadata.category}"`);
    }

    // Tags array
    if (metadata.tags && metadata.tags.length > 0) {
      yamlLines.push('tags:');
      metadata.tags.forEach((tag) => yamlLines.push(`  - ${tag}`));
    }

    // SEO enhancements
    if (metadata.lastUpdated) {
      yamlLines.push(`lastUpdated: ${metadata.lastUpdated}`);
    }

    return yamlLines.join('\n');
  }

  private validateConvertedContent(
    content: string,
    metadata: DocumentMetadata
  ): {
    isValid: boolean;
    warnings: string[];
    suggestions: string[];
    quality: 'high' | 'medium' | 'low';
  } {
    const warnings: string[] = [];
    const suggestions: string[] = [];

    this.validateTitle(metadata.title, warnings);
    this.validateDescription(metadata.description, warnings, suggestions);
    this.validateContentStructure(content, suggestions);
    this.validateCodeContent(content, metadata, suggestions);

    const quality = this.calculateQuality(warnings, metadata);

    return {
      isValid: warnings.length === 0,
      warnings,
      suggestions,
      quality,
    };
  }

  private validateTitle(title: string | undefined, warnings: string[]): void {
    if (!title || title.length < 5) {
      warnings.push('Title is too short or missing');
    }
    if (title && title.length > 100) {
      warnings.push('Title is unusually long');
    }
  }

  private validateDescription(
    description: string | undefined,
    warnings: string[],
    suggestions: string[]
  ): void {
    if (!description) {
      warnings.push('Description is missing');
      suggestions.push('Consider adding a brief description of the document content');
    } else if (description.length < 20) {
      warnings.push('Description is very short');
    } else if (description.length > 200) {
      suggestions.push('Description is long, consider summarizing key points');
    }
  }

  private validateContentStructure(content: string, suggestions: string[]): void {
    const headingCount = (content.match(/^#{1,6}\s/gm) || []).length;
    if (headingCount === 0) {
      suggestions.push('Consider adding headings to improve document structure');
    } else if (headingCount > 20) {
      suggestions.push('Document has many headings, consider reorganizing content');
    }
  }

  private validateCodeContent(
    content: string,
    metadata: DocumentMetadata,
    suggestions: string[]
  ): void {
    const codeBlocks = (content.match(/```/g) || []).length / 2;
    if (codeBlocks > 0 && !metadata.tags?.includes('code-heavy')) {
      suggestions.push('Document contains code - consider adding relevant technical tags');
    }
  }

  private calculateQuality(
    warnings: string[],
    metadata: DocumentMetadata
  ): 'high' | 'medium' | 'low' {
    let qualityScore = 100;
    if (warnings.length > 0) qualityScore -= warnings.length * 15;
    if (!metadata.description) qualityScore -= 25;
    if (!metadata.category || metadata.category === 'documentation') qualityScore -= 10;
    if (!metadata.tags || metadata.tags.length === 0) qualityScore -= 10;

    return qualityScore >= 80 ? 'high' : qualityScore >= 60 ? 'medium' : 'low';
  }

  private generateFrontmatter(
    content: string,
    filename: string,
    filePath: string
  ): DocumentMetadata {
    const frontmatter: DocumentMetadata = {};

    const title = this.extractTitle(content, filename);
    if (title) frontmatter.title = title;

    const description = this.extractDescription(content);
    if (description) frontmatter.description = description;

    // Enhanced category detection
    const category = this.generateCategory(content, filename, filePath);
    if (category !== 'documentation') {
      frontmatter.category = category;
    }

    // Enhanced tag extraction
    const tags = this.extractTags(content, filename, category);
    if (tags.length > 0) frontmatter.tags = tags;

    if (this.options.addTimestamps) {
      frontmatter.lastUpdated = new Date().toISOString().split('T')[0];
    }

    return frontmatter;
  }

  private isSupportedFormat(ext: string): ext is SupportedFormat {
    const supportedFormats: SupportedFormat[] = [
      '.docx',
      '.doc',
      '.txt',
      '.html',
      '.htm',
      '.md',
      '.mdx',
      '.rtf',
    ];
    return supportedFormats.includes(ext as SupportedFormat);
  }

  private isTextBasedFile(ext: string): boolean {
    const textExtensions = [
      '.txt',
      '.md',
      '.mdx',
      '.html',
      '.htm',
      '.rtf',
      '.csv',
      '.tsv',
      '.xml',
      '.json',
      '.yaml',
      '.yml',
      '.ini',
      '.cfg',
      '.conf',
      '.log',
      '.sh',
      '.bash',
      '.zsh',
      '.fish',
      '.js',
      '.ts',
      '.jsx',
      '.tsx',
      '.py',
      '.rb',
      '.php',
      '.java',
      '.c',
      '.cpp',
      '.h',
      '.hpp',
      '.css',
      '.scss',
      '.sass',
      '.less',
      '.sql',
      '.go',
      '.rs',
      '.kt',
      '.swift',
      '.dart',
      '.r',
      '.m',
      '.gradle',
      '.cmake',
      '.dockerfile',
    ];
    return textExtensions.includes(ext.toLowerCase());
  }

  private shouldSkipFile(filename: string, ext: string): { skip: boolean; reason?: string } {
    // Skip hidden files and system files
    if (filename.startsWith('.') && !['.md', '.html', '.htm', '.txt'].includes(ext)) {
      return { skip: true, reason: 'hidden file' };
    }

    // Skip common binary/asset file extensions
    const binaryExtensions = [
      '.png',
      '.jpg',
      '.jpeg',
      '.gif',
      '.bmp',
      '.tiff',
      '.svg',
      '.webp',
      '.ico',
      '.xls',
      '.xlsx',
      '.ppt',
      '.pptx',
      '.zip',
      '.rar',
      '.7z',
      '.tar',
      '.gz',
      '.mp3',
      '.mp4',
      '.avi',
      '.mov',
      '.wmv',
      '.flv',
      '.wav',
      '.ogg',
      '.woff',
      '.woff2',
      '.ttf',
      '.otf',
      '.eot',
      '.jar',
      '.war',
      '.ear',
      '.exe',
      '.dll',
      '.so',
      '.dylib',
      '.bin',
      '.iso',
      '.dmg',
      '.pkg',
      '.deb',
      '.rpm',
    ];

    if (binaryExtensions.includes(ext.toLowerCase())) {
      return { skip: true, reason: 'binary file' };
    }

    // Skip if not supported and not text-based
    if (!this.isSupportedFormat(ext) && !this.isTextBasedFile(ext)) {
      return { skip: true, reason: 'unsupported format' };
    }

    return { skip: false };
  }

  private convertPlainText(content: string): string {
    const lines = content.split('\n');
    const markdown: string[] = [];
    let inCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const result = this.processPlainTextLine(lines, i, inCodeBlock);
      inCodeBlock = result.inCodeBlock;

      if (result.output) {
        markdown.push(result.output);
      }
      if (result.additionalOutput) {
        markdown.push(result.additionalOutput);
      }
    }

    if (inCodeBlock) {
      markdown.push('```');
    }

    return markdown.join('\n');
  }

  private processPlainTextLine(
    lines: string[],
    index: number,
    inCodeBlock: boolean
  ): { output?: string; additionalOutput?: string; inCodeBlock: boolean } {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed && inCodeBlock) {
      return { output: line, inCodeBlock };
    }

    // Check if this is a code line
    if (this.isCodeLine(line, trimmed)) {
      if (!inCodeBlock) {
        return {
          output: '```',
          additionalOutput: line.replace(/^ {4}/, ''),
          inCodeBlock: true,
        };
      }
      return { output: line.replace(/^ {4}/, ''), inCodeBlock: true };
    }

    // Exit code block if needed
    if (inCodeBlock && !this.isIndentedLine(line)) {
      return {
        output: '```',
        additionalOutput: this.convertNonCodeLine(line, trimmed, lines, index),
        inCodeBlock: false,
      };
    }

    return {
      output: this.convertNonCodeLine(line, trimmed, lines, index),
      inCodeBlock,
    };
  }

  private isCodeLine(line: string, trimmed: string): boolean {
    return (
      line.match(/^ {4}/) !== null ||
      line.match(/^\t/) !== null ||
      trimmed.match(/^(function|const|let|var|class|import|export|<\w+|{\s*$)/) !== null
    );
  }

  private isIndentedLine(line: string): boolean {
    return line.match(/^ {4}/) !== null || line.match(/^\t/) !== null;
  }

  private convertNonCodeLine(
    line: string,
    trimmed: string,
    lines: string[],
    index: number
  ): string {
    // Convert headings
    if (trimmed.endsWith(':') && index + 1 < lines.length && lines[index + 1].trim()) {
      return `## ${trimmed.slice(0, -1)}`;
    }

    // Convert bullet points
    if (trimmed.match(/^[-*•]\s/)) {
      return line.replace(/^(\s*)[-*•]\s/, '$1- ');
    }

    return line;
  }

  private convertHTML(content: string): string {
    try {
      return this.turndownService.turndown(content).trim();
    } catch (error) {
      this.log(`Turndown conversion failed, using fallback: ${error}`, 'warn');
      // Basic fallback conversion
      return content
        .replace(
          /<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi,
          (_, level, text) => `${'#'.repeat(parseInt(level))} ${text.replace(/<[^>]*>/g, '')}`
        )
        .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n')
        .replace(/<[^>]*>/g, '')
        .trim();
    }
  }

  private async convertWordDocument(filePath: string): Promise<string> {
    try {
      const result = await mammoth.convertToHtml({ path: filePath });

      if (result.messages.length > 0) {
        this.log(`Word conversion warnings for ${filePath}:`, 'warn');
        result.messages.forEach((msg) => this.log(`  ${msg.message}`, 'warn'));
      }

      return this.convertHTML(result.value);
    } catch (error) {
      throw new Error(`Failed to convert Word document: ${error}`);
    }
  }

  private convertRTF(content: string): string {
    // Basic RTF to text conversion
    const text = content
      .replace(/\\[a-zA-Z]+\d*\s?/g, '') // Remove RTF control words
      .replace(/[{}]/g, '') // Remove braces
      .replace(/\\\\/g, '\\') // Unescape backslashes
      .replace(/\\'/g, "'") // Unescape quotes
      .trim();

    return this.convertPlainText(text);
  }

  private async processFileByType(
    inputPath: string,
    ext: string,
    outputPath: string
  ): Promise<ConversionResult | { content: string; needsConversion: boolean }> {
    switch (ext) {
      case '.docx':
      case '.doc':
        return {
          content: await this.convertWordDocument(inputPath),
          needsConversion: true,
        };

      case '.rtf': {
        const rtfContent = await readFile(inputPath, 'utf-8');
        return {
          content: this.convertRTF(rtfContent),
          needsConversion: true,
        };
      }

      case '.txt': {
        const textContent = await readFile(inputPath, 'utf-8');
        return {
          content: this.convertPlainText(textContent),
          needsConversion: true,
        };
      }

      case '.html':
      case '.htm': {
        const htmlContent = await readFile(inputPath, 'utf-8');
        return {
          content: this.convertHTML(htmlContent),
          needsConversion: true,
        };
      }

      case '.md':
      case '.mdx': {
        const mdContent = await readFile(inputPath, 'utf-8');
        const parsed = matter(mdContent);
        return {
          content: mdContent,
          needsConversion: Object.keys(parsed.data).length === 0,
        };
      }

      default:
        // Try to process text-based files as plain text
        if (this.isTextBasedFile(ext)) {
          try {
            const textContent = await readFile(inputPath, 'utf-8');
            this.log(`Processing ${ext} file as plain text`, 'info');
            return {
              content: this.convertPlainText(textContent),
              needsConversion: true,
            };
          } catch (error) {
            return {
              success: false,
              inputPath,
              outputPath,
              skipped: true,
              errorMessage: `Failed to read text file: ${error}`,
            };
          }
        } else {
          // Skip unsupported file formats gracefully
          return {
            success: false,
            inputPath,
            outputPath,
            skipped: true,
            errorMessage: `Skipped unsupported file format: ${ext}`,
          };
        }
    }
  }

  async convertFile(inputPath: string, outputPath?: string): Promise<ConversionResult> {
    try {
      const filename = basename(inputPath);
      const ext = extname(inputPath).toLowerCase();
      const resolvedOutputPath =
        outputPath || join(this.options.outputDir, filename.replace(/\.[^/.]+$/, '.md'));

      // Check if file should be skipped
      const skipCheck = this.shouldSkipFile(filename, ext);
      if (skipCheck.skip) {
        this.log(`Skipping ${filename}: ${skipCheck.reason}`, 'info');
        this.stats.skipped++;
        return {
          success: false,
          inputPath,
          outputPath: resolvedOutputPath,
          skipped: true,
          errorMessage: `Skipped: ${skipCheck.reason}`,
        };
      }

      this.stats.formats.set(ext, (this.stats.formats.get(ext) || 0) + 1);

      let processedContent = '';
      let needsConversion = false;

      // Process based on file extension
      const processingResult = await this.processFileByType(inputPath, ext, resolvedOutputPath);
      if ('success' in processingResult) {
        return processingResult;
      }

      processedContent = processingResult.content;
      needsConversion = processingResult.needsConversion;

      // Generate frontmatter if needed
      let finalContent = processedContent;
      let metadata: DocumentMetadata = {};

      if (needsConversion || !processedContent.startsWith('---')) {
        metadata = this.generateFrontmatter(processedContent, filename, inputPath);

        const frontmatterYaml = this.generateFrontmatterYaml(metadata);

        const contentWithoutFrontmatter = processedContent.replace(/^---[\s\S]*?---/, '').trim();
        finalContent = `---\n${frontmatterYaml}\n---\n\n${contentWithoutFrontmatter}`;
      }

      // Quality validation
      const validation = this.validateConvertedContent(finalContent, metadata);

      // Ensure output directory exists
      const outputDir = dirname(resolvedOutputPath);
      await mkdir(outputDir, { recursive: true });

      // Write the file
      if (!this.options.dryRun) {
        await writeFile(resolvedOutputPath, finalContent, 'utf-8');
      }

      // Enhanced logging with quality information
      const qualityEmoji =
        validation.quality === 'high' ? '🟢' : validation.quality === 'medium' ? '🟡' : '🔴';
      this.log(`✅ ${qualityEmoji} Converted: ${inputPath} → ${resolvedOutputPath}`);

      // Log quality issues if verbose
      if (this.options.verbose && validation.warnings.length > 0) {
        validation.warnings.forEach((warning) => this.log(`   ⚠️  ${warning}`, 'warn'));
      }

      this.stats.processed++;

      return {
        success: true,
        inputPath,
        outputPath: resolvedOutputPath,
        metadata,
      };
    } catch (error) {
      const errorMessage = `Error processing ${inputPath}: ${error}`;
      this.log(errorMessage, 'error');
      this.stats.errors++;

      return {
        success: false,
        inputPath,
        outputPath: outputPath || '',
        error: errorMessage,
      };
    }
  }

  async convertDirectory(inputDir: string, outputDir?: string): Promise<ConversionResult[]> {
    const results: ConversionResult[] = [];
    const resolvedOutputDir = outputDir || this.options.outputDir;

    try {
      const entries = await readdir(inputDir, { withFileTypes: true });

      for (const entry of entries) {
        const inputPath = join(inputDir, entry.name);

        // Skip ignored patterns
        if (
          this.options.ignorePatterns.some((pattern) =>
            inputPath.includes(pattern.replace('/**', '').replace('**/', ''))
          )
        ) {
          continue;
        }

        if (entry.isDirectory()) {
          const nestedOutputDir = this.options.preserveStructure
            ? join(resolvedOutputDir, entry.name)
            : resolvedOutputDir;

          const nestedResults = await this.convertDirectory(inputPath, nestedOutputDir);
          results.push(...nestedResults);
        } else {
          const outputPath = this.options.preserveStructure
            ? join(resolvedOutputDir, entry.name.replace(/\.[^/.]+$/, '.md'))
            : join(resolvedOutputDir, entry.name.replace(/\.[^/.]+$/, '.md'));

          const result = await this.convertFile(inputPath, outputPath);
          results.push(result);
        }
      }
    } catch (error) {
      this.log(`Error processing directory ${inputDir}: ${error}`, 'error');
    }

    return results;
  }

  getStats(): ConversionStats {
    return { ...this.stats };
  }

  printStats(): void {
    console.log(`\n${chalk.bold('📊 Conversion Statistics:')}`);
    console.log(`  ${chalk.green('✅ Processed:')} ${this.stats.processed} files`);
    console.log(`  ${chalk.yellow('⏭️  Skipped:')} ${this.stats.skipped} files`);
    console.log(`  ${chalk.red('❌ Errors:')} ${this.stats.errors} files`);

    if (this.stats.formats.size > 0) {
      console.log(`\n${chalk.bold('📁 File formats processed:')}`);
      for (const [ext, count] of this.stats.formats.entries()) {
        console.log(`  ${chalk.cyan(ext || '(no extension)')}: ${count} files`);
      }
    }

    if (this.options.dryRun) {
      console.log(`\n${chalk.yellow('🧪 Dry run completed - no files were actually modified.')}`);
    }
  }
}
