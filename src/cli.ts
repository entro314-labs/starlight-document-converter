#!/usr/bin/env node

import { existsSync, lstatSync, readdirSync } from 'node:fs'
import { basename, dirname, join, relative, resolve } from 'node:path'

import {
  cancel,
  confirm,
  intro,
  isCancel,
  multiselect,
  note,
  outro,
  select,
  spinner,
  text,
} from '@clack/prompts'
import { Command } from 'commander'
import pc from 'picocolors'

import { DocumentConverter } from './converter.js'
import { detectInputSources, getOutputDirectory, getSmartDefaults } from './utils/cli-helpers.js'
import {
  boxes,
  colors,
  createBrandHeader,
  createResultsTable,
  formatHelpSection,
  progress,
  status,
  symbols,
} from './utils/cli-styling.js'

import type { ConversionResult } from './types.js'
import type { ValidationStats } from './utils/cli-commands.js'

const program = new Command()

// Helper functions
const getFormattedStats = (results: ConversionResult[]) => {
  const successful = results.filter((r) => r.success).length
  const skipped = results.filter((r) => r.skipped).length
  const failed = results.filter((r) => !(r.success || r.skipped)).length
  return { successful, skipped, failed, total: results.length }
}

const detectInputType = (inputPath: string): 'file' | 'directory' | 'not-found' => {
  if (!existsSync(inputPath)) {
    return 'not-found'
  }
  return lstatSync(inputPath).isDirectory() ? 'directory' : 'file'
}

const getSampleFiles = (dir: string, maxSamples = 5): string[] => {
  try {
    const files = readdirSync(dir, { recursive: true })
      .filter((file: unknown) => typeof file === 'string')
      .filter((file: string) => {
        const ext = file.split('.').pop()?.toLowerCase()
        return ['md', 'mdx', 'txt', 'html', 'htm', 'docx', 'doc', 'rtf'].includes(ext || '')
      })
      .slice(0, maxSamples)
    return files as string[]
  } catch {
    return []
  }
}

// Helper function to show project info
function showProjectInfo(smartDefaults: ReturnType<typeof getSmartDefaults>) {
  if (smartDefaults.isStarlightProject) {
    note(
      `✅ Detected Starlight project: ${pc.cyan(smartDefaults.title || 'Documentation')}`,
      'Project Info'
    )
  } else {
    note('⚠️  Starlight not detected - using fallback configuration', 'Project Info')
  }

  if (smartDefaults.recommendations.length > 0) {
    note(smartDefaults.recommendations.join('\n'), 'Recommendations')
  }
}

// Helper function to get input path from user
async function getInputPath(detectedSources: string[], outputDir: string): Promise<string> {
  if (detectedSources.length > 0) {
    const isStarlightDir =
      detectedSources[0] === outputDir || detectedSources[0].includes('src/content/docs')

    const message = isStarlightDir
      ? `Found Starlight content directory and ${detectedSources.length > 1 ? 'other directories' : 'import directories'}: ${detectedSources.map((d) => pc.cyan(d)).join(', ')}`
      : `Found document directories: ${detectedSources.map((d) => pc.cyan(d)).join(', ')}`

    note(message, 'Available Sources')

    const sourceChoice = await select({
      message: 'Choose input source:',
      options: [
        ...detectedSources.map((source, index) => {
          const isMainContentDir = index === 0 && isStarlightDir
          return {
            value: source,
            label: `📁 ${source}`,
            hint: isMainContentDir ? 'Your Starlight content directory' : 'Document directory',
          }
        }),
        {
          value: 'custom',
          label: '✏️  Custom path',
          hint: 'Specify a different path',
        },
      ],
    })

    if (isCancel(sourceChoice)) {
      cancel('Operation cancelled')
      process.exit(0)
    }

    if (sourceChoice === 'custom') {
      return await getCustomPath('Enter path to convert:')
    }
    return sourceChoice as string
  }

  return await getCustomPath('What would you like to convert?')
}

