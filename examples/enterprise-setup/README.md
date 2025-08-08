# Enterprise Setup Example

This example shows how to set up Starlight Document Converter for enterprise environments with advanced features, security considerations, and scalability patterns.

## Features

- **Multi-tenant configuration** - Support multiple documentation sites
- **Enterprise security** - Content validation and sanitization
- **Scalable processing** - Batch processing for large document sets
- **Content governance** - Approval workflows and quality gates
- **Integration ecosystem** - Connect with enterprise tools

## Architecture Overview

```
enterprise-setup/
├── config/
│   ├── production.config.mjs    # Production configuration
│   ├── staging.config.mjs       # Staging configuration
│   └── security.config.js       # Security policies
├── workflows/
│   ├── content-approval/        # Approval workflow
│   ├── batch-processing/        # Large-scale processing
│   └── quality-assurance/       # QA automation
├── integrations/
│   ├── confluence/              # Confluence connector
│   ├── sharepoint/              # SharePoint integration
│   └── slack-notifications/     # Team notifications
└── monitoring/
    ├── analytics/               # Usage analytics
    ├── performance/             # Performance monitoring
    └── alerts/                  # Error alerting
```

## Production Configuration

```js
// config/production.config.mjs
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightDocumentConverter from 'starlight-document-converter';

export default defineConfig({
  integrations: [
    starlight({
      title: 'Enterprise Documentation Hub',
      description: 'Centralized documentation for all teams',
      logo: { src: './src/assets/logo.svg' },
      social: {
        github: 'https://github.com/company/docs',
      },
      editLink: {
        baseUrl: 'https://github.com/company/docs/edit/main/',
      },
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Welcome', link: '/welcome/' },
            { label: 'Quick Start', link: '/quick-start/' },
          ],
        },
        {
          label: 'Product Documentation',
          collapsed: false,
          autogenerate: { directory: 'products' },
        },
        {
          label: 'API Reference',
          collapsed: true,
          autogenerate: { directory: 'api' },
        },
        {
          label: 'Engineering Guides',
          collapsed: true,
          autogenerate: { directory: 'engineering' },
        },
      ],
      components: {
        // Override default components for enterprise branding
        Header: './src/components/CustomHeader.astro',
        Footer: './src/components/CustomFooter.astro',
      },
    }),
    
    starlightDocumentConverter({
      enabled: process.env.NODE_ENV !== 'test',
      watch: process.env.NODE_ENV === 'development',
      inputDirs: [
        'content-sources/product-docs',
        'content-sources/engineering',
        'content-sources/api-specs',
        'content-sources/external-imports'
      ],
      converter: {
        outputDir: 'src/content/docs',
        preserveStructure: true,
        generateTitles: true,
        generateDescriptions: true,
        addTimestamps: true,
        verbose: process.env.NODE_ENV === 'development',
        dryRun: process.env.DRY_RUN === 'true',
        
        // Enterprise category patterns
        categoryPatterns: {
          'product': 'Product Documentation',
          'api': 'API Reference',
          'engineering': 'Engineering Guides',
          'security': 'Security Documentation',
          'compliance': 'Compliance & Legal',
          'onboarding': 'Employee Onboarding',
          'process': 'Business Processes',
          'architecture': 'System Architecture',
          'runbook': 'Operations Runbooks'
        },
        
        // Advanced tag patterns for enterprise content
        tagPatterns: {
          'confidential': ['confidential', 'internal', 'restricted'],
          'public': ['public', 'external', 'customer-facing'],
          'product-alpha': ['alpha', 'product-alpha'],
          'product-beta': ['beta', 'product-beta'],
          'deprecated': ['deprecated', 'legacy', 'end-of-life'],
          'compliance': ['gdpr', 'soc2', 'hipaa', 'compliance'],
          'security': ['security', 'vulnerability', 'incident'],
          'architecture': ['architecture', 'design', 'system-design'],
          'operations': ['ops', 'devops', 'sre', 'monitoring']
        }
      }
    })
  ],
  
  // Performance optimizations for enterprise scale
  build: {
    split: true,
    format: 'directory'
  },
  
  // Security headers
  security: {
    checkOrigin: true
  }
});
```

## Security Configuration

```js
// config/security.config.js
export const securityConfig = {
  // Content sanitization rules
  sanitization: {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'ul', 'ol', 'li',
      'strong', 'em', 'code', 'pre',
      'blockquote', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'a', 'img'
    ],
    allowedAttributes: {
      'a': ['href', 'title'],
      'img': ['src', 'alt', 'title', 'width', 'height'],
      'code': ['class'],
      'pre': ['class']
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    stripIgnoreTag: true
  },
  
  // Content validation rules
  validation: {
    maxFileSize: '10MB',
    allowedExtensions: ['.md', '.mdx', '.txt', '.html', '.htm', '.docx', '.doc'],
    requireApproval: ['confidential', 'restricted'],
    bannedPatterns: [
      /password\s*[:=]\s*\w+/gi,
      /api[_-]?key\s*[:=]\s*\w+/gi,
      /secret\s*[:=]\s*\w+/gi
    ]
  },
  
  // Access control
  accessControl: {
    restrictedCategories: ['confidential', 'internal'],
    approvers: {
      'security': ['security-team@company.com'],
      'compliance': ['compliance@company.com'],
      'engineering': ['eng-leads@company.com']
    }
  }
};
```

