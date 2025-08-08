import { readFileSync, existsSync } from 'fs';
import { resolve, join } from 'path';

// Optional Astro types - only available when Astro is installed
type AstroConfig = any;

export interface StarlightConfig {
  contentDir: string;
  collectionsDir: string;
  docsDir: string;
  title?: string;
  description?: string;
}

/**
 * Detects Starlight configuration from the Astro project
 */
export function detectStarlightConfig(projectRoot: string): StarlightConfig {
  const defaults: StarlightConfig = {
    contentDir: 'src/content',
    collectionsDir: 'src/content',
    docsDir: 'src/content/docs',
    title: 'Documentation',
    description: 'Documentation site powered by Starlight'
  };

  try {
    // Try to read astro.config.mjs/ts files
    const configPaths = [
      'astro.config.mjs',
      'astro.config.ts', 
      'astro.config.js'
    ];

    for (const configPath of configPaths) {
      const fullPath = resolve(projectRoot, configPath);
      if (existsSync(fullPath)) {
        const config = parseAstroConfig(fullPath);
        if (config) {
          return mergeWithDefaults(defaults, config);
        }
      }
    }

    // Check for existing content directories
    const detectedDirs = detectContentDirectories(projectRoot);
    return {
      ...defaults,
      ...detectedDirs
    };

  } catch (error) {
    console.warn('Could not detect Starlight config, using defaults:', error);
    return defaults;
  }
}

/**
 * Parse Astro config to extract Starlight settings
 */
function parseAstroConfig(configPath: string): Partial<StarlightConfig> | null {
  try {
    const content = readFileSync(configPath, 'utf-8');
    
    // Extract basic info (this is a simple regex-based approach)
    // In a real implementation, you'd want to use a proper AST parser
    const config: Partial<StarlightConfig> = {};
    
    // Look for starlight title
    const titleMatch = content.match(/title:\s*['"`]([^'"`]+)['"`]/);
    if (titleMatch) {
      config.title = titleMatch[1];
    }
    
    // Look for starlight description  
    const descMatch = content.match(/description:\s*['"`]([^'"`]+)['"`]/);
    if (descMatch) {
      config.description = descMatch[1];
    }
    
    // Look for custom content directory
    const contentMatch = content.match(/content:\s*{[^}]*dir:\s*['"`]([^'"`]+)['"`]/);
    if (contentMatch) {
      const customContentDir = contentMatch[1];
      config.contentDir = customContentDir;
      config.collectionsDir = customContentDir;
      config.docsDir = join(customContentDir, 'docs');
    }
    
    return config;
    
  } catch (error) {
    console.warn(`Failed to parse ${configPath}:`, error);
    return null;
  }
}

/**
 * Detect existing content directories in the project
 */
function detectContentDirectories(projectRoot: string): Partial<StarlightConfig> {
  const config: Partial<StarlightConfig> = {};
  
  // Common content directory patterns to check
  const contentPatterns = [
    'src/content',
    'content', 
    'src/pages',
    'docs'
  ];
  
  for (const pattern of contentPatterns) {
    const dir = resolve(projectRoot, pattern);
    if (existsSync(dir)) {
      config.contentDir = pattern;
      config.collectionsDir = pattern;
      
      // Check for docs subdirectory
      const docsDir = join(dir, 'docs');
      if (existsSync(resolve(projectRoot, docsDir))) {
        config.docsDir = docsDir;
      } else {
        config.docsDir = pattern; // Use content dir directly
      }
      break;
    }
  }
  
  return config;
}

/**
 * Merge detected config with defaults
 */
function mergeWithDefaults(defaults: StarlightConfig, detected: Partial<StarlightConfig>): StarlightConfig {
  return {
    ...defaults,
    ...detected
  };
}

/**
 * Get recommended input directories based on project structure
 */
export function getRecommendedInputDirs(projectRoot: string, starlightConfig: StarlightConfig): string[] {
  const recommendations: string[] = [];
  
  // Check for common import directory patterns
  const importPatterns = [
    'docs-import',
    'content-import', 
    'documents',
    'imports',
    '_import',
    'draft'
  ];
  
  for (const pattern of importPatterns) {
    const dir = resolve(projectRoot, pattern);
    if (existsSync(dir)) {
      recommendations.push(pattern);
    }
  }
  
  // If no import directories found, suggest creating one
  if (recommendations.length === 0) {
    recommendations.push('docs-import');
  }
  
  return recommendations;
}

/**
 * Check if the project appears to be using Starlight
 */
export function isStarlightProject(projectRoot: string): boolean {
  try {
    // Check package.json for starlight dependency
    const packageJsonPath = resolve(projectRoot, 'package.json');
    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const deps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
        ...packageJson.peerDependencies
      };
      
      if (deps['@astrojs/starlight']) {
        return true;
      }
    }
    
    // Check for starlight in config files
    const configPaths = [
      'astro.config.mjs',
      'astro.config.ts', 
      'astro.config.js'
    ];
    
    for (const configPath of configPaths) {
      const fullPath = resolve(projectRoot, configPath);
      if (existsSync(fullPath)) {
        const content = readFileSync(fullPath, 'utf-8');
        if (content.includes('@astrojs/starlight') || content.includes('starlight')) {
          return true;
        }
      }
    }
    
    return false;
    
  } catch (error) {
    return false;
  }
}