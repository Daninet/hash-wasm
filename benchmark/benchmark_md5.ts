import benny from 'benny';
import nodeCrypto from 'crypto';
import npmMD5 from 'md5';
import nodeForge from 'node-forge';
import { md5 as wasmMD5 } from '../dist/index.umd';
import interpretResults, { benchmarkOptions } from './interpret';

export default (size: number, divisor: number) => {
  const buf = Buffer.alloc(size);
  buf.fill('\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF');
  const result = nodeCrypto.createHash('MD5').update(buf).digest('hex');

  return benny.suite(
    'MD5',

    benny.add('hash-wasm', async () => {
      for (let i = 0; i < divisor; i++) {
        const hash = await wasmMD5(buf);
        if (hash !== result) throw new Error('Hash error');
      }
    }, benchmarkOptions),

    benny.add('node-crypto', async () => {
      for (let i = 0; i < divisor; i++) {
        const hashObj = nodeCrypto.createHash('MD5');
        hashObj.update(buf);
        if (hashObj.digest('hex') !== result) throw new Error('Hash error');
      }
    }, benchmarkOptions),

    benny.add('npm-md5', async () => {
      for (let i = 0; i < divisor; i++) {
        const hash = npmMD5(buf);
        if (hash !== result) throw new Error('Hash error');
      }
    }, benchmarkOptions),

    benny.add('node-forge', async () => {
      for (let i = 0; i < divisor; i++) {
        const md = nodeForge.md.md5.create();
        const forgeBuffer = nodeForge.util.createBuffer(buf.toString('binary'));
        md.update(forgeBuffer.data);
        const hash = md.digest().toHex();
        if (hash !== result) throw new Error('Hash error');
      }
    }, benchmarkOptions),

    benny.cycle(),
    benny.complete((summary) => {
      interpretResults(summary, size, divisor);
    }),
  );
};
