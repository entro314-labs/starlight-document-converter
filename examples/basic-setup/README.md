# Basic Setup Example

This example shows the simplest way to set up Starlight Document Converter.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create sample documents:**
   ```bash
   npm run create-samples
   ```

3. **Convert documents:**
   ```bash
   npm run convert
   ```

4. **Start Astro development:**
   ```bash
   npm run dev
   ```

## What This Example Includes

- Simple Astro + Starlight configuration
- Document converter integration with default settings
- Sample documents in multiple formats
- Pre-configured scripts for easy testing

## Directory Structure

```
basic-setup/
├── docs-import/           # Source documents
│   ├── welcome.md
│   ├── guide.txt
│   └── api-reference.html
├── src/content/docs/      # Generated Starlight content
├── astro.config.mjs       # Configuration
└── package.json          # Scripts and dependencies
```

## Configuration

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightDocumentConverter from 'starlight-document-converter';

export default defineConfig({
  integrations: [
    starlight({
      title: 'Documentation',
    }),
    starlightDocumentConverter()
  ],
});
```

## Try It

1. Add documents to `docs-import/`
2. Run `npm run convert`
3. Check the generated files in `src/content/docs/`