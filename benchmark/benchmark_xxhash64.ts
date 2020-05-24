import benny from 'benny';
import xxhashjs from 'xxhashjs';
import xxhash from 'xxhash';
import xxhashWasm from 'xxhash-wasm';
import { xxhash64 as wasmXXHASH64 } from '../dist/index.umd';
import interpretResults, { benchmarkOptions } from './interpret';

const SEED = 0;

export default (size: number, divisor: number) => {
  const buf = Buffer.alloc(size);
  buf.fill('\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF');
  const result = '3cfc420cf71c1057';

  return benny.suite(
    'XXHASH64',

    benny.add('hash-wasm', async () => {
      for (let i = 0; i < divisor; i++) {
        const hash = await wasmXXHASH64(buf, SEED);
        if (hash !== result) throw new Error('Hash error');
      }
    }, benchmarkOptions),

    benny.add('xxhash', async () => {
      for (let i = 0; i < divisor; i++) {
        const hash = xxhash.hash64(buf, SEED).swap64().toString('hex');
        if (hash !== result) throw new Error('Hash error');
      }
    }, benchmarkOptions),

    benny.add('xxhashjs', async () => {
      for (let i = 0; i < divisor; i++) {
        const hash = xxhashjs.h64(buf, SEED).toString(16);
        if (hash !== result) throw new Error('Hash error');
      }
    }, benchmarkOptions),

    benny.add('xxhashWasm', async () => {
      for (let i = 0; i < divisor; i++) {
        const hasher = await xxhashWasm();
        const hash = hasher.h64(buf.toString(), 0, SEED);
        if (hash !== result) throw new Error('Hash error');
      }
    }, benchmarkOptions),

    benny.cycle(),
    benny.complete((summary) => {
      interpretResults(summary, size, divisor);
    }),
  );
};
