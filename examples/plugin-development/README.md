# Plugin Development Guide

This guide shows how to create custom plugins for Starlight Document Converter.

## Plugin Types

The converter supports three types of plugins:

1. **File Processors** - Convert new file types to markdown
2. **Metadata Enhancers** - Improve or add metadata to documents
3. **Quality Validators** - Validate and score content quality

## Creating a File Processor

File processors convert new file formats to markdown:

```typescript
// plugins/csv-processor.ts
import type { FileProcessor, ProcessingContext } from 'starlight-document-converter/plugins';

export const csvProcessor: FileProcessor = {
  extensions: ['.csv'],
  metadata: {
    name: 'csv-processor',
    version: '1.0.0',
    description: 'Converts CSV files to markdown tables',
    author: 'Your Name'
  },
  
  validate: (content: string): boolean => {
    // Basic CSV validation
    return content.includes(',') && content.includes('\n');
  },
  
  process: (content: string, context: ProcessingContext): string => {
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1).map(line => line.split(',').map(c => c.trim()));
    
    let markdown = `# ${context.filename.replace('.csv', '')}\n\n`;
    markdown += 'Data table imported from CSV file.\n\n';
    
    // Create markdown table
    markdown += '| ' + headers.join(' | ') + ' |\n';
    markdown += '|' + headers.map(() => '---').join('|') + '|\n';
    
    rows.forEach(row => {
      markdown += '| ' + row.join(' | ') + ' |\n';
    });
    
    return markdown;
  }
};
```

## Creating a Metadata Enhancer

Metadata enhancers improve document metadata:

```typescript
// plugins/seo-enhancer.ts
import type { MetadataEnhancer, DocumentMetadata, ProcessingContext } from 'starlight-document-converter/plugins';

export const seoEnhancer: MetadataEnhancer = {
  metadata: {
    name: 'seo-enhancer',
    version: '1.0.0',
    description: 'Enhances metadata for better SEO',
    author: 'Your Name'
  },
  priority: 100, // Higher priority runs first
  
  enhance: (metadata: DocumentMetadata, context: ProcessingContext): DocumentMetadata => {
    // Add SEO-friendly slug
    if (metadata.title) {
      metadata.slug = metadata.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
    }
    
    // Ensure description is SEO-optimal length (150-160 chars)
    if (metadata.description && metadata.description.length > 160) {
      const truncated = metadata.description.substring(0, 150);
      const lastSpace = truncated.lastIndexOf(' ');
      metadata.description = truncated.substring(0, lastSpace) + '...';
    }
    
    // Add canonical URL if domain is configured
    if (process.env.SITE_DOMAIN) {
      metadata.canonical = `https://${process.env.SITE_DOMAIN}/${metadata.slug}`;
    }
    
    // Add structured data type
    metadata.structuredDataType = determineContentType(metadata, context);
    
    return metadata;
  }
};

function determineContentType(metadata: DocumentMetadata, context: ProcessingContext): string {
  if (metadata.category === 'API Reference') return 'TechArticle';
  if (metadata.tags?.includes('tutorial')) return 'HowTo';
  if (metadata.tags?.includes('news')) return 'NewsArticle';
  return 'Article';
}
```

## Creating a Quality Validator

Quality validators assess and score content:

```typescript
// plugins/accessibility-validator.ts
import type { QualityValidator, QualityReport, QualityIssue, DocumentMetadata, ProcessingContext } from 'starlight-document-converter/plugins';

