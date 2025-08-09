import { copyFile, mkdir, stat } from 'node:fs/promises';
import { dirname, join, relative, resolve, basename, extname } from 'node:path';
import type { LinkInfo, ImageInfo } from '../../types.js';

export class LinkImageProcessor {
  private baseDir: string;
  private outputDir: string;
  private assetsDir: string;

  constructor(baseDir: string, outputDir: string, assetsDir = 'assets') {
    this.baseDir = baseDir;
    this.outputDir = outputDir;
    this.assetsDir = assetsDir;
  }

  /**
   * Process all links and images in markdown content
   */
  async processContent(
    content: string, 
    sourceFilePath: string, 
    targetFilePath: string
  ): Promise<{ content: string; links: LinkInfo[]; images: ImageInfo[] }> {
    const links: LinkInfo[] = [];
    const images: ImageInfo[] = [];

    // Process images first
    let processedContent = await this.processImages(content, sourceFilePath, targetFilePath, images);
    
    // Then process links
    processedContent = await this.processLinks(processedContent, sourceFilePath, targetFilePath, links);

    return {
      content: processedContent,
      links,
      images
    };
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
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let processedContent = content;
    const replacements: Array<{ original: string; replacement: string }> = [];

    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      const [fullMatch, linkText, linkUrl] = match;
      
      // Skip external links and anchors
      if (linkUrl.startsWith('http') || linkUrl.startsWith('mailto:') || linkUrl.startsWith('#')) {
        links.push({
          original: linkUrl,
          resolved: linkUrl,
          isInternal: false,
          exists: true, // Assume external links exist
          needsRepair: false
        });
        continue;
      }

      const linkInfo = await this.processInternalLink(linkUrl, sourceFilePath, targetFilePath);
      links.push(linkInfo);

      if (linkInfo.needsRepair && linkInfo.resolved !== linkInfo.original) {
        replacements.push({
          original: fullMatch,
          replacement: `[${linkText}](${linkInfo.resolved})`
        });
      }
    }

    // Apply all replacements
    for (const replacement of replacements) {
      processedContent = processedContent.replace(replacement.original, replacement.replacement);
    }

    return processedContent;
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
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let processedContent = content;
    const replacements: Array<{ original: string; replacement: string }> = [];

    let match;
    while ((match = imageRegex.exec(content)) !== null) {
      const [fullMatch, altText, imagePath] = match;

      // Skip external images
      if (imagePath.startsWith('http')) {
        images.push({
          original: imagePath,
          resolved: imagePath,
          copied: false,
          alt: altText
        });
        continue;
      }

      const imageInfo = await this.processImage(imagePath, altText, sourceFilePath, targetFilePath);
      images.push(imageInfo);

      if (imageInfo.copied && imageInfo.outputPath) {
        const newImagePath = this.getRelativeImagePath(imageInfo.outputPath, targetFilePath);
        replacements.push({
          original: fullMatch,
          replacement: `![${altText || basename(imageInfo.original, extname(imageInfo.original))}](${newImagePath})`
        });
      }
    }

    // Apply all replacements
    for (const replacement of replacements) {
      processedContent = processedContent.replace(replacement.original, replacement.replacement);
    }

