import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightDocumentConverter from '@entro314labs/starlight-document-converter';

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: 'My Docs with Document Converter',
      description: 'Example Starlight site with document conversion',
      social: {
        github: 'https://github.com/entro314-labs/starlight-document-converter',
      },
      sidebar: [
        {
          label: 'Guides',
          items: [
            // Converted from Word docs
            { label: 'Getting Started', link: '/guides/getting-started/' },
            { label: 'Advanced Usage', link: '/guides/advanced/' },
          ],
        },
        {
          label: 'API Reference', 
          items: [
            // Converted from HTML
            { label: 'User API', link: '/api/users/' },
            { label: 'Auth API', link: '/api/auth/' },
          ],
        },
      ],
    }),
    
    // Document converter integration
    starlightDocumentConverter({
      // Enable file watching for development
      watch: true,
      
      // Directories to monitor for documents
      inputDirs: [
        'docs-import',      // Main import directory
        'team-docs',        // Team-contributed docs
        'external-content'  // External content imports
      ],
      
      converter: {
        // Output to Starlight content directory
        outputDir: 'src/content/docs',
        
        // Preserve directory structure from input
        preserveStructure: true,
        
        // Auto-generate frontmatter
        generateTitles: true,
        generateDescriptions: true,
        addTimestamps: true,
        
        // Default category for uncategorized docs
        defaultCategory: 'documentation',
        
        // Custom category patterns
        categoryPatterns: {
          'guide': 'Guides',
          'tutorial': 'Tutorials', 
          'api': 'API Reference',
          'reference': 'Reference',
          'blog': 'Blog',
          'news': 'News',
          'changelog': 'Updates'
        },
        
        // Custom tag patterns for content analysis
        tagPatterns: {
          'astro': ['astro', 'starlight', 'astro.build'],
          'javascript': ['javascript', 'js', 'node.js', 'npm'],
          'typescript': ['typescript', 'ts'],
          'react': ['react', 'jsx', 'react.js'],
          'api': ['api', 'rest', 'graphql', 'endpoint'],
          'guide': ['guide', 'tutorial', 'how-to'],
          'advanced': ['advanced', 'expert', 'deep-dive']
        },
        
        // Verbose logging for development
        verbose: true
      }
    })
  ],
});