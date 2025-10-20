import { describe, expect, it } from 'vitest'
import { MDXConverter } from './mdx-converter.js'
import type { ProcessingContext } from '../types.js'

describe('MDXConverter', () => {
  const createContext = (extension = '.md'): ProcessingContext => ({
    inputPath: '/test/input.md',
    outputPath: '/test/output.mdx',
    filename: 'input.md',
    extension,
    options: {},
  })

  describe('Callout Conversion', () => {
    it('should convert GitHub-style callouts to Aside components', async () => {
      const converter = new MDXConverter({ convertCallouts: true })
      const input = `> [!NOTE]
> This is a note
> with multiple lines`

      const result = await converter.process(input, createContext())

      expect(result).toContain('<Aside type="note">')
      expect(result).toContain('This is a note')
      expect(result).toContain('with multiple lines')
      expect(result).toContain('</Aside>')
    })

    it('should handle different callout types', async () => {
      const converter = new MDXConverter()
      const types = ['NOTE', 'TIP', 'CAUTION', 'DANGER', 'WARNING']

      for (const type of types) {
        const input = `> [!${type}]\n> Content`
        const result = await converter.process(input, createContext())
        expect(result).toContain('<Aside type="')
        expect(result).toContain('</Aside>')
      }
    })

    it('should not double-convert existing Aside components', async () => {
      const converter = new MDXConverter({ preserveJSX: true })
      const input = '<Aside type="note">Already JSX</Aside>'

      const result = await converter.process(input, createContext())

      expect(result).toBe(input)
    })
  })

  describe('Tab Conversion', () => {
    it('should convert tab patterns to Tabs components', async () => {
      const converter = new MDXConverter({ convertTabs: true })
      const input = `### Tab: JavaScript
console.log('hello')

### Tab: TypeScript
console.log('hello' as string)`

      const result = await converter.process(input, createContext())

      expect(result).toContain('<Tabs>')
      expect(result).toContain('<TabItem label="JavaScript">')
      expect(result).toContain('<TabItem label="TypeScript">')
      expect(result).toContain('</Tabs>')
    })

    it('should handle single tabs gracefully', async () => {
      const converter = new MDXConverter()
      const input = '### Tab: Only One'

      const result = await converter.process(input, createContext())

      expect(result).toContain('### Tab: Only One')
    })
  })

  describe('Code Group Conversion', () => {
    it('should convert multiple code blocks to code tabs', async () => {
      const converter = new MDXConverter({ convertCodeGroups: true })
      const input = `\`\`\`javascript
const x = 1
\`\`\`
\`\`\`typescript
const x: number = 1
\`\`\``

      const result = await converter.process(input, createContext())

      expect(result).toContain('<Tabs>')
      expect(result).toContain('<TabItem label="javascript">')
      expect(result).toContain('<TabItem label="typescript">')
    })

    it('should not convert single code blocks', async () => {
      const converter = new MDXConverter()
      const input = '```javascript\nconst x = 1\n```'

      const result = await converter.process(input, createContext())

      expect(result).toContain('```javascript')
      expect(result).not.toContain('<Tabs>')
    })

    it('should not convert code blocks with same language', async () => {
      const converter = new MDXConverter()
      const input = `\`\`\`javascript
const x = 1
\`\`\`
\`\`\`javascript
const y = 2
\`\`\``

      const result = await converter.process(input, createContext())

      expect(result).not.toContain('<Tabs>')
    })
  })

  describe('Card Conversion', () => {
    it('should convert card patterns to Card components', async () => {
      const converter = new MDXConverter()
      const input = `::: card My Title
Card content here
:::`

      const result = await converter.process(input, createContext())

      expect(result).toContain('<Card title="My Title">')
      expect(result).toContain('Card content here')
      expect(result).toContain('</Card>')
    })

    it('should handle cards without titles', async () => {
      const converter = new MDXConverter()
      const input = `::: card
Content
:::`

      const result = await converter.process(input, createContext())

      expect(result).toContain('<Card>')
      expect(result).not.toContain('title=')
    })
  })

  describe('Badge Conversion', () => {
    it('should convert badge patterns to Badge components', async () => {
      const converter = new MDXConverter()
      const input = '[badge]New[/badge]'

      const result = await converter.process(input, createContext())

      expect(result).toContain('<Badge>')
      expect(result).toContain('New')
      expect(result).toContain('</Badge>')
    })

    it('should handle badge types', async () => {
      const converter = new MDXConverter()
      const input = '[badge type="success"]Done[/badge]'

      const result = await converter.process(input, createContext())

      expect(result).toContain('<Badge variant="success">')
    })
  })

  describe('Import Management', () => {
    it('should add imports after frontmatter', async () => {
      const converter = new MDXConverter({ autoImports: true })
      const input = `---
title: Test
---

> [!NOTE]
> Content`

      const result = await converter.process(input, createContext())

      const frontmatterEnd = result.indexOf('---', 3) + 4
      const importSection = result.slice(frontmatterEnd, frontmatterEnd + 200)

      expect(importSection).toContain('import { Aside }')
      expect(importSection).toContain("from '@astrojs/starlight/components'")
    })

    it('should add imports at beginning if no frontmatter', async () => {
      const converter = new MDXConverter({ autoImports: true })
      const input = '> [!NOTE]\n> Content'

      const result = await converter.process(input, createContext())

      expect(result).toMatch(/^import/)
    })

    it('should group imports by source', async () => {
      const converter = new MDXConverter({ autoImports: true })
      const input = `> [!NOTE]
> Content

### Tab: One
content

### Tab: Two
content`

      const result = await converter.process(input, createContext())

      // Should have one import statement with Aside, Tabs, TabItem
      const importMatches = result.match(/import \{[^}]+\}/g)
      expect(importMatches).toBeTruthy()
      expect(importMatches![0]).toContain('Aside')
      expect(importMatches![0]).toContain('Tabs')
      expect(importMatches![0]).toContain('TabItem')
    })
  })

  describe('Component Mappings', () => {
    it('should use custom component mappings', async () => {
      const converter = new MDXConverter({
        componentMappings: {
          note: 'CustomNote',
        },
      })

      const input = '> [!NOTE]\n> Content'
      const result = await converter.process(input, createContext())

      // Should still use default Aside since mapping is for internal use
      expect(result).toContain('<Aside')
    })
  })

  describe('Preserve JSX', () => {
    it('should skip processing if JSX detected and preserveJSX is true', async () => {
      const converter = new MDXConverter({ preserveJSX: true })
      const input = `import { Something } from 'somewhere'

<Component>
  Content
</Component>`

      const result = await converter.process(input, createContext())

      expect(result).toBe(input)
    })

    it('should process if preserveJSX is false', async () => {
      const converter = new MDXConverter({ preserveJSX: false })
      const input = `<Component>
  Content
</Component>

> [!NOTE]
> New content`

      const result = await converter.process(input, createContext())

      expect(result).toContain('<Aside')
    })
  })
})
