#!/usr/bin/env node

import { readdir, readFile, writeFile } from 'fs/promises';
import { join, extname, basename, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONTENT_DIR = join(__dirname, '../src/content/docs');

class StarlightMigrator {
  constructor() {
    this.processed = 0;
    this.migrated = 0;
    this.skipped = 0;
    this.errors = [];
    this.dryRun = process.argv.includes('--dry-run');
    this.verbose = process.argv.includes('--verbose');
  }

  async migrateDirectory(dirPath) {
    try {
      const entries = await readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);

        if (entry.isDirectory()) {
          await this.migrateDirectory(fullPath);
        } else if (this.isMarkdownFile(entry.name)) {
          await this.migrateFile(fullPath);
        }
      }
    } catch (error) {
      this.errors.push(`Error reading directory ${dirPath}: ${error.message}`);
    }
  }

  isMarkdownFile(filename) {
    const ext = extname(filename).toLowerCase();
    return ext === '.md' || ext === '.mdx';
  }

  async migrateFile(filePath) {
    try {
      this.processed++;
      const content = await readFile(filePath, 'utf-8');
      const relativePath = filePath.replace(CONTENT_DIR, '').replace(/^\//, '');

      if (this.verbose) {
        console.log(`Processing: ${relativePath}`);
      }

      // Skip if already has proper frontmatter
      if (this.hasValidFrontmatter(content)) {
        this.skipped++;
        if (this.verbose) {
          console.log(`  ✓ Already has valid frontmatter`);
        }
        return;
      }

      // Generate frontmatter
      const frontmatter = this.generateFrontmatter(content, filePath);
      const migratedContent = this.addFrontmatter(content, frontmatter);

      if (!this.dryRun) {
        await writeFile(filePath, migratedContent, 'utf-8');
      }

      this.migrated++;
      if (this.verbose) {
        console.log(`  ✓ Migrated with title: "${frontmatter.title}"`);
      }
    } catch (error) {
      this.errors.push(`Error migrating ${filePath}: ${error.message}`);
    }
  }

  hasValidFrontmatter(content) {
    if (!content.startsWith('---\n')) return false;

    const frontmatterMatch = content.match(/^---\n(.*?)\n---\n/s);
    if (!frontmatterMatch) return false;

    const frontmatterText = frontmatterMatch[1];
    return frontmatterText.includes('title:');
  }

  generateFrontmatter(content, filePath) {
    const filename = basename(filePath, extname(filePath));
    const relativePath = filePath.replace(CONTENT_DIR, '').replace(/^\//, '');
    const pathParts = relativePath.split('/');

    // Extract title from content or filename
    const title = this.extractTitle(content) || this.cleanFilename(filename);

    // Generate description from content
    const description = this.generateDescription(content, title);

    // Determine category/section from path
    const category = pathParts.length > 1 ? pathParts[0] : 'General';

    // Set up frontmatter object
    const frontmatter = {
      title,
      description,
    };

    // Add category/tags if relevant
    if (this.shouldAddCategory(category)) {
      frontmatter.category = this.cleanCategory(category);
    }

    // Add special properties for certain file types
    if (this.isTemplate(filename)) {
      frontmatter.template = 'doc';
    }

    if (this.isReference(pathParts)) {
      frontmatter.sidebar = { order: 100 };
    }

    return frontmatter;
  }

  extractTitle(content) {
    // Try to find the first heading
    const headingMatch = content.match(/^#\s+(.+)$/m);
    if (headingMatch) {
      return this.cleanTitle(headingMatch[1]);
    }

    // Try to find title in potential frontmatter
    const titleMatch = content.match(/title:\s*(.+)/i);
    if (titleMatch) {
      return this.cleanTitle(titleMatch[1]);
    }

    return null;
  }

  cleanTitle(title) {
    // Remove markdown formatting and clean up
    return title
      .replace(/[#*_`]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 60); // Limit length
  }

  cleanFilename(filename) {
    return filename
      .replace(/[-_]/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase to spaces
      .replace(/\b\w/g, (l) => l.toUpperCase()) // Title case
      .replace(/\s+/g, ' ')
      .trim();
  }

  generateDescription(content, title) {
    // Remove frontmatter if present
    const cleanContent = content.replace(/^---[\s\S]*?---\n/, '');

    // Find first paragraph or meaningful sentence
    const paragraphs = cleanContent
      .split('\n\n')
      .map((p) => p.replace(/\n/g, ' ').trim())
      .filter(
        (p) => p.length > 20 && !p.startsWith('#') && !p.startsWith('```')
      );

    if (paragraphs.length > 0) {
      let description = paragraphs[0]
        .replace(/[#*_`]/g, '') // Remove markdown
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
        .substring(0, 155); // SEO-friendly length

      // Ensure it ends properly
      if (description.length === 155) {
        const lastSpace = description.lastIndexOf(' ');
        if (lastSpace > 100) {
          description = description.substring(0, lastSpace);
        }
      }

      return description + (description.endsWith('.') ? '' : '.');
    }

    // Fallback descriptions based on filename/path
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

  shouldAddCategory(category) {
    const skipCategories = ['', '.', 'docs', 'content'];
    return !skipCategories.includes(category.toLowerCase());
  }

  cleanCategory(category) {
    return category
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase())
      .trim();
  }

  isTemplate(filename) {
    return filename.toLowerCase().includes('template');
  }

  isReference(pathParts) {
    return pathParts.some((part) =>
      ['reference', 'api', 'docs'].includes(part.toLowerCase())
    );
  }

  addFrontmatter(content, frontmatter) {
    // Build frontmatter string
    let frontmatterStr = '---\n';

    // Add title and description first
    frontmatterStr += `title: ${this.escapeYamlString(frontmatter.title)}\n`;
    frontmatterStr += `description: ${this.escapeYamlString(frontmatter.description)}\n`;

    // Add other properties
    Object.entries(frontmatter).forEach(([key, value]) => {
      if (key !== 'title' && key !== 'description') {
        if (typeof value === 'object') {
          frontmatterStr += `${key}:\n`;
          Object.entries(value).forEach(([subKey, subValue]) => {
            frontmatterStr += `  ${subKey}: ${subValue}\n`;
          });
        } else {
          frontmatterStr += `${key}: ${this.escapeYamlString(value)}\n`;
        }
      }
    });

    frontmatterStr += '---\n\n';

    // Remove any existing incomplete frontmatter
    const cleanContent = content.replace(/^---[\s\S]*?---\n+/, '');

    return frontmatterStr + cleanContent;
  }

  escapeYamlString(str) {
    if (typeof str !== 'string') return str;

    // If contains special chars, quote it
    if (
      str.includes(':') ||
      str.includes('"') ||
      str.includes("'") ||
      str.includes('\n') ||
      str.includes('#') ||
      str.startsWith('>')
    ) {
      return `"${str.replace(/"/g, '\\"')}"`;
    }

    return str;
  }

  generateReport() {
    console.log('\n📝 Starlight Migration Report');
    console.log('==============================');

    console.log(`\n📊 Statistics:`);
    console.log(`Files processed: ${this.processed}`);
    console.log(`Files migrated: ${this.migrated}`);
    console.log(`Files skipped (already valid): ${this.skipped}`);
    console.log(`Errors encountered: ${this.errors.length}`);

    if (this.dryRun) {
      console.log('\n🏃‍♂️ DRY RUN - No files were actually modified');
    }

    if (this.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.errors.forEach((error) => console.log(`  ${error}`));
    }

    const successRate =
      this.processed > 0
        ? Math.round(((this.migrated + this.skipped) / this.processed) * 100)
        : 100;
    console.log(`\nSuccess rate: ${successRate}%`);

    if (!this.dryRun && this.migrated > 0) {
      console.log('\n✅ Migration completed successfully!');
      console.log('💡 Next steps:');
      console.log('  1. Run `pnpm run validate` to check for any issues');
      console.log('  2. Run `pnpm run dev` to test the site');
      console.log('  3. Update astro.config.mjs to enable full navigation');
    }

    console.log('\n==============================\n');
  }
}

// CLI usage
async function main() {
  const migrator = new StarlightMigrator();

  console.log('🚀 Starting Starlight migration...');
  console.log(`📁 Scanning directory: ${CONTENT_DIR}`);

  if (migrator.dryRun) {
    console.log('🏃‍♂️ DRY RUN MODE - No files will be modified');
  }

  await migrator.migrateDirectory(CONTENT_DIR);
  migrator.generateReport();

  process.exit(migrator.errors.length > 0 ? 1 : 0);
}

// Show help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🌟 Starlight Migration Tool

Usage:
  node scripts/migrate-to-starlight.js [options]

Options:
  --dry-run    Preview changes without modifying files
  --verbose    Show detailed processing information
  --help       Show this help message

Examples:
  node scripts/migrate-to-starlight.js --dry-run --verbose
  node scripts/migrate-to-starlight.js
`);
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
