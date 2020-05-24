import benny from 'benny';
import nodeCrypto from 'crypto';
import nodeForge from 'node-forge';
import cryptoJsSHA256 from 'crypto-js/sha256';
import cryptoJsHex from 'crypto-js/enc-hex';
import JsSHA from 'jssha';
import sha256Wasm from 'sha256-wasm';
import { sha256 as wasmSHA256 } from '../dist/index.umd';
import interpretResults, { benchmarkOptions } from './interpret';

export default (size: number, divisor: number) => {
  const buf = Buffer.alloc(size);
  buf.fill('\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF');
  const result = nodeCrypto.createHash('SHA256').update(buf).digest('hex');

  return benny.suite(
    'SHA256',

    benny.add('hash-wasm', async () => {
      for (let i = 0; i < divisor; i++) {
        const hash = await wasmSHA256(buf);
        if (hash !== result) throw new Error('Hash error');
      }
    }, benchmarkOptions),

    benny.add('node-crypto', async () => {
      for (let i = 0; i < divisor; i++) {
        const hashObj = nodeCrypto.createHash('SHA256');
        hashObj.update(buf);
        if (hashObj.digest('hex') !== result) throw new Error('Hash error');
      }
    }, benchmarkOptions),

    benny.add('node-forge', async () => {
      for (let i = 0; i < divisor; i++) {
        const md = nodeForge.md.sha256.create();
        const forgeBuffer = nodeForge.util.createBuffer(buf.toString('binary'));
        md.update(forgeBuffer.data);
        const hash = md.digest().toHex();
        if (hash !== result) throw new Error('Hash error');
      }
    }, benchmarkOptions),

    benny.add('crypto-js', async () => {
      for (let i = 0; i < divisor; i++) {
        const hash = cryptoJsHex.stringify(cryptoJsSHA256(buf.toString('utf8')));
        if (hash !== result) throw new Error('Hash error');
      }
    }, benchmarkOptions),

    benny.add('jsSHA', async () => {
      for (let i = 0; i < divisor; i++) {
        const hasher = new JsSHA('SHA-256', 'UINT8ARRAY' as any, { encoding: 'UTF8' });
        hasher.update(buf);
        const hash = hasher.getHash('HEX');
        if (hash !== result) throw new Error('Hash error');
      }
    }, benchmarkOptions),

    benny.add('sha256-wasm', async () => {
      for (let i = 0; i < divisor; i++) {
        const hashObj = sha256Wasm();
        hashObj.update(buf);
        if (hashObj.digest('hex') !== result) throw new Error('Hash error');
      }
    }, benchmarkOptions),

    benny.cycle(),
    benny.complete((summary) => {
      interpretResults(summary, size, divisor);
    }),
  );
};
