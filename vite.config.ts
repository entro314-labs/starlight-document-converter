import { defineConfig } from 'vite-plus'

export default defineConfig({
  staged: {
    '*': 'vp check --fix',
  },
  lint: { options: { typeAware: true, typeCheck: true } },
  // `vp fmt` and the staged hook's `vp check --fix` read only this block; the `oxfmt` package
  // scripts read .oxfmtrc.jsonc. Keep the two in sync.
  fmt: {
    printWidth: 100,
    useTabs: false,
    singleQuote: true,
    jsxSingleQuote: false,
    quoteProps: 'as-needed',
    trailingComma: 'es5',
    semi: false,
    arrowParens: 'always',
    bracketSpacing: true,
    objectWrap: 'preserve',
    insertFinalNewline: true,
    embeddedLanguageFormatting: 'auto',
    htmlWhitespaceSensitivity: 'css',
    proseWrap: 'preserve',
    sortPackageJson: {
      sortScripts: true,
    },
    overrides: [
      {
        files: ['**/*.md'],
        options: {
          printWidth: 80,
        },
      },
    ],
  },
  pack: {
    entry: {
      index: 'src/index.ts',
      cli: 'src/cli.ts',
    },
    format: ['esm'],
    // package.json's bin and exports point at dist/*.js and dist/*.d.ts; without this the node
    // platform default emits .mjs and .d.mts and the published entry points do not exist.
    fixedExtension: false,
    dts: true,
    clean: true,
    sourcemap: true,
    minify: false,
    target: 'node22',
  },
})
