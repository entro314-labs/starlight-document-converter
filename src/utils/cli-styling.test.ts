import { describe, expect, it } from 'vitest'

import {
  boxes,
  colors,
  createBrandHeader,
  createIssuesTable,
  createResultsTable,
  createTable,
  formatHelpSection,
  gradients,
  progress,
  status,
  symbols,
} from './cli-styling.js'

describe('CLI Styling Utilities', () => {
  describe('symbols', () => {
    it('should provide cross-platform Unicode symbols', () => {
      expect(symbols.success).toBeTruthy()
      expect(symbols.error).toBeTruthy()
      expect(symbols.warning).toBeTruthy()
      expect(symbols.info).toBeTruthy()
      expect(symbols.arrow).toBeTruthy()
      expect(symbols.bullet).toBeTruthy()
      expect(symbols.star).toBeTruthy()
      expect(symbols.heart).toBeTruthy()
      expect(symbols.checkbox).toBeTruthy()
      expect(symbols.radioOn).toBeTruthy()
      expect(symbols.pointer).toBeTruthy()
      expect(symbols.line).toBeTruthy()
      expect(symbols.corner).toBeTruthy()
    })

    it('should contain valid Unicode characters', () => {
      // Test that symbols are actual string characters, not undefined
      Object.values(symbols).forEach((symbol) => {
        expect(typeof symbol).toBe('string')
        expect(symbol.length).toBeGreaterThan(0)
      })
    })
  })

  describe('colors', () => {
    it('should provide color functions', () => {
      expect(typeof colors.primary).toBe('function')
      expect(typeof colors.success).toBe('function')
      expect(typeof colors.error).toBe('function')
      expect(typeof colors.warning).toBe('function')
      expect(typeof colors.info).toBe('function')
      expect(typeof colors.muted).toBe('function')
      expect(typeof colors.bold).toBe('function')
      expect(typeof colors.dim).toBe('function')
    })

    it('should apply colors to text', () => {
      const testText = 'Hello World'
      expect(colors.success(testText)).toContain(testText)
      expect(colors.error(testText)).toContain(testText)
      expect(colors.warning(testText)).toContain(testText)
      expect(colors.info(testText)).toContain(testText)
    })
  })

  describe('gradients', () => {
    it('should provide gradient functions', () => {
      expect(typeof gradients.primary).toBe('function')
      expect(typeof gradients.success).toBe('function')
      expect(typeof gradients.warning).toBe('function')
      expect(typeof gradients.error).toBe('function')
      expect(typeof gradients.rainbow).toBe('function')
    })

    it('should apply gradients to text', () => {
      const testText = 'Gradient Test'
      const result = gradients.primary(testText)
      expect(result).toBeTruthy()
      expect(typeof result).toBe('string')
    })
  })

  describe('status indicators', () => {
    it('should combine symbols with colors', () => {
      const testText = 'Status message'

      const successStatus = status.success(testText)
      expect(successStatus).toContain(testText)
      expect(successStatus).toContain(symbols.success)

      const errorStatus = status.error(testText)
      expect(errorStatus).toContain(testText)
      expect(errorStatus).toContain(symbols.error)

      const warningStatus = status.warning(testText)
      expect(warningStatus).toContain(testText)
      expect(warningStatus).toContain(symbols.warning)

      const infoStatus = status.info(testText)
      expect(infoStatus).toContain(testText)
      expect(infoStatus).toContain(symbols.info)
    })

    it('should provide processing and bullet indicators', () => {
      const testText = 'Processing'

      const processingStatus = status.processing(testText)
      expect(processingStatus).toContain(testText)
      expect(processingStatus).toContain(symbols.arrow)

      const bulletStatus = status.bullet(testText)
      expect(bulletStatus).toContain(testText)
      expect(bulletStatus).toContain(symbols.bullet)
    })
  })

  describe('boxes', () => {
    it('should create styled boxes', () => {
      const testText = 'Box content'
      const title = 'Test Title'

      const successBox = boxes.success(testText, title)
      expect(successBox).toContain(testText)
      expect(successBox).toContain(title)

      const errorBox = boxes.error(testText, title)
      expect(errorBox).toContain(testText)
      expect(errorBox).toContain(title)

      const warningBox = boxes.warning(testText, title)
      expect(warningBox).toContain(testText)
      expect(warningBox).toContain(title)

      const infoBox = boxes.info(testText, title)
      expect(infoBox).toContain(testText)
      expect(infoBox).toContain(title)
    })

    it('should handle boxes without titles', () => {
      const testText = 'Box content without title'

      const box = boxes.success(testText)
      expect(box).toContain(testText)
      expect(typeof box).toBe('string')
    })
  })

  describe('createTable', () => {
    it('should create a table instance', () => {
      const table = createTable()
      expect(table).toBeTruthy()
      expect(typeof table.push).toBe('function')
      expect(typeof table.toString).toBe('function')
    })

    it('should accept custom options', () => {
      const table = createTable({
        head: ['Custom', 'Header'],
        style: { head: ['red'] },
      })
      expect(table).toBeTruthy()
    })
  })

  describe('createResultsTable', () => {
    it('should create table with repair stats', () => {
      const stats = {
        filesProcessed: 10,
        totalRepaired: 8,
        totalIssues: 15,
      }

      const table = createResultsTable(stats)
      const tableString = table.toString()

      expect(tableString).toContain('Files Processed')
      expect(tableString).toContain('Files Repaired')
      expect(tableString).toContain('Issues Resolved')
      expect(tableString).toContain('10')
      expect(tableString).toContain('8')
      expect(tableString).toContain('15')
    })

    it('should create table with validation stats', () => {
      const stats = {
        totalFiles: 20,
        validFiles: 18,
        issueCount: 5,
      }

      const table = createResultsTable(stats)
      const tableString = table.toString()

      expect(tableString).toContain('Success Rate')
      expect(tableString).toContain('90%')
    })

    it('should handle mixed stats', () => {
      const stats = {
        filesProcessed: 5,
        totalRepaired: 3,
        totalFiles: 10,
        validFiles: 7,
      }

      const table = createResultsTable(stats)
      const tableString = table.toString()

      expect(tableString).toContain('Files Processed')
      expect(tableString).toContain('Success Rate')
      expect(tableString).toContain('70%')
    })
  })

  describe('createIssuesTable', () => {
    it('should create table with issue details', () => {
      const issues = [
        {
          type: 'error',
          message: 'Missing title',
          severity: 8,
          file: 'test.md',
        },
        {
          type: 'warning',
          message: 'Long description',
          severity: 4,
          file: 'doc.md',
        },
        {
          type: 'info',
          message: 'Consider adding tags',
          severity: 2,
        },
      ]

      const table = createIssuesTable(issues)
      const tableString = table.toString()

      expect(tableString).toContain('Missing title')
      expect(tableString).toContain('Long description')
      expect(tableString).toContain('Consider adding tags')
      expect(tableString).toContain('test.md')
      expect(tableString).toContain('doc.md')
      expect(tableString).toContain('High')
      expect(tableString).toContain('Med')
      expect(tableString).toContain('Low')
    })

    it('should handle issues without files', () => {
      const issues = [
        {
          type: 'error',
          message: 'Global issue',
          severity: 7,
        },
      ]

      const table = createIssuesTable(issues)
      const tableString = table.toString()

      expect(tableString).toContain('Global issue')
      expect(tableString).toContain('-') // No file specified
    })
  })

  describe('createBrandHeader', () => {
    it('should create brand header with title only', () => {
      const header = createBrandHeader('Test App')
      expect(header).toContain('Test App')
      expect(header).toContain('╔') // Box border characters
      expect(header).toContain('╗')
      expect(header).toContain('╚')
      expect(header).toContain('╝')
    })

    it('should create brand header with title and version', () => {
      const header = createBrandHeader('Test App', '2.0.0')
      expect(header).toContain('Test App')
      expect(header).toContain('v2.0.0')
    })

    it('should apply gradient styling', () => {
      const header = createBrandHeader('Styled App')
      expect(header).toBeTruthy()
      expect(typeof header).toBe('string')
    })
  })

  describe('progress indicators', () => {
    it('should format step progress', () => {
      const result = progress.step(3, 10, 'Processing files')
      expect(result).toContain('[3/10]')
      expect(result).toContain('Processing files')
    })

    it('should format percentage progress', () => {
      const result = progress.percentage(75, 'Converting documents')
      expect(result).toContain('75%')
      expect(result).toContain('Converting documents')
      expect(result).toContain('█') // Progress bar filled
      expect(result).toContain('░') // Progress bar empty
    })

    it('should handle edge cases in percentage', () => {
      const zeroResult = progress.percentage(0, 'Starting')
      expect(zeroResult).toContain('0%')
      expect(zeroResult).toContain('░░░░░░░░░░░░░░░░░░░░') // All empty

      const fullResult = progress.percentage(100, 'Complete')
      expect(fullResult).toContain('100%')
      expect(fullResult).toContain('████████████████████') // All filled
    })
  })

  describe('formatHelpSection', () => {
    it('should format help sections with title and items', () => {
      const title = 'Test Commands'
      const items = [
        { name: 'command1', description: 'First command description' },
        { name: 'command2', description: 'Second command description' },
      ]

      const result = formatHelpSection(title, items)

      expect(result).toContain('Test Commands')
      expect(result).toContain('command1')
      expect(result).toContain('First command description')
      expect(result).toContain('command2')
      expect(result).toContain('Second command description')
      expect(result).toContain(symbols.bullet)
      expect(result).toContain('─'.repeat(title.length)) // Underline
    })

    it('should handle empty items array', () => {
      const result = formatHelpSection('Empty Section', [])
      expect(result).toContain('Empty Section')
      expect(result).toContain('─'.repeat('Empty Section'.length))
    })

    it('should handle special characters in descriptions', () => {
      const items = [{ name: 'special-cmd', description: 'Command with "quotes" and <brackets>' }]

      const result = formatHelpSection('Special', items)
      expect(result).toContain('special-cmd')
      expect(result).toContain('"quotes"')
      expect(result).toContain('<brackets>')
    })
  })

  describe('integration', () => {
    it('should work together in typical CLI scenarios', () => {
      // Simulate a typical CLI flow
      const header = createBrandHeader('CLI Tool', '1.0.0')
      const successMessage = status.success('Operation completed')
      const resultsTable = createResultsTable({
        filesProcessed: 5,
        totalRepaired: 3,
        totalIssues: 7,
      })
      const infoBox = boxes.info('All tests passed!', 'Test Results')

      expect(header).toBeTruthy()
      expect(successMessage).toBeTruthy()
      expect(resultsTable.toString()).toBeTruthy()
      expect(infoBox).toBeTruthy()

      // Verify they all contain expected content
      expect(header).toContain('CLI Tool')
      expect(successMessage).toContain('Operation completed')
      expect(infoBox).toContain('All tests passed!')
    })

    it('should maintain consistent styling across components', () => {
      const components = [
        status.success('Success'),
        status.error('Error'),
        status.warning('Warning'),
        status.info('Info'),
      ]

      components.forEach((component) => {
        expect(component).toBeTruthy()
        expect(typeof component).toBe('string')
        expect(component.length).toBeGreaterThan(0)
      })
    })
  })

  describe('accessibility and cross-platform compatibility', () => {
    it('should use safe Unicode characters', () => {
      // Test that symbols don't contain problematic characters
      Object.values(symbols).forEach((symbol) => {
        expect(symbol).not.toContain('\u0000') // Null character
        expect(symbol).not.toContain('\uFFFD') // Replacement character
      })
    })

    it('should handle color stripping gracefully', () => {
      // Test that colored text still contains the original text
      const originalText = 'Test Message'
      const coloredText = colors.success(originalText)

      // Even with ANSI codes, the original text should be present
      expect(coloredText).toContain(originalText)
    })

    it('should provide fallbacks for complex styling', () => {
      // Test that complex operations don't fail
      expect(() => {
        const header = createBrandHeader('Test')
        const table = createResultsTable({ filesProcessed: 1 })
        const box = boxes.info('Test')

        return header + table.toString() + box
      }).not.toThrow()
    })
  })
})