// Helper function to get custom path from user
async function getCustomPath(message: string): Promise<string> {
  const customPath = await text({
    message,
    placeholder: './docs or ./document.md',
    validate: (value) => {
      if (!value) return 'Please provide an input path'
      const resolved = resolve(value as string)
      const type = detectInputType(resolved)
      if (type === 'not-found') return 'Path does not exist'
      return
    },
  })

  if (isCancel(customPath)) {
    cancel('Operation cancelled')
    process.exit(0)
  }

  return customPath as string
}

// Helper function to show conversion preview
function showConversionPreview(resolvedInput: string, inputType: string) {
  if (inputType === 'directory') {
    const sampleFiles = getSampleFiles(resolvedInput)
    if (sampleFiles.length > 0) {
      note(
        `Found ${sampleFiles.length} convertible files:\n${sampleFiles.map((f) => `  • ${f}`).join('\n')}${sampleFiles.length === 5 ? '\n  ... and potentially more' : ''}`,
        'Preview'
      )
    }
  } else {
    note(`Converting single file: ${pc.cyan(basename(resolvedInput))}`, 'Preview')
  }
}

// Helper function to get advanced options from user
async function getAdvancedOptions(): Promise<Record<string, unknown>> {
  const advancedOptions = await confirm({
    message: 'Configure advanced options?',
    initialValue: false,
  })

  const defaultOptions = {
    preserveStructure: true,
    generateTitles: true,
    generateDescriptions: true,
    addTimestamps: false,
    verbose: false,
    dryRun: false,
  }

  if (!advancedOptions || isCancel(advancedOptions)) {
    return defaultOptions
  }

  const preserveStructure = await confirm({
    message: 'Preserve directory structure?',
    initialValue: true,
  })

  if (isCancel(preserveStructure)) {
    cancel('Operation cancelled')
    process.exit(0)
  }

  const contentOptions = await multiselect({
    message: 'What should be auto-generated?',
    options: [
      {
        value: 'titles',
        label: 'Titles from content',
        hint: 'Extract titles from headings or filenames',
      },
      {
        value: 'descriptions',
        label: 'Descriptions from content',
        hint: 'Generate descriptions from first paragraph',
      },
      {
        value: 'timestamps',
        label: 'Last updated timestamps',
        hint: 'Add conversion date to frontmatter',
      },
    ],
    initialValues: ['titles', 'descriptions'],
  })

  if (isCancel(contentOptions)) {
    cancel('Operation cancelled')
    process.exit(0)
  }

  const outputOptions = await multiselect({
    message: 'Output preferences:',
    options: [
      { value: 'verbose', label: 'Verbose output', hint: 'Show detailed conversion logs' },
      { value: 'dryRun', label: 'Dry run', hint: 'Preview changes without writing files' },
    ],
    initialValues: [],
  })

  if (isCancel(outputOptions)) {
    cancel('Operation cancelled')
    process.exit(0)
  }

  return {
    preserveStructure: preserveStructure as boolean,
    generateTitles: (contentOptions as string[]).includes('titles'),
    generateDescriptions: (contentOptions as string[]).includes('descriptions'),
    addTimestamps: (contentOptions as string[]).includes('timestamps'),
    verbose: (outputOptions as string[]).includes('verbose'),
    dryRun: (outputOptions as string[]).includes('dryRun'),
  }
}

// Helper function to show results
function showResults(
  results: Array<{ success: boolean; skipped?: boolean; inputPath: string; outputPath: string }>,
  converterOptions: Record<string, unknown>
) {
  const stats = getFormattedStats(results)

  if (stats.total > 0) {
    note(
      `${pc.green('✅ Successful:')} ${stats.successful} files\n` +
        (stats.skipped > 0 ? `${pc.yellow('⏭️ Skipped:')} ${stats.skipped} files\n` : '') +
        (stats.failed > 0 ? `${pc.red('❌ Failed:')} ${stats.failed} files\n` : '') +
        (converterOptions.dryRun ? pc.yellow('🧪 Dry run - no files were modified') : ''),
      'Results'
    )
  }

  const successfulResults = results.filter((r) => r.success).slice(0, 3)
  if (successfulResults.length > 0 && !converterOptions.dryRun) {
    note(
      `${successfulResults.map((r) => `• ${pc.cyan(relative(process.cwd(), r.inputPath))} → ${pc.green(relative(process.cwd(), r.outputPath))}`).join('\n')}`,
      'Sample conversions'
    )
  }
}

