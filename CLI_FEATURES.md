# 🌟 CLI Experience

✅ **UPDATE**: The new CLI has been successfully integrated as the main CLI!

The Starlight Document Converter features a completely redesigned, interactive CLI built with [Clack](https://clack.cc/) for a beautiful, modern experience.

## ✨ New Features

### 🎯 **Interactive Mode** (Default)
Simply run `starlight-convert` with no arguments for a guided, interactive experience:

```bash
npx starlight-convert
```

**Features:**
- ✅ Prompts with colors and emojis
- 📁 Automatic file detection and preview
- ⚙️ Advanced configuration options
- 🔍 Real-time validation
- 📊 Quality indicators with visual feedback

### 🚀 **Available Commands**

#### `convert` - Interactive Conversion
```bash
starlight-convert convert
```
Same as default interactive mode.

#### `batch` - Non-Interactive Batch Processing
```bash
starlight-convert batch <input> [options]
```

**Options:**
- `-o, --output <dir>` - Output directory (default: src/content/docs)
- `--no-preserve` - Don't preserve directory structure
- `--no-titles` - Don't auto-generate titles
- `--no-descriptions` - Don't auto-generate descriptions
- `--timestamps` - Add lastUpdated timestamps
- `--category <category>` - Default category
- `-v, --verbose` - Show detailed output
- `--dry-run` - Preview without writing files

#### `setup` - Project Setup Wizard
```bash
starlight-convert setup
```

Interactive wizard that:
- 🏗️ Generates Astro configuration
- 📂 Creates input directories
- ⚙️ Configures file watching
- 📋 Provides complete setup instructions

#### `watch` - File Watching
```bash
starlight-convert watch <directory> [options]
```

Real-time file monitoring with:
- 👀 Automatic conversion on file changes
- 🎯 Smart file filtering
- ⚡ Instant feedback
- 🛑 Graceful shutdown (Ctrl+C)

### 🎨 **Visual Improvements**

#### **Quality Indicators**
- 🟢 **High Quality**: Complete metadata, good structure
- 🟡 **Medium Quality**: Minor issues
- 🔴 **Low Quality**: Missing metadata, needs attention

#### **Beautiful Output**
- 📦 Branded headers with color backgrounds
- 📝 Informative notes and previews
- 📊 Clear progress indicators
- ✅ Success/error status with emojis
- 🎯 Sample conversion previews

#### **Interactive Prompts**
- 🎮 Multi-select for options
- ✅ Confirmation dialogs
- 📝 Validated text inputs
- 🎨 Syntax-highlighted code blocks
- ⚡ Real-time path validation

### 📚 **Usage Examples**

#### Quick Start (Interactive)
```bash
# Launch interactive mode
npx starlight-convert

# Follow the prompts:
# 1. Enter input path: ./docs
# 2. Choose output: src/content/docs
# 3. Configure options
# 4. Confirm and convert
```

#### Batch Processing
```bash
# Convert entire directory
npx starlight-convert batch ./docs --verbose

# Preview changes first
npx starlight-convert batch ./docs --dry-run

# Custom output location
npx starlight-convert batch ./legacy-docs -o ./new-content
```

#### Project Setup
```bash
# Interactive setup wizard
npx starlight-convert setup

# Choose project type:
# - New Starlight project
# - Existing project
# - Standalone CLI usage
```

#### File Watching
```bash
# Watch directory for changes
npx starlight-convert watch ./docs-import

# With custom output
npx starlight-convert watch ./drafts -o ./content/docs
```

### 🔧 **Advanced Features**

#### **Smart Detection**
- 📁 Automatic directory vs file detection
- 🎯 Supported format filtering
- 📊 File count previews
- ⚠️ Path validation

#### **Quality Validation**
- 📏 Title length checks
- 📝 Description quality analysis
- 🏗️ Content structure validation
- 🏷️ Tag relevance scoring

#### **Configuration Options**
- 📂 Directory structure preservation
- 🏷️ Automatic title generation
- 📝 Description extraction
- 📅 Timestamp addition
- 🎨 Category detection
- 🔍 Verbose logging

### 💡 **Tips**

1. **Start Interactive**: Use `starlight-convert` (no args) for the best experience
2. **Preview First**: Use `--dry-run` to see changes before applying
3. **Use Setup**: Run `setup` command for new projects
4. **Watch Mode**: Use `watch` for active development
5. **Quality Indicators**: Pay attention to 🟢🟡🔴 quality scores

### 🎯 **Migration from Old CLI**

Old command structure is still supported through the `batch` command:

```bash
# Old way (still works)
starlight-convert docs/ --output ./content --verbose

# New way (recommended)
starlight-convert batch docs/ --output ./content --verbose

# Best way (interactive)
starlight-convert
```

The new CLI provides a significantly enhanced experience while maintaining full backward compatibility!