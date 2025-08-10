import { describe, it, expect } from 'vitest'
import { ContentAnalyzer } from './content-analyzer.js'

describe('ContentAnalyzer', () => {
  const analyzer = new ContentAnalyzer()

  describe('analyzeContent', () => {
    it('should analyze markdown content and generate metadata', () => {
      const content = `---
existing: "metadata"
---

# API Documentation

This comprehensive guide covers the REST API endpoints for user management and authentication.

## Authentication

All API endpoints require authentication via JWT tokens.

### POST /auth/login

Authenticate a user and receive a JWT token.

\`\`\`javascript
fetch('/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
\`\`\`

## User Management

### GET /users

Retrieve a list of users.`

      const result = analyzer.analyzeContent(content, '/docs/api.md')

      expect(result.metadata.title).toBe('API Documentation')
      expect(result.metadata.description).toContain('comprehensive guide')
      expect(result.metadata.category).toBe('Reference')
      expect(result.metadata.tags).toContain('api')
      expect(result.metadata.tags).toContain('javascript')

      expect(result.analysis.wordCount).toBeGreaterThan(40)
      expect(result.analysis.readingTime).toBeGreaterThan(0)
      expect(result.analysis.contentType).toBe('reference')
      expect(result.analysis.complexity).toMatch(/simple|moderate|complex/)
      expect(result.analysis.headingStructure.length).toBeGreaterThan(0)
    })

    it('should detect tutorial content', () => {
      const content = `# Getting Started Tutorial

Step 1: Install the package
Step 2: Configure your project
Finally, run your first conversion.`

      const result = analyzer.analyzeContent(content, '/guides/tutorial.md')
      expect(result.analysis.contentType).toBe('tutorial')
      expect(result.metadata.category).toBe('Guides')
    })

    it('should detect guide content', () => {
      const content = `# How to Setup Your Environment

This guide will help you set up your development environment.

## Overview

Getting started is easy...`

      const result = analyzer.analyzeContent(content, '/guides/setup.md')
      expect(result.analysis.contentType).toBe('guide')
      expect(result.metadata.tags).toContain('guide')
    })

    it('should assess content complexity', () => {
      const simpleContent = `# Simple

Short content.`

      const simpleResult = analyzer.analyzeContent(simpleContent, '/simple.md')
      expect(simpleResult.analysis.complexity).toBe('simple')

      const complexContent = `# Complex Document

${'Long content with many words. '.repeat(200)}

## Section 1
## Section 2
## Section 3
## Section 4
## Section 5
## Section 6

\`\`\`javascript
code block 1
\`\`\`

\`\`\`python
code block 2
\`\`\`

\`\`\`bash
code block 3
\`\`\`

\`\`\`typescript
code block 4
\`\`\`

[Link 1](http://example1.com)
[Link 2](http://example2.com)
[Link 3](http://example3.com)
[Link 4](http://example4.com)
[Link 5](http://example5.com)
[Link 6](http://example6.com)
[Link 7](http://example7.com)
[Link 8](http://example8.com)
[Link 9](http://example9.com)
[Link 10](http://example10.com)
[Link 11](http://example11.com)`

      const complexResult = analyzer.analyzeContent(complexContent, '/complex.md')
      expect(complexResult.analysis.complexity).toBe('complex')
    })

    it('should extract topics from content', () => {
      const content = `# **React** Development Guide

Learn about **useState**, **useEffect**, and other **React hooks**.

## **TypeScript** Integration

Working with **TypeScript** in React projects.`

      const result = analyzer.analyzeContent(content, '/react-ts.md')
      expect(result.metadata.tags).toContain('react')
      expect(result.metadata.tags).toContain('typescript')
    })

    it('should infer category from path', () => {
      const content = `# Test Content

Some content.`

      const result = analyzer.analyzeContent(content, '/api/endpoints.md')
      expect(result.metadata.category).toBe('Reference')
    })

    it('should generate reading time estimate', () => {
      const content = `# Test Document

${'This is a paragraph with multiple words to test reading time calculation. '.repeat(50)}`

      const result = analyzer.analyzeContent(content, '/test.md')
      expect(result.analysis.readingTime).toBeGreaterThan(1)
      expect(result.analysis.wordCount).toBeGreaterThan(300)
    })

    it('should handle content without frontmatter', () => {
      const content = `# Plain Markdown

This is plain markdown without frontmatter.`

      const result = analyzer.analyzeContent(content, '/plain.md')
      expect(result.metadata.title).toBe('Plain Markdown')
      expect(result.metadata.description).toContain('plain markdown')
    })

    it('should preserve existing metadata', () => {
      const content = `---
title: "Existing Title"
description: "Existing description"
tags:
  - existing-tag
---

# Different Title

Different description here.`

      const result = analyzer.analyzeContent(content, '/test.md')
      expect(result.metadata.title).toBe('Existing Title')
      expect(result.metadata.description).toBe('Existing description')
      expect(result.metadata.tags).toContain('existing-tag')
    })
  })

  describe('category inference', () => {
    it('should infer AI category from path and content', () => {
      const result = analyzer.analyzeContent(
        '# AI Guide\n\nMachine learning content.',
        '/ai/guide.md'
      )
      expect(result.metadata.category).toBe('AI & ML')
    })

    it('should infer Design category', () => {
      const result = analyzer.analyzeContent(
        '# UI Components\n\nDesign system components.',
        '/design/ui.md'
      )
      expect(result.metadata.category).toBe('Design System')
    })

    it('should default to Documentation', () => {
      const result = analyzer.analyzeContent('# Random Content\n\nSome content.', '/random/file.md')
      expect(result.metadata.category).toBe('Documentation')
    })
  })
})
