import { describe, it, expect } from 'vitest';
import { TocGenerator } from './toc-generator.js';

describe('TocGenerator', () => {
  const tocGen = new TocGenerator();

  describe('generateToc', () => {
    it('should generate table of contents from markdown headings', () => {
      const content = `# Main Title

## Section 1

Content for section 1.

### Subsection 1.1

More content.

### Subsection 1.2

Even more content.

## Section 2

Content for section 2.

### Subsection 2.1

Final content.`;

      const toc = tocGen.generateToc(content);
      
      expect(toc).toHaveLength(1); // The main title with children
      expect(toc[0].title).toBe('Main Title');
      expect(toc[0].level).toBe(1);
      expect(toc[0].children).toHaveLength(2); // Two main sections
      expect(toc[0].children?.[0].title).toBe('Section 1');
      expect(toc[0].children?.[0].children).toHaveLength(2); // Two subsections
      expect(toc[0].children?.[1].title).toBe('Section 2');
      expect(toc[0].children?.[1].children).toHaveLength(1); // One subsection
    });

    it('should return empty array for insufficient headings', () => {
      const content = `# Single Title

Content without enough headings.`;

      const toc = tocGen.generateToc(content);
      expect(toc).toHaveLength(0);
    });

    it('should respect max depth', () => {
      const content = `# Title
## Section
### Subsection
#### Sub-subsection
##### Deep section
###### Very deep section`;

      const tocGen4 = new TocGenerator(4, 2);
      const toc = tocGen4.generateToc(content);
      
      // Should not include headings deeper than level 4
      const allEntries = [];
      const collectEntries = (entries: any[]) => {
        for (const entry of entries) {
          allEntries.push(entry);
          if (entry.children) collectEntries(entry.children);
        }
      };
      collectEntries(toc);
      
      expect(allEntries.every(entry => entry.level <= 4)).toBe(true);
    });

    it('should generate proper anchors', () => {
      const content = `## API Reference
### User Management & Authentication
#### GET /users/{id}`;

      const toc = tocGen.generateToc(content);
      
      expect(toc[0].anchor).toBe('api-reference');
      expect(toc[0].children?.[0].anchor).toBe('user-management-authentication');
      expect(toc[0].children?.[0].children?.[0].anchor).toBe('get-usersid');
    });
  });

  describe('insertTocIntoContent', () => {
    it('should insert TOC after title', () => {
      const content = `# Main Title

Some introduction paragraph.

## Section 1

Content here.`;

      const result = tocGen.insertTocIntoContent(content);
      
      expect(result).toContain('## Table of Contents');
      expect(result).toContain('- [Section 1](#section-1)');
      expect(result.indexOf('## Table of Contents')).toBeLessThan(result.indexOf('## Section 1'));
    });

    it('should handle content with frontmatter', () => {
      const content = `---
title: "Test"
---

# Main Title

## Section 1

Content.`;

      const result = tocGen.insertTocIntoContent(content);
      expect(result).toContain('---\ntitle: "Test"\n---');
      expect(result).toContain('## Table of Contents');
    });

    it('should not modify content with insufficient headings', () => {
      const content = `# Single Title

Content without enough sections.`;

      const result = tocGen.insertTocIntoContent(content);
      expect(result).toBe(content);
    });
  });

  describe('hasExistingToc', () => {
    it('should detect existing table of contents', () => {
      const contentWithToc = `# Title

## Table of Contents

- [Section 1](#section-1)

## Section 1`;

      expect(tocGen.hasExistingToc(contentWithToc)).toBe(true);
    });

    it('should detect HTML TOC', () => {
      const contentWithHtmlToc = `# Title

<nav class="table-of-contents">
<ul><li>Section</li></ul>
</nav>

## Section`;

      expect(tocGen.hasExistingToc(contentWithHtmlToc)).toBe(true);
    });

    it('should return false for content without TOC', () => {
      const content = `# Title

## Section 1

Content here.`;

      expect(tocGen.hasExistingToc(content)).toBe(false);
    });
  });

  describe('renderTocAsMarkdown', () => {
    it('should render TOC as markdown', () => {
      const toc = [
        {
          level: 2,
          title: 'Section 1',
          anchor: 'section-1',
          children: [
            { level: 3, title: 'Subsection', anchor: 'subsection' }
          ]
        },
        { level: 2, title: 'Section 2', anchor: 'section-2' }
      ];

      const markdown = tocGen.renderTocAsMarkdown(toc);
      
      expect(markdown).toContain('## Table of Contents');
      expect(markdown).toContain('- [Section 1](#section-1)');
      expect(markdown).toContain('  - [Subsection](#subsection)');
      expect(markdown).toContain('- [Section 2](#section-2)');
    });
  });

  describe('renderTocAsHtml', () => {
    it('should render TOC as HTML', () => {
      const toc = [
        {
          level: 2,
          title: 'Section 1',
          anchor: 'section-1',
          children: [
            { level: 3, title: 'Subsection', anchor: 'subsection' }
          ]
        }
      ];

      const html = tocGen.renderTocAsHtml(toc);
      
      expect(html).toContain('<nav class="table-of-contents">');
      expect(html).toContain('<h2>Table of Contents</h2>');
      expect(html).toContain('<a href="#section-1">Section 1</a>');
      expect(html).toContain('<a href="#subsection">Subsection</a>');
    });
  });

  describe('removeExistingToc', () => {
    it('should remove markdown TOC', () => {
      const content = `# Title

## Table of Contents

- [Section 1](#section-1)
- [Section 2](#section-2)

## Section 1

Content here.`;

      const result = tocGen.removeExistingToc(content);
      expect(result).not.toContain('Table of Contents');
      expect(result).not.toContain('- [Section 1]');
      expect(result).toContain('## Section 1');
    });

    it('should remove HTML TOC', () => {
      const content = `# Title

<nav class="table-of-contents">
<ul><li><a href="#section">Section</a></li></ul>
</nav>

## Section

Content.`;

      const result = tocGen.removeExistingToc(content);
      expect(result).not.toContain('<nav class="table-of-contents">');
      expect(result).toContain('## Section');
    });
  });
});