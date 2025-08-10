# Starlight Document Converter

<div align="center">

[![npm version](https://badge.fury.io/js/%40entro314labs%2Fstarlight-document-converter.svg)](https://badge.fury.io/js/%40entro314labs%2Fstarlight-document-converter)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)

</div>

<div align="center">

<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="64" height="64" rx="12" fill="#6366F1"/>
<path d="M16 20h32v4H16v-4zm0 8h24v4H16v-4zm0 8h28v4H16v-4z" fill="white"/>
<circle cx="48" cy="44" r="8" fill="#10B981"/>
<path d="M44 44l3 3 5-5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

**Transform any document into beautiful Starlight documentation**

A comprehensive document converter for Astro Starlight that transforms various document formats into Starlight-compatible Markdown with proper frontmatter.

</div>

Starlight Document Converter revolutionizes documentation workflows by seamlessly converting Word docs, HTML files, and other formats directly into Astro Starlight-compatible markdown. This tool helps developers migrate existing documentation and provides intelligent content analysis with automatic frontmatter generation.

## Features

<table>
<tr>
<td align="center" width="50%">

<svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="#6366F1"/>
<path d="M14 2v6h6" fill="none" stroke="white" stroke-width="2"/>
</svg>

**Multi-Format Support**  
Convert `.docx`, `.doc`, `.txt`, `.html`, `.htm`, `.md`, `.rtf` files with perfect formatting preservation

</td>
<td align="center" width="50%">

<svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" fill="#10B981"/>
</svg>

**Smart AI Integration**  
Auto-generates titles, descriptions, categories, and tags using intelligent content analysis

</td>
</tr>
<tr>
<td align="center">

<svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M9.5 3A6.5 6.5 0 0 1 16 9.5c0 1.61-.59 3.09-1.56 4.23l.27.27h.79l5 5-1.5 1.5-5-5v-.79l-.27-.27A6.516 6.516 0 0 1 9.5 16 6.5 6.5 0 0 1 3 9.5 6.5 6.5 0 0 1 9.5 3m0 2C7 5 5 7 5 9.5S7 14 9.5 14 14 12 14 9.5 12 5 9.5 5z" fill="#8B5CF6"/>
</svg>

**Quality Scoring**  
Real-time quality indicators (🟢🟡🔴) with improvement suggestions and detailed analytics

</td>
<td align="center">

<svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="12" cy="12" r="3" fill="#F59E0B"/>
<path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" stroke="#F59E0B" stroke-width="2"/>
</svg>

**Astro Integration**  
Seamless Astro integration with file watching, batch processing, and zero-configuration setup

</td>
</tr>
</table>

## Quick Start

<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z" fill="#059669"/>
</svg>

### Installation

```bash
# Install globally
npm install -g @entro314labs/starlight-document-converter

# Or use directly with npx (full command)
npx @entro314labs/starlight-document-converter --help

# Shorter npx usage
npx @entro314labs/starlight-document-converter@latest
# Aliases: sdc, starvert, starlight-convert
```

### Basic Usage

```bash
# Interactive mode with smart detection
npx @entro314labs/starlight-document-converter

# Convert directory (auto-detects output location)
npx @entro314labs/starlight-document-converter batch documents/

# Preview changes first
npx @entro314labs/starlight-document-converter batch documents/ --dry-run --verbose

# After global install, use short aliases:
sdc                          # Interactive mode
sdc batch documents/         # Batch convert
starvert --help             # Show help
```

That's it! Your documents are ready for Starlight.

## How It Works

1. **Smart Detection**: Automatically detects your Starlight project structure and configuration
2. **Content Analysis**: Analyzes document content to generate appropriate titles, descriptions, and tags
3. **Format Conversion**: Converts various formats to clean, Starlight-compatible markdown
4. **Quality Assessment**: Provides quality scores and improvement suggestions for each document

## Supported Technologies

<div align="center">

<table>
<tr>
<td align="center">

<svg width="32" height="32" viewBox="0 0 24 24" fill="#FF7A00">
<path d="M0 0v24h24V0H0zm13.5 2.5c1.381 0 2.5 1.119 2.5 2.5 0 .563-.186 1.082-.5 1.5H13c-.825 0-1.5-.675-1.5-1.5s.675-1.5 1.5-1.5c.211 0 .414.044.5.1v-.6zm-3 0c.825 0 1.5.675 1.5 1.5s-.675 1.5-1.5 1.5S9 4.825 9 4s.675-1.5 1.5-1.5zm-1.5 4h3v2h-3V6.5zm0 3h3v2h-3v-2zm0 3h3v2h-3v-2zm0 3h3V18h-3v-2.5zM6 18c-.825 0-1.5-.675-1.5-1.5s.675-1.5 1.5-1.5 1.5.675 1.5 1.5S6.825 18 6 18zm12 0c-.825 0-1.5-.675-1.5-1.5s.675-1.5 1.5-1.5 1.5.675 1.5 1.5-.675 1.5-1.5 1.5z"/>
</svg>

**Astro & Starlight**  
Astro 5.x, Starlight 0.35+  
Native integration support

</td>
<td align="center">

<svg width="32" height="32" viewBox="0 0 24 24" fill="#339933">
<path d="M12 1.85c-.27 0-.55.07-.78.2l-7.44 4.3c-.48.28-.78.8-.78 1.36v8.58c0 .56.3 1.08.78 1.36l7.44 4.3c.46.26 1.04.26 1.5 0l7.44-4.3c.48-.28.78-.8.78-1.36V7.71c0-.56-.3-1.08-.78-1.36l-7.44-4.3c-.23-.13-.51-.2-.78-.2zm0 2.03c.13 0 .27.04.39.11l6.9 4v.81L12 12.6 4.71 8.8v-.81l6.9-4c.12-.07.26-.11.39-.11zM5.05 9.85l6.95 4.01v7.79c-.13 0-.27-.04-.39-.11l-6.9-4c-.23-.13-.39-.39-.39-.68v-6.68c0-.11.02-.22.05-.33zm13.9 0c.03.11.05.22.05.33v6.68c0 .29-.16.55-.39.68l-6.9 4c-.12.07-.26.11-.39.11v-7.79l6.95-4.01z"/>
</svg>

**Node.js**  
Node.js 20+, npm/pnpm/yarn  
CLI and programmatic API

</td>
</tr>
<tr>
<td align="center">

<svg width="32" height="32" viewBox="0 0 24 24" fill="#3178C6">
<path d="M1.125 0C.502 0 0 .502 0 1.125v21.75C0 23.498.502 24 1.125 24h21.75c.623 0 1.125-.502 1.125-1.125V1.125C24 .502 23.498 0 22.875 0zm17.363 9.75c.612 0 1.154.037 1.627.111a6.38 6.38 0 0 1 1.306.34v2.458a3.95 3.95 0 0 0-.643-.361 5.093 5.093 0 0 0-.717-.26 5.453 5.453 0 0 0-1.426-.2c-.3 0-.573.028-.819.086a2.1 2.1 0 0 0-.623.242c-.17.104-.3.229-.393.374a.888.888 0 0 0-.14.49c0 .196.053.373.156.529.104.156.252.304.443.444s.423.276.696.41c.273.135.582.274.926.416.47.197.892.407 1.266.628.374.222.695.473.963.753.268.279.472.598.614.957.142.359.214.776.214 1.253 0 .657-.125 1.21-.373 1.656a3.033 3.033 0 0 1-1.012 1.085 4.38 4.38 0 0 1-1.487.596c-.566.12-1.163.18-1.79.18a9.916 9.916 0 0 1-1.84-.164 5.544 5.544 0 0 1-1.512-.493v-2.63a5.033 5.033 0 0 0 3.237 1.2c.333 0 .624-.03.872-.09.249-.06.456-.144.623-.25.166-.108.29-.234.373-.38a1.023 1.023 0 0 0-.074-1.089 2.12 2.12 0 0 0-.537-.5 5.597 5.597 0 0 0-.807-.444 27.72 27.72 0 0 0-1.007-.436c-.918-.383-1.602-.852-2.053-1.405-.45-.553-.676-1.222-.676-2.005 0-.614.123-1.141.369-1.582.246-.441.58-.804 1.004-1.089a4.494 4.494 0 0 1 1.47-.629 7.536 7.536 0 0 1 1.77-.201zm-15.113.188h9.563v2.166H9.506v9.646H6.789v-9.646H3.375z"/>
</svg>

**TypeScript**  
Full TypeScript support  
Type definitions included

</td>
<td align="center">

<svg width="32" height="32" viewBox="0 0 24 24" fill="#E34F26">
<path d="M1.5 0h21l-1.91 21.563L11.977 24l-8.564-2.438L1.5 0zm7.031 9.75l-.232-2.718 10.059.003.23-2.622L5.412 4.41l.698 8.01h9.126l-.326 3.426-2.91.804-2.955-.81-.188-2.11H6.248l.33 4.171L12 19.351l5.379-1.443.744-8.157H8.531z"/>
</svg>

**Document Formats**  
Word, HTML, RTF, Markdown  
Text and structured content

</td>
</tr>
</table>

</div>

## Core Commands

<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM4 6h16v2H4V6zm0 4h4v2H4v-2zm6 0h10v2H10v-2zm-6 4h4v2H4v-2zm6 0h10v2H10v-2z" fill="#374151"/>
</svg>

> **Note:** Commands below assume global installation. For npx usage, prefix with `npx @entro314labs/starlight-document-converter`
> 
> **Aliases:** `starlight-convert`, `sdc` (short), `starvert` (memorable)

```bash
# Interactive mode (recommended) - using short alias
sdc                                  # Launch guided interface with smart detection

# Project setup
sdc setup                           # Configuration wizard for new projects

# Batch processing
sdc batch <input>                   # Convert directory with auto-detection
sdc batch --dry-run                 # Preview changes without writing files

# File watching
sdc watch <directory>               # Auto-convert on file changes

# Alternative memorable alias
starvert --help                     # Same functionality, different name
```

## Configuration

```javascript
// astro.config.mjs - Astro Integration
import starlightDocumentConverter from '@entro314labs/starlight-document-converter';

export default defineConfig({
  integrations: [
    starlight({ title: 'My Docs' }),
    starlightDocumentConverter({
      enabled: true,
      watch: true,
      inputDirs: ['docs-import', 'documents'],
      converter: {
        outputDir: 'src/content/docs',
        preserveStructure: true,
        generateTitles: true,
        generateDescriptions: true
      }
    })
  ]
});
```

## Examples

### Basic Document Conversion

```bash
# Create import directory and add documents
mkdir docs-import
cp ~/documents/*.docx docs-import/

# Convert all documents
npx @entro314labs/starlight-document-converter batch docs-import/
```

### Word Document Conversion

Input (`guide.docx`):
```
# Getting Started Guide

This guide will help you set up your development environment.

## Prerequisites
- Node.js 20+
- Git
```

Output (`guide.md`):
```yaml
---
title: "Getting Started Guide"
description: "This guide will help you set up your development environment."
category: "Guides"
tags:
  - guide
  - setup
---

# Getting Started Guide

This guide will help you set up your development environment.

## Prerequisites
- Node.js 20+
- Git
```

### Programmatic Usage

```javascript
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

## Documentation

- **[Getting Started Guide](./docs/getting-started.md)** - Complete setup instructions
- **[API Reference](./docs/api-reference.md)** - All commands and options
- **[Configuration](./docs/configuration.md)** - Advanced configuration
- **[Examples](./docs/examples.md)** - Real-world usage examples

## Contributing

<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill="#7C3AED"/>
</svg>

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

- [Report bugs](https://github.com/entro314-labs/starlight-document-converter/issues)
- [Request features](https://github.com/entro314-labs/starlight-document-converter/issues)
- [Improve documentation](./docs/)
- [Submit pull requests](https://github.com/entro314-labs/starlight-document-converter/pulls)

## Roadmap

<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z" fill="#0891B2"/>
</svg>

- [ ] **Enhanced AI Analysis** - Better content understanding and metadata generation
- [ ] **Custom Plugins** - Plugin system for extending conversion capabilities  
- [ ] **Starlight Components** - Dashboard components for in-browser conversion
- [ ] **Bulk Operations** - Advanced batch processing with parallel conversion

## Requirements

<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M20 18c1.1 0 1.99-.9 1.99-2L22 5c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2H0c0 1.1.9 2 2 2h20c1.1 0 2-.9 2-2h-4zM4 5h16v11H4V5zm8 14c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" fill="#6B7280"/>
</svg>

- **Node.js**: >= 20.0.0
- **npm**: >= 8.0.0 or **pnpm** >= 7.0.0
- **Operating System**: Windows, macOS, Linux

## License

<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="#9CA3AF"/>
<path d="M14 2v6h6" fill="none" stroke="white" stroke-width="2"/>
</svg>

MIT License - see the [LICENSE](LICENSE) file for details.

## Support

<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#059669"/>
</svg>

- **Issues**: [GitHub Issues](https://github.com/entro314-labs/starlight-document-converter/issues)
- **Discussions**: [GitHub Discussions](https://github.com/entro314-labs/starlight-document-converter/discussions)
- **Documentation**: [GitHub Repository](https://github.com/entro314-labs/starlight-document-converter)
- **Email**: Support via GitHub issues

---

<div align="center">

**Made with ❤️ for the Astro community**

[GitHub](https://github.com/entro314-labs/starlight-document-converter) • [npm](https://www.npmjs.com/package/@entro314labs/starlight-document-converter) • [Issues](https://github.com/entro314-labs/starlight-document-converter/issues) • [Discussions](https://github.com/entro314-labs/starlight-document-converter/discussions)

</div>