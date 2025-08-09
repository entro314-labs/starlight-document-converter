// Plugin system exports

export { jsonProcessor } from './built-in/json-processor.js';
export { markdownProcessor } from './built-in/markdown-processor.js';
// Built-in plugins
export { markdownEnhancer } from './built-in/markdown-enhancer.js';
export { contentQualityValidator } from './built-in/quality-validator.js';
export { FrontmatterRepair } from './built-in/frontmatter-repair.js';
export { LinkImageProcessor } from './built-in/link-image-processor.js';
export { TocGenerator } from './built-in/toc-generator.js';
export { ContentAnalyzer } from './built-in/content-analyzer.js';
export { DefaultPluginRegistry, pluginRegistry } from './registry.js';
export { PluginIntegrationHelper } from './integration-helper.js';
export * from './types.js';

// Convenience function to register all built-in plugins
export async function registerBuiltInPlugins() {
  const { pluginRegistry } = await import('./registry.js');
  const { markdownEnhancer } = await import('./built-in/markdown-enhancer.js');
  const { jsonProcessor } = await import('./built-in/json-processor.js');
  const { markdownProcessor } = await import('./built-in/markdown-processor.js');
  const { contentQualityValidator } = await import('./built-in/quality-validator.js');
  const { frontmatterEnhancer, frontmatterValidator } = await import('./built-in/frontmatter-repair.js');

  // Register built-in plugins in priority order
  pluginRegistry.registerEnhancer(frontmatterEnhancer);  // Priority 100
  pluginRegistry.registerEnhancer(markdownEnhancer);     // Priority 50
  
  pluginRegistry.registerProcessor(jsonProcessor);
  pluginRegistry.registerProcessor(markdownProcessor);
  
  pluginRegistry.registerValidator(contentQualityValidator);
  pluginRegistry.registerValidator(frontmatterValidator);

  console.log('Built-in plugins registered successfully');

  return pluginRegistry.getStats();
}
