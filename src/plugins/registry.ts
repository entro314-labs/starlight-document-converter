import type { FileProcessor, MetadataEnhancer, PluginRegistry, QualityValidator } from './types.js';

/**
 * Central plugin registry for managing file processors, metadata enhancers, and quality validators
 */
export class DefaultPluginRegistry implements PluginRegistry {
  private processors: Map<string, FileProcessor> = new Map();
  private enhancers: MetadataEnhancer[] = [];
  private validators: QualityValidator[] = [];

  /**
   * Register a file processor plugin
   */
  registerProcessor(processor: FileProcessor): void {
    const key = `${processor.metadata.name}@${processor.metadata.version}`;

    // Validate processor
    this.validateProcessor(processor);

    this.processors.set(key, processor);
    console.log(`Registered processor: ${processor.metadata.name} v${processor.metadata.version}`);
  }

  /**
   * Register a metadata enhancer plugin
   */
  registerEnhancer(enhancer: MetadataEnhancer): void {
    // Validate enhancer
    this.validateEnhancer(enhancer);

    this.enhancers.push(enhancer);

    // Sort by priority (higher priority first)
    this.enhancers.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    console.log(`Registered enhancer: ${enhancer.metadata.name} v${enhancer.metadata.version}`);
  }

  /**
   * Register a quality validator plugin
   */
  registerValidator(validator: QualityValidator): void {
    // Validate validator
    this.validateValidator(validator);

    this.validators.push(validator);
    console.log(`Registered validator: ${validator.metadata.name} v${validator.metadata.version}`);
  }

  /**
   * Get all registered processors
   */
  getProcessors(): FileProcessor[] {
    return Array.from(this.processors.values());
  }

  /**
   * Get processors that can handle a specific file extension
   */
  getProcessorsForExtension(extension: string): FileProcessor[] {
    return this.getProcessors().filter((processor) =>
      processor.extensions.includes(extension.toLowerCase())
    );
  }

  /**
   * Get all registered enhancers (sorted by priority)
   */
  getEnhancers(): MetadataEnhancer[] {
    return [...this.enhancers];
  }

  /**
   * Get all registered validators
   */
  getValidators(): QualityValidator[] {
    return [...this.validators];
  }

  /**
   * Clear all registered plugins
   */
  clear(): void {
    this.processors.clear();
    this.enhancers.length = 0;
    this.validators.length = 0;
  }

  /**
   * Get plugin statistics
   */
  getStats() {
    const processorExtensions = new Set<string>();
    this.getProcessors().forEach((p) =>
      p.extensions.forEach((ext) => processorExtensions.add(ext))
    );

    return {
      processors: this.processors.size,
      enhancers: this.enhancers.length,
      validators: this.validators.length,
      supportedExtensions: Array.from(processorExtensions),
    };
  }

  private validateProcessor(processor: FileProcessor): void {
    if (!processor.metadata?.name) {
      throw new Error('Processor must have a name in metadata');
    }
    if (!processor.metadata?.version) {
      throw new Error('Processor must have a version in metadata');
    }
    if (!processor.extensions || processor.extensions.length === 0) {
      throw new Error('Processor must specify at least one file extension');
    }
    if (typeof processor.process !== 'function') {
      throw new Error('Processor must have a process function');
    }
  }

  private validateEnhancer(enhancer: MetadataEnhancer): void {
    if (!enhancer.metadata?.name) {
      throw new Error('Enhancer must have a name in metadata');
    }
    if (!enhancer.metadata?.version) {
      throw new Error('Enhancer must have a version in metadata');
    }
    if (typeof enhancer.enhance !== 'function') {
      throw new Error('Enhancer must have an enhance function');
    }
  }

  private validateValidator(validator: QualityValidator): void {
    if (!validator.metadata?.name) {
      throw new Error('Validator must have a name in metadata');
    }
    if (!validator.metadata?.version) {
      throw new Error('Validator must have a version in metadata');
    }
    if (typeof validator.validate !== 'function') {
      throw new Error('Validator must have a validate function');
    }
  }
}

// Global plugin registry instance
export const pluginRegistry = new DefaultPluginRegistry();
