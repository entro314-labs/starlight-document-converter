// Plugin system exports

export { jsonProcessor } from './built-in/json-processor.js';
// Built-in plugins
export { markdownEnhancer } from './built-in/markdown-enhancer.js';
export { contentQualityValidator } from './built-in/quality-validator.js';
export { DefaultPluginRegistry, pluginRegistry } from './registry.js';
export * from './types.js';

// Convenience function to register all built-in plugins
export async function registerBuiltInPlugins() {
  const { pluginRegistry } = await import('./registry.js');
  const { markdownEnhancer } = await import('./built-in/markdown-enhancer.js');
  const { jsonProcessor } = await import('./built-in/json-processor.js');
  const { contentQualityValidator } = await import('./built-in/quality-validator.js');

  // Register built-in plugins
  pluginRegistry.registerEnhancer(markdownEnhancer);
  pluginRegistry.registerProcessor(jsonProcessor);
  pluginRegistry.registerValidator(contentQualityValidator);

  console.log('Built-in plugins registered successfully');

  return pluginRegistry.getStats();
}
