# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Additional CLI utility modules and enhanced command structure
- Cross-platform styling improvements for better terminal compatibility
- Extended plugin architecture with new built-in processors
- Enhanced integration testing suite

### Changed
- Improved code organization with better separation of concerns
- Refined plugin type definitions for better extensibility
- Enhanced converter logic for more robust document processing

### Fixed
- Various minor bug fixes and performance improvements
- Enhanced error handling in edge cases

## [1.5.0] - 2025-08-09

### 🎉 Major New Features

#### Content Repair System
- **New `repair` command** - Fix frontmatter and content issues in existing Starlight files
  - Automatically repairs missing or malformed frontmatter
  - Fixes internal links and references
  - Processes and copies images to assets directory
  - Generates table of contents for better navigation
  - Supports both single files and directory batch processing
  - Dry-run mode for safe previewing of changes

#### Content Validation System
- **New `validate` command** - Comprehensive content structure and quality validation
  - Validates required frontmatter fields (title, description, category)
  - Checks content structure and heading hierarchy
  - Quality scoring system with actionable suggestions
  - Auto-fix integration to repair issues automatically
  - Detailed reporting with success rates and issue breakdown

#### Advanced Content Analysis
- **Intelligent metadata generation** using new ContentAnalyzer
  - Smart title extraction from headings and content
  - SEO-optimized description generation (155 character limit)
  - Automatic category inference from file paths and content
  - Technology and topic-based tag suggestions
  - Content type detection (guide, tutorial, reference, blog, documentation)
  - Complexity assessment (simple, moderate, complex)
  - Reading time estimation and word count analysis

#### Table of Contents Generation
- **Automatic TOC generation** for improved navigation
  - Configurable depth levels (default: 4 levels)
  - Minimum entry threshold to avoid cluttered TOCs
  - Multiple output formats: Markdown, HTML, Starlight sidebar JSON
  - Smart insertion after title or custom positioning
  - Existing TOC detection and replacement
  - URL-friendly anchor generation

#### Link and Image Processing
- **Comprehensive link management**
  - Internal link validation and repair
  - Automatic path resolution for Starlight compatibility
  - Broken link detection and reporting
  - Extension normalization (.md/.mdx handling)
- **Image processing pipeline**
  - Automatic image copying to assets directory
  - Relative path conversion for proper rendering
  - Alt text validation and suggestions
  - Missing image detection and reporting

### 🔧 Enhanced CLI Experience

#### New Commands
```bash
# Content repair with advanced options
starlight-convert repair <input> [options]
  --fix-links          Fix internal links and references
  --process-images     Process and copy images to assets
  --generate-toc       Generate table of contents
  --dry-run           Preview repairs without making changes

# Content validation with quality scoring
starlight-convert validate <input> [options]
  --fix-issues        Automatically fix issues where possible
  --show-details      Show detailed validation results
  --verbose           Show issue details and suggestions
```

#### Enhanced Batch Command
```bash
starlight-convert batch <input> [options]
  --fix-links         Fix internal links during conversion
  --process-images    Process and copy images during conversion
  --generate-toc      Generate table of contents
  --validate          Validate content after conversion
```

#### Improved Help System
- Organized help sections (Basic Commands, Content Management, Advanced Features)
- Comprehensive examples for all use cases
- Option descriptions with clear explanations
- Command-specific help with use case scenarios

### 🏗️ Architecture Improvements

#### Plugin System Enhancement
- **New built-in plugins**:
  - `frontmatterEnhancer` - Repairs and enhances frontmatter metadata
  - `frontmatterValidator` - Validates frontmatter quality and structure
  - `markdownProcessor` - Advanced markdown processing with link/image handling
  - Enhanced `markdownEnhancer` - Now uses ContentAnalyzer for better metadata extraction

