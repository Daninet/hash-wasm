import benny from 'benny';
import xxhashjs from 'xxhashjs';
import xxhash from 'xxhash';
import xxhashWasm from 'xxhash-wasm';
import { xxhash64 as wasmXXHASH64 } from '../dist/index.umd';

const SEED = 0;
const SIZE = 4 * 1024 * 1024;
const buf = Buffer.alloc(SIZE);
buf.fill('\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF');
const result = '3cfc420cf71c1057';

export default () => benny.suite(
  'XXHASH64',

  benny.add('hash-wasm', async () => {
    const hash = await wasmXXHASH64(buf, SEED);
    if (hash !== result) throw new Error('Hash error');
  }),

  benny.add('xxhash', async () => {
    const hash = xxhash.hash64(buf, SEED).swap64().toString('hex');
    if (hash !== result) throw new Error('Hash error');
  }),

  benny.add('xxhashjs', async () => {
    const hash = xxhashjs.h64(buf, SEED).toString(16);
    if (hash !== result) throw new Error('Hash error');
  }),

  benny.add('xxhashWasm', async () => {
    const hasher = await xxhashWasm();
    const hash = hasher.h64(buf.toString(), 0, SEED);
    if (hash !== result) throw new Error('Hash error');
  }),

  benny.cycle(),
  benny.complete(),
);
