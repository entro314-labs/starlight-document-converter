# Starlight Document Converter

[![npm version](https://badge.fury.io/js/@entro314labs/starlight-document-converter.svg)](https://www.npmjs.com/package/@entro314labs/starlight-document-converter)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive document converter for [Astro Starlight](https://starlight.astro.build) that transforms various document formats into Starlight-compatible Markdown with proper frontmatter.

## ✨ Features

- **🌟 Beautiful Interactive CLI**: Modern, guided experience with colors and emojis
- **📁 Multi-format Support**: Convert `.docx`, `.doc`, `.txt`, `.html`, `.htm`, `.md`, `.rtf` files
- **🧠 Smart AI-powered Generation**: Auto-generates titles, descriptions, categories, and tags
- **📊 Quality Scoring**: Real-time quality indicators (🟢🟡🔴) with improvement suggestions
- **🚀 Batch Processing**: Convert entire directories with preserved structure
- **⚙️ Enhanced Starlight Integration**: Dashboard components with analytics and conversion management
- **👀 File Watching**: Auto-convert documents on changes
- **🎯 Project Setup Wizard**: Interactive configuration for new projects
- **📱 Responsive Design**: Works perfectly on desktop and mobile devices
- **📝 TypeScript Support**: Full type definitions included

## 📦 Installation

```bash
npm install @entro314labs/starlight-document-converter
# or
pnpm add @entro314labs/starlight-document-converter
# or
yarn add @entro314labs/starlight-document-converter
```

## 🚀 Quick Start

### As Astro Integration (Recommended)

Add to your `astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightDocumentConverter from '@entro314labs/starlight-document-converter';

export default defineConfig({
  integrations: [
    starlight({
      title: 'My Docs',
    }),
    
    // 🎉 Zero configuration - automatically detects your setup!
    starlightDocumentConverter({
      watch: true  // Optional: auto-convert during development
    })
  ],
});
```

**What it does automatically:**
- ✅ Detects your Starlight content directory (`src/content/docs`)
- ✅ Finds existing document directories (`docs-import`, `documents`, etc.)
- ✅ Uses your project's title and configuration
- ✅ Converts documents to proper Starlight format

### 🌟 Interactive CLI

The CLI automatically detects your Starlight project:

```bash
# Interactive mode with smart detection
npx starlight-convert

# ✅ Detects: Your content directory, existing docs, project config
# ✅ Suggests: Available document sources
# ✅ Converts: Directly to your Starlight structure
```

### ⚡ Quick Commands

```bash
# Convert directory (auto-detects output location)
npx starlight-convert batch documents/

# Preview changes first
npx starlight-convert batch documents/ --dry-run --verbose

# Watch for changes
npx starlight-convert watch documents/
```


## 🎨 CLI Experience

### ✨ Interactive Mode Features
- 🎯 **Smart Prompts**: Guided workflow with validation and previews
- 🎮 **Multi-select Options**: Choose exactly what you want to generate
- 📊 **Quality Indicators**: Real-time feedback with 🟢🟡🔴 quality scores
- 📁 **File Preview**: See what files will be converted before proceeding
- ⚙️ **Advanced Configuration**: Optional settings for power users

### 🚀 Available Commands

| Command | Purpose | Example |
|---------|---------|---------|
| `starlight-convert` | Interactive mode (recommended) | Best overall experience |
| `starlight-convert setup` | Project configuration wizard | Perfect for new projects |
| `starlight-convert batch` | Non-interactive batch processing | `batch docs/ --dry-run` |
| `starlight-convert watch` | File watching with auto-conversion | `watch docs-import/` |

### 📊 Quality Scoring System
- 🟢 **High Quality (80%+)**: Complete metadata, good structure, proper tags
- 🟡 **Medium Quality (60-79%)**: Minor issues, some missing elements
- 🔴 **Low Quality (<60%)**: Missing descriptions, poor titles, needs attention

## 📚 Supported Formats

| Format | Extension | Features |
|--------|-----------|----------|
| Word Documents | `.docx`, `.doc` | Full formatting, tables, lists |
| HTML | `.html`, `.htm` | Clean conversion to markdown |
| Plain Text | `.txt` | Smart code block detection |
| Markdown | `.md`, `.mdx` | Frontmatter generation |
| Rich Text | `.rtf` | Basic formatting support |

## ⚙️ Configuration

### Integration Options

```js
starlightDocumentConverter({
  // Enable/disable the integration
  enabled: true,
  
  // Watch for file changes
  watch: true,
  
  // Input directories to monitor
  inputDirs: ['docs-import', 'documents'],
  
  // Converter options
  converter: {
    outputDir: 'src/content/docs',
    preserveStructure: true,
    generateTitles: true,
    generateDescriptions: true,
    addTimestamps: false,
    defaultCategory: 'documentation',
    verbose: false,
    dryRun: false
  }
})
```

### 🎛️ Enhanced Starlight Components (NEW!)

Add powerful dashboard components directly to your Starlight pages:

#### Conversion Dashboard

```astro
---
// src/content/docs/admin/converter.mdx
import ConversionDashboard from '@entro314labs/starlight-document-converter/src/starlight-components/ConversionDashboard.astro';
---

# Document Converter

<ConversionDashboard 
  title="Convert Documents" 
  showStats={true}
  showRecentConversions={true}
/>
```

#### Quality Analytics

```astro
---
import QualityMetrics from '@entro314labs/starlight-document-converter/src/starlight-components/QualityMetrics.astro';
---

# Conversion Analytics  

<QualityMetrics 
  title="Quality Analytics"
  showDetailedBreakdown={true}
  timeframe="week"
/>
```

**Components Features:**
- **📊 Embedded Analytics**: Quality metrics and conversion statistics
- **🎯 Quick Convert**: Drag & drop functionality within Starlight
- **📋 Conversion History**: Track conversions with quality indicators
- **⚙️ Settings Panel**: Configure conversion parameters
- **📱 Mobile Responsive**: Perfect on all devices
- **🎨 Starlight Themed**: Matches your site's design perfectly

### Command Reference

```bash
# Interactive mode (recommended)
starlight-convert                    # Launch guided interface

# Project setup
starlight-convert setup              # Configuration wizard

# Batch processing
starlight-convert batch <input> [options]
  -o, --output <dir>      Output directory (default: src/content/docs)
  --no-preserve          Don't preserve directory structure
  --no-titles            Don't auto-generate titles  
  --no-descriptions      Don't auto-generate descriptions
  --timestamps           Add lastUpdated timestamps
  --category <category>  Default category (default: documentation)
  -v, --verbose          Show detailed output with quality indicators
  --dry-run              Preview changes without writing files

# File watching  
starlight-convert watch <directory> [options]
  -o, --output <dir>     Output directory (default: src/content/docs)
  -v, --verbose          Show detailed output
```

## 📝 Frontmatter Generation

The converter automatically generates Starlight-compatible frontmatter:

```yaml
---
title: "Document Title"
description: "Auto-generated description from first paragraph."
category: "Guides"
tags:
  - javascript
  - api
  - tutorial
---
```

### Category Detection

Categories are auto-detected from file paths:

- `*/guide*` → `"Guides"`
- `*/api*`, `*/reference*` → `"Reference"`
- `*/blog*` → `"Blog"`
- `*/tutorial*` → `"Guides"`

### Tag Extraction

Tags are automatically extracted based on content analysis:

- **Technologies**: JavaScript, TypeScript, React, Vue, Astro
- **Topics**: API, Database, Security, Performance
- **Content Types**: Guide, Reference, Tutorial

## 🔧 Programmatic Usage

```js
import { DocumentConverter } from '@entro314labs/starlight-document-converter';

const converter = new DocumentConverter({
  outputDir: 'src/content/docs',
  generateTitles: true,
  generateDescriptions: true
});

// Convert single file
const result = await converter.convertFile('document.docx');

// Convert directory
const results = await converter.convertDirectory('documents/');

// Get conversion statistics
const stats = converter.getStats();
console.log(`Processed: ${stats.processed} files`);
```

## 📁 Flexible Directory Usage

### Option 1: Direct Content Directory (Simple)
```
your-starlight-project/
├── src/content/docs/
│   ├── existing-page.md
│   ├── new-document.docx    # 👈 Drop documents directly here
│   └── api-guide.html       # 👈 Or here - they'll be converted automatically
└── astro.config.mjs
```

### Option 2: Separate Import Directory (Organized)
```
your-starlight-project/
├── docs-import/             # 👈 Create this for imports
│   ├── guides/
│   │   └── setup.docx
│   └── api-reference.html
├── src/content/docs/        # 👈 Converted markdown appears here
│   ├── guides/
│   │   └── setup.md
│   └── api-reference.md
└── astro.config.mjs
```

**The converter automatically detects and uses whichever approach you prefer!**

## 🎯 Use Cases

### 1. Documentation Migration
Convert existing Word docs and HTML files to Starlight:

```bash
# Place old docs in docs-import/
mkdir docs-import
cp ~/old-docs/*.docx docs-import/

# Convert all at once
npx starlight-convert docs-import/ --verbose
```

### 2. Content Workflow
Set up automatic conversion for content creators:

```js
// astro.config.mjs
starlightDocumentConverter({
  watch: true,
  inputDirs: ['content-drafts'],
  converter: {
    generateDescriptions: true,
    addTimestamps: true
  }
})
```

### 3. Bulk Processing
Convert large documentation sets:

```bash
# Preview first
npx starlight-convert legacy-docs/ --dry-run

# Convert with custom output
npx starlight-convert legacy-docs/ -o src/content/docs/legacy
```

## 🧪 Examples

### Word Document Conversion

Input (`guide.docx`):
```
# Getting Started Guide

This guide will help you set up your development environment.

## Prerequisites
- Node.js 18+
- Git

## Installation Steps
1. Clone the repository
2. Install dependencies
3. Start development server
```

Output (`guide.md`):
```yaml
---
title: "Getting Started Guide"
description: "This guide will help you set up your development environment."
category: "Guides"
tags:
  - guide
---

# Getting Started Guide

This guide will help you set up your development environment.

## Prerequisites
- Node.js 18+
- Git

## Installation Steps
1. Clone the repository
2. Install dependencies  
3. Start development server
```

### HTML Conversion

Input (`api.html`):
```html
<!DOCTYPE html>
<html>
<head><title>API Reference</title></head>
<body>
  <h1>User API</h1>
  <p>REST API for user management</p>
  
  <h2>Endpoints</h2>
  <ul>
    <li><code>GET /users</code> - List users</li>
    <li><code>POST /users</code> - Create user</li>
  </ul>
</body>
</html>
```

Output (`api.md`):
```yaml
---
title: "API Reference"
description: "REST API for user management."
category: "Reference"
tags:
  - api
  - reference
---

# User API

REST API for user management

## Endpoints

- `GET /users` - List users
- `POST /users` - Create user
```

## 🔍 Advanced Features

### Custom Category Patterns

```js
converter: {
  categoryPatterns: {
    'tutorial': 'Tutorials',
    'howto': 'How-to Guides', 
    'spec': 'Specifications',
    'rfc': 'RFCs'
  }
}
```

### Custom Tag Patterns

```js
converter: {
  tagPatterns: {
    'python': ['python', 'django', 'flask'],
    'devops': ['docker', 'kubernetes', 'ci/cd'],
    'mobile': ['ios', 'android', 'react-native']
  }
}
```

### File Watching

```js
// Monitor multiple directories
starlightDocumentConverter({
  watch: true,
  inputDirs: [
    'content-drafts',
    'team-docs', 
    'external-imports'
  ]
})
```

## 🧪 Testing

The package includes comprehensive tests:

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## 🤝 Contributing

Contributions are welcome! Please see our [GitHub repository](https://github.com/entro314-labs/starlight-document-converter) for contribution guidelines.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- [Documentation](https://github.com/entro314-labs/starlight-document-converter/blob/main/docs)
- [Issues](https://github.com/entro314-labs/starlight-document-converter/issues)
- [Discussions](https://github.com/entro314-labs/starlight-document-converter/discussions)

## 🙏 Acknowledgments

- Built for [Astro Starlight](https://starlight.astro.build)
- Uses [Mammoth.js](https://github.com/mwilliamson/mammoth.js) for Word document conversion
- Uses [Turndown](https://github.com/mixmark-io/turndown) for HTML to Markdown conversion

---

Made with ❤️ for the Astro community