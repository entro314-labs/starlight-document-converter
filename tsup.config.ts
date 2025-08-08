import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    cli: 'src/cli.ts'
  },
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: false,
  target: 'node18'
});