import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';

export default {
  input: 'lib/index.ts',
  output: [
    {
      file: 'dist/index.umd.js',
      name: 'hashwasm',
      format: 'umd',
    },
    {
      file: 'dist/index.esm.js',
      format: 'es',
    },
  ],
  plugins: [
    json(),
    typescript(),
  ],
};
