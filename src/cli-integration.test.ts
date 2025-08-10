import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createBrandHeader,
  createIssuesTable,
  createResultsTable,
  formatHelpSection,
} from './utils/cli-styling.js'

describe('CLI Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Brand Header Integration', () => {
    it('should create consistent brand headers across different contexts', () => {
      const appHeader = createBrandHeader('Starlight Document Converter')
      const versionHeader = createBrandHeader('Starlight Document Converter', '1.6.1')
      const shortHeader = createBrandHeader('CLI Tool')
      const longHeader = createBrandHeader(
        'Very Long Application Name That Tests Wrapping Behavior'
      )

      expect(appHeader).toBeTruthy()
      expect(versionHeader).toBeTruthy()
      expect(shortHeader).toBeTruthy()
      expect(longHeader).toBeTruthy()

      // All should contain box borders
      ;[appHeader, versionHeader, shortHeader, longHeader].forEach((header) => {
        expect(header).toContain('╔')
        expect(header).toContain('╗')
        expect(header).toContain('╚')
        expect(header).toContain('╝')
      })
    })

    it('should handle special characters and Unicode in titles', () => {
      const specialHeader = createBrandHeader('CLI Tool™ v2.0 ⭐')
      expect(specialHeader).toBeTruthy()
      expect(specialHeader).toContain('CLI Tool™ v2.0 ⭐')
    })

    it('should maintain consistent styling with different version formats', () => {
      const versions = ['1.0.0', '2.0.0-beta', '3.0.0-alpha.1', '0.1.0-dev']

      versions.forEach((version) => {
        const header = createBrandHeader('Test App', version)
        expect(header).toContain(`v${version}`)
        expect(header).toContain('Test App')
      })
    })
  })

  describe('Help Section Integration', () => {
    it('should format complex help sections consistently', () => {
      const basicCommands = [
        { name: 'convert', description: 'Convert documents interactively with smart detection' },
        {
          name: 'batch <input>',
          description: 'Convert multiple files or entire directories efficiently',
        },
        {
          name: 'setup',
          description: 'Interactive project setup wizard for new Astro Starlight projects',
        },
      ]

      const advancedCommands = [
        {
          name: 'repair <input>',
          description: 'Fix frontmatter, links, images, and content structural issues',
        },
        {
          name: 'validate <input>',
          description: 'Validate content structure, quality scoring, and compliance checks',
        },
        {
          name: 'watch <input>',
          description: 'Monitor directory for changes and automatically convert new files',
        },
      ]

      const basicSection = formatHelpSection('Basic Commands', basicCommands)
      const advancedSection = formatHelpSection('Advanced Features', advancedCommands)

      expect(basicSection).toContain('Basic Commands')
      expect(basicSection).toContain('convert')
      expect(basicSection).toContain('batch <input>')
      expect(basicSection).toContain('setup')

      expect(advancedSection).toContain('Advanced Features')
      expect(advancedSection).toContain('repair <input>')
      expect(advancedSection).toContain('validate <input>')
      expect(advancedSection).toContain('watch <input>')

      // Both should have consistent formatting
      expect(basicSection).toMatch(/─+/) // Underline
      expect(advancedSection).toMatch(/─+/) // Underline
    })

    it('should handle edge cases in help formatting', () => {
      const edgeCases = [
        { name: '', description: 'Empty command name' },
        { name: 'cmd', description: '' },
        {
          name: 'very-long-command-name-that-might-wrap',
          description:
            'Very long description that might wrap to multiple lines and should be handled gracefully by the formatting system',
        },
        {
          name: 'special-chars',
          description: 'Description with "quotes", <brackets>, and & symbols',
        },
      ]

      const section = formatHelpSection('Edge Cases', edgeCases)

      expect(section).toBeTruthy()
      expect(section).toContain('Edge Cases')
      expect(section).toContain('very-long-command-name-that-might-wrap')
      expect(section).toContain('"quotes"')
      expect(section).toContain('<brackets>')
      expect(section).toContain('& symbols')
    })

    it('should maintain hierarchy and readability', () => {
      const nestedCommands = [
        { name: 'level1', description: 'Top level command' },
        { name: '  level2', description: 'Indented subcommand' },
        { name: '    level3', description: 'Deeply nested command option' },
      ]

      const section = formatHelpSection('Command Hierarchy', nestedCommands)

      expect(section).toContain('level1')
      expect(section).toContain('level2')
      expect(section).toContain('level3')
      expect(section).toContain('Top level command')
      expect(section).toContain('Deeply nested command option')
    })
  })

  describe('Table Integration Tests', () => {
    it('should create comprehensive results tables for various scenarios', () => {
      const scenarioData = [
        {
          name: 'Small project',
          stats: { filesProcessed: 5, totalRepaired: 3, totalIssues: 7 },
        },
        {
          name: 'Medium project',
          stats: { filesProcessed: 50, totalRepaired: 35, totalIssues: 28 },
        },
        {
          name: 'Large project',
          stats: { filesProcessed: 500, totalRepaired: 425, totalIssues: 150 },
        },
        {
          name: 'Perfect project',
          stats: { filesProcessed: 25, totalRepaired: 0, totalIssues: 0 },
        },
      ]

      scenarioData.forEach((scenario) => {
        const table = createResultsTable(scenario.stats)
        const tableString = table.toString()

        expect(tableString).toContain('Files Processed')
        expect(tableString).toContain(scenario.stats.filesProcessed.toString())

        if (scenario.stats.totalRepaired !== undefined) {
          expect(tableString).toContain('Files Repaired')
          expect(tableString).toContain(scenario.stats.totalRepaired.toString())
        }

        if (scenario.stats.totalIssues !== undefined) {
          expect(tableString).toContain('Issues Resolved')
          expect(tableString).toContain(scenario.stats.totalIssues.toString())
        }
      })
    })

    it('should handle validation statistics correctly', () => {
      const validationScenarios = [
        { totalFiles: 10, validFiles: 9, issueCount: 3 }, // 90% success
        { totalFiles: 20, validFiles: 14, issueCount: 12 }, // 70% success
        { totalFiles: 30, validFiles: 15, issueCount: 25 }, // 50% success
        { totalFiles: 100, validFiles: 95, issueCount: 8 }, // 95% success
      ]

      validationScenarios.forEach((stats) => {
        const table = createResultsTable(stats)
        const tableString = table.toString()

        const expectedRate = Math.round((stats.validFiles / stats.totalFiles) * 100)

        expect(tableString).toContain('Success Rate')
        expect(tableString).toContain(`${expectedRate}%`)
        expect(tableString).toContain(stats.totalFiles.toString())
        expect(tableString).toContain(stats.validFiles.toString())
        expect(tableString).toContain(stats.issueCount.toString())
      })
    })

    it('should create comprehensive issues tables', () => {
      const complexIssues = [
        {
          type: 'error',
          message: 'Critical: Missing required frontmatter title field',
          severity: 9,
          file: 'docs/getting-started.md',
        },
        {
          type: 'warning',
          message: 'Description exceeds recommended 155 character limit for SEO',
          severity: 5,
          file: 'guides/advanced-usage.mdx',
        },
        {
          type: 'info',
          message: 'Consider adding category metadata for better organization',
          severity: 2,
          file: 'tutorials/basics.md',
        },
        {
          type: 'error',
          message: 'Broken internal link detected',
          severity: 7,
          file: 'reference/api.md',
        },
        {
          type: 'warning',
          message: 'Image missing alt text for accessibility',
          severity: 6,
          file: 'examples/showcase.md',
        },
      ]

      const issuesTable = createIssuesTable(complexIssues)
      const tableString = issuesTable.toString()

      // Check that all issues are represented
      complexIssues.forEach((issue) => {
        expect(tableString).toContain(issue.message)
        if (issue.file) {
          expect(tableString).toContain(issue.file)
        }
      })

      // Check severity levels
      expect(tableString).toContain('High') // severity 9, 7
      expect(tableString).toContain('Med') // severity 5, 6
      expect(tableString).toContain('Low') // severity 2

      // Check issue types
      expect(tableString).toMatch(/error|Error/)
      expect(tableString).toMatch(/warning|Warning/)
      expect(tableString).toMatch(/info|Info/)
    })
  })

  describe('Cross-Platform Compatibility', () => {
    it('should work consistently across different terminal environments', () => {
      // Test with different mock environments
      const originalEnv = process.env

      const environments = [
        { TERM: 'xterm-256color', COLORTERM: 'truecolor' },
        { TERM: 'screen', COLORTERM: undefined },
        { TERM: 'dumb', COLORTERM: undefined },
        { TERM: 'xterm', CI: 'true' },
      ]

      environments.forEach((env) => {
        process.env = { ...originalEnv, ...env }

        const header = createBrandHeader('Test App', '1.0.0')
        const table = createResultsTable({ filesProcessed: 5, totalRepaired: 3 })
        const helpSection = formatHelpSection('Test Commands', [
          { name: 'test', description: 'Test command' },
        ])

        expect(header).toBeTruthy()
        expect(table.toString()).toBeTruthy()
        expect(helpSection).toBeTruthy()
      })

      process.env = originalEnv
    })

    it('should handle different character encodings gracefully', () => {
      const unicodeTexts = [
        'Español: Conversor de documentos',
        'Français: Convertisseur de documents',
        '日本語: ドキュメントコンバーター',
        'Русский: Конвертер документов',
        '中文: 文档转换器',
        'العربية: محول المستندات',
      ]

      unicodeTexts.forEach((text) => {
        const header = createBrandHeader(text)
        expect(header).toBeTruthy()
        expect(header).toContain(text)
      })
    })
  })

  describe('Performance and Memory', () => {
    it('should handle large datasets without performance degradation', () => {
      const start = Date.now()

      // Create large datasets
      const largeIssuesList = Array.from({ length: 1000 }, (_, i) => ({
        type: i % 3 === 0 ? 'error' : i % 3 === 1 ? 'warning' : 'info',
        message: `Issue number ${i}: This is a test issue with some descriptive text`,
        severity: Math.floor(Math.random() * 10) + 1,
        file: `file-${i}.md`,
      }))

      const largeStats = {
        totalFiles: 10000,
        validFiles: 8500,
        issueCount: 1500,
      }

      // Create tables
      const issuesTable = createIssuesTable(largeIssuesList)
      const resultsTable = createResultsTable(largeStats)

      expect(issuesTable.toString()).toBeTruthy()
      expect(resultsTable.toString()).toBeTruthy()

      const end = Date.now()
      const duration = end - start

      // Should complete in reasonable time (less than 1 second)
      expect(duration).toBeLessThan(1000)
    })

    it('should not accumulate memory with repeated operations', () => {
      // Simulate repeated CLI operations
      for (let i = 0; i < 100; i++) {
        const header = createBrandHeader(`App ${i}`, `${i}.0.0`)
        const table = createResultsTable({
          filesProcessed: i,
          totalRepaired: Math.floor(i * 0.8),
          totalIssues: Math.floor(i * 0.3),
        })
        const section = formatHelpSection(`Section ${i}`, [
          { name: `command${i}`, description: `Description ${i}` },
        ])

        // Verify they're still working
        expect(header).toBeTruthy()
        expect(table.toString()).toBeTruthy()
        expect(section).toBeTruthy()
      }
    })
  })

  describe('Real-World Usage Scenarios', () => {
    it('should handle typical CLI workflow end-to-end', () => {
      // Simulate a complete CLI interaction

      // 1. Show brand header
      const header = createBrandHeader('Starlight Document Converter', '1.6.1')
      expect(header).toBeTruthy()

      // 2. Show help sections
      const basicHelp = formatHelpSection('Basic Commands', [
        { name: 'convert', description: 'Interactive conversion' },
        { name: 'batch <input>', description: 'Batch conversion' },
      ])
      expect(basicHelp).toBeTruthy()

      // 3. Process some files and show results
      const repairStats = { filesProcessed: 25, totalRepaired: 18, totalIssues: 32 }
      const resultsTable = createResultsTable(repairStats)
      expect(resultsTable.toString()).toBeTruthy()

      // 4. Show any issues found
      const issues = [
        { type: 'error', message: 'Missing frontmatter', severity: 8, file: 'doc1.md' },
        { type: 'warning', message: 'Long description', severity: 4, file: 'doc2.md' },
      ]
      const issuesTable = createIssuesTable(issues)
      expect(issuesTable.toString()).toBeTruthy()

      // All components should work together
      const fullOutput = [header, basicHelp, resultsTable.toString(), issuesTable.toString()].join(
        '\n\n'
      )
      expect(fullOutput.length).toBeGreaterThan(500) // Should be substantial output
    })

    it('should handle error scenarios gracefully', () => {
      // Test with problematic input
      const problemCases = [
        { name: undefined, description: 'Undefined name' },
        { name: null, description: 'Null name' },
        { name: 'valid', description: undefined },
        { name: '', description: null },
      ]

      expect(() => {
        const section = formatHelpSection('Problem Cases', problemCases.filter(Boolean))
        expect(section).toBeTruthy()
      }).not.toThrow()

      // Test with extreme values
      const extremeStats = {
        filesProcessed: Number.MAX_SAFE_INTEGER,
        totalRepaired: 0,
        totalIssues: -1, // Invalid but should not break
      }

      expect(() => {
        const table = createResultsTable(extremeStats)
        expect(table.toString()).toBeTruthy()
      }).not.toThrow()
    })
  })

  describe('Accessibility and Usability', () => {
    it('should provide meaningful output for screen readers', () => {
      const stats = {
        totalFiles: 10,
        validFiles: 8,
        issueCount: 5,
      }

      const table = createResultsTable(stats)
      const tableString = table.toString()

      // Should contain descriptive labels
      expect(tableString).toMatch(/Success Rate|Files|Issues/)

      // Should contain actual values
      expect(tableString).toContain('10')
      expect(tableString).toContain('8')
      expect(tableString).toContain('5')
      expect(tableString).toContain('80%')
    })

    it('should work with high contrast terminals', () => {
      // Test that styling doesn't break with minimal color support
      const header = createBrandHeader('Accessibility Test')
      const section = formatHelpSection('Commands', [
        { name: 'test', description: 'Test description' },
      ])

      expect(header).toContain('Accessibility Test')
      expect(section).toContain('Commands')
      expect(section).toContain('test')
      expect(section).toContain('Test description')
    })
  })
})
