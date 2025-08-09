import matter from 'gray-matter';
import type { 
  ValidationResult, 
  ValidationIssue, 
  RepairResult, 
  QualityScore, 
  DocumentMetadata 
} from '../../types.js';
import type { 
  MetadataEnhancer, 
  ProcessingContext, 
  QualityValidator 
} from '../types.js';

/**
 * Frontmatter repair and validation plugin that integrates with the plugin system
 */
export const frontmatterEnhancer: MetadataEnhancer = {
  metadata: {
    name: 'frontmatter-enhancer',
    version: '1.0.0',
    description: 'Enhances and repairs frontmatter metadata',
    author: 'Starlight Document Converter',
  },
  priority: 100, // High priority to run early
  
  enhance: async (metadata: DocumentMetadata, context: ProcessingContext): Promise<DocumentMetadata> => {
    const repairer = new FrontmatterRepair();
    
    // Read the file content if not provided
    let content = '';
    if (context.inputPath) {
      const { readFile } = await import('node:fs/promises');
      content = await readFile(context.inputPath, 'utf-8');
    }
    
    const repairResult = repairer.repairFrontmatter(content, context.inputPath);
    
    if (repairResult.success && repairResult.fixed) {
      // Extract enhanced metadata from repaired content
      try {
        const parsed = matter(repairResult.repairedContent);
        return { ...metadata, ...parsed.data };
      } catch {
        return metadata;
      }
    }
    
    return metadata;
  }
};

export const frontmatterValidator: QualityValidator = {
  metadata: {
    name: 'frontmatter-validator',
    version: '1.0.0',
    description: 'Validates frontmatter quality and structure',
    author: 'Starlight Document Converter',
  },
  
  validate: (content: string, metadata: DocumentMetadata, context: ProcessingContext) => {
    const repairer = new FrontmatterRepair();
    const validation = repairer.validateContent(content, context.inputPath);
    
    // Convert our ValidationResult to the expected QualityReport format
    return {
      score: validation.score?.titleScore || 0,
      level: validation.score?.overall === 'good' ? 'high' : 
             validation.score?.overall === 'fair' ? 'medium' : 'low',
      issues: validation.issues.map(issue => ({
        type: issue.type,
        message: issue.message,
        severity: issue.type === 'error' ? 8 : issue.type === 'warning' ? 5 : 2,
      })),
      suggestions: validation.score?.suggestions || []
    };
  }
};

export class FrontmatterRepair {
  private readonly requiredFields = ['title'];
  private readonly recommendedFields = ['description'];
  private readonly maxTitleLength = 60;
  private readonly maxDescriptionLength = 160;

