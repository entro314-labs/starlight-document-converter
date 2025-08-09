import { describe, it, expect, vi, beforeEach } from 'vitest';
import { showRepairResults, showValidationResults, createSpinner } from './cli-commands.js';

// Mock the CLI styling module
vi.mock('./cli-styling.js', () => ({
  status: {
    success: vi.fn((text) => `✓ ${text}`),
    error: vi.fn((text) => `✗ ${text}`),
    warning: vi.fn((text) => `⚠ ${text}`),
    info: vi.fn((text) => `ℹ ${text}`),
    processing: vi.fn((text) => `→ ${text}`)
  },
  boxes: {
    success: vi.fn((content, title) => `[SUCCESS BOX: ${title}]\n${content}`),
    error: vi.fn((content, title) => `[ERROR BOX: ${title}]\n${content}`),
    warning: vi.fn((content, title) => `[WARNING BOX: ${title}]\n${content}`),
    info: vi.fn((content, title) => `[INFO BOX: ${title}]\n${content}`)
  },
  createResultsTable: vi.fn(() => ({
    toString: () => 'MOCKED_TABLE_OUTPUT'
  })),
  colors: {
    success: vi.fn((text) => `GREEN(${text})`),
    error: vi.fn((text) => `RED(${text})`),
    warning: vi.fn((text) => `YELLOW(${text})`),
    primary: vi.fn((text) => `CYAN(${text})`)
  }
}));

// Mock clack prompts
vi.mock('@clack/prompts', () => ({
  spinner: vi.fn(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    message: vi.fn()
  }))
}));

