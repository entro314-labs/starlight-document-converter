import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { detectStarlightConfig, isStarlightProject } from './starlight-detector.js';

/**
 * Get smart defaults for CLI operations
 */
export function getSmartDefaults(cwd: string = process.cwd()) {
  try {
    const starlightConfig = detectStarlightConfig(cwd);
    const isStarlight = isStarlightProject(cwd);

    return {
      outputDir: starlightConfig.docsDir,
      isStarlightProject: isStarlight,
      title: starlightConfig.title,
      description: starlightConfig.description,
      recommendations: getRecommendations(cwd, starlightConfig, isStarlight),
    };
  } catch {
    // Fallback when Astro/Starlight is not available (CLI-only usage)
    return {
      outputDir: 'docs-output',
      isStarlightProject: false,
      title: 'Documentation',
      description: 'Documentation site',
      recommendations: [
        'Using CLI-only mode. Install @astrojs/starlight for full integration features.',
      ],
    };
  }
}

/**
 * Get recommendations for the user based on project setup
 */
function getRecommendations(
  cwd: string,
  config: { docsDir: string },
  isStarlight: boolean
): string[] {
  const recommendations: string[] = [];

  if (!isStarlight) {
    recommendations.push(
      "This doesn't appear to be a Starlight project. Consider installing @astrojs/starlight first."
    );
  }

  if (!existsSync(resolve(cwd, config.docsDir))) {
    recommendations.push(
      `Content directory ${config.docsDir} doesn't exist yet. It will be created automatically.`
    );
  }

  // Check for common import directories
  const importDirs = ['docs-import', 'documents', 'content-import'];
  const existingImportDirs = importDirs.filter((dir) => existsSync(resolve(cwd, dir)));

  if (existingImportDirs.length === 0) {
    recommendations.push(
      'Consider creating a "docs-import" directory to drop documents for conversion.'
    );
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

  try {
    const starlightConfig = detectStarlightConfig(cwd);
    return starlightConfig.docsDir;
  } catch {
    // Fallback for CLI-only usage
    return 'docs-output';
  }
}

/**
 * Detect and suggest input sources
 */
export function detectInputSources(cwd: string = process.cwd()): string[] {
  const sources: string[] = [];

  // First, check for existing Starlight content directory
  try {
    const starlightConfig = detectStarlightConfig(cwd);
    if (starlightConfig.docsDir && existsSync(resolve(cwd, starlightConfig.docsDir))) {
      sources.push(starlightConfig.docsDir);
    }
  } catch {
    // If Starlight config detection fails, continue with other patterns
  }

  // Common document/import directories
  const commonDirs = ['docs-import', 'documents', 'content-import', 'drafts', 'imports', '_import'];

  for (const dir of commonDirs) {
    if (existsSync(resolve(cwd, dir))) {
      // Avoid duplicates (in case docsDir matches a common dir name)
      if (!sources.includes(dir)) {
        sources.push(dir);
      }
    }
  }

  return sources;
}
