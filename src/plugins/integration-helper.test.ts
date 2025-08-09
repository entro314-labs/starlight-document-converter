import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PluginIntegrationHelper } from './integration-helper.js';
import { pluginRegistry } from './registry.js';
import type { MetadataEnhancer, FileProcessor, QualityValidator } from './types.js';

describe('PluginIntegrationHelper', () => {
  beforeEach(() => {
    pluginRegistry.clear();
  });

  describe('enhanceMetadata', () => {
    it('should apply multiple metadata enhancers in priority order', async () => {
      const highPriorityEnhancer: MetadataEnhancer = {
        metadata: { name: 'high-priority', version: '1.0.0', description: 'High priority enhancer' },
        priority: 100,
        enhance: async (metadata) => ({ ...metadata, highPriorityField: 'added' })
      };

      const lowPriorityEnhancer: MetadataEnhancer = {
        metadata: { name: 'low-priority', version: '1.0.0', description: 'Low priority enhancer' },
        priority: 10,
        enhance: async (metadata) => ({ ...metadata, lowPriorityField: 'added' })
      };

      pluginRegistry.registerEnhancer(highPriorityEnhancer);
      pluginRegistry.registerEnhancer(lowPriorityEnhancer);

      const context = {
        inputPath: '/test.md',
        outputPath: '/output.md',
        filename: 'test.md',
        extension: '.md' as const,
        options: {}
      };

      const result = await PluginIntegrationHelper.enhanceMetadata({}, context);

      expect(result.highPriorityField).toBe('added');
      expect(result.lowPriorityField).toBe('added');
    });

    it('should handle enhancer failures gracefully', async () => {
      const failingEnhancer: MetadataEnhancer = {
        metadata: { name: 'failing', version: '1.0.0', description: 'Failing enhancer' },
        enhance: async () => {
          throw new Error('Enhancer failed');
        }
      };

      const workingEnhancer: MetadataEnhancer = {
        metadata: { name: 'working', version: '1.0.0', description: 'Working enhancer' },
        enhance: async (metadata) => ({ ...metadata, workingField: 'success' })
      };

      pluginRegistry.registerEnhancer(failingEnhancer);
      pluginRegistry.registerEnhancer(workingEnhancer);

      const context = {
        inputPath: '/test.md',
        outputPath: '/output.md',
        filename: 'test.md',
        extension: '.md' as const,
        options: {}
      };

      // Mock console.warn to avoid noise in tests
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await PluginIntegrationHelper.enhanceMetadata({}, context);

      expect(result.workingField).toBe('success');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Enhancer failing failed:'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('processContent', () => {
    it('should process content through multiple processors', async () => {
      const processor1: FileProcessor = {
        extensions: ['.md'],
        metadata: { name: 'processor1', version: '1.0.0', description: 'First processor' },
        process: async (content) => content + ' [processed by 1]'
      };

      const processor2: FileProcessor = {
        extensions: ['.md'],
        metadata: { name: 'processor2', version: '1.0.0', description: 'Second processor' },
        process: async (content) => content + ' [processed by 2]'
      };

      pluginRegistry.registerProcessor(processor1);
      pluginRegistry.registerProcessor(processor2);

      const context = {
        inputPath: '/test.md',
        outputPath: '/output.md',
        filename: 'test.md',
        extension: '.md' as const,
        options: { verbose: false }
      };

      const result = await PluginIntegrationHelper.processContent('original content', context);

      expect(result).toBe('original content [processed by 1] [processed by 2]');
    });

    it('should apply preprocessing and postprocessing', async () => {
      const processor: FileProcessor = {
        extensions: ['.md'],
        metadata: { name: 'full-processor', version: '1.0.0', description: 'Full processor' },
        preprocess: async (content) => `[pre] ${content}`,
        process: async (content) => `[main] ${content}`,
        postprocess: async (content) => `${content} [post]`
      };

      pluginRegistry.registerProcessor(processor);

      const context = {
        inputPath: '/test.md',
        outputPath: '/output.md',
        filename: 'test.md',
        extension: '.md' as const,
        options: {}
      };

      const result = await PluginIntegrationHelper.processContent('content', context);

      expect(result).toBe('[main] [pre] content [post]');
    });

    it('should skip processors that fail validation', async () => {
      const processor: FileProcessor = {
        extensions: ['.md'],
        metadata: { name: 'validating-processor', version: '1.0.0', description: 'Validating processor' },
        validate: async () => false,
        process: async (content) => content + ' [should not be processed]'
      };

      pluginRegistry.registerProcessor(processor);

      const context = {
        inputPath: '/test.md',
        outputPath: '/output.md',
        filename: 'test.md',
        extension: '.md' as const,
        options: {}
      };

      const result = await PluginIntegrationHelper.processContent('content', context);

      expect(result).toBe('content');
    });
  });

  describe('validateContent', () => {
    it('should run all validators and collect results', () => {
      const validator1: QualityValidator = {
        metadata: { name: 'validator1', version: '1.0.0', description: 'First validator' },
        validate: () => ({
          score: 85,
          level: 'high',
          issues: [{ type: 'info', message: 'Info from validator 1', severity: 1 }],
          suggestions: ['Suggestion 1']
        })
      };

      const validator2: QualityValidator = {
        metadata: { name: 'validator2', version: '1.0.0', description: 'Second validator' },
        validate: () => ({
          score: 70,
          level: 'medium',
          issues: [{ type: 'warning', message: 'Warning from validator 2', severity: 5 }],
          suggestions: ['Suggestion 2']
        })
      };

      pluginRegistry.registerValidator(validator1);
      pluginRegistry.registerValidator(validator2);

      const context = {
        inputPath: '/test.md',
        outputPath: '/output.md',
        filename: 'test.md',
        extension: '.md' as const,
        options: {}
      };

      const results = PluginIntegrationHelper.validateContent('content', {}, context);

      expect(results).toHaveLength(2);
      expect(results[0].validator).toBe('validator1');
      expect(results[0].score).toBe(85);
      expect(results[1].validator).toBe('validator2');
      expect(results[1].score).toBe(70);
    });
  });

  describe('createProcessingContext', () => {
    it('should create a valid processing context', () => {
      const context = PluginIntegrationHelper.createProcessingContext(
        '/input.md',
        '/output.md',
        'input.md',
        '.md',
        { verbose: true },
        { custom: 'data' }
      );

      expect(context.inputPath).toBe('/input.md');
      expect(context.outputPath).toBe('/output.md');
      expect(context.filename).toBe('input.md');
      expect(context.extension).toBe('.md');
      expect(context.options.verbose).toBe(true);
      expect(context.data?.custom).toBe('data');
    });
  });

  describe('validatePluginSetup', () => {
    it('should validate complete plugin setup', () => {
      const processor: FileProcessor = {
        extensions: ['.md', '.mdx', '.json'],
        metadata: { name: 'test-processor', version: '1.0.0', description: 'Test' },
        process: async (content) => content
      };

      const enhancer: MetadataEnhancer = {
        metadata: { name: 'test-enhancer', version: '1.0.0', description: 'Test' },
        enhance: async (metadata) => metadata
      };

      const validator: QualityValidator = {
        metadata: { name: 'test-validator', version: '1.0.0', description: 'Test' },
        validate: () => ({ score: 100, level: 'high', issues: [], suggestions: [] })
      };

      pluginRegistry.registerProcessor(processor);
      pluginRegistry.registerEnhancer(enhancer);
      pluginRegistry.registerValidator(validator);

      const result = PluginIntegrationHelper.validatePluginSetup();

      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect missing plugin types', () => {
      const result = PluginIntegrationHelper.validatePluginSetup();

      expect(result.valid).toBe(false);
      expect(result.issues).toContain('No file processors registered');
      expect(result.issues).toContain('No metadata enhancers registered');
      expect(result.issues).toContain('No quality validators registered');
    });

    it('should detect missing required extensions', () => {
      const processor: FileProcessor = {
        extensions: ['.txt'], // Missing .md, .mdx, .json
        metadata: { name: 'test-processor', version: '1.0.0', description: 'Test' },
        process: async (content) => content
      };

      pluginRegistry.registerProcessor(processor);

      const result = PluginIntegrationHelper.validatePluginSetup();

      expect(result.valid).toBe(false);
      expect(result.issues.some(issue => issue.includes('Missing processors for extensions'))).toBe(true);
    });
  });
});