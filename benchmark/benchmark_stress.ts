/* eslint-disable no-await-in-loop */
import benny from 'benny';
import nodeCrypto from 'crypto';
import nodeForge from 'node-forge';
import { md5 as wasmMD5, sha1 as wasmSHA1, sha256 as wasmSHA256 } from '../dist/index.umd';
import interpretResults from './interpret';

export default (size: number, divisor: number) => {
  const buf = Buffer.alloc(size);
  buf.fill('\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF');
  const resultMD5 = nodeCrypto.createHash('MD5').update(buf).digest('hex');
  const resultSHA1 = nodeCrypto.createHash('SHA1').update(buf).digest('hex');
  const resultSHA256 = nodeCrypto.createHash('SHA256').update(buf).digest('hex');

  return benny.suite(
    'STRESS',

    benny.add('hash-wasm', async () => {
      for (let i = 0; i < divisor; i++) {
        let hash = await wasmMD5(buf);
        if (hash !== resultMD5) throw new Error('Hash error');
        hash = await wasmSHA1(buf);
        if (hash !== resultSHA1) throw new Error('Hash error');
        hash = await wasmSHA256(buf);
        if (hash !== resultSHA256) throw new Error('Hash error');
      }
    }),

    benny.add('node-crypto', async () => {
      for (let i = 0; i < divisor; i++) {
        let hashObj = nodeCrypto.createHash('MD5');
        hashObj.update(buf);
        if (hashObj.digest('hex') !== resultMD5) throw new Error('Hash error');

        hashObj = nodeCrypto.createHash('SHA1');
        hashObj.update(buf);
        if (hashObj.digest('hex') !== resultSHA1) throw new Error('Hash error');

        hashObj = nodeCrypto.createHash('SHA256');
        hashObj.update(buf);
        if (hashObj.digest('hex') !== resultSHA256) throw new Error('Hash error');
      }
    }),

    benny.add('node-forge', async () => {
      for (let i = 0; i < divisor; i++) {
        const forgeBuffer = nodeForge.util.createBuffer(buf.toString('binary'));
        let md = nodeForge.md.md5.create();
        md.update(forgeBuffer.data);
        if (md.digest().toHex() !== resultMD5) throw new Error('Hash error');

        md = nodeForge.md.sha1.create();
        md.update(forgeBuffer.data);
        if (md.digest().toHex() !== resultSHA1) throw new Error('Hash error');

        md = nodeForge.md.sha256.create();
        md.update(forgeBuffer.data);
        if (md.digest().toHex() !== resultSHA256) throw new Error('Hash error');
      }
    }),

    benny.cycle(),
    benny.complete((summary) => {
      interpretResults(summary, size, divisor);
    }),
  );
};
