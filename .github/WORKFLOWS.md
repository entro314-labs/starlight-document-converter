# GitHub Actions Workflows

This repository uses several GitHub Actions workflows to automate development, testing, and release processes.

## 🔄 Available Workflows

### 1. **CI (Continuous Integration)**

**File**: `.github/workflows/ci.yml`

**Triggers:**

- Push to `main` or `v2` branches
- Pull requests to `main` branch

**What it does:**

- ✅ Tests across Node.js versions (18, 20, 22)
- ✅ Type checking with TypeScript
- ✅ Builds the project
- ✅ Runs test suite with coverage
- ✅ Lints and formats code with Biome
- ✅ Uploads coverage reports to Codecov

### 2. **Update Dependencies**

**File**: `.github/workflows/update-dependencies.yml`

**Triggers:**

- Scheduled: Every Monday at 9 AM UTC
- Manual trigger via "workflow_dispatch"

**What it does:**

- 🔄 Updates all dependencies to latest versions
- ✅ Runs tests to ensure compatibility
- 🔄 Creates a PR with dependency updates
- 📦 Auto-labels PR for easy review

### 3. **Publish to npm**

**File**: `.github/workflows/publish.yml`

**Triggers:**

- When a GitHub release is published
- Manual trigger with version bump options

**What it does:**

- ✅ Runs quality checks (tests, linting, typecheck)
- 🏗️ Builds the package
- 📦 Publishes to npm with provenance
- 🏷️ Creates GitHub release (for manual triggers)

### 4. **Create Release**

**File**: `.github/workflows/release.yml`

**Triggers:**

- Push of version tags (v*.*.\*)
- Manual trigger with custom tag/version

**What it does:**

- 📝 Generates automatic changelog from commits
- ✅ Runs full quality checks
- 🏗️ Builds the package
- 🚀 Creates beautiful GitHub release with features list
- 🔗 Includes installation instructions and links

## 🚀 How to Use

### Publishing a New Release

#### Option 1: Manual Release (Recommended)

1. Go to **Actions** tab in GitHub
2. Select **"Create Release"** workflow
3. Click **"Run workflow"**
4. Enter version tag (e.g., `v1.2.0`)
5. Choose if it's a pre-release
6. The workflow will:
   - Create the release
   - Generate changelog
   - Build beautiful release notes

#### Option 2: Tag-based Release

```bash
git tag v1.2.0
git push origin v1.2.0
```

### Publishing to npm

#### Option 1: Automatic (via Release)

When you create a GitHub release, the publish workflow automatically runs.

#### Option 2: Manual Publish

1. Go to **Actions** tab
2. Select **"Publish to npm"** workflow
3. Choose release type: `patch`, `minor`, or `major`
4. The workflow will:
   - Bump version in package.json
   - Run quality checks
   - Publish to npm
   - Create GitHub release

### Updating Dependencies

Dependencies are automatically updated every Monday, but you can also:

1. Go to **Actions** tab
2. Select **"Update Dependencies"** workflow
3. Click **"Run workflow"**
4. Review and merge the created PR

## 🔧 Required Secrets

Set these in your GitHub repository settings:

- `NPM_TOKEN` - npm authentication token for publishing
  - Get from: https://www.npmjs.com/settings/tokens
  - Scope: Automation token with publish permissions

## 📊 Quality Gates

All workflows include quality checks:

- ✅ TypeScript compilation
- ✅ Biome linting and formatting
- ✅ Full test suite
- ✅ Build verification
- ✅ Coverage reporting

## 🏷️ Versioning Strategy

This project follows [Semantic Versioning](https://semver.org/):

- **MAJOR** (`1.0.0` → `2.0.0`): Breaking changes
- **MINOR** (`1.0.0` → `1.1.0`): New features, backward compatible
- **PATCH** (`1.0.0` → `1.0.1`): Bug fixes, backward compatible

## 📝 Release Notes

Releases automatically include:

- 🎯 Feature highlights
- 📋 Auto-generated changelog from commits
- 📦 Installation instructions
- 🔗 Helpful links and documentation

## 🤝 Contributing

When contributing:

1. All PRs trigger CI workflow
2. Must pass all quality checks
3. Coverage reports help identify untested code
4. Dependencies are automatically kept up-to-date

## 🔗 Useful Links

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [npm Publishing Guide](https://docs.npmjs.com/cli/v8/commands/npm-publish)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://conventionalcommits.org/)