#### Unified Type System
- Consolidated DocumentMetadata interfaces across plugin and core systems
- Added support for extended metadata fields:
  - `readingTime` - Estimated reading time in minutes
  - `wordCount` - Total word count for content
  - `contentType` - Detected content type (guide, tutorial, etc.)
  - `complexity` - Content complexity assessment
  - `author` and `draft` fields for publishing workflows

#### Integration Helper System
- New `PluginIntegrationHelper` for seamless plugin coordination
- Automatic plugin initialization and validation
- Error handling and graceful degradation for failed plugins
- Processing context management for consistent plugin execution

### 🧪 Testing & Quality Assurance

#### Comprehensive Test Coverage
- **New test suites**:
  - `frontmatter-repair.test.ts` - Frontmatter repair and validation logic
  - `content-analyzer.test.ts` - Content analysis and metadata generation
  - `toc-generator.test.ts` - Table of contents generation functionality
  - `cli-commands.test.ts` - CLI command utilities and helpers
  - `integration-helper.test.ts` - Plugin integration and coordination

#### Quality Improvements
- TypeScript strict mode compliance
- Comprehensive error handling with user-friendly messages
- Input validation and sanitization
- Memory usage optimization for large file processing

### 📚 Developer Experience

#### Enhanced CLI Helpers
- New `cli-commands.ts` utility module with reusable functions
- Reduced command complexity (addressing Biome lint warnings)
- Consistent error handling and user feedback patterns
- Spinner and progress indication improvements

#### Better Configuration Support
- Extended ConversionOptions with new feature flags
- Backward compatibility with existing configurations
- Smart defaults for new features (disabled by default)
- Environment-specific configuration validation

### 🐛 Bug Fixes & Improvements

#### Content Processing
- Fixed YAML frontmatter parsing edge cases
- Improved markdown heading extraction reliability
- Better handling of special characters in titles and descriptions
- Enhanced error messages for debugging conversion issues

#### Link Processing
- Resolved relative path calculation issues
- Fixed extension handling for .md/.mdx files
- Improved internal link detection accuracy
- Better error reporting for broken links

#### Image Handling
- Fixed asset directory creation race conditions
- Improved image path resolution for nested directories
- Better handling of external image URLs
- Enhanced alt text extraction and validation

### 🔄 Migration Guide

#### For Existing Users
All existing functionality remains fully compatible. New features are opt-in:

```bash
# Existing commands work exactly the same
starlight-convert batch docs/

# New features require explicit flags
starlight-convert batch docs/ --fix-links --generate-toc
```

#### For Plugin Developers
- Plugin interfaces remain backward compatible
- New optional methods available for enhanced functionality
- Updated DocumentMetadata interface includes new optional fields
- Plugin registration system unchanged

### 📋 Breaking Changes
- **None** - This is a feature release with full backward compatibility

---

## [1.2.0] - 2025-08-09

### Added
- Graceful file type detection and handling
- Smart binary file filtering (automatically skips images, assets, etc.)
- Text-based file processing (processes .js, .json, .yaml, etc. as plain text)
- Enhanced logging and statistics for skipped files
- Better CLI output showing successful, skipped, and failed files separately

### Fixed
- **Major improvement**: Reduced error rate from ~79% to minimal failures by gracefully handling unsupported file formats
- No more flooding of "Unsupported file format" errors
- Binary files (.webp, .png, .svg, .ico, .ttf, etc.) are now silently skipped instead of throwing errors
- Text-based files are intelligently processed instead of being rejected

### Improved
- Code complexity reduction through function refactoring
- Better separation of concerns in file processing logic
- Enhanced error messages with clear categorization
- More informative statistics tracking and reporting

### Technical
- Refactored `convertFile` method to reduce cognitive complexity
- Added `shouldSkipFile()`, `isTextBasedFile()`, and `processFileByType()` helper methods
- Updated `ConversionResult` interface with `skipped` and `errorMessage` properties
- Improved TypeScript type safety throughout the codebase
- All tests pass with maintained functionality

## [1.1.0] - 2025-08-09

