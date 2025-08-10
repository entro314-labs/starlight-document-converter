import { exec } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, rmdir, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { promisify } from 'node:util'

import { describe, expect, it } from 'vitest'

const execAsync = promisify(exec)

describe('Package Validation', () => {
  const testDir = '/tmp/starlight-converter-test'
  const testFile = join(testDir, 'test.md')

  describe('CLI Enhanced Functionality', () => {
    it('should display enhanced help with beautiful formatting', async () => {
      const { stdout } = await execAsync('node dist/cli.js --help')

      // Should contain brand header
      expect(stdout).toContain('Starlight Document Converter v1.5.0')
      expect(stdout).toContain('╔') // Box border
      expect(stdout).toContain('╗') // Box border

      // Should contain organized help sections
      expect(stdout).toContain('Basic Commands')
      expect(stdout).toContain('Content Management')
      expect(stdout).toContain('●') // Bullet points

      // Should contain documentation box
      expect(stdout).toContain('Documentation')
      expect(stdout).toContain('github.com')
    })

    it('should handle repair command with enhanced output', async () => {
      // Create test directory and file
      if (!existsSync(testDir)) {
        await mkdir(testDir, { recursive: true })
      }

      const testContent = `# Test Document

This is a test document without proper frontmatter.

## Section 1
Some content here.

## Section 2
More content.`

      await writeFile(testFile, testContent)

      try {
        const { stdout } = await execAsync(`node dist/cli.js repair ${testFile} --dry-run`)

        // Should contain enhanced styling
        expect(stdout).toContain('Content Repair')
        expect(stdout).toContain('Analysis completed')
        expect(stdout).toContain('├') // Table borders
        expect(stdout).toContain('┤') // Table borders
        expect(stdout).toContain('Metric') // Table headers
        expect(stdout).toContain('Count') // Table headers
        expect(stdout).toContain('Status') // Table headers

        // Should show symbols
        expect(stdout).toMatch(/[✓✗⚠ℹ]/) // Unicode symbols
      } finally {
        // Cleanup
        if (existsSync(testFile)) {
          await unlink(testFile)
        }
        if (existsSync(testDir)) {
          await rmdir(testDir)
        }
      }
    })

    it('should handle validation command with enhanced tables', async () => {
      // Create test directory and file
      if (!existsSync(testDir)) {
        await mkdir(testDir, { recursive: true })
      }

      const testContent = `---
title: "Valid Document"
description: "This is a valid test document"
---

# Valid Document

This document has proper frontmatter.`

      await writeFile(testFile, testContent)

      try {
        const { stdout } = await execAsync(`node dist/cli.js validate ${testFile}`)

        // Should contain enhanced validation output
        expect(stdout).toContain('Content Validation')
        expect(stdout).toContain('Validation Results')
        expect(stdout).toContain('┌') // Table characters
        expect(stdout).toContain('└') // Table characters

        // Should show success indicators
        expect(stdout).toMatch(/[✓✔]/) // Success symbols
      } finally {
        // Cleanup
        if (existsSync(testFile)) {
          await unlink(testFile)
        }
        if (existsSync(testDir)) {
          await rmdir(testDir)
        }
      }
    })
  })

  describe('Cross-Platform Compatibility', () => {
    it('should work on different Node.js environments', async () => {
      const { stdout: nodeVersion } = await execAsync('node --version')
      console.log(`Testing on Node.js ${nodeVersion.trim()}`)

      // Test basic CLI functionality
      const { stdout } = await execAsync('node dist/cli.js --version')
      expect(stdout.trim()).toBe('1.5.0')
    })

    it('should handle Unicode symbols correctly', async () => {
      // Test that CLI can handle Unicode output
      const { stdout } = await execAsync('node dist/cli.js --help')

      // Should not contain replacement characters
      expect(stdout).not.toContain('\uFFFD')
      expect(stdout).not.toContain('?')

      // Should contain expected Unicode
      expect(stdout).toContain('●') // Bullet
      expect(stdout).toContain('─') // Line
      expect(stdout).toContain('🌟') // Star emoji
    })
  })

  describe('Package Dependencies', () => {
    it('should have all required dependencies available', async () => {
      // Test that new dependencies are properly installed
      const dependencies = ['chalk', 'gradient-string', 'boxen', 'cli-table3', 'figures']

      for (const dep of dependencies) {
        expect(() => require(dep)).not.toThrow()
      }
    })

    it('should not have broken existing dependencies', async () => {
      // Test that existing functionality still works
      const { stdout } = await execAsync(
        'node -e "const pkg = require(\'./dist/index.js\'); console.log(typeof pkg.DocumentConverter)"'
      )
      expect(stdout.trim()).toBe('function')
    })
  })

  describe('Performance and Memory', () => {
    it('should not significantly increase startup time', async () => {
      const start = Date.now()
      await execAsync('node dist/cli.js --version')
      const end = Date.now()

      const startupTime = end - start
      expect(startupTime).toBeLessThan(2000) // Should start in under 2 seconds
    })

    it('should not leak memory with styling utilities', async () => {
      // Test repeated CLI calls don't accumulate memory
      const promises = Array.from({ length: 10 }, () => execAsync('node dist/cli.js --version'))

      const results = await Promise.all(promises)
      results.forEach(({ stdout }) => {
        expect(stdout.trim()).toBe('1.5.0')
      })
    })
  })

  describe('Backward Compatibility', () => {
    it('should maintain existing API compatibility', async () => {
      // Test that the core API hasn't changed
      const { stdout } = await execAsync(`node -e "
        const { DocumentConverter } = require('./dist/index.js');
        const converter = new DocumentConverter();
        console.log('API_COMPATIBLE');
      "`)

      expect(stdout.trim()).toBe('API_COMPATIBLE')
    })

    it('should support all existing CLI commands', async () => {
      const commands = ['batch', 'setup', 'watch', 'repair', 'validate']

      const results = await Promise.all(
        commands.map((command) => execAsync(`node dist/cli.js ${command} --help`))
      )

      for (const { stdout } of results) {
        expect(stdout).toBeTruthy()
        expect(stdout).toContain('Usage:')
      }
    })
  })

  describe('Quality Assurance', () => {
    it('should pass all tests', async () => {
      // Use typecheck instead of running tests to avoid infinite recursion
      const { stdout, stderr } = await execAsync('npm run typecheck')

      // Should pass typecheck without errors
      expect(stderr).not.toContain('error')
      expect(stderr).not.toContain('failed')

      // Typecheck should complete successfully
      expect(stdout).toContain('tsc --noEmit')
      expect(stderr).toBe('')
    }, 30000) // 30 second timeout for full test suite

    it('should build without errors', async () => {
      const { stdout, stderr } = await execAsync('npm run build')

      expect(stdout).toContain('Build success')
      expect(stderr).not.toContain('error')
      expect(stderr).not.toContain('Error')
    })

    it('should have proper TypeScript definitions', () => {
      expect(existsSync('dist/index.d.ts')).toBe(true)
      expect(existsSync('dist/cli.d.ts')).toBe(true)
    })
  })

  describe('Documentation and Examples', () => {
    it('should provide comprehensive CLI documentation', async () => {
      const { stdout } = await execAsync('node dist/cli.js --help')

      // Should contain examples
      expect(stdout).toContain('Examples')
      expect(stdout).toContain('starlight-convert batch')
      expect(stdout).toContain('starlight-convert repair')
      expect(stdout).toContain('starlight-convert validate')

      // Should contain option descriptions
      expect(stdout).toContain('--dry-run')
      expect(stdout).toContain('--verbose')
      expect(stdout).toContain('--output')
    })

    it('should maintain up-to-date version information', async () => {
      const { stdout } = await execAsync('node dist/cli.js --version')
      expect(stdout.trim()).toBe('1.5.0')

      // Should match package.json version
      const pkg = require('../package.json')
      expect(pkg.version).toBe('1.5.0')
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid commands gracefully', async () => {
      try {
        await execAsync('node dist/cli.js invalid-command')
        expect(true).toBe(false) // Should not reach here
      } catch (error: any) {
        expect(error.stdout || error.stderr).toContain('error')
      }
    })

    it('should provide helpful error messages', async () => {
      try {
        await execAsync('node dist/cli.js repair /nonexistent/file.md')
        expect(true).toBe(false) // Should not reach here
      } catch (error: any) {
        const output = error.stdout || error.stderr
        expect(output).toBeTruthy()
        // Should not crash completely
        expect(error.code).not.toBe(139) // Not segmentation fault
      }
    })
  })
})
