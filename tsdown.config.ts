import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/utils/color.ts'],
  outDir: 'dist/lib',
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: false
});
