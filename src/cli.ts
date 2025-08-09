#!/usr/bin/env node

import { existsSync, lstatSync, readdirSync } from 'node:fs';
import { basename, relative, resolve } from 'node:path';
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
} from '@clack/prompts';
import { Command } from 'commander';
import pc from 'picocolors';
import { DocumentConverter } from './converter.js';
import type { ConversionResult } from './types.js';
import { detectInputSources, getOutputDirectory, getSmartDefaults } from './utils/cli-helpers.js';

const program = new Command();

// Helper functions
const getFormattedStats = (results: ConversionResult[]) => {
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  return { successful, failed, total: results.length };
};

const detectInputType = (inputPath: string): 'file' | 'directory' | 'not-found' => {
  if (!existsSync(inputPath)) return 'not-found';
  return lstatSync(inputPath).isDirectory() ? 'directory' : 'file';
};

const getSampleFiles = (dir: string, maxSamples = 5): string[] => {
  try {
    const files = readdirSync(dir, { recursive: true })
      .filter((file: unknown) => typeof file === 'string')
      .filter((file: string) => {
        const ext = file.split('.').pop()?.toLowerCase();
        return ['md', 'mdx', 'txt', 'html', 'htm', 'docx', 'doc', 'rtf'].includes(ext || '');
      })
      .slice(0, maxSamples);
    return files as string[];
  } catch {
    return [];
  }
};

