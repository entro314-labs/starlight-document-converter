import { copyFile, mkdir, stat } from 'node:fs/promises'
import { basename, dirname, extname, join, relative, resolve } from 'node:path'

import type { ImageInfo, LinkInfo } from '../../types.js'

export class LinkImageProcessor {
  private baseDir: string
  private outputDir: string
  private assetsDir: string
  private logger?: { warn: (msg: string) => void; error: (msg: string, error?: any) => void }

  constructor(
    baseDir: string,
    outputDir: string,
    assetsDir = 'assets',
    logger?: { warn: (msg: string) => void; error: (msg: string, error?: any) => void }
  ) {
    this.baseDir = baseDir
    this.outputDir = outputDir
    this.assetsDir = assetsDir
    this.logger = logger
  }

  /**
   * Process all links and images in markdown content
   */
  async processContent(
    content: string,
    sourceFilePath: string,
    targetFilePath: string
  ): Promise<{ content: string; links: LinkInfo[]; images: ImageInfo[] }> {
    const links: LinkInfo[] = []
    const images: ImageInfo[] = []

    // Process images first
    let processedContent = await this.processImages(content, sourceFilePath, targetFilePath, images)

    // Then process links
    processedContent = await this.processLinks(
      processedContent,
      sourceFilePath,
      targetFilePath,
      links
    )

    return {
      content: processedContent,
      links,
      images,
    }
  }

  /**
   * Process and fix internal links
   */
  private async processLinks(
    content: string,
    sourceFilePath: string,
    targetFilePath: string,
    links: LinkInfo[]
  ): Promise<string> {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
    let processedContent = content
    const replacements: Array<{ original: string; replacement: string }> = []

    let match: RegExpExecArray | null
    // biome-ignore lint/suspicious/noAssignInExpressions: Standard regex pattern matching
    while ((match = linkRegex.exec(content)) !== null) {
      const [fullMatch, linkText, linkUrl] = match

      // Skip external links and anchors
      if (linkUrl.startsWith('http') || linkUrl.startsWith('mailto:') || linkUrl.startsWith('#')) {
        links.push({
          original: linkUrl,
          resolved: linkUrl,
          isInternal: false,
          exists: true, // Assume external links exist
          needsRepair: false,
        })
        continue
      }

      const linkInfo = await this.processInternalLink(linkUrl, sourceFilePath, targetFilePath)
      links.push(linkInfo)

      if (linkInfo.needsRepair && linkInfo.resolved !== linkInfo.original) {
        replacements.push({
          original: fullMatch,
          replacement: `[${linkText}](${linkInfo.resolved})`,
        })
      }
    }

    // Apply all replacements
    for (const replacement of replacements) {
      processedContent = processedContent.replace(replacement.original, replacement.replacement)
    }

    return processedContent
  }

  /**
   * Process and copy images
   */
  private async processImages(
    content: string,
    sourceFilePath: string,
    targetFilePath: string,
    images: ImageInfo[]
  ): Promise<string> {
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g
    let processedContent = content
    const replacements: Array<{ original: string; replacement: string }> = []

    let match: RegExpExecArray | null
    // biome-ignore lint/suspicious/noAssignInExpressions: Standard regex pattern matching
    while ((match = imageRegex.exec(content)) !== null) {
      const [fullMatch, altText, imagePath] = match

      // Skip external images
      if (imagePath.startsWith('http')) {
        images.push({
          original: imagePath,
          resolved: imagePath,
          copied: false,
          alt: altText,
        })
        continue
      }

      const imageInfo = await this.processImage(imagePath, altText, sourceFilePath, targetFilePath)
      images.push(imageInfo)

      if (imageInfo.copied && imageInfo.outputPath) {
        const newImagePath = this.getRelativeImagePath(imageInfo.outputPath, targetFilePath)
        replacements.push({
          original: fullMatch,
          replacement: `![${altText || basename(imageInfo.original, extname(imageInfo.original))}](${newImagePath})`,
        })
      }
    }

    // Apply all replacements
    for (const replacement of replacements) {
      processedContent = processedContent.replace(replacement.original, replacement.replacement)
    }

    return processedContent
  }