// Interactive convert command
async function interactiveConvert() {
  intro(pc.bgMagenta(pc.black(' Starlight Document Converter ')))

  const smartDefaults = getSmartDefaults()
  const detectedSources = detectInputSources()

  showProjectInfo(smartDefaults)

  const inputPath = await getInputPath(detectedSources, smartDefaults.outputDir)
  const resolvedInput = resolve(inputPath)
  const inputType = detectInputType(resolvedInput)

  showConversionPreview(resolvedInput, inputType)

  const outputDir = await text({
    message: 'Where should the converted files be saved?',
    placeholder: smartDefaults.outputDir,
    initialValue: smartDefaults.outputDir,
  })

  if (isCancel(outputDir)) {
    cancel('Operation cancelled')
    process.exit(0)
  }

  const advancedOptions = await getAdvancedOptions()
  const converterOptions = {
    outputDir: outputDir as string,
    ...advancedOptions,
  } as Record<string, unknown> & { dryRun?: boolean }

  const confirmConversion = await confirm({
    message: `${converterOptions.dryRun ? 'Preview' : 'Convert'} ${inputType === 'directory' ? 'directory' : 'file'}?`,
  })

  if (!confirmConversion || isCancel(confirmConversion)) {
    cancel('Operation cancelled')
    process.exit(0)
  }

  const s = spinner()
  s.start(`${converterOptions.dryRun ? 'Previewing' : 'Converting'} documents...`)

  try {
    const converter = new DocumentConverter(converterOptions)

    const results =
      inputType === 'directory'
        ? await converter.convertDirectory(resolvedInput)
        : [await converter.convertFile(resolvedInput)]

    s.stop(`Conversion ${converterOptions.dryRun ? 'preview' : 'completed'}!`)

    showResults(results, converterOptions)
    converter.printStats()

    outro(
      `${pc.green('🎉 All done!')} Your documents have been ${converterOptions.dryRun ? 'previewed' : 'converted successfully'}.`
    )
  } catch (error) {
    s.stop('Conversion failed')
    note(`${pc.red('❌ Error:')} ${error}`, 'Conversion failed')
    process.exit(1)
  }
}