// Interactive convert command
async function interactiveConvert() {
  intro(pc.bgMagenta(pc.black(' Starlight Document Converter ')));

  // Get smart defaults for the current project
  const smartDefaults = getSmartDefaults();
  const detectedSources = detectInputSources();

  // Show project detection info
  if (smartDefaults.isStarlightProject) {
    note(
      `✅ Detected Starlight project: ${pc.cyan(smartDefaults.title || 'Documentation')}`,
      'Project Info'
    );
  } else {
    note(`⚠️  Starlight not detected - using fallback configuration`, 'Project Info');
  }

  if (smartDefaults.recommendations.length > 0) {
    note(smartDefaults.recommendations.join('\n'), 'Recommendations');
  }

  // Smart input source detection
  let inputPath: string;

  if (detectedSources.length > 0) {
    // Check if first source is the Starlight docs directory
    const isStarlightDir = detectedSources[0] === smartDefaults.outputDir || 
                          detectedSources[0].includes('src/content/docs');
    
    const message = isStarlightDir 
      ? `Found Starlight content directory and ${detectedSources.length > 1 ? 'other directories' : 'import directories'}: ${detectedSources.map((d) => pc.cyan(d)).join(', ')}`
      : `Found document directories: ${detectedSources.map((d) => pc.cyan(d)).join(', ')}`;
    
    note(message, 'Available Sources');

    const sourceChoice = await select({
      message: 'Choose input source:',
      options: [
        ...detectedSources.map((source, index) => {
          const isMainContentDir = index === 0 && isStarlightDir;
          return {
            value: source,
            label: `📁 ${source}`,
            hint: isMainContentDir ? 'Your Starlight content directory' : 'Document directory',
          };
        }),
        {
          value: 'custom',
          label: '✏️  Custom path',
          hint: 'Specify a different path',
        },
      ],
    });

    if (isCancel(sourceChoice)) {
      cancel('Operation cancelled');
      return process.exit(0);
    }

    if (sourceChoice === 'custom') {
      const customPath = await text({
        message: 'Enter path to convert:',
        placeholder: './docs or ./document.md',
        validate: (value) => {
          if (!value) return 'Please provide an input path';
          const resolved = resolve(value as string);
          const type = detectInputType(resolved);
          if (type === 'not-found') return 'Path does not exist';
          return undefined;
        },
      });

      if (isCancel(customPath)) {
        cancel('Operation cancelled');
        return process.exit(0);
      }

      inputPath = customPath as string;
    } else {
      inputPath = sourceChoice as string;
    }
  } else {
    // No sources detected, ask for input
    const customPath = await text({
      message: 'What would you like to convert?',
      placeholder: './docs or ./document.md',
      validate: (value) => {
        if (!value) return 'Please provide an input path';
        const resolved = resolve(value as string);
        const type = detectInputType(resolved);
        if (type === 'not-found') return 'Path does not exist';
        return undefined;
      },
    });

    if (isCancel(customPath)) {
      cancel('Operation cancelled');
      return process.exit(0);
    }

    inputPath = customPath as string;
  }

  if (isCancel(inputPath)) {
    cancel('Operation cancelled');
    return process.exit(0);
  }

  const resolvedInput = resolve(inputPath as string);
  const inputType = detectInputType(resolvedInput);

  // Show preview of what will be converted
  if (inputType === 'directory') {
    const sampleFiles = getSampleFiles(resolvedInput);
    if (sampleFiles.length > 0) {
      note(
        `Found ${sampleFiles.length} convertible files:\n${sampleFiles.map((f) => `  • ${f}`).join('\n')}${sampleFiles.length === 5 ? '\n  ... and potentially more' : ''}`,
        'Preview'
      );
    }
  } else {
    note(`Converting single file: ${pc.cyan(basename(resolvedInput))}`, 'Preview');
  }

  // Output configuration with smart defaults
  const outputDir = await text({
    message: 'Where should the converted files be saved?',
    placeholder: smartDefaults.outputDir,
    initialValue: smartDefaults.outputDir,
  });

  if (isCancel(outputDir)) {
    cancel('Operation cancelled');
    return process.exit(0);
  }

  // Advanced options
  const advancedOptions = await confirm({
    message: 'Configure advanced options?',
    initialValue: false,
  });

  let converterOptions: Record<string, unknown> = {
    outputDir: outputDir as string,
    preserveStructure: true,
    generateTitles: true,
    generateDescriptions: true,
    addTimestamps: false,
    verbose: false,
    dryRun: false,
  };

  if (advancedOptions && !isCancel(advancedOptions)) {
    // Structure preservation
    const preserveStructure = await confirm({
      message: 'Preserve directory structure?',
      initialValue: true,
    });

    if (isCancel(preserveStructure)) {
      cancel('Operation cancelled');
      return process.exit(0);
    }

    // Content generation options
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
    });

    if (isCancel(contentOptions)) {
      cancel('Operation cancelled');
      return process.exit(0);
    }

    // Quality and output options
    const outputOptions = await multiselect({
      message: 'Output preferences:',
      options: [
        { value: 'verbose', label: 'Verbose output', hint: 'Show detailed conversion logs' },
        { value: 'dryRun', label: 'Dry run', hint: 'Preview changes without writing files' },
      ],
      initialValues: [],
    });

    if (isCancel(outputOptions)) {
      cancel('Operation cancelled');
      return process.exit(0);
    }

    // Apply advanced options
    converterOptions = {
      ...converterOptions,
      preserveStructure: preserveStructure as boolean,
      generateTitles: (contentOptions as string[]).includes('titles'),
      generateDescriptions: (contentOptions as string[]).includes('descriptions'),
      addTimestamps: (contentOptions as string[]).includes('timestamps'),
      verbose: (outputOptions as string[]).includes('verbose'),
      dryRun: (outputOptions as string[]).includes('dryRun'),
    };
  }

  // Confirmation before conversion
  const confirmConversion = await confirm({
    message: `${converterOptions.dryRun ? 'Preview' : 'Convert'} ${inputType === 'directory' ? 'directory' : 'file'}?`,
  });

  if (!confirmConversion || isCancel(confirmConversion)) {
    cancel('Operation cancelled');
    return process.exit(0);
  }

  // Perform conversion
  const s = spinner();
  s.start(`${converterOptions.dryRun ? 'Previewing' : 'Converting'} documents...`);

  try {
    const converter = new DocumentConverter(converterOptions);

    const results =
      inputType === 'directory'
        ? await converter.convertDirectory(resolvedInput)
        : [await converter.convertFile(resolvedInput)];

    s.stop(`Conversion ${converterOptions.dryRun ? 'preview' : 'completed'}!`);

    const stats = getFormattedStats(results);

    if (stats.successful > 0) {
      note(
        `${pc.green('✅ Successful:')} ${stats.successful} files\n` +
          (stats.failed > 0 ? `${pc.red('❌ Failed:')} ${stats.failed} files\n` : '') +
          (converterOptions.dryRun ? pc.yellow('🧪 Dry run - no files were modified') : ''),
        'Results'
      );
    }

    // Show sample conversions
    const successfulResults = results.filter((r) => r.success).slice(0, 3);
    if (successfulResults.length > 0 && !converterOptions.dryRun) {
      note(
        `${successfulResults.map((r) => `• ${pc.cyan(relative(process.cwd(), r.inputPath))} → ${pc.green(relative(process.cwd(), r.outputPath))}`).join('\n')}`,
        'Sample conversions'
      );
    }

    converter.printStats();

    outro(
      `${pc.green('🎉 All done!')} Your documents have been ${converterOptions.dryRun ? 'previewed' : 'converted successfully'}.`
    );
  } catch (error) {
    s.stop('Conversion failed');
    note(`${pc.red('❌ Error:')} ${error}`, 'Conversion failed');
    process.exit(1);
  }
}

