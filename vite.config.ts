import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      include: ['src'],
      tsconfigPath: './tsconfig.json'
    })
  ],
  build: {
    outDir: resolve(import.meta.dirname, 'dist'),
    emptyOutDir: true,
    lib: {
      entry: {
        index: resolve(import.meta.dirname, 'src/index.ts')
      },
      name: 'CathlametLibrary',
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.js`
    },
    rollupOptions: {
      external: [
        '@dimforge/rapier3d-compat',
        'three',
        'three/webgpu'
      ],
      output: {
        globals: { three: 'THREE' }
      }
    },
    target: 'esnext',
    sourcemap: true,
    minify: false
  }
});
