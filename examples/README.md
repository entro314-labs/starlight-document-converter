# Starlight Document Converter Examples

This directory contains example configurations and usage patterns for the Starlight Document Converter.

## Quick Start Example

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create input directories:**
   ```bash
   mkdir docs-import team-docs external-content
   ```

3. **Add some test documents:**
   ```bash
   # Create a simple text file
   echo "# Welcome Guide

   This is a sample document that will be converted to Starlight markdown.

   ## Getting Started
   Follow these steps to begin." > docs-import/welcome.txt

   # Create an HTML file
   echo "<!DOCTYPE html>
   <html>
   <head><title>API Documentation</title></head>
   <body>
     <h1>User API</h1>
     <p>REST API for managing users</p>
     <h2>Endpoints</h2>
     <ul>
       <li><code>GET /users</code> - List all users</li>
       <li><code>POST /users</code> - Create new user</li>
     </ul>
   </body>
   </html>" > docs-import/api-docs.html
   ```

4. **Start development with auto-conversion:**
   ```bash
   npm run dev
   ```

5. **Or convert manually:**
   ```bash
   # Preview conversion
   npm run convert:dry
   
   # Convert files
   npm run convert
   
   # Watch for changes
   npm run convert:watch
   ```

## File Structure

```
example-project/
├── docs-import/          # Drop documents here
│   ├── guides/
│   │   ├── setup.docx    # Word document
│   │   └── advanced.txt  # Text file
│   ├── api/
│   │   └── reference.html # HTML file
│   └── welcome.md        # Markdown file
├── src/content/docs/     # Converted output
│   ├── guides/
│   │   ├── setup.md      # Generated from setup.docx
│   │   └── advanced.md   # Generated from advanced.txt
│   ├── api/
│   │   └── reference.md  # Generated from reference.html  
│   └── welcome.md        # Processed welcome.md
└── astro.config.mjs      # Astro configuration
```

## Configuration Examples

### Basic Setup
```js
import starlightDocumentConverter from 'starlight-document-converter';

export default defineConfig({
  integrations: [
    starlight({ title: 'My Docs' }),
    starlightDocumentConverter()
  ]
});
```

### Advanced Setup
```js
starlightDocumentConverter({
  watch: true,
  inputDirs: ['docs-import', 'content-drafts'],
  converter: {
    outputDir: 'src/content/docs',
    generateTitles: true,
    generateDescriptions: true,
    categoryPatterns: {
      'tutorial': 'Tutorials',
      'guide': 'Guides',
      'api': 'API Reference'
    }
  }
})
```

### CLI Usage Examples
```bash
# Convert single file
starlight-convert document.docx

# Convert with custom output
starlight-convert docs/ --output content/docs/

# Preview changes
starlight-convert docs/ --dry-run --verbose

# Custom category
starlight-convert tutorials/ --category "Tutorials"

# Watch directory
starlight-convert watch docs-import/
```

## Document Examples

### Word Document (`guide.docx`)
When you place a Word document in `docs-import/`, it gets converted to:

```markdown
---
title: "User Setup Guide"
description: "Complete guide for setting up user accounts and permissions."
category: "Guides"
tags:
  - guide
  - setup
---

# User Setup Guide

Complete guide for setting up user accounts and permissions.

## Prerequisites
- Admin access
- Email configuration

## Steps
1. Access admin panel
2. Navigate to user management
3. Create new user account
```

### HTML Document (`api.html`)
```html
<!DOCTYPE html>
<html>
<head><title>Payment API</title></head>
<body>
  <h1>Payment Processing API</h1>
  <p>Secure payment processing endpoints</p>
  
  <h2>Authentication</h2>
  <p>All requests require API key header</p>
  
  <h2>Endpoints</h2>
  <ul>
    <li><strong>POST /payments</strong> - Process payment</li>
    <li><strong>GET /payments/:id</strong> - Get payment status</li>
  </ul>
</body>
</html>
```

Converts to:
```markdown
---
title: "Payment API"
description: "Secure payment processing endpoints."
category: "Reference"
tags:
  - api
  - reference
---

# Payment Processing API

Secure payment processing endpoints

## Authentication

All requests require API key header

## Endpoints

- **POST /payments** - Process payment
- **GET /payments/:id** - Get payment status
```

### Text File (`setup.txt`)
```txt
Development Environment Setup

Setting up your local development environment for the project.

Requirements:
- Node.js 18 or higher
- Git installed
- Code editor (VS Code recommended)

Installation Steps:
    git clone https://github.com/project/repo.git
    cd repo
    npm install
    npm run dev

Configuration:
Create a .env file with the following variables:
- DATABASE_URL
- API_KEY
- DEBUG_MODE

Testing:
Run the test suite to verify everything works:
    npm test
    npm run test:integration
```

Converts to:
```markdown
---
title: "Development Environment Setup"
description: "Setting up your local development environment for the project."
category: "Guides"
tags:
  - guide
  - setup
---

# Development Environment Setup

Setting up your local development environment for the project.

## Requirements
- Node.js 18 or higher
- Git installed
- Code editor (VS Code recommended)

## Installation Steps

```
git clone https://github.com/project/repo.git
cd repo
npm install
npm run dev
```

## Configuration
Create a .env file with the following variables:
- DATABASE_URL
- API_KEY
- DEBUG_MODE

## Testing
Run the test suite to verify everything works:

```
npm test
npm run test:integration
```
```

## Tips

1. **File Organization**: Organize your `docs-import/` directory to match your desired output structure
2. **Naming Convention**: Use descriptive filenames as they'll become document titles
3. **Content Structure**: Start documents with clear headings for better title extraction
4. **Batch Processing**: Use directories to process multiple documents at once
5. **Preview First**: Always use `--dry-run` to preview changes before converting