// Configuration wizard
async function configurationWizard() {
  intro(pc.bgBlue(pc.black(' Starlight Integration Setup ')));

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
  });

  if (isCancel(projectType)) {
    cancel('Setup cancelled');
    return process.exit(0);
  }

  if (projectType === 'standalone') {
    note(
      `You can now use the converter with:\n\n` +
        `${pc.cyan('npx starlight-convert <input> [options]')}\n\n` +
        `For interactive mode:\n` +
        `${pc.cyan('npx starlight-convert')}`,
      'CLI Usage'
    );
    outro('🎉 Setup complete!');
    return;
  }

  // Input directories
  const inputDirs = await text({
    message: 'Which directories should be monitored for documents?',
    placeholder: 'docs-import,documents,content-drafts',
    initialValue: 'docs-import',
  });

  if (isCancel(inputDirs)) {
    cancel('Setup cancelled');
    return process.exit(0);
  }

  const inputDirsList = (inputDirs as string).split(',').map((d) => d.trim());

  // Watch mode
  const enableWatch = await confirm({
    message: 'Enable automatic file watching?',
    initialValue: true,
  });

  if (isCancel(enableWatch)) {
    cancel('Setup cancelled');
    return process.exit(0);
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
});`;

  note(`Add this to your ${pc.cyan('astro.config.mjs')}:\n\n${pc.dim(config)}`, 'Configuration');

  const setupDirectories = await confirm({
    message: 'Create input directories now?',
    initialValue: true,
  });

  if (setupDirectories && !isCancel(setupDirectories)) {
    const s = spinner();
    s.start('Creating directories...');

    try {
      const { mkdir } = await import('node:fs/promises');
      for (const dir of inputDirsList) {
        await mkdir(dir, { recursive: true });
      }
      s.stop('Directories created!');

      note(
        `Created directories:\n${inputDirsList.map((d) => `• ${pc.green(d)}`).join('\n')}\n\n` +
          `Drop your documents into these folders and they'll be automatically converted!`,
        'Next Steps'
      );
    } catch (error) {
      s.stop('Failed to create directories');
      note(`${pc.red('❌ Error:')} Could not create directories: ${error}`, 'Error');
    }
  }

  outro(`${pc.green('🎉 Setup complete!')} Your Starlight Document Converter is ready to use.`);
}

// Command definitions
program
  .name('starlight-convert')
  .description('🌟 Beautiful document converter for Starlight')
  .version('1.0.0')
  .action(async () => {
    // Default interactive mode
    await interactiveConvert();
  });

// Convert command (can be called directly)
program
  .command('convert')
  .description('Convert documents interactively')
  .action(async () => {
    await interactiveConvert();
  });