  /**
   * Process a single internal link
   */
  private async processInternalLink(
    linkUrl: string,
    sourceFilePath: string,
    targetFilePath: string
  ): Promise<LinkInfo> {
    const sourceDir = dirname(sourceFilePath)
    let resolvedPath = linkUrl
    let exists = false
    let needsRepair = false

    try {
      // Handle different link formats
      if (linkUrl.startsWith('./') || linkUrl.startsWith('../') || !linkUrl.startsWith('/')) {
        // Relative link
        resolvedPath = resolve(sourceDir, linkUrl)
      } else {
        // Absolute link (relative to base)
        resolvedPath = resolve(this.baseDir, linkUrl.substring(1))
      }

      // Check if target exists (try different extensions)
      const possiblePaths = [
        resolvedPath,
        `${resolvedPath}.md`,
        `${resolvedPath}.mdx`,
        join(resolvedPath, 'index.md'),
        join(resolvedPath, 'index.mdx'),
      ]

      for (const path of possiblePaths) {
        try {
          await stat(path)
          resolvedPath = path
          exists = true
          break
        } catch {}
      }

      // If link exists, convert to proper relative path for Starlight
      if (exists) {
        const targetDir = dirname(targetFilePath)
        const relativePath = relative(targetDir, resolvedPath)

        // Convert to Starlight-friendly format
        let starlightPath = relativePath
          .replace(/\.mdx?$/, '') // Remove .md/.mdx extensions
          .replace(/\/index$/, '') // Remove /index suffixes
          .replace(/\\/g, '/') // Normalize path separators

        // Make sure it starts with ./ for relative paths
        if (!(starlightPath.startsWith('./') || starlightPath.startsWith('../'))) {
          starlightPath = `./${starlightPath}`
        }

        resolvedPath = starlightPath
        needsRepair = starlightPath !== linkUrl
      } else {
        needsRepair = true
      }
    } catch (error) {
      needsRepair = true
    }

    return {
      original: linkUrl,
      resolved: resolvedPath,
      isInternal: true,
      exists,
      needsRepair,
    }
  }

  /**
   * Process and copy a single image
   */
  private async processImage(
    imagePath: string,
    altText: string,
    sourceFilePath: string,
    targetFilePath: string
  ): Promise<ImageInfo> {
    const sourceDir = dirname(sourceFilePath)
    let resolvedPath: string = imagePath // Initialize with original path
    let copied = false
    let outputPath: string | undefined
    const possiblePaths: string[] = []

    try {
      // Try multiple resolution strategies
      if (imagePath.startsWith('./') || imagePath.startsWith('../') || !imagePath.startsWith('/')) {
        // Relative path - try from source directory
        possiblePaths.push(resolve(sourceDir, imagePath))

        // Also try from common image directories
        possiblePaths.push(resolve(sourceDir, 'images', basename(imagePath)))
        possiblePaths.push(resolve(sourceDir, 'assets', basename(imagePath)))
        possiblePaths.push(resolve(this.baseDir, 'images', basename(imagePath)))
        possiblePaths.push(resolve(this.baseDir, 'assets', basename(imagePath)))
      } else {
        // Absolute path
        possiblePaths.push(resolve(this.baseDir, imagePath.substring(1)))
      }

      // If it's just a filename, search in common directories
      if (!imagePath.includes('/')) {
        possiblePaths.push(resolve(sourceDir, 'images', imagePath))
        possiblePaths.push(resolve(sourceDir, 'assets', imagePath))
        possiblePaths.push(resolve(this.baseDir, 'images', imagePath))
        possiblePaths.push(resolve(this.baseDir, 'assets', imagePath))
        possiblePaths.push(resolve(this.baseDir, 'src', 'assets', imagePath))
        possiblePaths.push(resolve(this.baseDir, 'public', imagePath))
      }

      // Try to find the image in any of the possible locations
      let foundPath: string | null = null
      for (const path of possiblePaths) {
        try {
          await stat(path)
          foundPath = path
          resolvedPath = path
          break
        } catch {
          // Continue searching
        }
      }

      if (foundPath) {
        // Copy image to assets directory with collision handling
        const imageName = basename(foundPath)
        const imageExt = extname(imageName)
        const imageBase = basename(imageName, imageExt)
        const assetsPath = join(dirname(this.outputDir), this.assetsDir)

        // Create assets directory if it doesn't exist
        await mkdir(assetsPath, { recursive: true })

        // Handle filename collisions
        let finalImageName = imageName
        let counter = 1
        while (true) {
          const candidatePath = join(assetsPath, finalImageName)
          try {
            await stat(candidatePath)
            // File exists, try with suffix
            finalImageName = `${imageBase}-${counter}${imageExt}`
            counter++
          } catch {
            // File doesn't exist, we can use this name
            outputPath = candidatePath
            break
          }
        }

        // Copy the image
        await copyFile(foundPath, outputPath)
        copied = true
      } else {
        // Image not found - keep original path but log warning
        resolvedPath = imagePath
        if (this.logger) {
          this.logger.warn(`Image not found: ${imagePath}`)
          this.logger.warn(`Searched in: ${possiblePaths.join(', ')}`)
          this.logger.warn(
            'Consider running with --process-images flag or ensuring images are in the correct location'
          )
        }
      }
    } catch (error) {
      resolvedPath = imagePath
      if (this.logger) {
        this.logger.error(`Error processing image ${imagePath}:`, error)
      }
    }

    return {
      original: imagePath,
      resolved: resolvedPath,
      copied,
      outputPath,
      alt: altText,
    }
  }

