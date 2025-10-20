import { describe, expect, it } from 'vitest'
import { MDXEnhancer } from './mdx-enhancer.js'
import type { ProcessingContext, DocumentMetadata } from '../types.js'

describe('MDXEnhancer', () => {
  const createContext = (content: string, extension = '.mdx'): ProcessingContext => ({
    inputPath: '/test/input.mdx',
    outputPath: '/test/output.mdx',
    filename: 'input.mdx',
    extension,
    options: {},
    data: { content },
  })

  describe('Component Detection', () => {
    it('should detect JSX components in content', async () => {
      const enhancer = new MDXEnhancer({ detectComponents: true })
      const content = `<Aside type="note">
  Content
</Aside>

<Tabs>
  <TabItem label="One">Content</TabItem>
</Tabs>`

      const metadata: DocumentMetadata = {}
      const result = await enhancer.enhance(metadata, createContext(content))

      expect(result.mdxComponents).toContain('Aside')
      expect(result.mdxComponents).toContain('Tabs')
      expect(result.mdxComponents).toContain('TabItem')
      expect(result.componentCount).toBe(3)
    })

    it('should only detect capital-case components', async () => {
      const enhancer = new MDXEnhancer()
      const content = '<div>Regular HTML</div>\n<Component>JSX</Component>'

      const result = await enhancer.enhance({}, createContext(content))

      expect(result.mdxComponents).toContain('Component')
      expect(result.mdxComponents).not.toContain('div')
    })

    it('should return sorted unique components', async () => {
      const enhancer = new MDXEnhancer()
      const content = '<Card />\n<Aside />\n<Card />\n<Badge />'

      const result = await enhancer.enhance({}, createContext(content))

      expect(result.mdxComponents).toEqual(['Aside', 'Badge', 'Card'])
    })
  })

  describe('Complexity Analysis', () => {
    it('should analyze low complexity', async () => {
      const enhancer = new MDXEnhancer({ analyzeComplexity: true })
      const content = '<Aside>Simple content</Aside>'

      const result = await enhancer.enhance({}, createContext(content))

      expect(result.mdxComplexity).toBe('low')
    })

    it('should analyze medium complexity', async () => {
      const enhancer = new MDXEnhancer()
      const content = `import { Component } from 'lib';

<Component>
  <Nested>
    <DeepNested>Content</DeepNested>
  </Nested>
</Component>

{someExpression}
{anotherExpression}`

      const result = await enhancer.enhance({}, createContext(content))

      expect(result.mdxComplexity).toBe('medium')
    })

    it('should analyze high complexity', async () => {
      const enhancer = new MDXEnhancer()
      const content = `import { A } from 'a';
import { B } from 'b';
import { C } from 'c';

export const config = {};

<Component>{expr1}</Component>
<Another>{expr2}</Another>
<Third>{expr3}</Third>
<Fourth>
  <Nested>
    <Deep>
      {complexExpression}
    </Deep>
  </Nested>
</Fourth>
<Fifth />
<Sixth />
<Seventh />`

      const result = await enhancer.enhance({}, createContext(content))

      expect(result.mdxComplexity).toBe('high')
    })
  })

  describe('MDX Tags', () => {
    it('should add mdx tag automatically', async () => {
      const enhancer = new MDXEnhancer({ addMdxTags: true })
      const content = '<Component>Content</Component>'

      const result = await enhancer.enhance({ tags: [] }, createContext(content))

      expect(result.tags).toContain('mdx')
    })

    it('should detect component-specific tags', async () => {
      const enhancer = new MDXEnhancer()
      const content = `<Tabs>
  <TabItem label="One">Content</TabItem>
</Tabs>

<Card title="Card">Content</Card>

<Aside type="note">Note</Aside>`

      const result = await enhancer.enhance({ tags: [] }, createContext(content))

      expect(result.tags).toContain('tabs')
      expect(result.tags).toContain('cards')
      expect(result.tags).toContain('callouts')
    })

    it('should detect interactive elements', async () => {
      const enhancer = new MDXEnhancer()
      const content = '<Button onClick={handler}>Click</Button>'

      const result = await enhancer.enhance({ tags: [] }, createContext(content))

      expect(result.tags).toContain('interactive')
    })

    it('should preserve existing tags', async () => {
      const enhancer = new MDXEnhancer()
      const content = '<Component />'

      const result = await enhancer.enhance({ tags: ['existing', 'tags'] }, createContext(content))

      expect(result.tags).toContain('existing')
      expect(result.tags).toContain('tags')
      expect(result.tags).toContain('mdx')
    })
  })

  describe('Interactivity Detection', () => {
    it('should detect event handlers', async () => {
      const enhancer = new MDXEnhancer({ detectInteractivity: true })
      const content = '<Button onClick={handler}>Click</Button>'

      const result = await enhancer.enhance({}, createContext(content))

      expect(result.isInteractive).toBe(true)
      expect(result.interactiveFeatures).toContain('event-handlers')
    })

    it('should detect state management', async () => {
      const enhancer = new MDXEnhancer()
      const content = `const [state, setState] = useState(0);`

      const result = await enhancer.enhance({}, createContext(content))

      expect(result.isInteractive).toBe(true)
      expect(result.interactiveFeatures).toContain('state-management')
    })

    it('should detect effects', async () => {
      const enhancer = new MDXEnhancer()
      const content = `useEffect(() => {
  // do something
}, [])`

      const result = await enhancer.enhance({}, createContext(content))

      expect(result.isInteractive).toBe(true)
      expect(result.interactiveFeatures).toContain('side-effects')
    })

    it('should detect forms', async () => {
      const enhancer = new MDXEnhancer()
      const content = '<form><input type="text" /></form>'

      const result = await enhancer.enhance({}, createContext(content))

      expect(result.isInteractive).toBe(true)
      expect(result.interactiveFeatures).toContain('forms')
    })

    it('should detect client directives', async () => {
      const enhancer = new MDXEnhancer()
      const content = '<Component client:load>Content</Component>'

      const result = await enhancer.enhance({}, createContext(content))

      expect(result.isInteractive).toBe(true)
      expect(result.interactiveFeatures).toContain('client-hydration')
    })

    it('should not be interactive if no features detected', async () => {
      const enhancer = new MDXEnhancer()
      const content = '<Aside>Static content</Aside>'

      const result = await enhancer.enhance({}, createContext(content))

      expect(result.isInteractive).toBe(false)
      expect(result.interactiveFeatures).toEqual([])
    })
  })

  describe('Format Detection', () => {
    it('should set format to mdx for .mdx files', async () => {
      const enhancer = new MDXEnhancer()
      const content = 'Content'

      const result = await enhancer.enhance({}, createContext(content, '.mdx'))

      expect(result.format).toBe('mdx')
    })

    it('should not enhance .md files', async () => {
      const enhancer = new MDXEnhancer()
      const content = '<Component />'

      const result = await enhancer.enhance({}, createContext(content, '.md'))

      expect(result.format).toBeUndefined()
      expect(result.mdxComponents).toBeUndefined()
    })

    it('should detect frontmatter', async () => {
      const enhancer = new MDXEnhancer()
      const content = `---
title: Test
---

Content`

      const result = await enhancer.enhance({}, createContext(content))

      expect(result.hasFrontmatter).toBe(true)
    })

    it('should detect imports', async () => {
      const enhancer = new MDXEnhancer()
      const content = `import { Component } from 'lib';

<Component />`

      const result = await enhancer.enhance({}, createContext(content))

      expect(result.hasImports).toBe(true)
    })
  })

  describe('Selective Enhancement', () => {
    it('should only run enabled enhancements', async () => {
      const enhancer = new MDXEnhancer({
        detectComponents: true,
        analyzeComplexity: false,
        addMdxTags: false,
        detectInteractivity: false,
      })

      const content = '<Component onClick={handler}>Content</Component>'
      const result = await enhancer.enhance({}, createContext(content))

      expect(result.mdxComponents).toBeDefined()
      expect(result.mdxComplexity).toBeUndefined()
      expect(result.tags).toBeUndefined()
      expect(result.isInteractive).toBeUndefined()
    })
  })
})
