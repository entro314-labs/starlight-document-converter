import type { ConversionOptions, DocumentMetadata } from '../types.js'
import { pluginRegistry } from './registry.js'
import type { ProcessingContext } from './types.js'

/**
 * Integration helper to bridge the main converter with the plugin system
 */
// biome-ignore lint/complexity/noStaticOnlyClass: Utility class with organized static methods
export class PluginIntegrationHelper {
  /**
   * Apply all registered metadata enhancers to the given metadata
   */
  static async enhanceMetadata(
    metadata: DocumentMetadata,
    context: ProcessingContext
  ): Promise<DocumentMetadata> {
    const enhancers = pluginRegistry.getEnhancers()
    let enhancedMetadata = { ...metadata }

    for (const enhancer of enhancers) {
      try {
        const result = await enhancer.enhance(enhancedMetadata, context)
        enhancedMetadata = { ...enhancedMetadata, ...result }
      } catch (error) {
        console.warn(`Enhancer ${enhancer.metadata.name} failed:`, error)
      }
    }

    return enhancedMetadata
  }

  /**
   * Process content using registered file processors
   */
  static async processContent(content: string, context: ProcessingContext): Promise<string> {
    const processors = pluginRegistry.getProcessorsForExtension(context.extension)
    let processedContent = content

    for (const processor of processors) {
      try {
        // Validate if processor has validation
        if (processor.validate && !(await processor.validate(processedContent, context))) {
          continue
        }

        // Apply preprocessing if available
        if (processor.preprocess) {
          processedContent = await processor.preprocess(processedContent, context)
        }

        // Main processing
        processedContent = await processor.process(processedContent, context)

        // Apply postprocessing if available
        if (processor.postprocess) {
          processedContent = await processor.postprocess(processedContent, context)
        }

        if (context.options.verbose) {
          console.log(`  Processed with ${processor.metadata.name}`)
        }
      } catch (error) {
        console.warn(`Processor ${processor.metadata.name} failed:`, error)
      }
    }

    return processedContent
  }

  /**
   * Validate content using all registered validators
   */
  static validateContent(content: string, metadata: DocumentMetadata, context: ProcessingContext) {
    const validators = pluginRegistry.getValidators()
    const results = []

    for (const validator of validators) {
      try {
        const result = validator.validate(content, metadata, context)
        results.push({
          validator: validator.metadata.name,
          ...result,
        })
      } catch (error) {
        console.warn(`Validator ${validator.metadata.name} failed:`, error)
      }
    }

    return results
  }

  /**
   * Create a processing context from conversion parameters
   */
  static createProcessingContext(
    inputPath: string,
    outputPath: string,
    filename: string,
    extension: string,
    options: ConversionOptions,
    additionalData?: Record<string, unknown>
  ): ProcessingContext {
    return {
      inputPath,
      outputPath,
      filename,
      extension,
      options,
      data: additionalData,
    }
  }

  /**
   * Initialize all built-in plugins
   */
  static async initializePlugins() {
    const { registerBuiltInPlugins } = await import('./index.js')
    return await registerBuiltInPlugins()
  }

  /**
   * Get plugin statistics
   */
  static getPluginStats() {
    return pluginRegistry.getStats()
  }

  /**
   * Check if plugins are properly registered
   */
  static validatePluginSetup(): { valid: boolean; issues: string[] } {
    const stats = pluginRegistry.getStats()
    const issues: string[] = []

    if (stats.processors === 0) {
      issues.push('No file processors registered')
    }

    if (stats.enhancers === 0) {
      issues.push('No metadata enhancers registered')
    }

    if (stats.validators === 0) {
      issues.push('No quality validators registered')
    }

    const requiredExtensions = ['.md', '.mdx', '.json']
    const missingExtensions = requiredExtensions.filter(
      (ext) => !stats.supportedExtensions.includes(ext)
    )

    if (missingExtensions.length > 0) {
      issues.push(`Missing processors for extensions: ${missingExtensions.join(', ')}`)
    }

    return {
      valid: issues.length === 0,
      issues,
    }
  }
}
