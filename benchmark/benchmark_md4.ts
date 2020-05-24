import benny from 'benny';
import nodeCrypto from 'crypto';
import jsMD4 from 'js-md4';
import { md4 as wasmMD4 } from '../dist/index.umd';
import interpretResults, { benchmarkOptions } from './interpret';

export default (size: number, divisor: number) => {
  const buf = Buffer.alloc(size);
  buf.fill('\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF');
  const result = nodeCrypto.createHash('MD4').update(buf).digest('hex');

  return benny.suite(
    'MD4',

    benny.add('hash-wasm', async () => {
      for (let i = 0; i < divisor; i++) {
        const hash = await wasmMD4(buf);
        if (hash !== result) throw new Error('Hash error');
      }
    }, benchmarkOptions),

    benny.add('node-crypto', async () => {
      for (let i = 0; i < divisor; i++) {
        const hashObj = nodeCrypto.createHash('MD4');
        hashObj.update(buf);
        if (hashObj.digest('hex') !== result) throw new Error('Hash error');
      }
    }, benchmarkOptions),

    benny.add('js-md4', async () => {
      for (let i = 0; i < divisor; i++) {
        const hashObj = jsMD4.create();
        hashObj.update(buf);
        if (hashObj.hex() !== result) throw new Error('Hash error');
      }
    }, benchmarkOptions),

    benny.cycle(),
    benny.complete((summary) => {
      interpretResults(summary, size, divisor);
    }),
  );
};