// Configuration wizard
async function configurationWizard() {
  intro(pc.bgBlue(pc.black(' Starlight Integration Setup ')))

  const projectType = await select({
    message: 'What type of project are you setting up?',
    options: [
      { value: 'new', label: 'New Starlight project', hint: 'Complete setup with Astro config' },
      {
        value: 'existing',
        label: 'Existing Starlight project',
        hint: 'Add converter to existing setup',
      },
      {
        value: 'standalone',
        label: 'Standalone CLI usage',
        hint: 'Just use the command line tool',
      },
    ],
  })

  if (isCancel(projectType)) {
    cancel('Setup cancelled')
    return process.exit(0)
  }

  if (projectType === 'standalone') {
    note(
      'You can now use the converter with:\n\n' +
        `${pc.cyan('npx starlight-convert <input> [options]')}\n\n` +
        'For interactive mode:\n' +
        `${pc.cyan('npx starlight-convert')}`,
      'CLI Usage'
    )
    outro('🎉 Setup complete!')
    return
  }

  // Input directories
  const inputDirs = await text({
    message: 'Which directories should be monitored for documents?',
    placeholder: 'docs-import,documents,content-drafts',
    initialValue: 'docs-import',
  })

  if (isCancel(inputDirs)) {
    cancel('Setup cancelled')
    return process.exit(0)
  }

  const inputDirsList = (inputDirs as string).split(',').map((d) => d.trim())

  // Watch mode
  const enableWatch = await confirm({
    message: 'Enable automatic file watching?',
    initialValue: true,
  })

  if (isCancel(enableWatch)) {
    cancel('Setup cancelled')
    return process.exit(0)
  }

  // Generate configuration
  const config = `import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightDocumentConverter from 'starlight-document-converter';

export default defineConfig({
  integrations: [
    starlight({
      title: 'My Documentation',
      description: 'Documentation powered by Starlight',
      social: {
        github: 'https://github.com/your-username/your-repo',
      },
      sidebar: [
        {
          label: 'Guides',
          items: [
            { label: 'Getting Started', link: '/guides/getting-started/' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'API Reference', link: '/reference/api/' },
          ],
        },
      ],
    }),
    
    starlightDocumentConverter({
      watch: ${enableWatch},
      inputDirs: ${JSON.stringify(inputDirsList)},
      converter: {
        outputDir: 'src/content/docs',
        preserveStructure: true,
        generateTitles: true,
        generateDescriptions: true,
        verbose: true
      }
    })
  ],
});`

  note(`Add this to your ${pc.cyan('astro.config.mjs')}:\n\n${pc.dim(config)}`, 'Configuration')

  const setupDirectories = await confirm({
    message: 'Create input directories now?',
    initialValue: true,
  })

  if (setupDirectories && !isCancel(setupDirectories)) {
    const s = spinner()
    s.start('Creating directories...')

    try {
      const { mkdir } = await import('node:fs/promises')
      for (const dir of inputDirsList) {
        await mkdir(dir, { recursive: true })
      }
      s.stop('Directories created!')

      note(
        `Created directories:\n${inputDirsList.map((d) => `• ${pc.green(d)}`).join('\n')}\n\n` +
          `Drop your documents into these folders and they'll be automatically converted!`,
        'Next Steps'
      )
    } catch (error) {
      s.stop('Failed to create directories')
      note(`${pc.red('❌ Error:')} Could not create directories: ${error}`, 'Error')
    }
  }

  outro(`${pc.green('🎉 Setup complete!')} Your Starlight Document Converter is ready to use.`)
}

// Command definitions
program
  .name('starlight-convert')
  .description('🌟 Beautiful document converter for Starlight')
  .version('1.7.0')
  .action(async () => {
    // Default interactive mode
    await interactiveConvert()
  })

// Convert command (can be called directly)
program
  .command('convert')
  .description('Convert documents interactively')
  .action(async () => {
    await interactiveConvert()
  })

