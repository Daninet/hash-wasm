import benny from 'benny';
import nodeCrypto from 'crypto';
import nodeForge from 'node-forge';
import npmSHA1 from 'sha1';
import cryptoJsSHA1 from 'crypto-js/sha1';
import cryptoJsHex from 'crypto-js/enc-hex';
import JsSHA from 'jssha';
import { sha1 as wasmSHA1 } from '../dist/index.umd';
import interpretResults from './interpret';

export default (size: number, divisor: number) => {
  const buf = Buffer.alloc(size);
  buf.fill('\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF');
  const result = nodeCrypto.createHash('SHA1').update(buf).digest('hex');

  return benny.suite(
    'SHA1',

    benny.add('hash-wasm', async () => {
      for (let i = 0; i < divisor; i++) {
        const hash = await wasmSHA1(buf);
        if (hash !== result) throw new Error('Hash error');
      }
    }),

    benny.add('node-crypto', async () => {
      for (let i = 0; i < divisor; i++) {
        const hashObj = nodeCrypto.createHash('SHA1');
        hashObj.update(buf);
        if (hashObj.digest('hex') !== result) throw new Error('Hash error');
      }
    }),

    benny.add('node-forge', async () => {
      for (let i = 0; i < divisor; i++) {
        const md = nodeForge.md.sha1.create();
        const forgeBuffer = nodeForge.util.createBuffer(buf.toString('binary'));
        md.update(forgeBuffer.data);
        const hash = md.digest().toHex();
        if (hash !== result) throw new Error('Hash error');
      }
    }),

    benny.add('npm-sha1', async () => {
      for (let i = 0; i < divisor; i++) {
        if (npmSHA1(buf) !== result) throw new Error('Hash error');
      }
    }),

    benny.add('crypto-js', async () => {
      for (let i = 0; i < divisor; i++) {
        const hash = cryptoJsHex.stringify(cryptoJsSHA1(buf.toString('utf8')));
        if (hash !== result) throw new Error('Hash error');
      }
    }),

    benny.add('jsSHA', async () => {
      for (let i = 0; i < divisor; i++) {
        const hasher = new JsSHA('SHA-1', 'UINT8ARRAY' as any, { encoding: 'UTF8' });
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