export const accessibilityValidator: QualityValidator = {
  metadata: {
    name: 'accessibility-validator',
    version: '1.0.0',
    description: 'Validates content for accessibility compliance',
    author: 'Your Name'
  },
  
  validate: (content: string, metadata: DocumentMetadata, context: ProcessingContext): QualityReport => {
    const issues: QualityIssue[] = [];
    let score = 100;
    
    // Check for images without alt text
    const images = content.match(/!\[([^\]]*)\]\([^)]+\)/g) || [];
    const imagesWithoutAlt = images.filter(img => {
      const altText = img.match(/!\[([^\]]*)\]/)?.[1];
      return !altText || altText.trim().length === 0;
    });
    
    if (imagesWithoutAlt.length > 0) {
      issues.push({
        type: 'error',
        message: `${imagesWithoutAlt.length} image(s) missing alt text`,
        severity: 8
      });
      score -= 20;
    }
    
    // Check heading structure
    const headings = content.match(/^(#{1,6})\s+(.+)$/gm) || [];
    let prevLevel = 0;
    
    headings.forEach((heading, index) => {
      const level = heading.match(/^#+/)?.[0]?.length || 0;
      
      if (index === 0 && level !== 1) {
        issues.push({
          type: 'warning',
          message: 'Document should start with H1 heading',
          severity: 6
        });
        score -= 10;
      }
      
      if (level > prevLevel + 1) {
        issues.push({
          type: 'warning',
          message: `Heading level jumps from H${prevLevel} to H${level}`,
          severity: 4
        });
        score -= 5;
      }
      
      prevLevel = level;
    });
    
    // Check for sufficient color contrast (basic check)
    const colorReferences = content.match(/color:\s*#[0-9a-fA-F]{6}/g) || [];
    if (colorReferences.length > 0) {
      issues.push({
        type: 'info',
        message: 'Manual color contrast verification needed for inline styles',
        severity: 2
      });
    }
    
    const level: 'high' | 'medium' | 'low' = 
      score >= 90 ? 'high' : 
      score >= 70 ? 'medium' : 'low';
    
    return {
      score: Math.max(0, score),
      level,
      issues,
      suggestions: generateAccessibilitySuggestions(issues)
    };
  }
};

function generateAccessibilitySuggestions(issues: QualityIssue[]): string[] {
  const suggestions: string[] = [];
  
  if (issues.some(i => i.message.includes('alt text'))) {
    suggestions.push('Add descriptive alt text to all images for screen reader users');
  }
  
  if (issues.some(i => i.message.includes('heading'))) {
    suggestions.push('Ensure proper heading hierarchy (H1 > H2 > H3) for navigation');
  }
  
  if (issues.some(i => i.message.includes('color'))) {
    suggestions.push('Verify color contrast meets WCAG guidelines (4.5:1 for normal text)');
  }
  
  return suggestions;
}
```

## Registering Plugins

Register plugins in your configuration:

```typescript
// astro.config.mjs
import { csvProcessor, seoEnhancer, accessibilityValidator } from './plugins/index.js';
import { pluginRegistry } from 'starlight-document-converter/plugins';

// Register custom plugins
pluginRegistry.registerProcessor(csvProcessor);
pluginRegistry.registerEnhancer(seoEnhancer);
pluginRegistry.registerValidator(accessibilityValidator);

export default defineConfig({
  integrations: [
    starlight({ title: 'Documentation' }),
    starlightDocumentConverter({
      // Plugin system is automatically used
      converter: {
        verbose: true // See plugin execution logs
      }
    })
  ]
});
```

## Plugin Development Best Practices

### 1. Error Handling

Always handle errors gracefully:

```typescript
process: (content: string, context: ProcessingContext): string => {
  try {
    // Your processing logic
    return processContent(content);
  } catch (error) {
    console.error(`Plugin ${this.metadata.name} failed:`, error);
    // Return original content or safe fallback
    return content;
  }
}
```

### 2. Performance Considerations

- Use async processing for I/O operations
- Cache expensive computations
- Avoid blocking operations in validators

```typescript
// Good: Async processing
process: async (content: string, context: ProcessingContext): Promise<string> => {
  const externalData = await fetchExternalData(content);
  return combineData(content, externalData);
}

// Good: Caching
const cache = new Map();
enhance: (metadata: DocumentMetadata, context: ProcessingContext): DocumentMetadata => {
  const cacheKey = `${context.filename}-${metadata.title}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  
  const enhanced = performEnhancement(metadata);
  cache.set(cacheKey, enhanced);
  return enhanced;
}
```

### 3. Configuration Support

Make plugins configurable:

```typescript
export interface CSVProcessorConfig {
  delimiter?: string;
  hasHeader?: boolean;
  tableClass?: string;
}

export function createCSVProcessor(config: CSVProcessorConfig = {}): FileProcessor {
  return {
    extensions: ['.csv'],
    metadata: {
      name: 'csv-processor',
      version: '1.0.0',
      description: 'Configurable CSV to markdown converter'
    },
    
    process: (content: string, context: ProcessingContext): string => {
      const delimiter = config.delimiter || ',';
      const hasHeader = config.hasHeader !== false;
      
      // Use configuration in processing
      return processCsv(content, { delimiter, hasHeader });
    }
  };
}
```

### 4. Testing Plugins

Create comprehensive tests:

```typescript
// plugins/csv-processor.test.ts
import { describe, it, expect } from 'vitest';
import { csvProcessor } from './csv-processor.js';

describe('CSV Processor', () => {
  it('should convert CSV to markdown table', () => {
    const csvContent = 'Name,Age,City\nJohn,30,NYC\nJane,25,LA';
    const context = {
      filename: 'users.csv',
      inputPath: '/path/to/users.csv',
      outputPath: '/path/to/users.md',
      extension: '.csv',
      options: {}
    };
    
    const result = csvProcessor.process(csvContent, context);
    
    expect(result).toContain('| Name | Age | City |');
    expect(result).toContain('| John | 30 | NYC |');
    expect(result).toContain('| Jane | 25 | LA |');
  });
  
  it('should validate CSV content', () => {
    expect(csvProcessor.validate!('name,age\njohn,30')).toBe(true);
    expect(csvProcessor.validate!('not csv content')).toBe(false);
  });
});
```

## Plugin Ecosystem Examples

### API Documentation Plugin

```typescript
export const openAPIProcessor: FileProcessor = {
  extensions: ['.yaml', '.yml'],
  metadata: {
    name: 'openapi-processor',
    version: '1.0.0',
    description: 'Converts OpenAPI specs to documentation'
  },
  
  validate: (content: string): boolean => {
    return content.includes('openapi:') || content.includes('swagger:');
  },
  
  process: async (content: string, context: ProcessingContext): Promise<string> => {
    const spec = YAML.parse(content);
    return generateAPIDocumentation(spec, context);
  }
};
```

### Diagram Generator Plugin

```typescript
export const mermaidEnhancer: MetadataEnhancer = {
  metadata: {
    name: 'mermaid-enhancer',
    version: '1.0.0',
    description: 'Adds diagram metadata for Mermaid blocks'
  },
  
  enhance: (metadata: DocumentMetadata, context: ProcessingContext): DocumentMetadata => {
    // Read content to detect Mermaid diagrams
    const hasDiagrams = context.data?.content?.includes('```mermaid');
    
    if (hasDiagrams) {
      metadata.tags = [...(metadata.tags || []), 'diagrams', 'visual'];
      metadata.hasDiagrams = true;
    }
    
    return metadata;
  }
};
```

This plugin system makes the converter highly extensible while maintaining clean separation of concerns!