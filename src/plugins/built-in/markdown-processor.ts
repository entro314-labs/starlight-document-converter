import type { FileProcessor, ProcessingContext } from '../types.js'

/**
 * Advanced markdown processor that handles link/image processing and TOC generation
 */
export const markdownProcessor: FileProcessor = {
  extensions: ['.md', '.mdx'],
  metadata: {
    name: 'markdown-processor',
    version: '1.0.0',
    description:
      'Advanced markdown processing with link fixing, image processing, and TOC generation',
    author: 'Starlight Document Converter',
  },

  validate: (content: string): boolean => {
    // Basic validation - check if content looks like markdown
    return typeof content === 'string' && content.length > 0
  },

  process: async (content: string, context: ProcessingContext): Promise<string> => {
    let processedContent = content

    try {
      // Only process if enhanced features are requested
      if (
        context.options.fixLinks ||
        context.options.processImages ||
        context.options.generateToc
      ) {
        const { LinkImageProcessor } = await import('./link-image-processor.js')
        const { TocGenerator } = await import('./toc-generator.js')
        const { dirname } = await import('node:path')

        // Process links and images if requested
        if (context.options.fixLinks || context.options.processImages) {
          const processor = new LinkImageProcessor(
            dirname(context.inputPath),
            dirname(context.outputPath)
          )

          const result = await processor.processContent(
            processedContent,
            context.inputPath,
            context.outputPath
          )

          processedContent = result.content

          // Log processing results if verbose
          if (context.options.verbose) {
            const linkReport = processor.generateLinkReport(result.links)
            const imageReport = processor.generateImageReport(result.images)

            console.log(`  Links: ${linkReport.repaired} repaired, ${linkReport.broken} broken`)
            console.log(`  Images: ${imageReport.copied} copied, ${imageReport.missing} missing`)
          }
        }

        // Generate TOC if requested
        if (context.options.generateToc) {
          const tocGenerator = new TocGenerator()

          // Only add TOC if it doesn't already exist
          if (!tocGenerator.hasExistingToc(processedContent)) {
            processedContent = tocGenerator.insertTocIntoContent(processedContent)

            if (context.options.verbose) {
              console.log('  Added table of contents')
            }
          }
        }
      }

      return processedContent
    } catch (error) {
      console.warn(`Failed to process markdown for ${context.inputPath}:`, error)
      return content // Return original content on error
    }
  },
}