// Non-interactive convert
program
  .command('batch')
  .description('Convert documents in batch mode')
  .argument('<input>', 'Input file or directory to convert')
  .option('-o, --output <dir>', 'Output directory (auto-detected if not specified)')
  .option('--no-preserve', "Don't preserve directory structure", false)
  .option('--no-titles', "Don't auto-generate titles", false)
  .option('--no-descriptions', "Don't auto-generate descriptions", false)
  .option('--timestamps', 'Add lastUpdated timestamps', false)
  .option('--category <category>', 'Default category for documents', 'documentation')
  .option('--fix-links', 'Fix internal links during conversion', false)
  .option('--process-images', 'Process and copy images during conversion', false)
  .option('--generate-toc', 'Generate table of contents', false)
  .option('--validate', 'Validate content after conversion', false)
  .option('-v, --verbose', 'Show detailed output', false)
  .option('--dry-run', 'Preview changes without writing files', false)
  .action(async (input, options) => {
    intro(pc.bgCyan(pc.black(' Batch Convert ')))

    const inputPath = resolve(input)
    const inputType = detectInputType(inputPath)

    // Use smart output directory detection
    const outputDir = getOutputDirectory(options.output)

    if (inputType === 'not-found') {
      note(`${pc.red('❌ Error:')} Input path "${input}" does not exist`, 'Error')
      process.exit(1)
    }

    // Show smart detection info
    const smartDefaults = getSmartDefaults()
    if (smartDefaults.isStarlightProject) {
      note(`✅ Detected Starlight project, using: ${pc.cyan(outputDir)}`, 'Smart Detection')
    } else {
      note(`⚠️  Using fallback output directory: ${pc.cyan(outputDir)}`, 'Fallback Mode')
    }

    const s = spinner()
    s.start(`${options.dryRun ? 'Previewing' : 'Converting'} documents...`)

    try {
      const converter = new DocumentConverter({
        outputDir,
        preserveStructure: options.preserve,
        generateTitles: options.titles,
        generateDescriptions: options.descriptions,
        addTimestamps: options.timestamps,
        defaultCategory: options.category,
        fixLinks: options.fixLinks,
        processImages: options.processImages,
        generateToc: options.generateToc,
        validateContent: options.validate,
        verbose: options.verbose,
        dryRun: options.dryRun,
      })

      const results =
        inputType === 'directory'
          ? await converter.convertDirectory(inputPath)
          : [await converter.convertFile(inputPath)]

      s.stop(`${options.dryRun ? 'Preview' : 'Conversion'} completed!`)

      const stats = getFormattedStats(results)
      note(
        `${pc.green('✅ Successful:')} ${stats.successful} files\n` +
          (stats.skipped > 0 ? `${pc.yellow('⏭️ Skipped:')} ${stats.skipped} files\n` : '') +
          (stats.failed > 0 ? `${pc.red('❌ Failed:')} ${stats.failed} files\n` : '') +
          (options.dryRun ? pc.yellow('🧪 Dry run - no files were modified') : ''),
        'Results'
      )

      converter.printStats()
      outro('🎉 Batch conversion completed!')
    } catch (error) {
      s.stop('Conversion failed')
      note(`${pc.red('❌ Error:')} ${error}`, 'Conversion failed')
      process.exit(1)
    }
  })

// Setup command
program
  .command('setup')
  .description('Interactive project setup wizard')
  .action(async () => {
    await configurationWizard()
  })

// Watch command
program
  .command('watch')
  .description('Watch directory for changes')
  .argument('<input>', 'Directory to watch')
  .option('-o, --output <dir>', 'Output directory', 'src/content/docs')
  .option('-v, --verbose', 'Show detailed output')
  .action(async (input, options) => {
    intro(pc.bgGreen(pc.black(' File Watcher ')))

    const inputPath = resolve(input)
    if (detectInputType(inputPath) !== 'directory') {
      note(`${pc.red('❌ Error:')} Watch requires a directory path`, 'Error')
      process.exit(1)
    }

    note(`Watching ${pc.cyan(relative(process.cwd(), inputPath))} for changes...`, 'Monitoring')

    const { watch } = await import('node:fs')
    const converter = new DocumentConverter({
      outputDir: options.output,
      verbose: options.verbose,
    })

    const watcher = watch(inputPath, { recursive: true }, async (eventType, filename) => {
      if (!filename || eventType !== 'change') return

      const ext = filename.split('.').pop()?.toLowerCase()
      if (['docx', 'doc', 'txt', 'html', 'htm', 'md', 'rtf'].includes(ext || '')) {
        const s = spinner()
        s.start(`Converting ${filename}...`)

        try {
          await converter.convertFile(resolve(inputPath, filename))
          s.stop(`${pc.green('✅')} Converted: ${filename}`)
        } catch (error) {
          s.stop(`${pc.red('❌')} Failed: ${filename}`)
          console.log(`   ${pc.red('Error:')} ${error}`)
        }
      }
    })

    process.on('SIGINT', () => {
      watcher.close()
      outro('👋 Stopped watching')
      process.exit(0)
    })
  })

