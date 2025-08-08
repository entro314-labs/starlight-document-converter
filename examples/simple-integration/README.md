# Simple Integration (Recommended)

This is the easiest way to add document conversion to your Starlight project.

## ✨ Zero Configuration Setup

The converter now automatically detects your Starlight configuration:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightDocumentConverter from '@entro314labs/starlight-document-converter';

export default defineConfig({
  integrations: [
    starlight({
      title: 'My Documentation',
      // ... your Starlight config
    }),
    
    // 🎉 That's it! No configuration needed
    starlightDocumentConverter()
  ],
});
```

## How It Works

### 1. **Automatic Detection**

The converter automatically detects:
- ✅ Your Starlight content directory (`src/content/docs` by default)
- ✅ Your project structure and configuration
- ✅ Existing document import directories

### 2. **Smart Directory Usage**

**Option A: Use existing content directory**
```bash
# Just drop documents directly into your content folder
your-project/
├── src/content/docs/
│   ├── existing-page.md
│   ├── new-document.docx     # 👈 Add documents here
│   └── api-guide.html        # 👈 Or here
```

**Option B: Use separate import directory** (if you prefer)
```bash
# The converter will detect and use these automatically
your-project/
├── docs-import/              # 👈 Create this directory
│   ├── user-guide.docx
│   └── api-docs.html
├── src/content/docs/         # 👈 Converted files appear here
│   ├── user-guide.md
│   └── api-docs.md
```

### 3. **File Watching (Optional)**

Enable automatic conversion during development:

```js
starlightDocumentConverter({
  watch: true  // Converts files automatically when you add them
})
```

## Usage Examples

### CLI Usage (Also Auto-Detects)

```bash
# Interactive mode - detects your project automatically
npx starlight-convert

# Batch convert - uses your content directory automatically  
npx starlight-convert documents/

# Watch mode - monitors for changes
npx starlight-convert watch documents/
```

### What Gets Converted

When you add a Word document like `user-guide.docx`, it becomes:

```yaml
---
title: "User Guide"
description: "Complete guide for using our platform effectively."
category: "Guides"
tags:
  - guide
  - getting-started
---

# User Guide

Complete guide for using our platform effectively.

## Getting Started
...
```

### Supported Formats

- **Word Documents**: `.docx`, `.doc`
- **HTML Files**: `.html`, `.htm` 
- **Text Files**: `.txt`
- **Markdown Files**: `.md` (adds missing frontmatter)
- **Rich Text**: `.rtf`

## Advanced Options (Optional)

Only configure these if you need custom behavior:

```js
starlightDocumentConverter({
  // Custom input directories (optional)
  inputDirs: ['docs-import', 'team-docs'],
  
  // Custom output directory (optional - auto-detected by default)  
  converter: {
    outputDir: 'src/content/docs',
    
    // Conversion options
    generateTitles: true,
    generateDescriptions: true,
    addTimestamps: true,
    
    // Custom categorization
    categoryPatterns: {
      'tutorial': 'Tutorials',
      'guide': 'User Guides', 
      'api': 'API Reference'
    }
  }
})
```

## Development Workflow

1. **Start development**:
   ```bash
   npm run dev
   ```

2. **Add documents** to your project:
   - Drop into `docs-import/` (if it exists)
   - Or directly into `src/content/docs/`

3. **Files convert automatically** (if `watch: true`)

4. **View in browser** - new pages appear in your Starlight site

## Migration from Other Systems

### From Legacy Documentation

```bash
# 1. Export your old docs as HTML or Word files
# 2. Drop them into docs-import/
# 3. Run conversion
npx starlight-convert docs-import/

# Result: All docs now in Starlight format!
```

### From Confluence/Notion

```bash  
# 1. Export spaces as HTML
# 2. Convert to Starlight
npx starlight-convert confluence-export/ --verbose

# The converter handles HTML → Markdown conversion automatically
```

This simple approach removes the complexity of managing separate import directories unless you specifically want them!