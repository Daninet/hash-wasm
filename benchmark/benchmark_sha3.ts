import benny from 'benny';
import nodeCrypto from 'crypto';
import { SHA3 as NpmSHA3 } from 'sha3';
import JsSHA from 'jssha';
import { sha3 as wasmSHA3 } from '../dist/index.umd';
import interpretResults from './interpret';

export default (size: number, divisor: number) => {
  const buf = Buffer.alloc(size);
  buf.fill('\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF');
  const result = nodeCrypto.createHash('SHA3-512').update(buf).digest('hex');

  return benny.suite(
    'SHA3-512',

    benny.add('hash-wasm', async () => {
      for (let i = 0; i < divisor; i++) {
        const hash = await wasmSHA3(buf);
        if (hash !== result) throw new Error('Hash error');
      }
    }),

    benny.add('node-crypto', async () => {
      for (let i = 0; i < divisor; i++) {
        const hashObj = nodeCrypto.createHash('SHA3-512');
        hashObj.update(buf);
        if (hashObj.digest('hex') !== result) throw new Error('Hash error');
      }
    }),

    benny.add('npm-sha3', async () => {
      for (let i = 0; i < divisor; i++) {
        const hasher = new NpmSHA3(512);
        hasher.update(buf);
        const hash = hasher.digest('hex');
        if (hash !== result) throw new Error('Hash error');
      }
    }),

    benny.add('jsSHA', async () => {
      for (let i = 0; i < divisor; i++) {
        const hasher = new JsSHA('SHA3-512', 'UINT8ARRAY' as any, { encoding: 'UTF8' });
        hasher.update(buf);
        const hash = hasher.getHash('HEX');
        if (hash !== result) throw new Error('Hash error');
      }
    }),

    benny.cycle(),
    benny.complete((summary) => {
      interpretResults(summary, size, divisor);
    }),
  );
};
