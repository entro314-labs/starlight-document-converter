import { describe, expect, it } from 'vitest'
import { JSXTransformer } from './jsx-transformer.js'
import type { ProcessingContext } from '../types.js'

describe('JSXTransformer', () => {
  const createContext = (extension = '.md'): ProcessingContext => ({
    inputPath: '/test/input.md',
    outputPath: '/test/output.mdx',
    filename: 'input.md',
    extension,
    options: {},
  })

  describe('GitHub Alerts', () => {
    it('should transform GitHub-style alerts to Aside', async () => {
      const transformer = new JSXTransformer({ githubAlerts: true })
      const input = `> [!NOTE]
> This is important information`

      const result = await transformer.process(input, createContext())

      expect(result).toContain('<Aside type="note">')
      expect(result).toContain('This is important information')
      expect(result).toContain('</Aside>')
    })

    it('should handle all GitHub alert types', async () => {
      const transformer = new JSXTransformer()
      const alertTypes = {
        NOTE: 'note',
        TIP: 'tip',
        IMPORTANT: 'note',
        WARNING: 'caution',
        CAUTION: 'caution',
      }

      for (const [githubType, mappedType] of Object.entries(alertTypes)) {
        const input = `> [!${githubType}]\n> Content`
        const result = await transformer.process(input, createContext())
        expect(result).toContain(`<Aside type="${mappedType}">`)
      }
    })
  })

  describe('Admonitions', () => {
    it('should transform Docusaurus-style admonitions', async () => {
      const transformer = new JSXTransformer({ admonitions: true })
      const input = `:::note Custom Title
This is the content
:::`

      const result = await transformer.process(input, createContext())

      expect(result).toContain('<Aside type="note" title="Custom Title">')
      expect(result).toContain('This is the content')
      expect(result).toContain('</Aside>')
    })

    it('should handle admonitions without titles', async () => {
      const transformer = new JSXTransformer()
      const input = `:::tip
Just a tip
:::`

      const result = await transformer.process(input, createContext())

      expect(result).toContain('<Aside type="tip">')
      expect(result).not.toContain('title=')
    })

    it('should handle all admonition types', async () => {
      const transformer = new JSXTransformer()
      const types = ['note', 'tip', 'info', 'caution', 'danger', 'warning']

      for (const type of types) {
        const input = `:::${type}\nContent\n:::`
        const result = await transformer.process(input, createContext())
        expect(result).toContain(`<Aside type="${type}">`)
      }
    })
  })

  describe('Expandable Sections', () => {
    it('should transform details/summary to Details component', async () => {
      const transformer = new JSXTransformer({ expandableSections: true })
      const input = `<details>
<summary>Click to expand</summary>
Hidden content here
</details>`

      const result = await transformer.process(input, createContext())

      expect(result).toContain('<Details summary="Click to expand">')
      expect(result).toContain('Hidden content here')
      expect(result).toContain('</Details>')
    })
  })

  describe('Link Cards', () => {
    it('should transform link card patterns to LinkCard components', async () => {
      const transformer = new JSXTransformer({ linkCards: true })
      const input = `[card: Documentation](https://example.com)
Learn more about our API
[/card]`

      const result = await transformer.process(input, createContext())

      expect(result).toContain('<LinkCard')
      expect(result).toContain('title="Documentation"')
      expect(result).toContain('href="https://example.com"')
      expect(result).toContain('description="Learn more about our API"')
    })

    it('should handle link cards without descriptions', async () => {
      const transformer = new JSXTransformer()
      const input = `[card: Quick Link](https://example.com)
[/card]`

      const result = await transformer.process(input, createContext())

      expect(result).toContain('<LinkCard')
      expect(result).not.toContain('description=')
    })
  })

  describe('File Trees', () => {
    it('should transform file tree code blocks', async () => {
      const transformer = new JSXTransformer({ fileTrees: true })
      const input = `\`\`\`tree
src/
  components/
    Button.tsx
  utils/
    helpers.ts
\`\`\``

      const result = await transformer.process(input, createContext())

      expect(result).toContain('<FileTree>')
      expect(result).toContain('src/')
      expect(result).toContain('components/')
      expect(result).toContain('Button.tsx')
      expect(result).toContain('</FileTree>')
    })

    it('should preserve indentation in file trees', async () => {
      const transformer = new JSXTransformer()
      const input = `\`\`\`tree
root/
  child/
    grandchild.txt
\`\`\``

      const result = await transformer.process(input, createContext())

      expect(result).toContain('- root/')
      expect(result).toContain('- child/')
      expect(result).toContain('- grandchild.txt')
    })
  })

  describe('Custom Rules', () => {
    it('should apply custom transformation rules', async () => {
      const customRule = {
        pattern: /\[highlight\](.*?)\[\/highlight\]/g,
        replacement: '<mark>$1</mark>',
        imports: [{ name: 'Mark', source: '@/components' }],
      }

      const transformer = new JSXTransformer({ customRules: [customRule] })
      const input = '[highlight]important text[/highlight]'

      const result = await transformer.process(input, createContext())

      expect(result).toContain('<mark>important text</mark>')
    })

    it('should track imports from custom rules', async () => {
      const customRule = {
        pattern: /\[custom\](.*?)\[\/custom\]/g,
        replacement: '<Custom>$1</Custom>',
        imports: [{ name: 'Custom', source: '@/custom' }],
      }

      const transformer = new JSXTransformer({ customRules: [customRule] })
      const input = '[custom]content[/custom]'

      const result = await transformer.process(input, createContext())

      expect(result).toContain("import { Custom } from '@/custom'")
    })
  })

  describe('Import Management', () => {
    it('should add imports after frontmatter', async () => {
      const transformer = new JSXTransformer()
      const input = `---
title: Test
---

:::note
Content
:::`

      const result = await transformer.process(input, createContext())

      const frontmatterEnd = result.indexOf('---', 3) + 4
      const afterFrontmatter = result.slice(frontmatterEnd, frontmatterEnd + 100)

      expect(afterFrontmatter).toContain('import')
    })

    it('should not duplicate existing imports', async () => {
      const transformer = new JSXTransformer()
      const input = `import { Aside } from '@astrojs/starlight/components';

:::note
Content
:::`

      const result = await transformer.process(input, createContext())

      // Should not add another import
      const importCount = (result.match(/import.*Aside/g) || []).length
      expect(importCount).toBe(1)
    })

    it('should group imports by source', async () => {
      const transformer = new JSXTransformer()
      const input = `:::note
Note content
:::

<details>
<summary>More</summary>
Details content
</details>`

      const result = await transformer.process(input, createContext())

      // Should have one import with both Aside and Details
      const importMatches = result.match(/import \{[^}]+\}/g)
      expect(importMatches).toBeTruthy()
      expect(importMatches![0]).toContain('Aside')
      expect(importMatches![0]).toContain('Details')
    })
  })

  describe('Selective Transformations', () => {
    it('should only apply enabled transformations', async () => {
      const transformer = new JSXTransformer({
        githubAlerts: true,
        admonitions: false,
        expandableSections: false,
      })

      const input = `> [!NOTE]
> GitHub alert

:::note
Admonition
:::`

      const result = await transformer.process(input, createContext())

      expect(result).toContain('<Aside type="note">')
      expect(result).toContain('GitHub alert')
      // Admonition should not be transformed
      expect(result).toContain(':::note')
    })
  })
})
