import benny from 'benny';
import nodeCrypto from 'crypto';
import nodeForge from 'node-forge';
import cryptoJsSHA256 from 'crypto-js/sha256';
import cryptoJsHex from 'crypto-js/enc-hex';
import JsSHA from 'jssha';
import sha256Wasm from 'sha256-wasm';
import { sha256 as wasmSHA256 } from '../dist/index.umd';

const SIZE = 4 * 1024 * 1024;
const buf = Buffer.alloc(SIZE);
buf.fill('\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF');
const result = nodeCrypto.createHash('SHA256').update(buf).digest('hex');

export default () => benny.suite(
  'SHA256',

  benny.add('hash-wasm', async () => {
    const hash = await wasmSHA256(buf);
    if (hash !== result) throw new Error('Hash error');
  }),

  benny.add('node-crypto', async () => {
    const hashObj = nodeCrypto.createHash('SHA256');
    hashObj.update(buf);
    if (hashObj.digest('hex') !== result) throw new Error('Hash error');
  }),

  benny.add('node-forge', async () => {
    const md = nodeForge.md.sha256.create();
    const forgeBuffer = nodeForge.util.createBuffer(buf.toString('binary'));
    md.update(forgeBuffer.data);
    const hash = md.digest().toHex();
    if (hash !== result) throw new Error('Hash error');
  }),

  benny.add('crypto-js', async () => {
    const hash = cryptoJsHex.stringify(cryptoJsSHA256(buf.toString('utf8')));
    if (hash !== result) throw new Error('Hash error');
  }),

  benny.add('jsSHA', async () => {
    const hasher = new JsSHA('SHA-256', 'UINT8ARRAY' as any, { encoding: 'UTF8' });
    hasher.update(buf);
    const hash = hasher.getHash('HEX');
    if (hash !== result) throw new Error('Hash error');
  }),

  benny.add('sha256-wasm', async () => {
    const hashObj = sha256Wasm();
    hashObj.update(buf);
    if (hashObj.digest('hex') !== result) throw new Error('Hash error');
  }),

  benny.cycle(),
  benny.complete(),
);