// Non-interactive convert
program
  .command('batch')
  .description('Convert documents in batch mode')
  .argument('<input>', 'Input file or directory to convert')
  .option('-o, --output <dir>', 'Output directory (auto-detected if not specified)')
  .option('--no-preserve', "Don't preserve directory structure")
  .option('--no-titles', "Don't auto-generate titles")
  .option('--no-descriptions', "Don't auto-generate descriptions")
  .option('--timestamps', 'Add lastUpdated timestamps')
  .option('--category <category>', 'Default category for documents', 'documentation')
  .option('-v, --verbose', 'Show detailed output')
  .option('--dry-run', 'Preview changes without writing files')
  .action(async (input, options) => {
    intro(pc.bgCyan(pc.black(' Batch Convert ')));

    const inputPath = resolve(input);
    const inputType = detectInputType(inputPath);

    // Use smart output directory detection
    const outputDir = getOutputDirectory(options.output);

    if (inputType === 'not-found') {
      note(`${pc.red('❌ Error:')} Input path "${input}" does not exist`, 'Error');
      process.exit(1);
    }

    // Show smart detection info
    const smartDefaults = getSmartDefaults();
    if (smartDefaults.isStarlightProject) {
      note(`✅ Detected Starlight project, using: ${pc.cyan(outputDir)}`, 'Smart Detection');
    } else {
      note(`⚠️  Using fallback output directory: ${pc.cyan(outputDir)}`, 'Fallback Mode');
    }

    const s = spinner();
    s.start(`${options.dryRun ? 'Previewing' : 'Converting'} documents...`);

    try {
      const converter = new DocumentConverter({
        outputDir,
        preserveStructure: options.preserve,
        generateTitles: options.titles,
        generateDescriptions: options.descriptions,
        addTimestamps: options.timestamps,
        defaultCategory: options.category,
        verbose: options.verbose,
        dryRun: options.dryRun,
      });

      const results =
        inputType === 'directory'
          ? await converter.convertDirectory(inputPath)
          : [await converter.convertFile(inputPath)];

      s.stop(`${options.dryRun ? 'Preview' : 'Conversion'} completed!`);

      const stats = getFormattedStats(results);
      note(
        `${pc.green('✅ Successful:')} ${stats.successful} files\n` +
          (stats.failed > 0 ? `${pc.red('❌ Failed:')} ${stats.failed} files\n` : '') +
          (options.dryRun ? pc.yellow('🧪 Dry run - no files were modified') : ''),
        'Results'
      );

      converter.printStats();
      outro('🎉 Batch conversion completed!');
    } catch (error) {
      s.stop('Conversion failed');
      note(`${pc.red('❌ Error:')} ${error}`, 'Conversion failed');
      process.exit(1);
    }
  });

// Setup command
program
  .command('setup')
  .description('Interactive project setup wizard')
  .action(async () => {
    await configurationWizard();
  });

// Watch command
program
  .command('watch')
  .description('Watch directory for changes')
  .argument('<input>', 'Directory to watch')
  .option('-o, --output <dir>', 'Output directory', 'src/content/docs')
  .option('-v, --verbose', 'Show detailed output')
  .action(async (input, options) => {
    intro(pc.bgGreen(pc.black(' File Watcher ')));

    const inputPath = resolve(input);
    if (detectInputType(inputPath) !== 'directory') {
      note(`${pc.red('❌ Error:')} Watch requires a directory path`, 'Error');
      process.exit(1);
    }

    note(`Watching ${pc.cyan(relative(process.cwd(), inputPath))} for changes...`, 'Monitoring');

    const { watch } = await import('node:fs');
    const converter = new DocumentConverter({
      outputDir: options.output,
      verbose: options.verbose,
    });

    const watcher = watch(inputPath, { recursive: true }, async (eventType, filename) => {
      if (!filename || eventType !== 'change') return;

      const ext = filename.split('.').pop()?.toLowerCase();
      if (['docx', 'doc', 'txt', 'html', 'htm', 'md', 'rtf'].includes(ext || '')) {
        const s = spinner();
        s.start(`Converting ${filename}...`);

        try {
          await converter.convertFile(resolve(inputPath, filename));
          s.stop(`${pc.green('✅')} Converted: ${filename}`);
        } catch (error) {
          s.stop(`${pc.red('❌')} Failed: ${filename}`);
          console.log(`   ${pc.red('Error:')} ${error}`);
        }
      }
    });

    process.on('SIGINT', () => {
      watcher.close();
      outro('👋 Stopped watching');
      process.exit(0);
    });
  });

// Help command
program.addHelpText(
  'after',
  `
${pc.dim('Examples:')}
  ${pc.cyan('starlight-convert')}                    Interactive mode
  ${pc.cyan('starlight-convert setup')}              Project setup wizard
  ${pc.cyan('starlight-convert batch docs/')}        Convert directory
  ${pc.cyan('starlight-convert watch docs-import/')} Watch for changes
  
${pc.dim('For more help, visit:')} ${pc.underline('https://github.com/entro314-labs/starlight-document-converter')}
`
);

// Parse CLI arguments
if (process.argv.length === 2) {
  // No arguments provided - show interactive mode
  interactiveConvert();
} else {
  program.parse();
}