  /**
   * Validate frontmatter and content structure
   */
  validateContent(content: string, filePath: string): ValidationResult {
    const issues: ValidationIssue[] = [];
    let metadata: DocumentMetadata | undefined;

    try {
      // Check if file has frontmatter
      if (!content.startsWith('---\n')) {
        issues.push({
          type: 'error',
          message: 'Missing frontmatter',
          suggestion: 'Add YAML frontmatter with title and description'
        });
        
        return {
          valid: false,
          issues,
          score: this.calculateQualityScore(content, undefined, issues)
        };
      }

      // Parse frontmatter
      const parsed = matter(content);
      metadata = parsed.data as DocumentMetadata;
      const contentBody = parsed.content;

      // Validate required fields
      for (const field of this.requiredFields) {
        if (!metadata[field as keyof DocumentMetadata]) {
          issues.push({
            type: 'error',
            field,
            message: `Missing required frontmatter field: ${field}`,
            suggestion: `Add ${field} field to frontmatter`
          });
        }
      }

      // Validate recommended fields
      for (const field of this.recommendedFields) {
        if (!metadata[field as keyof DocumentMetadata]) {
          issues.push({
            type: 'warning',
            field,
            message: `Missing recommended frontmatter field: ${field}`,
            suggestion: `Add ${field} field for better SEO and navigation`
          });
        }
      }

      // Validate title length
      if (metadata.title && metadata.title.length > this.maxTitleLength) {
        issues.push({
          type: 'warning',
          field: 'title',
          message: `Title is too long (${metadata.title.length} chars, max ${this.maxTitleLength})`,
          suggestion: 'Shorten title for better readability'
        });
      }

      // Validate description length
      if (metadata.description && metadata.description.length > this.maxDescriptionLength) {
        issues.push({
          type: 'warning',
          field: 'description',
          message: `Description is too long (${metadata.description.length} chars, max ${this.maxDescriptionLength})`,
          suggestion: 'Shorten description for better SEO'
        });
      }

      // Validate content structure
      this.validateContentStructure(contentBody, issues);

    } catch (error) {
      issues.push({
        type: 'error',
        message: `Failed to parse frontmatter: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestion: 'Fix YAML syntax errors in frontmatter'
      });
    }

    return {
      valid: issues.filter(i => i.type === 'error').length === 0,
      issues,
      metadata,
      score: this.calculateQualityScore(content, metadata, issues)
    };
  }

  /**
   * Repair frontmatter issues
   */
  repairFrontmatter(content: string, filePath: string): RepairResult {
    const originalContent = content;
    const issues: string[] = [];
    let needsFix = false;

    try {
      // Handle missing frontmatter
      if (!content.startsWith('---\n')) {
        const generatedMeta = this.generateFrontmatterFromContent(content, filePath);
        const frontmatterStr = this.buildFrontmatterString(generatedMeta);
        const repairedContent = frontmatterStr + '\n' + content;
        
        issues.push('Added missing frontmatter');
        return {
          success: true,
          fixed: true,
          issues,
          originalContent,
          repairedContent
        };
      }

      // Parse existing frontmatter
      const parsed = matter(content);
      let metadata = { ...parsed.data } as DocumentMetadata;
      const contentBody = parsed.content;

      // Fix missing title
      if (!metadata.title) {
        metadata.title = this.extractTitleFromContent(contentBody, filePath);
        issues.push('Generated missing title');
        needsFix = true;
      }

      // Fix missing description
      if (!metadata.description) {
        metadata.description = this.generateDescriptionFromContent(contentBody, metadata.title || '');
        issues.push('Generated missing description');
        needsFix = true;
      }

      // Clean up problematic values
      if (metadata.title) {
        const cleanTitle = this.cleanString(metadata.title);
        if (cleanTitle !== metadata.title) {
          metadata.title = cleanTitle;
          issues.push('Cleaned title formatting');
          needsFix = true;
        }
      }

      if (metadata.description) {
        const cleanDesc = this.cleanString(metadata.description);
        if (cleanDesc !== metadata.description || metadata.description.length > this.maxDescriptionLength) {
          metadata.description = cleanDesc.length > this.maxDescriptionLength
            ? cleanDesc.substring(0, this.maxDescriptionLength - 3) + '...'
            : cleanDesc;
          issues.push('Cleaned and truncated description');
          needsFix = true;
        }
      }

      // Add category if missing
      if (!metadata.category) {
        metadata.category = this.inferCategoryFromPath(filePath);
        if (metadata.category) {
          issues.push(`Inferred category: ${metadata.category}`);
          needsFix = true;
        }
      }

      // Rebuild content if needed
      if (needsFix) {
        const frontmatterStr = this.buildFrontmatterString(metadata);
        const repairedContent = frontmatterStr + '\n' + contentBody;
        
        return {
          success: true,
          fixed: true,
          issues,
          originalContent,
          repairedContent
        };
      }

      return {
        success: true,
        fixed: false,
        issues: ['No repairs needed'],
        originalContent,
        repairedContent: originalContent
      };

    } catch (error) {
      return {
        success: false,
        fixed: false,
        issues: [`Failed to repair: ${error instanceof Error ? error.message : 'Unknown error'}`],
        originalContent,
        repairedContent: originalContent
      };
    }
  }

  private validateContentStructure(content: string, issues: ValidationIssue[]): void {
    // Check for empty content
    if (content.trim().length === 0) {
      issues.push({
        type: 'warning',
        message: 'Document appears to be empty',
        suggestion: 'Add content to the document'
      });
      return;
    }

    // Check heading structure
    const headings = content.match(/^#{1,6}\s+.+$/gm) || [];
    if (headings.length === 0) {
      issues.push({
        type: 'warning',
        message: 'No headings found',
        suggestion: 'Add headings to improve document structure'
      });
    } else if (!this.hasProperHeadingStructure(headings)) {
      issues.push({
        type: 'warning',
        message: 'Inconsistent heading structure',
        suggestion: 'Use sequential heading levels (h1 -> h2 -> h3)'
      });
    }
  }

  private hasProperHeadingStructure(headings: string[]): boolean {
    let previousLevel = 0;
    
    for (const heading of headings) {
      const level = heading.match(/^(#+)/)?.[1].length || 0;
      if (level > previousLevel + 1) {
        return false; // Skipped a level
      }
      previousLevel = level;
    }
    
    return true;
  }

  private calculateQualityScore(content: string, metadata?: DocumentMetadata, issues: ValidationIssue[] = []): QualityScore {
    let titleScore = 0;
    let descriptionScore = 0;
    let contentScore = 0;
    let structureScore = 0;

    // Title scoring
    if (metadata?.title) {
      titleScore = metadata.title.length > 10 && metadata.title.length <= this.maxTitleLength ? 100 : 60;
    }

    // Description scoring
    if (metadata?.description) {
      const length = metadata.description.length;
      descriptionScore = length >= 50 && length <= this.maxDescriptionLength ? 100 : 70;
    }

    // Content scoring
    const wordCount = content.split(/\s+/).length;
    contentScore = wordCount > 100 ? 100 : Math.max(40, wordCount);

    // Structure scoring
    const headings = content.match(/^#{1,6}\s+.+$/gm) || [];
    structureScore = headings.length > 0 ? 100 : 50;

    // Overall score calculation
    const avgScore = (titleScore + descriptionScore + contentScore + structureScore) / 4;
    const errorPenalty = issues.filter(i => i.type === 'error').length * 20;
    const finalScore = Math.max(0, avgScore - errorPenalty);

    const overall = finalScore >= 80 ? 'good' : finalScore >= 60 ? 'fair' : 'poor';

    const suggestions: string[] = [];
    if (titleScore < 80) suggestions.push('Improve title quality');
    if (descriptionScore < 80) suggestions.push('Add better description');
    if (contentScore < 80) suggestions.push('Add more content');
    if (structureScore < 80) suggestions.push('Improve document structure with headings');

    return {
      overall,
      titleScore,
      descriptionScore,
      contentScore,
      structureScore,
      suggestions
    };
  }

  private generateFrontmatterFromContent(content: string, filePath: string): DocumentMetadata {
    const title = this.extractTitleFromContent(content, filePath);
    const description = this.generateDescriptionFromContent(content, title);
    const category = this.inferCategoryFromPath(filePath);

    return {
      title,
      description,
      category
    };
  }

  private extractTitleFromContent(content: string, filePath: string): string {
    // Try to find the first heading
    const headingMatch = content.match(/^#\s+(.+)$/m);
    if (headingMatch) {
      return this.cleanString(headingMatch[1]);
    }

    // Try to find title in potential frontmatter
    const titleMatch = content.match(/title:\s*(.+)/i);
    if (titleMatch) {
      return this.cleanString(titleMatch[1]);
    }

    // Generate from filename
    const filename = filePath.split('/').pop()?.replace(/\.[^.]+$/, '') || 'Untitled';
    return this.cleanFilename(filename);
  }

  private generateDescriptionFromContent(content: string, title: string): string {
    // Remove frontmatter if present
    const cleanContent = content.replace(/^---[\s\S]*?---\n/, '');

    // Find first meaningful paragraph
    const paragraphs = cleanContent
      .split('\n\n')
      .map(p => p.replace(/\n/g, ' ').trim())
      .filter(p => 
        p.length > 20 && 
        !p.startsWith('#') && 
        !p.startsWith('```') &&
        !p.startsWith('{')
      );

    if (paragraphs.length > 0) {
      let description = paragraphs[0]
        .replace(/[#*_`[\]]/g, '') // Remove markdown
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
        .substring(0, this.maxDescriptionLength - 3);

      // Ensure it ends properly
      if (description.length === this.maxDescriptionLength - 3) {
        const lastSpace = description.lastIndexOf(' ');
        if (lastSpace > 100) {
          description = description.substring(0, lastSpace);
        }
      }

      return this.cleanString(description) + '.';
    }

    // Fallback descriptions based on filename/title
    if (title.toLowerCase().includes('readme')) {
      return `Documentation and setup guide for ${title.replace(/readme/i, '').trim()}.`;
    }
    if (title.toLowerCase().includes('guide')) {
      return `Comprehensive guide covering ${title.toLowerCase().replace('guide', '').trim()}.`;
    }
    if (title.toLowerCase().includes('api')) {
      return `API documentation and reference for ${title.replace(/api/i, '').trim()}.`;
    }

    return `Documentation for ${title}.`;
  }

  private inferCategoryFromPath(filePath: string): string | undefined {
    const pathParts = filePath.split('/');
    
    if (pathParts.length > 1) {
      const category = pathParts[pathParts.length - 2];
      return this.cleanFilename(category);
    }
    
    return undefined;
  }

  private cleanString(str: string): string {
    return str
      .replace(/[{}[\]"'\\]/g, '') // Remove problematic chars
      .replace(/\s+/g, ' ')
      .trim();
  }

  private cleanFilename(filename: string): string {
    return filename
      .replace(/[-_]/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, l => l.toUpperCase())
      .replace(/\s+/g, ' ')
      .trim();
  }

  private buildFrontmatterString(metadata: DocumentMetadata): string {
    const lines = ['---'];
    
    if (metadata.title) {
      lines.push(`title: "${this.escapeYamlString(metadata.title)}"`);
    }
    
    if (metadata.description) {
      lines.push(`description: "${this.escapeYamlString(metadata.description)}"`);
    }
    
    if (metadata.category) {
      lines.push(`category: "${this.escapeYamlString(metadata.category)}"`);
    }
    
    if (metadata.tags && metadata.tags.length > 0) {
      lines.push('tags:');
      for (const tag of metadata.tags) {
        lines.push(`  - "${this.escapeYamlString(tag)}"`);
      }
    }
    
    if (metadata.lastUpdated) {
      lines.push(`lastUpdated: ${metadata.lastUpdated}`);
    }
    
    lines.push('---');
    
    return lines.join('\n');
  }

  private escapeYamlString(str: string): string {
    return str.replace(/"/g, '\\"');
  }
}