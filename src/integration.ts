// Optional Astro types - only available when Astro is installed
interface AstroHookContext {
  config: AstroConfig
  logger: Logger
}

interface AstroIntegration {
  name: string
  hooks: {
    [key: string]: ((context: AstroHookContext) => void | Promise<void>) | undefined
  }
}

interface AstroConfig {
  root: { pathname: string }
}

interface Logger {
  info(message: string): void
  warn(message: string): void
  error(message: string): void
}

import { watch } from 'node:fs'
import { resolve } from 'node:path'

import { DocumentConverter } from './converter.js'
import type { StarlightIntegrationConfig } from './types.js'
import {
  detectStarlightConfig,
  getRecommendedInputDirs,
  isStarlightProject,
} from './utils/starlight-detector.js'

export function starlightDocumentConverter(
  userConfig: StarlightIntegrationConfig = {}
): AstroIntegration {
  // Initialize configuration outside hooks so it's accessible to all
  let config: Required<StarlightIntegrationConfig>

  return {
    name: 'starlight-document-converter',
    hooks: {
      'astro:config:setup': ({
        config: astroConfig,
        logger,
      }: {
        config: AstroConfig
        logger: Logger
      }) => {
        const projectRoot = astroConfig.root.pathname

        // Detect Starlight configuration
        const starlightConfig = detectStarlightConfig(projectRoot)
        const isStarlight = isStarlightProject(projectRoot)

        if (!isStarlight) {
          logger.warn(
            'Starlight not detected in this project. Document converter may not work as expected.'
          )
        }

        // Smart configuration with detection
        config = {
          enabled: userConfig.enabled ?? true,
          watch: userConfig.watch ?? false,
          inputDirs: userConfig.inputDirs || getRecommendedInputDirs(projectRoot, starlightConfig),
          converter: {
            outputDir: userConfig.converter?.outputDir || starlightConfig.docsDir,
            preserveStructure: true,
            generateTitles: true,
            generateDescriptions: true,
            addTimestamps: false,
            defaultCategory: 'documentation',
            verbose: false,
            dryRun: false,
            categoryPatterns: {},
            tagPatterns: {},
            ignorePatterns: [],
            ...userConfig.converter,
          },
        }

        if (!config.enabled) {
          logger.info('Document converter disabled')
          return
        }

        logger.info('Setting up Starlight Document Converter')
        logger.info(`Detected content directory: ${starlightConfig.docsDir}`)

        // Initialize converter
        const converter = new DocumentConverter(config.converter)

        // Convert existing files on startup
        Promise.all(
          config.inputDirs.map(async (dir) => {
            const fullPath = resolve(astroConfig.root.pathname, dir)
            try {
              const results = await converter.convertDirectory(fullPath)
              const successful = results.filter((r) => r.success).length
              const failed = results.filter((r) => !r.success).length

              if (successful > 0 || failed > 0) {
                logger.info(
                  `Converted ${successful} documents from ${dir}${failed > 0 ? ` (${failed} failed)` : ''}`
                )
              }
            } catch (error) {
              logger.warn(`Could not process directory ${dir}: ${error}`)
            }
          })
        ).catch((error) => {
          logger.error(`Document conversion error: ${error}`)
        })

        // Set up file watching if enabled
        if (config.watch) {
          config.inputDirs.forEach((dir) => {
            const fullPath = resolve(astroConfig.root.pathname, dir)

            try {
              const watcher = watch(fullPath, { recursive: true }, (eventType, filename) =>
                handleFileChange(eventType, filename, fullPath, converter, logger)
              )

              logger.info(`Watching ${dir} for document changes`)

              // Clean up watcher on process exit
              process.on('SIGINT', () => watcher.close())
              process.on('SIGTERM', () => watcher.close())
            } catch (error) {
              logger.warn(`Could not watch directory ${dir}: ${error}`)
            }
          })
        }
      },

      'astro:config:done': ({ logger }: { logger: Logger }) => {
        if (config?.enabled) {
          logger.info('Starlight Document Converter ready')

          if (config.watch) {
            logger.info(`Watching directories: ${config.inputDirs.join(', ')}`)
          }
        }
      },
    },
  }
}

async function handleFileChange(
  eventType: string | null,
  filename: string | null,
  fullPath: string,
  converter: DocumentConverter,
  logger: Logger
): Promise<void> {
  if (!filename || eventType !== 'change') {
    return
  }

  const filePath = resolve(fullPath, filename)
  const ext = filename.split('.').pop()?.toLowerCase()

  // Only process supported formats
  if (['docx', 'doc', 'txt', 'html', 'htm', 'md', 'rtf'].includes(ext || '')) {
    logger.info(`Converting changed file: ${filename}`)

    try {
      await converter.convertFile(filePath)
      logger.info(`✅ Converted: ${filename}`)
    } catch (error) {
      logger.error(`❌ Failed to convert ${filename}: ${error}`)
    }
  }
}

export default starlightDocumentConverter