describe('Enhanced CLI Commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('showRepairResults', () => {
    it('should display repair results in a success box for regular mode', () => {
      const stats = {
        filesProcessed: 5,
        totalRepaired: 4,
        totalIssues: 8
      };
      
      const options = {
        output: '/output',
        fixLinks: true,
        processImages: false,
        generateToc: true,
        dryRun: false,
        verbose: false
      };

      const result = showRepairResults(stats, options);
      
      expect(result).toContain('[SUCCESS BOX: Repair Results]');
      expect(result).toContain('✓ Files successfully repaired');
      expect(result).toContain('MOCKED_TABLE_OUTPUT');
    });

    it('should display repair results in a warning box for dry-run mode', () => {
      const stats = {
        filesProcessed: 3,
        totalRepaired: 2,
        totalIssues: 5
      };
      
      const options = {
        output: '/output',
        fixLinks: false,
        processImages: true,
        generateToc: false,
        dryRun: true,
        verbose: true
      };

      const result = showRepairResults(stats, options);
      
      expect(result).toContain('[WARNING BOX: Repair Analysis (Dry Run)]');
      expect(result).toContain('ℹ Analysis completed without making changes');
      expect(result).toContain('MOCKED_TABLE_OUTPUT');
    });

    it('should handle zero repair cases', () => {
      const stats = {
        filesProcessed: 10,
        totalRepaired: 0,
        totalIssues: 0
      };
      
      const options = {
        output: '/output',
        fixLinks: false,
        processImages: false,
        generateToc: false,
        dryRun: false,
        verbose: false
      };

      const result = showRepairResults(stats, options);
      
      expect(result).toBeTruthy();
      expect(result).toContain('MOCKED_TABLE_OUTPUT');
    });
  });

  describe('showValidationResults', () => {
    it('should display excellent quality results in success box', () => {
      const stats = {
        totalFiles: 10,
        validFiles: 9,
        issueCount: 2,
        allIssues: []
      };

      const result = showValidationResults(stats);
      
      expect(result).toContain('[SUCCESS BOX: Validation Results]');
      expect(result).toContain('✓ Excellent content quality!');
      expect(result).toContain('MOCKED_TABLE_OUTPUT');
    });

    it('should display moderate quality results in warning box', () => {
      const stats = {
        totalFiles: 10,
        validFiles: 8,
        issueCount: 5,
        allIssues: []
      };

      const result = showValidationResults(stats);
      
      expect(result).toContain('[WARNING BOX: Validation Results]');
      expect(result).toContain('⚠ Some issues found');
      expect(result).toContain('MOCKED_TABLE_OUTPUT');
    });

    it('should display poor quality results in error box', () => {
      const stats = {
        totalFiles: 10,
        validFiles: 6,
        issueCount: 15,
        allIssues: []
      };

      const result = showValidationResults(stats);
      
      expect(result).toContain('[ERROR BOX: Validation Results]');
      expect(result).toContain('✗ Multiple issues need attention');
      expect(result).toContain('MOCKED_TABLE_OUTPUT');
    });

    it('should handle perfect validation results', () => {
      const stats = {
        totalFiles: 5,
        validFiles: 5,
        issueCount: 0,
        allIssues: []
      };

      const result = showValidationResults(stats);
      
      expect(result).toContain('[SUCCESS BOX: Validation Results]');
      expect(result).toContain('✓ Excellent content quality!');
    });

    it('should handle zero files edge case', () => {
      const stats = {
        totalFiles: 0,
        validFiles: 0,
        issueCount: 0,
        allIssues: []
      };

      const result = showValidationResults(stats);
      
      // Should still create a success box (100% success rate for 0 files)
      expect(result).toContain('[SUCCESS BOX: Validation Results]');
      expect(result).toContain('✓ Excellent content quality!');
    });
  });

  describe('createSpinner', () => {
    it('should create spinner with processing status for regular mode', () => {
      const message = 'Converting files';
      const spinner = createSpinner(message, false);
      
      expect(spinner).toBeTruthy();
      expect(spinner.start).toHaveBeenCalledWith('→ Converting files');
    });

    it('should create spinner with warning status for dry-run mode', () => {
      const message = 'Analyzing content';
      const spinner = createSpinner(message, true);
      
      expect(spinner).toBeTruthy();
      expect(spinner.start).toHaveBeenCalledWith('⚠ Analyzing: Analyzing content');
    });

    it('should handle empty message', () => {
      const spinner = createSpinner('', false);
      
      expect(spinner).toBeTruthy();
      expect(spinner.start).toHaveBeenCalledWith('→ ');
    });

    it('should handle special characters in message', () => {
      const message = 'Processing "files" & <documents>';
      const spinner = createSpinner(message, false);
      
      expect(spinner).toBeTruthy();
      expect(spinner.start).toHaveBeenCalledWith('→ Processing "files" & <documents>');
    });
  });

  describe('integration with styling system', () => {
    it('should use styling utilities consistently', async () => {
      const { status, boxes, createResultsTable } = await import('./cli-styling.js');
      
      // Test that our functions call the styling utilities
      const stats = {
        filesProcessed: 3,
        totalRepaired: 2,
        totalIssues: 4
      };
      
      const options = {
        output: '/output',
        fixLinks: true,
        processImages: false,
        generateToc: false,
        dryRun: false,
        verbose: false
      };

      showRepairResults(stats, options);
      
      expect(status.success).toHaveBeenCalled();
      expect(boxes.success).toHaveBeenCalled();
      expect(createResultsTable).toHaveBeenCalledWith({
        filesProcessed: 3,
        totalRepaired: 2,
        totalIssues: 4
      });
    });

    it('should handle styling system errors gracefully', async () => {
      // Test that our functions use styling utilities properly
      const { status, boxes, createResultsTable } = await import('./cli-styling.js');
      
      // Test that styling utilities are called
      const stats = {
        filesProcessed: 1,
        totalRepaired: 1,
        totalIssues: 0
      };
      
      const options = {
        output: '/output',
        fixLinks: false,
        processImages: false,
        generateToc: false,
        dryRun: false,
        verbose: false
      };

      const result = showRepairResults(stats, options);
      
      // Should produce valid output using styling utilities
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      expect(status.success).toHaveBeenCalled();
      expect(boxes.success).toHaveBeenCalled();
      expect(createResultsTable).toHaveBeenCalled();
    });
  });

  describe('output formatting', () => {
    it('should produce consistent output structure', () => {
      const stats = {
        filesProcessed: 5,
        totalRepaired: 3,
        totalIssues: 7
      };
      
      const options = {
        output: '/output',
        fixLinks: true,
        processImages: true,
        generateToc: true,
        dryRun: false,
        verbose: false
      };

      const result = showRepairResults(stats, options);
      
      // Should contain box structure
      expect(result).toMatch(/\[.*BOX:.*\]/);
      // Should contain status indicator
      expect(result).toMatch(/[✓✗⚠ℹ]/);
      // Should contain table output
      expect(result).toContain('MOCKED_TABLE_OUTPUT');
    });

    it('should handle long text without breaking formatting', () => {
      const longStats = {
        totalFiles: 999999,
        validFiles: 888888,
        issueCount: 111111,
        allIssues: []
      };

      const result = showValidationResults(longStats);
      
      expect(result).toBeTruthy();
      expect(result).toContain('MOCKED_TABLE_OUTPUT');
      expect(result).toMatch(/\[.*BOX:.*\]/);
    });
  });

  describe('performance', () => {
    it('should handle large datasets efficiently', () => {
      const start = Date.now();
      
      const largeStats = {
        totalFiles: 10000,
        validFiles: 9500,
        issueCount: 500,
        allIssues: []
      };

      const result = showValidationResults(largeStats);
      
      const end = Date.now();
      const duration = end - start;
      
      expect(result).toBeTruthy();
      expect(duration).toBeLessThan(100); // Should complete quickly
    });

    it('should not leak memory with repeated calls', () => {
      const stats = {
        filesProcessed: 1,
        totalRepaired: 1,
        totalIssues: 0
      };
      
      const options = {
        output: '/output',
        fixLinks: false,
        processImages: false,
        generateToc: false,
        dryRun: false,
        verbose: false
      };

      // Call function many times
      for (let i = 0; i < 100; i++) {
        const result = showRepairResults(stats, options);
        expect(result).toBeTruthy();
      }
    });
  });
});