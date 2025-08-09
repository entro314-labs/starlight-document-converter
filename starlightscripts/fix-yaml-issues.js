#!/usr/bin/env node

import { readdir, readFile, writeFile } from 'fs/promises';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CONTENT_DIR = join(__dirname, '../src/content/docs');

class YAMLFixer {
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
      let needsFix = false;
      let fixedFrontmatter = frontmatterText;

      // Fix description lines that contain problematic characters
      const lines = frontmatterText.split('\n');
      const fixedLines = lines.map((line) => {
        if (line.startsWith('description:')) {
          const value = line.substring(12).trim();

          // Check if it needs quoting
          if (
            (value.includes('[') && value.includes(']')) ||
            value.includes('|') ||
            value.includes(':') ||
            value.includes('#') ||
            (value.startsWith('-') && value.includes('-')) ||
            !value.startsWith('"')
          ) {
            // Extract content and clean it
            let cleanValue = value
              .replace(/^['"]|['"]$/g, '') // Remove existing quotes
              .replace(/^\s*\|\s*/, '') // Remove YAML literal block indicator
              .replace(/\s+/g, ' ') // Normalize spaces
              .trim();

            // Create a simple, clean description
            if (cleanValue.length > 160) {
              cleanValue = cleanValue.substring(0, 155) + '...';
            }

            needsFix = true;
            return `description: "${cleanValue.replace(/"/g, '\\"')}"`;
          }
        }
        return line;
      });

      if (needsFix) {
        fixedFrontmatter = fixedLines.join('\n');
        const newContent = content.replace(
          frontmatterMatch[0],
          `---\n${fixedFrontmatter}\n---\n`
        );

        await writeFile(filePath, newContent, 'utf-8');
        this.fixed++;
        console.log(`Fixed: ${relativePath}`);
      }
    } catch (error) {
      this.errors.push(`Error fixing ${filePath}: ${error.message}`);
    }
  }

  generateReport() {
    console.log('\n🔧 YAML Fix Report');
    console.log('==================');
    console.log(`Files fixed: ${this.fixed}`);
    console.log(`Errors: ${this.errors.length}`);

    if (this.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.errors.forEach((error) => console.log(`  ${error}`));
    }

    if (this.fixed > 0) {
      console.log('\n✅ YAML issues fixed! Try running the dev server again.');
    } else {
      console.log('\n✅ No YAML issues found.');
    }
  }
}

async function main() {
  const fixer = new YAMLFixer();
  console.log('🔧 Fixing YAML frontmatter issues...');

  await fixer.fixDirectory(CONTENT_DIR);
  fixer.generateReport();
}

main().catch((error) => {
  console.error('❌ Fix failed:', error);
  process.exit(1);
});
