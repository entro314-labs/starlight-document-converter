#!/usr/bin/env node

import { readdir, readFile, stat } from 'fs/promises';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONTENT_DIR = join(__dirname, '../src/content/docs');
const REQUIRED_FRONTMATTER = ['title'];
const RECOMMENDED_FRONTMATTER = ['description'];

class ContentValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.stats = {
      totalFiles: 0,
      mdFiles: 0,
      mdxFiles: 0,
      validFiles: 0,
      filesWithIssues: 0,
    };
  }

  async validateDirectory(dirPath) {
    try {
      const entries = await readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);

        if (entry.isDirectory()) {
          await this.validateDirectory(fullPath);
        } else if (this.isMarkdownFile(entry.name)) {
          await this.validateFile(fullPath);
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

  async validateFile(filePath) {
    try {
      this.stats.totalFiles++;
      const ext = extname(filePath).toLowerCase();

      if (ext === '.md') this.stats.mdFiles++;
      if (ext === '.mdx') this.stats.mdxFiles++;

      const content = await readFile(filePath, 'utf-8');
      const relativePath = filePath.replace(CONTENT_DIR, '').replace(/^\//, '');

      let hasIssues = false;

      // Check for frontmatter
      if (!this.hasFrontmatter(content)) {
        this.errors.push(`${relativePath}: Missing frontmatter`);
        hasIssues = true;
      } else {
        const frontmatter = this.parseFrontmatter(content);

        // Validate required frontmatter fields
        for (const field of REQUIRED_FRONTMATTER) {
          if (!frontmatter[field]) {
            this.errors.push(
              `${relativePath}: Missing required frontmatter field: ${field}`
            );
            hasIssues = true;
          }
        }

        // Check recommended frontmatter fields
        for (const field of RECOMMENDED_FRONTMATTER) {
          if (!frontmatter[field]) {
            this.warnings.push(
              `${relativePath}: Missing recommended frontmatter field: ${field}`
            );
            hasIssues = true;
          }
        }

        // Validate title length
        if (frontmatter.title && frontmatter.title.length > 60) {
          this.warnings.push(
            `${relativePath}: Title is too long (${frontmatter.title.length} chars, max 60)`
          );
          hasIssues = true;
        }

        // Validate description length
        if (frontmatter.description && frontmatter.description.length > 160) {
          this.warnings.push(
            `${relativePath}: Description is too long (${frontmatter.description.length} chars, max 160)`
          );
          hasIssues = true;
        }
      }

      // Check content structure
      const contentBody = this.getContentBody(content);

      // Check for empty content
      if (contentBody.trim().length === 0) {
        this.warnings.push(`${relativePath}: File appears to be empty`);
        hasIssues = true;
      }

      // Check for broken internal links
      const internalLinks = this.findInternalLinks(contentBody);
      for (const link of internalLinks) {
        if (!(await this.linkExists(link))) {
          this.warnings.push(
            `${relativePath}: Potentially broken internal link: ${link}`
          );
          hasIssues = true;
        }
      }

      // Check for heading structure
      if (!this.hasProperHeadingStructure(contentBody)) {
        this.warnings.push(
          `${relativePath}: Heading structure may be inconsistent`
        );
        hasIssues = true;
      }

      if (hasIssues) {
        this.stats.filesWithIssues++;
      } else {
        this.stats.validFiles++;
      }
    } catch (error) {
      this.errors.push(`Error validating ${filePath}: ${error.message}`);
      this.stats.filesWithIssues++;
    }
  }

  hasFrontmatter(content) {
    return content.startsWith('---\n') && content.includes('\n---\n');
  }

  parseFrontmatter(content) {
    const frontmatterMatch = content.match(/^---\n(.*?)\n---\n/s);
    if (!frontmatterMatch) return {};

    const frontmatterText = frontmatterMatch[1];
    const frontmatter = {};

    frontmatterText.split('\n').forEach((line) => {
      const match = line.match(/^([^:]+):\s*(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^['"]|['"]$/g, '');
        frontmatter[key] = value;
      }
    });

    return frontmatter;
  }

  getContentBody(content) {
    if (this.hasFrontmatter(content)) {
      return content.replace(/^---\n.*?\n---\n/s, '');
    }
    return content;
  }

  findInternalLinks(content) {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const internalLinks = [];
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      const url = match[2];
      // Check if it's an internal link (starts with / or relative path, not http/https)
      if (
        !url.startsWith('http') &&
        !url.startsWith('mailto:') &&
        !url.startsWith('#')
      ) {
        internalLinks.push(url);
      }
    }

    return internalLinks;
  }

  async linkExists(link) {
    try {
      // Basic check - assumes links point to files in the docs directory
      const cleanLink = link.replace(/^\//, '').replace(/#.*$/, '');
      if (!cleanLink) return true; // Empty link is probably an anchor

      const possiblePaths = [
        join(CONTENT_DIR, cleanLink),
        join(CONTENT_DIR, cleanLink + '.md'),
        join(CONTENT_DIR, cleanLink + '.mdx'),
        join(CONTENT_DIR, cleanLink, 'index.md'),
        join(CONTENT_DIR, cleanLink, 'index.mdx'),
      ];

      for (const path of possiblePaths) {
        try {
          await stat(path);
          return true;
        } catch {
          continue;
        }
      }
      return false;
    } catch {
      return true; // If we can't check, assume it's valid
    }
  }

  hasProperHeadingStructure(content) {
    const headings = content.match(/^#{1,6}\s+.+$/gm) || [];
    if (headings.length === 0) return true; // No headings is fine

    let previousLevel = 0;
    for (const heading of headings) {
      const level = heading.match(/^(#+)/)[1].length;
      if (level > previousLevel + 1) {
        return false; // Skipped a level
      }
      previousLevel = level;
    }
    return true;
  }

  generateReport() {
    console.log('\n🔍 Content Validation Report');
    console.log('================================');

    // Statistics
    console.log('\n📊 Statistics:');
    console.log(`Total files processed: ${this.stats.totalFiles}`);
    console.log(`Markdown files (.md): ${this.stats.mdFiles}`);
    console.log(`MDX files (.mdx): ${this.stats.mdxFiles}`);
    console.log(`Valid files: ${this.stats.validFiles}`);
    console.log(`Files with issues: ${this.stats.filesWithIssues}`);

    // Success rate
    const successRate =
      this.stats.totalFiles > 0
        ? Math.round((this.stats.validFiles / this.stats.totalFiles) * 100)
        : 100;
    console.log(`Success rate: ${successRate}%`);

    // Errors
    if (this.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.errors.forEach((error) => console.log(`  ${error}`));
    }

    // Warnings
    if (this.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      this.warnings.forEach((warning) => console.log(`  ${warning}`));
    }

    // Summary
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('\n✅ All content files are valid!');
    } else {
      console.log(
        `\n📋 Summary: ${this.errors.length} errors, ${this.warnings.length} warnings`
      );
    }

    console.log('\n================================\n');

    // Return exit code
    return this.errors.length > 0 ? 1 : 0;
  }
}

// Run validation
async function main() {
  const validator = new ContentValidator();

  console.log('🚀 Starting content validation...');
  console.log(`Scanning directory: ${CONTENT_DIR}`);

  await validator.validateDirectory(CONTENT_DIR);
  const exitCode = validator.generateReport();

  process.exit(exitCode);
}

main().catch((error) => {
  console.error('❌ Validation failed:', error);
  process.exit(1);
});
