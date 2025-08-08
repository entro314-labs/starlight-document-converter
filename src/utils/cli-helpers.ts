import { detectStarlightConfig, isStarlightProject } from './starlight-detector.js';
import { existsSync } from 'fs';
import { resolve } from 'path';

/**
 * Get smart defaults for CLI operations
 */
export function getSmartDefaults(cwd: string = process.cwd()) {
  const starlightConfig = detectStarlightConfig(cwd);
  const isStarlight = isStarlightProject(cwd);
  
  return {
    outputDir: starlightConfig.docsDir,
    isStarlightProject: isStarlight,
    title: starlightConfig.title,
    description: starlightConfig.description,
    recommendations: getRecommendations(cwd, starlightConfig, isStarlight)
  };
}

/**
 * Get recommendations for the user based on project setup
 */
function getRecommendations(cwd: string, config: any, isStarlight: boolean): string[] {
  const recommendations: string[] = [];
  
  if (!isStarlight) {
    recommendations.push('This doesn\'t appear to be a Starlight project. Consider installing @astrojs/starlight first.');
  }
  
  if (!existsSync(resolve(cwd, config.docsDir))) {
    recommendations.push(`Content directory ${config.docsDir} doesn't exist yet. It will be created automatically.`);
  }
  
  // Check for common import directories
  const importDirs = ['docs-import', 'documents', 'content-import'];
  const existingImportDirs = importDirs.filter(dir => existsSync(resolve(cwd, dir)));
  
  if (existingImportDirs.length === 0) {
    recommendations.push('Consider creating a "docs-import" directory to drop documents for conversion.');
  } else {
    recommendations.push(`Found existing import directories: ${existingImportDirs.join(', ')}`);
  }
  
  return recommendations;
}

/**
 * Smart output directory detection for CLI commands
 */
export function getOutputDirectory(userSpecified?: string, cwd: string = process.cwd()): string {
  if (userSpecified) {
    return userSpecified;
  }
  
  const starlightConfig = detectStarlightConfig(cwd);
  return starlightConfig.docsDir;
}

/**
 * Detect and suggest input sources
 */
export function detectInputSources(cwd: string = process.cwd()): string[] {
  const sources: string[] = [];
  
  // Common document directories
  const commonDirs = [
    'docs-import',
    'documents', 
    'content-import',
    'drafts',
    'imports',
    '_import'
  ];
  
  for (const dir of commonDirs) {
    if (existsSync(resolve(cwd, dir))) {
      sources.push(dir);
    }
  }
  
  return sources;
}