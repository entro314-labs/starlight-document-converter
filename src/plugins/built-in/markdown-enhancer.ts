import type { DocumentMetadata, MetadataEnhancer, ProcessingContext } from '../types.js'

/**
 * Built-in markdown metadata enhancer that improves title and description extraction
 */
export const markdownEnhancer: MetadataEnhancer = {
  metadata: {
    name: 'markdown-enhancer',
    version: '2.0.0',
    description: 'Enhances metadata extraction for markdown files using ContentAnalyzer',
    author: 'Starlight Document Converter',
  },
  priority: 50,

  enhance: async (
    metadata: DocumentMetadata,
    context: ProcessingContext
  ): Promise<DocumentMetadata> => {
    // Only process markdown files
    if (context.extension !== '.md' && context.extension !== '.mdx') {
      return metadata
    }

    try {
      // Dynamically import ContentAnalyzer to avoid circular imports
      const { ContentAnalyzer } = await import('./content-analyzer.js')
      const analyzer = new ContentAnalyzer()

      // Read file content
      const { readFile } = await import('node:fs/promises')
      const content = await readFile(context.inputPath, 'utf-8')

      // Analyze content for enhanced metadata
      const { metadata: analyzedMetadata, analysis } = analyzer.analyzeContent(
        content,
        context.inputPath
      )

      // Merge with existing metadata, preferring existing values
      const enhancedMetadata: DocumentMetadata = {
        title: metadata.title || analyzedMetadata.title,
        description: metadata.description || analyzedMetadata.description,
        category: metadata.category || analyzedMetadata.category,
        tags: [...(metadata.tags || []), ...(analyzedMetadata.tags || [])].filter(
          (tag, index, arr) => arr.indexOf(tag) === index
        ), // Remove duplicates
        // Add analysis-derived metadata
        ...(analysis.readingTime && { readingTime: analysis.readingTime }),
        ...(analysis.wordCount && { wordCount: analysis.wordCount }),
        ...(analysis.contentType && { contentType: analysis.contentType }),
        ...(analysis.complexity && { complexity: analysis.complexity }),
        // Preserve existing metadata
        ...metadata,
      }

      return enhancedMetadata
    } catch (error) {
      console.warn(`Failed to enhance markdown metadata for ${context.inputPath}:`, error)
      return metadata
    }
  },
}