// Repair command
program
  .command('repair')
  .description('Repair frontmatter and content issues in existing Starlight files')
  .argument('<input>', 'Input file or directory to repair')
  .option('-o, --output <dir>', 'Output directory (defaults to input location)')
  .option('--fix-links', 'Fix internal links and references', false)
  .option('--process-images', 'Process and copy images to assets directory', false)
  .option('--generate-toc', 'Generate table of contents', false)
  .option('--dry-run', 'Preview repairs without making changes', false)
  .option('-v, --verbose', 'Show detailed output', false)
  .action(async (input, options) => {
    intro(pc.bgYellow(pc.black(' Content Repair ')))

    const inputPath = resolve(input)
    const inputType = detectInputType(inputPath)

    if (inputType === 'not-found') {
      note(`${pc.red('❌ Error:')} Input path "${input}" does not exist`, 'Error')
      process.exit(1)
    }

    try {
      const { repairSingleFile, repairDirectory, showRepairResults, createSpinner } = await import(
        './utils/cli-commands.js'
      )

      const repairOptions = {
        output: options.output || (inputType === 'directory' ? inputPath : dirname(inputPath)),
        fixLinks: options.fixLinks,
        processImages: options.processImages,
        generateToc: options.generateToc,
        dryRun: options.dryRun,
        verbose: options.verbose,
      }

      const s = createSpinner('content repair', options.dryRun)

      if (inputType === 'directory') {
        const stats = await repairDirectory(inputPath, repairOptions)
        s.stop(`${options.dryRun ? 'Analysis' : 'Repair'} completed!`)
        note(showRepairResults(stats, repairOptions), 'Results')
      } else {
        const result = await repairSingleFile(inputPath, repairOptions)
        s.stop(`${options.dryRun ? 'Analysis' : 'Repair'} completed!`)

        const stats = {
          filesProcessed: 1,
          totalRepaired: result.repaired ? 1 : 0,
          totalIssues: result.issues.length,
        }

        if (repairOptions.verbose && result.repaired) {
          console.log(`\n${pc.cyan(basename(inputPath))}:`)
          result.issues.forEach((issue) => console.log(`  • ${issue}`))
        }

        note(showRepairResults(stats, repairOptions), 'Results')
      }

      outro(`🎉 Content repair ${options.dryRun ? 'analysis' : 'completed'}!`)
    } catch (error) {
      note(`${pc.red('❌ Error:')} ${error}`, 'Repair failed')
      process.exit(1)
    }
  })

