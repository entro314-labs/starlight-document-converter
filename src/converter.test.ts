import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DocumentConverter } from './converter.js';

describe('DocumentConverter', () => {
  let converter: DocumentConverter;
  let testDir: string;
  let inputDir: string;
  let outputDir: string;

  beforeEach(async () => {
    // Create temporary directories for testing
    testDir = join(tmpdir(), `converter-test-${Date.now()}`);
    inputDir = join(testDir, 'input');
    outputDir = join(testDir, 'output');

    await mkdir(inputDir, { recursive: true });
    await mkdir(outputDir, { recursive: true });

    converter = new DocumentConverter({
      outputDir,
      verbose: false,
      dryRun: false,
    });
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Text File Conversion', () => {
    it('should convert plain text to markdown with frontmatter', async () => {
      const testContent = `Getting Started Guide

This is a simple guide for beginners.

Installation:
    npm install package-name
    npm start

Features:
- Easy to use
- Well documented
- Fast performance`;

      const inputFile = join(inputDir, 'guide.txt');
      await writeFile(inputFile, testContent);

      const result = await converter.convertFile(inputFile);

      expect(result.success).toBe(true);
      expect(result.inputPath).toBe(inputFile);

      const outputContent = await readFile(result.outputPath, 'utf-8');

      // Check frontmatter
      expect(outputContent).toMatch(/^---\n/);
      expect(outputContent).toContain('title: "Getting Started Guide"');
      expect(outputContent).toContain('This is a simple guide for beginners.');

      // Check content conversion
      expect(outputContent).toContain('## Installation');
      expect(outputContent).toContain('```\nnpm install package-name');
      expect(outputContent).toContain('- Easy to use');
    });

    it('should handle code blocks correctly', async () => {
      const testContent = `Code Example

Here's how to use the API:

    const api = new API();
    api.connect();
    
    function example() {
        return "Hello World";
    }

End of example.`;

      const inputFile = join(inputDir, 'code.txt');
      await writeFile(inputFile, testContent);

      const result = await converter.convertFile(inputFile);
      const outputContent = await readFile(result.outputPath, 'utf-8');

      expect(outputContent).toContain('```\nconst api = new API();');
      expect(outputContent).toContain('function example()');
      expect(outputContent).toContain('```');
      expect(outputContent).toContain('End of example.');
    });
  });

  describe('HTML Conversion', () => {
    it('should convert HTML to clean markdown', async () => {
      const testContent = `<!DOCTYPE html>
<html>
<head>
    <title>API Documentation</title>
</head>
<body>
    <h1>User API</h1>
    <p>This API manages user accounts and <strong>authentication</strong>.</p>
    
    <h2>Endpoints</h2>
    <ul>
        <li><code>GET /users</code> - List users</li>
        <li><code>POST /users</code> - Create user</li>
    </ul>
    
    <p>For more info, visit <a href="https://example.com">our docs</a>.</p>
</body>
</html>`;

      const inputFile = join(inputDir, 'api.html');
      await writeFile(inputFile, testContent);

      const result = await converter.convertFile(inputFile);
      const outputContent = await readFile(result.outputPath, 'utf-8');

      expect(outputContent).toContain('title: "API Documentation"');
      expect(outputContent).toContain('# User API');
      expect(outputContent).toContain('**authentication**');
      expect(outputContent).toContain('## Endpoints');
      expect(outputContent).toContain('`GET /users` - List users');
      expect(outputContent).toContain('[our docs](https://example.com)');
    });
  });

  describe('Frontmatter Generation', () => {
    it('should generate appropriate categories', async () => {
      const testContent = 'API Reference Guide\n\nComplete API documentation.';
      const inputFile = join(inputDir, 'api', 'reference.txt');

      await mkdir(join(inputDir, 'api'), { recursive: true });
      await writeFile(inputFile, testContent);

      const result = await converter.convertFile(inputFile);
      const outputContent = await readFile(result.outputPath, 'utf-8');

      expect(outputContent).toContain('category: "Reference"');
    });

    it('should extract tags from content', async () => {
      const testContent = `JavaScript API Guide

Learn how to use our JavaScript API with Node.js and React.

This guide covers:
- Authentication setup
- Database queries
- Performance optimization`;

      const inputFile = join(inputDir, 'js-guide.txt');
      await writeFile(inputFile, testContent);

      const result = await converter.convertFile(inputFile);
      const outputContent = await readFile(result.outputPath, 'utf-8');

      expect(outputContent).toContain('tags:');
      expect(outputContent).toMatch(/- javascript|react|api|database|performance/);
    });

    it('should handle existing markdown files', async () => {
      const testContent = `# Existing Guide

This file already has content but no frontmatter.

## Section 1
Some content here.`;

      const inputFile = join(inputDir, 'existing.md');
      await writeFile(inputFile, testContent);

      const result = await converter.convertFile(inputFile);
      const outputContent = await readFile(result.outputPath, 'utf-8');

      expect(outputContent).toMatch(/^---\n/);
      expect(outputContent).toContain('title: "Existing Guide"');
      expect(outputContent).toContain('# Existing Guide');
    });
  });

  describe('File Processing Options', () => {
    it('should respect dryRun option', async () => {
      const dryConverter = new DocumentConverter({
        outputDir,
        dryRun: true,
      });

      const testContent = 'Test content';
      const inputFile = join(inputDir, 'test.txt');
      await writeFile(inputFile, testContent);

      const result = await dryConverter.convertFile(inputFile);

      expect(result.success).toBe(true);

      // File should not actually exist in dry run
      try {
        await readFile(result.outputPath, 'utf-8');
        expect.fail('File should not exist in dry run mode');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle custom category patterns', async () => {
      const customConverter = new DocumentConverter({
        outputDir,
        categoryPatterns: {
          custom: 'Custom Category',
        },
      });

      const testContent = 'Custom guide content';
      const inputFile = join(inputDir, 'custom', 'guide.txt');

      await mkdir(join(inputDir, 'custom'), { recursive: true });
      await writeFile(inputFile, testContent);

      const result = await customConverter.convertFile(inputFile);
      const outputContent = await readFile(result.outputPath, 'utf-8');

      expect(outputContent).toContain('category: "Custom Category"');
    });
  });

  describe('Error Handling', () => {
    it('should handle unsupported file formats gracefully', async () => {
      const inputFile = join(inputDir, 'binary.bin');
      await writeFile(inputFile, Buffer.from([0x00, 0x01, 0x02, 0x03]));

      const result = await converter.convertFile(inputFile);

      expect(result.success).toBe(false);
      expect(result.skipped).toBe(true);
      expect(result.errorMessage).toContain('Skipped');
    });

    it('should handle non-existent files', async () => {
      const inputFile = join(inputDir, 'non-existent.txt');

      const result = await converter.convertFile(inputFile);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Statistics Tracking', () => {
    it('should track conversion statistics', async () => {
      const files = [
        { name: 'doc1.txt', content: 'Document 1' },
        { name: 'doc2.html', content: '<h1>Document 2</h1>' },
        { name: 'doc3.md', content: '# Document 3' },
      ];

      for (const file of files) {
        await writeFile(join(inputDir, file.name), file.content);
        await converter.convertFile(join(inputDir, file.name));
      }

      const stats = converter.getStats();

      expect(stats.processed).toBe(3);
      expect(stats.errors).toBe(0);
      expect(stats.formats.get('.txt')).toBe(1);
      expect(stats.formats.get('.html')).toBe(1);
      expect(stats.formats.get('.md')).toBe(1);
    });
  });
});