## Batch Processing Workflow

```js
// workflows/batch-processing/processor.js
import { DocumentConverter } from 'starlight-document-converter';
import { securityConfig } from '../../config/security.config.js';

export class EnterpriseProcessor {
  constructor(config) {
    this.converter = new DocumentConverter(config);
    this.security = securityConfig;
    this.processedCount = 0;
    this.errors = [];
  }
  
  async processBatch(inputDir, options = {}) {
    console.log(`Starting batch processing of: ${inputDir}`);
    
    try {
      // Security validation
      await this.validateInputSecurity(inputDir);
      
      // Process documents with progress tracking
      const results = await this.converter.convertDirectory(inputDir);
      
      // Post-processing validation
      await this.validateOutputQuality(results);
      
      // Generate processing report
      return this.generateReport(results);
      
    } catch (error) {
      this.errors.push(error);
      throw new Error(`Batch processing failed: ${error.message}`);
    }
  }
  
  async validateInputSecurity(inputDir) {
    // Check for sensitive data patterns
    // Validate file sizes and types
    // Scan for malicious content
  }
  
  async validateOutputQuality(results) {
    // Quality score validation
    // Content structure validation
    // Metadata completeness checks
  }
  
  generateReport(results) {
    return {
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        processingTime: Date.now() - this.startTime
      },
      qualityMetrics: {
        averageQualityScore: this.calculateAverageQuality(results),
        highQuality: results.filter(r => r.quality === 'high').length,
        needsReview: results.filter(r => r.quality === 'low').length
      },
      errors: this.errors,
      recommendations: this.generateRecommendations(results)
    };
  }
}
```

## Integration Examples

### Confluence Integration
```js
// integrations/confluence/connector.js
export class ConfluenceConnector {
  constructor(config) {
    this.baseUrl = config.confluenceUrl;
    this.token = config.token;
  }
  
  async syncSpace(spaceKey, outputDir) {
    const pages = await this.getSpacePages(spaceKey);
    
    for (const page of pages) {
      const content = await this.getPageContent(page.id);
      const htmlFile = `${outputDir}/${page.title}.html`;
      
      await writeFile(htmlFile, content);
    }
    
    // Trigger conversion
    const converter = new DocumentConverter({
      outputDir: 'src/content/docs/confluence'
    });
    
    return await converter.convertDirectory(outputDir);
  }
}
```

### Slack Notifications
```js
// integrations/slack-notifications/notifier.js
export class SlackNotifier {
  async notifyConversionComplete(results) {
    const message = {
      channel: '#documentation',
      text: 'Documentation conversion completed',
      attachments: [{
        color: results.errors.length > 0 ? 'warning' : 'good',
        fields: [
          {
            title: 'Files Processed',
            value: results.summary.total,
            short: true
          },
          {
            title: 'Success Rate',
            value: `${(results.summary.successful / results.summary.total * 100).toFixed(1)}%`,
            short: true
          },
          {
            title: 'Average Quality Score',
            value: results.qualityMetrics.averageQualityScore,
            short: true
          }
        ]
      }]
    };
    
    await this.sendSlackMessage(message);
  }
}
```

## Monitoring and Analytics

### Performance Monitoring
```js
// monitoring/performance/tracker.js
export class PerformanceTracker {
  constructor() {
    this.metrics = new Map();
  }
  
  trackConversion(file, startTime, endTime, quality) {
    const duration = endTime - startTime;
    const size = this.getFileSize(file);
    
    this.metrics.set(file, {
      duration,
      size,
      quality,
      throughput: size / duration,
      timestamp: Date.now()
    });
  }
  
  getMetrics() {
    return {
      totalConversions: this.metrics.size,
      averageDuration: this.calculateAverage('duration'),
      averageQuality: this.calculateAverage('quality'),
      throughput: this.calculateThroughput(),
      slowestConversions: this.getSlowestConversions(10)
    };
  }
}
```

## Deployment Scripts

### Production Deployment
```bash
#!/bin/bash
# scripts/deploy-production.sh

set -e

echo "Starting enterprise deployment..."

# Validate configuration
npm run validate:config

# Run security checks
npm run security:scan

# Build with production optimizations
NODE_ENV=production npm run build

# Run integration tests
npm run test:integration

# Deploy to CDN
npm run deploy:cdn

# Update search index
npm run search:reindex

# Send deployment notification
npm run notify:deployment

echo "Deployment completed successfully!"
```

## Best Practices

1. **Security First**: Always validate and sanitize content
2. **Quality Gates**: Set minimum quality thresholds
3. **Monitoring**: Track performance and quality metrics
4. **Approval Workflows**: Require reviews for sensitive content
5. **Backup Strategy**: Regular backups of source content
6. **Disaster Recovery**: Automated recovery procedures
7. **Access Control**: Role-based access to different content types
8. **Audit Trail**: Log all content changes and conversions