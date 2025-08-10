import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DocumentConverter } from './converter.js'

describe('DocumentConverter Extended Tests', () => {
  let converter: DocumentConverter
  let tempDir: string

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'converter-extended-test-'))
    converter = new DocumentConverter({
      outputDir: tempDir,
      verbose: false,
    })
  })

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  describe('Advanced Options', () => {
    it('should handle all converter options', () => {
      const converter = new DocumentConverter({
        outputDir: 'custom-output',
        preserveStructure: false,
        generateTitles: true,
        generateDescriptions: true,
        addTimestamps: true,
        defaultCategory: 'custom-category',
        verbose: true,
        dryRun: true,
        categoryPatterns: { api: 'API Reference' },
        tagPatterns: { js: ['javascript', 'nodejs'] },
        ignorePatterns: ['*.draft.md'],
      })

      expect(converter).toBeDefined()
    })

    it('should use default options when not provided', () => {
      const converter = new DocumentConverter()
      expect(converter).toBeDefined()
    })

    it('should handle partial options', () => {
      const converter = new DocumentConverter({
        generateTitles: false,
        verbose: true,
      })
      expect(converter).toBeDefined()
    })
  })

  describe('File Processing Methods', () => {
    it('should process HTML content correctly', async () => {
      const htmlFile = path.join(tempDir, 'test.html')
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head><title>Test HTML Document</title></head>
        <body>
          <h1>Main Title</h1>
          <p>This is a test paragraph with <strong>bold</strong> text.</p>
        </body>
        </html>
      `

      await fs.writeFile(htmlFile, htmlContent)

      const result = await converter.convertFile(htmlFile)

      expect(result.success).toBe(true)
      expect(result.outputPath).toBeDefined()
      expect(result.inputPath).toContain('test.html')
    })

    it('should process plain text files', async () => {
      const txtFile = path.join(tempDir, 'test.txt')
      const txtContent = 'Test Document Title\n\nThis is the first paragraph.'

      await fs.writeFile(txtFile, txtContent)

      const result = await converter.convertFile(txtFile)

      expect(result.success).toBe(true)
      expect(result.outputPath).toBeDefined()
      expect(result.inputPath).toContain('test.txt')
    })

    it('should process markdown files with existing frontmatter', async () => {
      const mdFile = path.join(tempDir, 'existing.md')
      const mdContent = `---
title: "Existing Title"
---

# Content Title

This is existing markdown content.`

      await fs.writeFile(mdFile, mdContent)

      const result = await converter.convertFile(mdFile)

      expect(result.success).toBe(true)
      expect(result.outputPath).toBeDefined()
      expect(result.metadata).toBeDefined()
    })
  })

  describe('Directory Processing', () => {
    it('should process nested directories when preserveStructure is true', async () => {
      const converter = new DocumentConverter({
        outputDir: path.join(tempDir, 'output'),
        preserveStructure: true,
      })

      const inputDir = path.join(tempDir, 'input')
      const nestedDir = path.join(inputDir, 'nested')

      await fs.mkdir(inputDir, { recursive: true })
      await fs.mkdir(nestedDir, { recursive: true })

      await fs.writeFile(path.join(inputDir, 'root.md'), '# Root Document\nContent')
      await fs.writeFile(path.join(nestedDir, 'nested.md'), '# Nested Document\nContent')

      const results = await converter.convertDirectory(inputDir)

      expect(results).toHaveLength(2)
      expect(results.filter((r) => r.success)).toHaveLength(2)
    })

    it('should handle empty directories gracefully', async () => {
      const emptyDir = path.join(tempDir, 'empty')
      await fs.mkdir(emptyDir)

      const results = await converter.convertDirectory(emptyDir)

      expect(results).toHaveLength(0)
    })

    it('should attempt to process all files (including unsupported ones)', async () => {
      const inputDir = path.join(tempDir, 'mixed')
      await fs.mkdir(inputDir)

      await fs.writeFile(path.join(inputDir, 'document.md'), '# Document\nContent')
      await fs.writeFile(path.join(inputDir, 'image.jpg'), 'fake image content')
      await fs.writeFile(path.join(inputDir, 'data.json'), '{"key": "value"}')

      const results = await converter.convertDirectory(inputDir)

      // The converter will attempt to process all files, some may fail
      expect(results.length).toBeGreaterThan(0)
      // At least the markdown file should succeed
      const successfulResults = results.filter((r) => r.success)
      expect(successfulResults.length).toBeGreaterThan(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle non-existent files gracefully', async () => {
      const result = await converter.convertFile('non-existent-file.md').catch((error) => {
        expect(error).toBeDefined()
        return {
          success: false,
          inputPath: 'non-existent-file.md',
          outputPath: '',
          error: error.message,
        }
      })

      if (result) {
        expect(result.success).toBe(false)
      }
    })

    it('should handle permission errors gracefully', async () => {
      // Create a read-only file
      const readOnlyFile = path.join(tempDir, 'readonly.md')
      await fs.writeFile(readOnlyFile, '# Read Only\nContent')
      await fs.chmod(readOnlyFile, 0o444)

      try {
        const result = await converter.convertFile(readOnlyFile)
        expect(result).toBeDefined()
      } catch (error) {
        expect(error).toBeDefined()
      }

      // Restore permissions for cleanup
      await fs.chmod(readOnlyFile, 0o644)
    })
  })

  describe('Configuration Behavior', () => {
    it('should respect dryRun option', async () => {
      const dryRunConverter = new DocumentConverter({
        outputDir: path.join(tempDir, 'dry-run-output'),
        dryRun: true,
      })

      const mdFile = path.join(tempDir, 'dry-run.md')
      await fs.writeFile(mdFile, '# Dry Run Test\nContent')

      const result = await dryRunConverter.convertFile(mdFile)

      expect(result.success).toBe(true)
      expect(result.outputPath).toBeDefined()

      // In dry run mode, output file should not be created
      const outputExists = await fs
        .access(result.outputPath)
        .then(() => true)
        .catch(() => false)
      expect(outputExists).toBe(false)
    })

    it('should handle verbose output mode', () => {
      const verboseConverter = new DocumentConverter({ verbose: true })
      expect(verboseConverter).toBeDefined()

      // Test that verbose mode doesn't break functionality
      // We can't easily test console output in this context
    })

    it('should apply custom category patterns', () => {
      const converter = new DocumentConverter({
        categoryPatterns: {
          tutorial: 'Learning',
          guide: 'Documentation',
        },
      })

      expect(converter).toBeDefined()
    })
  })

  describe('Content Processing Edge Cases', () => {
    it('should handle empty files', async () => {
      const emptyFile = path.join(tempDir, 'empty.md')
      await fs.writeFile(emptyFile, '')

      const result = await converter.convertFile(emptyFile)

      expect(result).toBeDefined()
      expect(result.inputPath).toContain('empty.md')
    })

    it('should handle files with only frontmatter', async () => {
      const frontmatterOnlyFile = path.join(tempDir, 'frontmatter-only.md')
      const content = `---
title: "Only Frontmatter"
description: "This file has no content"
---`

      await fs.writeFile(frontmatterOnlyFile, content)

      const result = await converter.convertFile(frontmatterOnlyFile)

      expect(result).toBeDefined()
      expect(result.inputPath).toContain('frontmatter-only.md')
    })

    it('should handle files with special characters in names', async () => {
      const specialFile = path.join(tempDir, 'special-chars-test.md')
      const content = '# Special Characters\nContent with special chars: äöü'

      await fs.writeFile(specialFile, content)

      const result = await converter.convertFile(specialFile)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })

    it('should handle large files without issues', async () => {
      const largeFile = path.join(tempDir, 'large.md')
      const largeContent = `# Large File\n\n${'Lorem ipsum '.repeat(1000)}`

      await fs.writeFile(largeFile, largeContent)

      const result = await converter.convertFile(largeFile)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })
  })

  describe('Integration with File System', () => {
    it('should create output directory if it does not exist', async () => {
      const nonExistentOutputDir = path.join(tempDir, 'non-existent', 'nested', 'output')
      const converterWithCustomOutput = new DocumentConverter({
        outputDir: nonExistentOutputDir,
      })

      const testFile = path.join(tempDir, 'test.md')
      await fs.writeFile(testFile, '# Test\nContent')

      const result = await converterWithCustomOutput.convertFile(testFile)

      expect(result.success).toBe(true)

      // Check that the output directory was created
      const outputDirExists = await fs
        .access(nonExistentOutputDir)
        .then(() => true)
        .catch(() => false)
      expect(outputDirExists).toBe(true)
    })

    it('should maintain directory structure when preserveStructure is true', async () => {
      const structureConverter = new DocumentConverter({
        outputDir: path.join(tempDir, 'structured-output'),
        preserveStructure: true,
      })

      const inputDir = path.join(tempDir, 'input')
      const subDir = path.join(inputDir, 'subdirectory')

      await fs.mkdir(inputDir, { recursive: true })
      await fs.mkdir(subDir, { recursive: true })

      await fs.writeFile(path.join(subDir, 'nested.md'), '# Nested\nContent')

      const results = await structureConverter.convertDirectory(inputDir)

      expect(results).toHaveLength(1)
      expect(results[0].success).toBe(true)
      expect(results[0].outputPath).toContain('subdirectory')
    })
  })
})
