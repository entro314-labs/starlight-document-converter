#!/usr/bin/env node

import { readdir, readFile, writeFile } from 'fs/promises';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CONTENT_DIR = join(__dirname, '../src/content/docs');

class AdvancedYAMLFixer {
  constructor() {
    this.fixed = 0;
    this.errors = [];
  }

  async fixDirectory(dirPath) {
    try {
      const entries = await readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);

        if (entry.isDirectory()) {
          await this.fixDirectory(fullPath);
        } else if (this.isMarkdownFile(entry.name)) {
          await this.fixFile(fullPath);
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

  async fixFile(filePath) {
    try {
      const content = await readFile(filePath, 'utf-8');
      const relativePath = filePath.replace(CONTENT_DIR, '').replace(/^\//, '');

      if (!content.startsWith('---\n')) return;

      const frontmatterMatch = content.match(/^---\n(.*?)\n---\n/s);
      if (!frontmatterMatch) return;

      const frontmatterText = frontmatterMatch[1];
      const filename = relativePath
        .split('/')
        .pop()
        .replace(/\.\w+$/, '');

      // Generate a simple, clean frontmatter
      const title = this.generateTitle(frontmatterText, filename);
      const description = this.generateDescription(content, title);
      const category = this.generateCategory(relativePath);

      const newFrontmatter = [
        '---',
        `title: "${title}"`,
        `description: "${description}"`,
        category ? `category: "${category}"` : null,
        '---',
      ]
        .filter(Boolean)
        .join('\n');

      const newContent = content.replace(
        frontmatterMatch[0],
        newFrontmatter + '\n'
      );

      await writeFile(filePath, newContent, 'utf-8');
      this.fixed++;
      console.log(`Fixed: ${relativePath}`);
    } catch (error) {
      this.errors.push(`Error fixing ${filePath}: ${error.message}`);
    }
  }

  generateTitle(frontmatterText, filename) {
    // Try to extract title from existing frontmatter
    const titleMatch = frontmatterText.match(/title:\s*["']?([^"'\n]+)["']?/);
    if (titleMatch) {
      return this.cleanString(titleMatch[1]);
    }

    // Generate from filename
    return this.cleanFilename(filename);
  }

  generateDescription(content, title) {
    // Get content without frontmatter
    const cleanContent = content.replace(/^---[\s\S]*?---\n/, '');

    // Find first meaningful paragraph
    const paragraphs = cleanContent
      .split('\n\n')
      .map((p) => p.replace(/\n/g, ' ').trim())
      .filter(
        (p) =>
          p.length > 20 &&
          !p.startsWith('#') &&
          !p.startsWith('```') &&
          !p.startsWith('{')
      );

    if (paragraphs.length > 0) {
      const desc = paragraphs[0]
        .replace(/[#*_`[\]]/g, '') // Remove markdown
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 150);

      return this.cleanString(desc) + '.';
    }

    return `Documentation for ${title}.`;
  }

  generateCategory(relativePath) {
    const parts = relativePath.split('/');
    if (parts.length > 1) {
      return this.cleanString(parts[0])
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());
    }
    return null;
  }

  cleanString(str) {
    return str
      .replace(/[{}[\]"'\\]/g, '') // Remove problematic chars
      .replace(/\s+/g, ' ')
      .trim();
  }

  cleanFilename(filename) {
    return filename
      .replace(/[-_]/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, (l) => l.toUpperCase())
      .replace(/\s+/g, ' ')
      .trim();
  }

  generateReport() {
    console.log('\n🔧 Advanced YAML Fix Report');
    console.log('============================');
    console.log(`Files fixed: ${this.fixed}`);
    console.log(`Errors: ${this.errors.length}`);

    if (this.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.errors.forEach((error) => console.log(`  ${error}`));
    }

    console.log('\n✅ All YAML issues should now be resolved!');
  }
}

async function main() {
  const fixer = new AdvancedYAMLFixer();
  console.log('🔧 Performing comprehensive YAML fix...');

  await fixer.fixDirectory(CONTENT_DIR);
  fixer.generateReport();
}

main().catch((error) => {
  console.error('❌ Fix failed:', error);
  process.exit(1);
});