  /**
   * Get relative path for image in markdown
   */
  private getRelativeImagePath(imagePath: string, targetFilePath: string): string {
    const targetDir = dirname(targetFilePath)
    let relativePath = relative(targetDir, imagePath)

    // Convert Windows paths to forward slashes
    relativePath = relativePath.replace(/\\/g, '/')

    // For Astro compatibility, if the image is in assets directory,
    // we might need to adjust the path format
    if (relativePath.includes('../assets/')) {
      // Create a cleaner path for Astro imports
      const imageName = basename(imagePath)
      // Keep the relative path but ensure it's properly formatted
      return relativePath
    }

    return relativePath
  }

  /**
   * Generate an image report
   */
  generateImageReport(images: ImageInfo[]): {
    total: number
    copied: number
    external: number
    missing: number
    missingImages: string[]
  } {
    const external = images.filter((img) => img.original.startsWith('http')).length
    const copied = images.filter((img) => img.copied).length
    const missing = images.filter((img) => !(img.copied || img.original.startsWith('http'))).length
    const missingImages = images
      .filter((img) => !(img.copied || img.original.startsWith('http')))
      .map((img) => img.original)

    return {
      total: images.length,
      copied,
      external,
      missing,
      missingImages,
    }
  }

  /**
   * Generate suggestions for missing images
   */
  generateImageSuggestions(missingImages: string[]): string[] {
    const suggestions: string[] = []

    if (missingImages.length > 0) {
      suggestions.push('🖼️  Missing Images Found')
      suggestions.push('')
      suggestions.push('The following images could not be found during conversion:')
      suggestions.push('')

      missingImages.forEach((img, index) => {
        suggestions.push(`${index + 1}. ${img}`)
      })

      suggestions.push('')
      suggestions.push('💡 To fix this:')
      suggestions.push('1. Ensure images exist in one of these locations:')
      suggestions.push('   • Same directory as the source file')
      suggestions.push('   • ./images/ subdirectory')
      suggestions.push('   • ./assets/ subdirectory')
      suggestions.push('   • Project root /images/ or /assets/')
      suggestions.push('   • /src/assets/ directory')
      suggestions.push('   • /public/ directory')
      suggestions.push('')
      suggestions.push('2. Or run the conversion with --process-images flag')
      suggestions.push('')
      suggestions.push('3. For Astro projects, consider placing images in:')
      suggestions.push('   • src/assets/ for processed images')
      suggestions.push('   • public/ for static images')
    }

    return suggestions
  }

  /**
   * Generate a link report
   */
  generateLinkReport(links: LinkInfo[]): {
    total: number
    internal: number
    external: number
    broken: number
    repaired: number
  } {
    const internal = links.filter((l) => l.isInternal)
    const external = links.filter((l) => !l.isInternal)
    const broken = links.filter((l) => l.isInternal && !l.exists)
    const repaired = links.filter((l) => l.needsRepair && l.exists)

    return {
      total: links.length,
      internal: internal.length,
      external: external.length,
      broken: broken.length,
      repaired: repaired.length,
    }
  }

  /**
   * Extract all images from content for batch processing
   */
  static extractImages(content: string): Array<{ alt: string; src: string }> {
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g
    const images: Array<{ alt: string; src: string }> = []

    let match
    while ((match = imageRegex.exec(content)) !== null) {
      images.push({
        alt: match[1] || '',
        src: match[2],
      })
    }

    return images
  }

  /**
   * Extract all links from content for batch processing
   */
  static extractLinks(content: string): Array<{ text: string; url: string }> {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
    const links: Array<{ text: string; url: string }> = []

    let match
    while ((match = linkRegex.exec(content)) !== null) {
      links.push({
        text: match[1],
        url: match[2],
      })
    }

    return links
  }
}
