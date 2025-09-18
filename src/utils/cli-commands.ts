import { readdir, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'

import { spinner } from '@clack/prompts'
import pc from 'picocolors'
import type { RepairResult, ValidationResult } from '../types.js'
import {
  boxes,
  colors,
  createIssuesTable,
  createResultsTable,
  progress,
  status,
} from './cli-styling.js'

export interface RepairOptions {
  output?: string
  fixLinks: boolean
  processImages: boolean
  generateToc: boolean
  dryRun: boolean
  verbose: boolean
}

export interface ValidateOptions {
  fixIssues: boolean
  showDetails: boolean
  verbose: boolean
}

export interface RepairStats {
  totalRepaired: number
  totalIssues: number
  filesProcessed: number
}

export interface ValidationStats {
  totalFiles: number
  validFiles: number
  issueCount: number
  allIssues: Array<{ file: string; validation: ValidationResult }>
}

/**
 * Process a single file for repair
 */
export async function repairSingleFile(
  filePath: string,
  options: RepairOptions
): Promise<{ repaired: boolean; issues: string[] }> {
  const { FrontmatterRepair } = await import('../plugins/built-in/frontmatter-repair.js')
  const { LinkImageProcessor } = await import('../plugins/built-in/link-image-processor.js')
  const { TocGenerator } = await import('../plugins/built-in/toc-generator.js')

  const repairer = new FrontmatterRepair()
  const linkProcessor = new LinkImageProcessor(
    dirname(filePath),
    options.output || dirname(filePath)
  )
  const tocGenerator = new TocGenerator()

  const content = await readFile(filePath, 'utf-8')

  // Repair frontmatter
  const repairResult = repairer.repairFrontmatter(content, filePath)
  let processedContent = repairResult.repairedContent
  let wasRepaired = repairResult.fixed
  const issues = [...repairResult.issues]

  // Process links and images if requested
  if (options.fixLinks || options.processImages) {
    const { content: linkProcessedContent } = await linkProcessor.processContent(
      processedContent,
      filePath,
      filePath
    )
    if (linkProcessedContent !== processedContent) {
      processedContent = linkProcessedContent
      wasRepaired = true
      issues.push('Processed links and images')
    }
  }

  // Generate TOC if requested
  if (options.generateToc && !tocGenerator.hasExistingToc(processedContent)) {
    const tocContent = tocGenerator.insertTocIntoContent(processedContent)
    if (tocContent !== processedContent) {
      processedContent = tocContent
      wasRepaired = true
      issues.push('Added table of contents')
    }
  }

  // Write file if not dry run and content changed
  if (!options.dryRun && processedContent !== content) {
    await writeFile(filePath, processedContent, 'utf-8')
  }

  return { repaired: wasRepaired, issues }
}

/**
 * Process directory for repair
 */
export async function repairDirectory(
  inputPath: string,
  options: RepairOptions
): Promise<RepairStats> {
  const files = await readdir(inputPath, { recursive: true })
  let totalRepaired = 0
  let totalIssues = 0
  let filesProcessed = 0

  for (const file of files) {
    if (typeof file === 'string' && (file.endsWith('.md') || file.endsWith('.mdx'))) {
      const filePath = join(inputPath, file)

      try {
        const result = await repairSingleFile(filePath, options)

        if (result.repaired) {
          totalRepaired++
          totalIssues += result.issues.length

          if (options.verbose) {
            console.log(`\n${pc.cyan(file)}:`)
            result.issues.forEach((issue) => console.log(`  • ${issue}`))
          }
        }

        filesProcessed++
      } catch (error) {
        console.warn(`Failed to process ${file}:`, error)
      }
    }
  }

  return { totalRepaired, totalIssues, filesProcessed }
}

/**
 * Validate a single file
 */
export async function validateSingleFile(
  filePath: string,
  options: ValidateOptions
): Promise<{ valid: boolean; validation: ValidationResult }> {
  const { FrontmatterRepair } = await import('../plugins/built-in/frontmatter-repair.js')

  const validator = new FrontmatterRepair()
  const content = await readFile(filePath, 'utf-8')

  const validation = validator.validateContent(content, filePath)

  return { valid: validation.valid, validation }
}

/**
 * Validate directory
 */
export async function validateDirectory(
  inputPath: string,
  options: ValidateOptions
): Promise<ValidationStats> {
  const files = await readdir(inputPath, { recursive: true })
  let totalFiles = 0
  let validFiles = 0
  let issueCount = 0
  const allIssues: Array<{ file: string; validation: ValidationResult }> = []

  for (const file of files) {
    if (typeof file === 'string' && (file.endsWith('.md') || file.endsWith('.mdx'))) {
      const filePath = join(inputPath, file)

      try {
        const result = await validateSingleFile(filePath, options)
        totalFiles++

        if (result.valid) {
          validFiles++
        } else {
          issueCount += result.validation.issues.filter((i) => i.type === 'error').length
          allIssues.push({ file, validation: result.validation })
        }

        // Display results if requested
        if (options.showDetails || !result.valid) {
          console.log(
            `\n${pc.cyan(file)}: ${result.valid ? pc.green('✅ Valid') : pc.red('❌ Issues')}`
          )
          if (result.validation.score) {
            const scoreColor =
              result.validation.score.overall === 'good'
                ? pc.green
                : result.validation.score.overall === 'fair'
                  ? pc.yellow
                  : pc.red
            console.log(`  Quality: ${scoreColor(result.validation.score.overall.toUpperCase())}`)
          }

          if (!result.valid && options.verbose) {
            result.validation.issues.forEach((issue) => {
              const icon = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️'
              console.log(`    ${icon} ${issue.message}`)
            })
          }
        }
      } catch (error) {
        console.warn(`Failed to validate ${file}:`, error)
      }
    }
  }

  return { totalFiles, validFiles, issueCount, allIssues }
}

/**
 * Show repair results summary with enhanced styling
 */
export function showRepairResults(stats: RepairStats, options: RepairOptions) {
  const table = createResultsTable({
    filesProcessed: stats.filesProcessed,
    totalRepaired: stats.totalRepaired,
    totalIssues: stats.totalIssues,
  })

  const title = options.dryRun ? 'Repair Analysis (Dry Run)' : 'Repair Results'
  const isDryRun = options.dryRun

  const header = isDryRun
    ? boxes.warning(
        `${status.info('Analysis completed without making changes')}\n${table.toString()}`,
        title
      )
    : boxes.success(`${status.success('Files successfully repaired')}\n${table.toString()}`, title)

  return header
}

/**
 * Show validation results summary with enhanced styling
 */
export function showValidationResults(stats: ValidationStats) {
  const successRate =
    stats.totalFiles > 0 ? Math.round((stats.validFiles / stats.totalFiles) * 100) : 100

  const table = createResultsTable({
    totalFiles: stats.totalFiles,
    validFiles: stats.validFiles,
    issueCount: stats.issueCount,
  })

  const title = 'Validation Results'
  const header =
    successRate >= 90
      ? boxes.success(`${status.success('Excellent content quality!')}\n${table.toString()}`, title)
      : successRate >= 70
        ? boxes.warning(`${status.warning('Some issues found')}\n${table.toString()}`, title)
        : boxes.error(
            `${status.error('Multiple issues need attention')}\n${table.toString()}`,
            title
          )

  return header
}

/**
 * Create a spinner with enhanced styling
 */
export function createSpinner(message: string, dryRun = false) {
  const s = spinner()
  const styledMessage = dryRun
    ? status.warning(`Analyzing: ${message}`)
    : status.processing(message)
  s.start(styledMessage)
  return s
}