// Validate command
program
  .command('validate')
  .description('Validate Starlight content structure and quality')
  .argument('<input>', 'Input file or directory to validate')
  .option('--fix-issues', 'Automatically fix issues where possible', false)
  .option('--show-details', 'Show detailed validation results for all files', false)
  .option('-v, --verbose', 'Show verbose output with issue details', false)
  .action(async (input, options) => {
    intro(pc.bgBlue(pc.black(' Content Validation ')))

    const inputPath = resolve(input)
    const inputType = detectInputType(inputPath)

    if (inputType === 'not-found') {
      note(`${pc.red('❌ Error:')} Input path "${input}" does not exist`, 'Error')
      process.exit(1)
    }

    try {
      const { validateSingleFile, validateDirectory, showValidationResults, createSpinner } =
        await import('./utils/cli-commands.js')

      const validateOptions = {
        fixIssues: options.fixIssues,
        showDetails: options.showDetails,
        verbose: options.verbose,
      }

      const s = createSpinner('content validation')

      let stats: ValidationStats

      if (inputType === 'directory') {
        stats = await validateDirectory(inputPath, validateOptions)
      } else {
        const result = await validateSingleFile(inputPath, validateOptions)
        stats = {
          totalFiles: 1,
          validFiles: result.valid ? 1 : 0,
          issueCount: result.validation.issues.filter((i) => i.type === 'error').length,
          allIssues: result.valid
            ? []
            : [{ file: basename(inputPath), validation: result.validation }],
        }

        // Show single file results
        console.log(
          `\n${pc.cyan(basename(inputPath))}: ${result.valid ? pc.green('✅ Valid') : pc.red('❌ Issues')}`
        )
        if (result.validation.score) {
          const scoreColor =
            result.validation.score.overall === 'good'
              ? pc.green
              : result.validation.score.overall === 'fair'
                ? pc.yellow
                : pc.red
          console.log(`Quality: ${scoreColor(result.validation.score.overall.toUpperCase())}`)
        }

        if (!result.valid) {
          result.validation.issues.forEach((issue) => {
            const icon = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️'
            console.log(`  ${icon} ${issue.message}`)
          })
        }
      }

      s.stop('Validation completed!')

      note(showValidationResults(stats), 'Validation Summary')

      // Auto-fix integration
      if (options.fixIssues && stats.allIssues.length > 0) {
        const shouldFix = await confirm({
          message: `Fix ${stats.allIssues.length} files with issues?`,
          initialValue: true,
        })

        if (shouldFix && !isCancel(shouldFix)) {
          note('Running automatic repair...', 'Auto-fix')

          const { repairDirectory, repairSingleFile } = await import('./utils/cli-commands.js')
          const repairOptions = {
            output: inputType === 'directory' ? inputPath : dirname(inputPath),
            fixLinks: false,
            processImages: false,
            generateToc: false,
            dryRun: false,
            verbose: false,
          }

          const repairSpinner = createSpinner('auto-repair')

          if (inputType === 'directory') {
            await repairDirectory(inputPath, repairOptions)
          } else {
            await repairSingleFile(inputPath, repairOptions)
          }

          repairSpinner.stop('Auto-repair completed!')
          note(
            'Issues have been automatically fixed. Re-run validation to verify.',
            'Auto-fix Complete'
          )
        }
      }

      const successRate =
        stats.totalFiles > 0 ? Math.round((stats.validFiles / stats.totalFiles) * 100) : 100
      outro(
        `🎉 Validation completed! ${successRate >= 90 ? 'Excellent quality!' : successRate >= 70 ? 'Good quality.' : 'Consider improvements.'}`
      )
    } catch (error) {
      note(`${pc.red('❌ Error:')} ${error}`, 'Validation failed')
      process.exit(1)
    }
  })

// Enhanced Help command
program.addHelpText('before', createBrandHeader('Starlight Document Converter', '1.7.0'))

program.addHelpText(
  'after',
  formatHelpSection('Basic Commands', [
    {
      name: 'starlight-convert',
      description: 'Interactive mode with smart detection and guided setup',
    },
    {
      name: 'starlight-convert setup',
      description: 'Project setup wizard for new Astro Starlight projects',
    },
    {
      name: 'starlight-convert batch <input>',
      description: 'Convert multiple files or entire directories',
    },
    {
      name: 'starlight-convert watch <input>',
      description: 'Watch directory for changes and auto-convert',
    },
  ]) +
    formatHelpSection('Content Management', [
      {
        name: 'starlight-convert repair <input>',
        description: 'Fix frontmatter, links, images, and content issues',
      },
      {
        name: 'starlight-convert validate <input>',
        description: 'Validate content structure and quality scoring',
      },
    ]) +
    formatHelpSection('Common Options', [
      { name: '--dry-run', description: 'Preview changes without modifying any files' },
      { name: '-v, --verbose', description: 'Show detailed output and progress information' },
      { name: '-o, --output <dir>', description: 'Specify output directory for converted files' },
    ]) +
    formatHelpSection('Examples', [
      {
        name: 'Batch Conversion',
        description: 'starlight-convert batch docs/ --generate-toc --fix-links',
      },
      {
        name: 'Content Repair',
        description: 'starlight-convert repair content/ --process-images --dry-run',
      },
      {
        name: 'Quality Check',
        description: 'starlight-convert validate docs/ --show-details --verbose',
      },
    ]) +
    `\n${boxes.info('For complete documentation and advanced usage examples, visit:\nhttps://github.com/entro314-labs/starlight-document-converter', 'Documentation')}\n`
)

// Parse CLI arguments
if (process.argv.length === 2) {
  // No arguments provided - show interactive mode
  interactiveConvert()
} else {
  program.parse()
}
