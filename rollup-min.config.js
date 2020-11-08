import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import { terser } from 'rollup-plugin-terser';
import gzipPlugin from 'rollup-plugin-gzip'

const algorithms = [
  'argon2', 'bcrypt', 'blake2b', 'blake2s', 'crc32', 'hmac', 'keccak', 'md4', 'md5',
  'pbkdf2', 'ripemd160', 'scrypt', 'sha1', 'sha3', 'sha224', 'sha256', 'sha384', 'sha512',
  'sm3', 'whirlpool', 'xxhash32', 'xxhash64',
];

const configs = algorithms.map((algo) => ({
  input: `lib/${algo}.ts`,
  output: [
    {
      file: `dist/${algo}.umd.min.js`,
      name: 'hashwasm',
      format: 'umd',
      extend: true,
    },
  ],
  plugins: [
    json(),
    typescript(),
    terser({
      output: {
        comments: false,
      },
    }),
    gzipPlugin(),
  ],
}));

export default configs;
