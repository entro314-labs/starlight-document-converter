# Advanced Workflow Example

This example demonstrates a complete content workflow with file watching, custom patterns, and team collaboration features.

## Features

- **Multi-directory watching** - Monitor multiple input directories
- **Custom category patterns** - Advanced categorization rules
- **Team workflow** - Separate directories for different content types
- **Quality validation** - Built-in content quality checks
- **Automated workflow** - File watching with instant conversion

## Directory Structure

```
advanced-workflow/
├── content-sources/
│   ├── team-docs/         # Team documentation
│   ├── api-specs/         # API specifications
│   ├── tutorials/         # Tutorial content
│   └── external-imports/  # External document imports
├── src/content/docs/      # Generated content
├── scripts/
│   ├── setup-workflow.js  # Workflow setup
│   └── validate-content.js # Content validation
└── astro.config.mjs
```

## Configuration

```js
// astro.config.mjs
export default defineConfig({
  integrations: [
    starlight({
      title: 'Advanced Documentation',
      sidebar: [
        {
          label: 'Getting Started',
          items: [{ label: 'Introduction', link: '/intro/' }],
        },
        {
          label: 'Guides',
          autogenerate: { directory: 'guides' },
        },
        {
          label: 'API Reference',
          autogenerate: { directory: 'api' },
        },
        {
          label: 'Tutorials',
          autogenerate: { directory: 'tutorials' },
        },
      ],
    }),
    
    starlightDocumentConverter({
      watch: true,
      inputDirs: [
        'content-sources/team-docs',
        'content-sources/api-specs',
        'content-sources/tutorials',
        'content-sources/external-imports'
      ],
      converter: {
        outputDir: 'src/content/docs',
        preserveStructure: true,
        generateTitles: true,
        generateDescriptions: true,
        addTimestamps: true,
        verbose: true,
        categoryPatterns: {
          'tutorial': 'Tutorials',
          'howto': 'How-to Guides',
          'guide': 'Guides',
          'reference': 'Reference',
          'api': 'API Reference',
          'spec': 'Specifications',
          'rfc': 'RFCs',
          'design': 'Design Docs'
        },
        tagPatterns: {
          'javascript': ['javascript', 'js', 'node.js', 'react', 'vue'],
          'typescript': ['typescript', 'ts', 'tsx'],
          'python': ['python', 'django', 'flask', 'fastapi'],
          'api': ['api', 'rest', 'graphql', 'endpoint'],
          'database': ['database', 'sql', 'mongodb', 'postgres'],
          'devops': ['docker', 'kubernetes', 'ci/cd', 'deployment'],
          'security': ['security', 'auth', 'oauth', 'jwt'],
          'testing': ['test', 'testing', 'jest', 'vitest', 'cypress']
        }
      }
    })
  ],
});
```

## Workflow Scripts

### Content Setup
```bash
# Create content structure
npm run setup:workflow

# Import external documentation
npm run import:external

# Validate all content
npm run validate:content
```

### Development Workflow
```bash
# Start with file watching
npm run dev:watch

# Convert with quality checks
npm run convert:quality

# Generate content report
npm run report:content
```

## Team Workflow

### Content Contributors

1. **Add content** to appropriate directories:
   - `team-docs/` - Internal documentation
   - `tutorials/` - User tutorials
   - `api-specs/` - API documentation

2. **File watching** automatically converts new files

3. **Quality checks** provide immediate feedback

### Content Review Process

1. **Automated validation** runs on all conversions
2. **Quality scores** help identify content needing improvement
3. **Structured output** makes review easier

## Custom Validation Rules

```js
// scripts/validate-content.js
export function validateContent(frontmatter, content) {
  const issues = [];
  
  // Title validation
  if (!frontmatter.title || frontmatter.title.length < 5) {
    issues.push('Title too short or missing');
  }
  
  // Description validation
  if (!frontmatter.description || frontmatter.description.length < 20) {
    issues.push('Description should be at least 20 characters');
  }
  
  // Content structure validation
  const headings = content.match(/^#{1,6}\s/gm);
  if (!headings || headings.length === 0) {
    issues.push('No headings found - consider adding structure');
  }
  
  // Code examples validation
  const codeBlocks = content.match(/```/g);
  if (codeBlocks && codeBlocks.length > 0) {
    if (codeBlocks.length % 2 !== 0) {
      issues.push('Unmatched code block markers');
    }
  }
  
  return issues;
}
```

## Integration with External Tools

### Content Management
- Import from Notion, Confluence, or other platforms
- Batch process Word documents from shared drives
- Convert legacy HTML documentation

### CI/CD Integration
- Automated content validation in pull requests
- Quality gates for documentation updates
- Automated deployment to production sites

## Monitoring and Analytics

Track content quality and conversion success:
- Conversion success rates
- Quality score distributions
- Most common content issues
- Content categorization accuracy