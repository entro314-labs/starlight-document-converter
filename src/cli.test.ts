import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

describe.skip('CLI Integration Tests', () => {
  let tempDir: string;
  let cliPath: string;

  beforeEach(async () => {
    // Create temporary directory for test files
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cli-test-'));
    cliPath = path.join(process.cwd(), 'dist', 'cli.js');
  });

  afterEach(async () => {
    // Clean up temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('CLI Commands', () => {
    it('should show help information', async () => {
      const result = await runCLI(['--help']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Beautiful document converter for Starlight');
      expect(result.stdout).toContain('Usage:');
    });

    it('should show version', async () => {
      const result = await runCLI(['--version']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe('1.0.0');
    });

    it('should show batch command help', async () => {
      const result = await runCLI(['batch', '--help']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Convert documents in batch mode');
      expect(result.stdout).toContain('Options:');
    });

    it('should show setup command help', async () => {
      const result = await runCLI(['setup', '--help']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Interactive project setup wizard');
    });

    it('should show watch command help', async () => {
      const result = await runCLI(['watch', '--help']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Watch directory for changes');
    });
  });

  describe('Batch Conversion', () => {
    it('should convert a single markdown file', async () => {
      // Create test file
      const testFile = path.join(tempDir, 'test.md');
      const outputDir = path.join(tempDir, 'output');

      await fs.writeFile(
        testFile,
        `# Test Document\n\nThis is a test document.\n\n## Features\n\n- Feature 1\n- Feature 2`
      );

      // Run conversion
      const result = await runCLI(['batch', testFile, '--output', outputDir, '--verbose']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Successful: 1 files');

      // Check output file exists
      const outputFile = path.join(outputDir, 'test.md');
      const exists = await fs
        .access(outputFile)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);

      // Check content has frontmatter
      const content = await fs.readFile(outputFile, 'utf-8');
      expect(content).toMatch(/^---[\s\S]*?---/);
      expect(content).toContain('title:');
      expect(content).toContain('description:');
    });

    it('should perform dry run without creating files', async () => {
      const testFile = path.join(tempDir, 'test.md');
      const outputDir = path.join(tempDir, 'output');

      await fs.writeFile(testFile, `# Test Document\n\nThis is a test.`);

      const result = await runCLI(['batch', testFile, '--output', outputDir, '--dry-run']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Dry run - no files were modified');

      // Check output file was NOT created
      const outputFile = path.join(outputDir, 'test.md');
      const exists = await fs
        .access(outputFile)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(false);
    });

    it('should handle conversion options correctly', async () => {
      const testFile = path.join(tempDir, 'test.md');
      const outputDir = path.join(tempDir, 'output');

      await fs.writeFile(testFile, `# Test Document\n\nThis is a test.`);

      const result = await runCLI([
        'batch',
        testFile,
        '--output',
        outputDir,
        '--no-titles',
        '--no-descriptions',
        '--timestamps',
        '--category',
        'custom-category',
      ]);

      expect(result.exitCode).toBe(0);

      const outputFile = path.join(outputDir, 'test.md');
      const content = await fs.readFile(outputFile, 'utf-8');

      // Should not have auto-generated title/description but should have category
      expect(content).toContain('category: "custom-category"');
    });

    it('should handle non-existent input file', async () => {
      const result = await runCLI(['batch', 'non-existent-file.md']);

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain('does not exist');
    });

    it('should process directory with multiple files', async () => {
      // Create test directory with multiple files
      const inputDir = path.join(tempDir, 'input');
      const outputDir = path.join(tempDir, 'output');

      await fs.mkdir(inputDir, { recursive: true });

      await fs.writeFile(path.join(inputDir, 'doc1.md'), '# Document 1\nContent 1');
      await fs.writeFile(path.join(inputDir, 'doc2.md'), '# Document 2\nContent 2');
      await fs.writeFile(path.join(inputDir, 'doc3.txt'), 'Plain text document');

      const result = await runCLI(['batch', inputDir, '--output', outputDir, '--verbose']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Processed: 3 files');

      // Check all output files exist
      const files = await fs.readdir(outputDir);
      expect(files).toContain('doc1.md');
      expect(files).toContain('doc2.md');
      expect(files).toContain('doc3.md'); // .txt gets converted to .md
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid command gracefully', async () => {
      const result = await runCLI(['invalid-command']);
      expect(result.exitCode).toBe(1);
    });

    it('should handle missing required arguments', async () => {
      const result = await runCLI(['batch']);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('required');
    });
  });

  // Helper function to run CLI commands
  async function runCLI(
    args: string[]
  ): Promise<{ exitCode: number; stdout: string; stderr: string }> {
    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';

      const child = spawn('node', [cliPath, ...args], {
        cwd: tempDir,
        stdio: 'pipe',
      });

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (exitCode) => {
        globalThis.clearTimeout(timeoutId);
        resolve({
          exitCode: exitCode || 0,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
        });
      });

      // Set timeout for CLI commands
      const timeoutId = globalThis.setTimeout(() => {
        child.kill();
        resolve({
          exitCode: 1,
          stdout: stdout.trim(),
          stderr: 'Command timed out',
        });
      }, 30000);
    });
  }
});