### Added
- Enhanced folder detection logic for better Starlight project integration
- Improved default folder detection and recommendations
- Better CLI user experience with smart input source detection
- Enhanced GitHub Actions workflow with automated publishing pipeline
- Code quality improvements with Biome integration

### Changed
- Migrated from ESLint to Biome for better linting and formatting
- Refactored complex functions to improve maintainability and reduce cognitive complexity
- Updated Node.js engine requirement to ≥20.0.0
- Enhanced peer dependency configuration with optional flags

### Fixed
- Updated dependency handling and build configuration
- Improved GitHub Actions workflows for automated publishing
- Fixed pnpm workflow configurations
- Resolved TypeScript type issues in CLI components
- Enhanced test suite reliability and coverage

### Technical
- Broke down `interactiveConvert` function into smaller, focused helper functions
- Simplified `extractDescription`, `extractTags`, and validation methods
- Split large conversion functions into manageable, testable units
- Added comprehensive GitHub workflow documentation
- Updated test expectations to match new description generation format

## [1.0.2] - 2025-08-09

### Fixed
- **Critical**: Moved Astro and Starlight dependencies to optional peer dependencies for global installation compatibility
- Resolved dependency conflicts preventing global package installation
- Enhanced integration utilities for better framework detection
- Improved CLI helper functions for more robust operation

### Changed
- Updated Node.js engine requirement from ≥18.0.0 to ≥22.0.0
- Updated Astro peer dependency to ^5.12.9 and Starlight to ^0.35.2
- Enhanced peer dependency metadata with optional configuration
- Updated development dependencies for better compatibility

### Technical
- Enhanced `starlight-detector.ts` with better project detection logic
- Improved `cli-helpers.ts` with more robust utility functions
- Updated `integration.ts` with enhanced framework integration capabilities

## [1.0.1] - 2025-08-09

### Fixed
- Fixed CI/CD pipeline configuration for GitHub Actions
- Corrected pnpm installation syntax in workflow files
- Added proper peer dependency installation in automated builds
- Enhanced release workflow with better dependency management

### Changed
- Updated package dependencies for better security and compatibility
- Improved GitHub Actions workflow configuration
- Enhanced automated testing and publishing pipeline

## [1.0.0] - 2025-08-09

### Added
- Initial release of Starlight Document Converter
- Support for multiple document formats (.docx, .doc, .txt, .html, .htm, .md, .rtf)
- Astro integration for automatic document conversion
- CLI tool for standalone document conversion
- Smart frontmatter generation with titles, descriptions, categories, and tags
- Batch processing with directory structure preservation
- File watching for auto-conversion during development
- TypeScript support with full type definitions
- Comprehensive test suite with Vitest
- Example configurations and usage patterns

### Features
- **Multi-format Support**: Convert Word docs, HTML, text files, and more
- **Astro Integration**: Seamless integration with Astro Starlight projects
- **CLI Tool**: Standalone command-line interface with `starlight-convert`
- **Smart Processing**: Auto-generates titles, descriptions, categories, and tags
- **File Watching**: Real-time conversion during development
- **Batch Processing**: Handle entire directories with preserved structure
- **Customizable**: Configurable category patterns, tag extraction, and output options
- **TypeScript**: Full type definitions and TypeScript source code

### Documentation
- Comprehensive README with usage examples
- API documentation with TypeScript types
- Example Astro configuration
- CLI usage guide
- Testing setup and coverage reports

[unreleased]: https://github.com/entro314-labs/starlight-document-converter/compare/v1.5.0...HEAD
[1.5.0]: https://github.com/entro314-labs/starlight-document-converter/compare/v1.2.0...v1.5.0
[1.2.0]: https://github.com/entro314-labs/starlight-document-converter/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/entro314-labs/starlight-document-converter/compare/v1.0.2...v1.1.0
[1.0.2]: https://github.com/entro314-labs/starlight-document-converter/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/entro314-labs/starlight-document-converter/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/entro314-labs/starlight-document-converter/releases/tag/v1.0.0