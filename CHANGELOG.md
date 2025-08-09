# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2025-01-27

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

## [1.1.0] - 2025-01-27

### Added
- Enhanced folder detection logic for better Starlight project integration
- Improved default folder detection and recommendations
- Better CLI user experience with smart input source detection

### Fixed
- Updated dependency handling and build configuration
- Improved GitHub Actions workflows for automated publishing
- Fixed pnpm workflow configurations

## [1.0.0] - 2025-01-27

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