    return processedContent;
  }

  /**
   * Process a single internal link
   */
  private async processInternalLink(
    linkUrl: string,
    sourceFilePath: string,
    targetFilePath: string
  ): Promise<LinkInfo> {
    const sourceDir = dirname(sourceFilePath);
    let resolvedPath = linkUrl;
    let exists = false;
    let needsRepair = false;

    try {
      // Handle different link formats
      if (linkUrl.startsWith('./') || linkUrl.startsWith('../') || !linkUrl.startsWith('/')) {
        // Relative link
        resolvedPath = resolve(sourceDir, linkUrl);
      } else {
        // Absolute link (relative to base)
        resolvedPath = resolve(this.baseDir, linkUrl.substring(1));
      }

      // Check if target exists (try different extensions)
      const possiblePaths = [
        resolvedPath,
        resolvedPath + '.md',
        resolvedPath + '.mdx',
        join(resolvedPath, 'index.md'),
        join(resolvedPath, 'index.mdx')
      ];

      for (const path of possiblePaths) {
        try {
          await stat(path);
          resolvedPath = path;
          exists = true;
          break;
        } catch {
          continue;
        }
      }

      // If link exists, convert to proper relative path for Starlight
      if (exists) {
        const targetDir = dirname(targetFilePath);
        const relativePath = relative(targetDir, resolvedPath);
        
        // Convert to Starlight-friendly format
        let starlightPath = relativePath
          .replace(/\.mdx?$/, '') // Remove .md/.mdx extensions
          .replace(/\/index$/, '') // Remove /index suffixes
          .replace(/\\/g, '/'); // Normalize path separators

        // Make sure it starts with ./ for relative paths
        if (!starlightPath.startsWith('./') && !starlightPath.startsWith('../')) {
          starlightPath = './' + starlightPath;
        }

        resolvedPath = starlightPath;
        needsRepair = starlightPath !== linkUrl;
      } else {
        needsRepair = true;
      }

    } catch (error) {
      needsRepair = true;
    }

    return {
      original: linkUrl,
      resolved: resolvedPath,
      isInternal: true,
      exists,
      needsRepair
    };
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
    const sourceDir = dirname(sourceFilePath);
    let resolvedPath: string;
    let copied = false;
    let outputPath: string | undefined;

    try {
      // Resolve image path
      if (imagePath.startsWith('./') || imagePath.startsWith('../') || !imagePath.startsWith('/')) {
        resolvedPath = resolve(sourceDir, imagePath);
      } else {
        resolvedPath = resolve(this.baseDir, imagePath.substring(1));
      }

      // Check if image exists
      try {
        await stat(resolvedPath);
        
        // Copy image to assets directory
        const imageName = basename(resolvedPath);
        const targetDir = dirname(targetFilePath);
        const assetsPath = join(dirname(this.outputDir), this.assetsDir);
        
        // Create assets directory if it doesn't exist
        await mkdir(assetsPath, { recursive: true });
        
        outputPath = join(assetsPath, imageName);
        
        // Copy the image
        await copyFile(resolvedPath, outputPath);
        copied = true;

      } catch (error) {
        // Image doesn't exist or couldn't be copied
        resolvedPath = imagePath;
      }

    } catch (error) {
      resolvedPath = imagePath;
    }

    return {
      original: imagePath,
      resolved: resolvedPath,
      copied,
      outputPath,
      alt: altText
    };
  }

  /**
   * Get relative path for image in markdown
   */
  private getRelativeImagePath(imagePath: string, targetFilePath: string): string {
    const targetDir = dirname(targetFilePath);
    const relativePath = relative(targetDir, imagePath);
    return relativePath.replace(/\\/g, '/');
  }

  /**
   * Generate a link report
   */
  generateLinkReport(links: LinkInfo[]): {
    total: number;
    internal: number;
    external: number;
    broken: number;
    repaired: number;
  } {
    const internal = links.filter(l => l.isInternal);
    const external = links.filter(l => !l.isInternal);
    const broken = links.filter(l => l.isInternal && !l.exists);
    const repaired = links.filter(l => l.needsRepair && l.exists);

    return {
      total: links.length,
      internal: internal.length,
      external: external.length,
      broken: broken.length,
      repaired: repaired.length
    };
  }

  /**
   * Generate an image report
   */
  generateImageReport(images: ImageInfo[]): {
    total: number;
    copied: number;
    external: number;
    missing: number;
  } {
    const copied = images.filter(i => i.copied);
    const external = images.filter(i => i.original.startsWith('http'));
    const missing = images.filter(i => !i.copied && !i.original.startsWith('http'));

    return {
      total: images.length,
      copied: copied.length,
      external: external.length,
      missing: missing.length
    };
  }

  /**
   * Extract all images from content for batch processing
   */
  static extractImages(content: string): Array<{ alt: string; src: string }> {
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const images: Array<{ alt: string; src: string }> = [];
    
    let match;
    while ((match = imageRegex.exec(content)) !== null) {
      images.push({
        alt: match[1] || '',
        src: match[2]
      });
    }
    
    return images;
  }

  /**
   * Extract all links from content for batch processing
   */
  static extractLinks(content: string): Array<{ text: string; url: string }> {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const links: Array<{ text: string; url: string }> = [];
    
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      links.push({
        text: match[1],
        url: match[2]
      });
    }
    
    return links;
  }
}