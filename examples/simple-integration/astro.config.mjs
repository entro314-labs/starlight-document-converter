import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightDocumentConverter from '@entro314labs/starlight-document-converter';

export default defineConfig({
  integrations: [
    starlight({
      title: 'My Documentation',
      description: 'Documentation made easy with Starlight',
      sidebar: [
        {
          label: 'Start Here',
          items: [
            { label: 'Welcome', link: '/welcome/' },
          ],
        },
        {
          label: 'Guides',
          autogenerate: { directory: 'guides' },
        },
        {
          label: 'API',
          autogenerate: { directory: 'api' },
        },
      ],
    }),
    
    // 🎉 That's it! The converter will:
    // ✅ Auto-detect your content directory (src/content/docs)
    // ✅ Look for import directories (docs-import, documents, etc.)  
    // ✅ Convert files automatically when you add them
    starlightDocumentConverter({
      // Optional: Enable file watching during development
      watch: true,
    })
  ],
});