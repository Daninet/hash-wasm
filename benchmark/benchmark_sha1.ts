import benny from 'benny';
import nodeCrypto from 'crypto';
import nodeForge from 'node-forge';
import npmSHA1 from 'sha1';
import cryptoJsSHA1 from 'crypto-js/sha1';
import cryptoJsHex from 'crypto-js/enc-hex';
import { sha1 as wasmSHA1 } from '../dist/index.umd';

const SIZE = 4 * 1024 * 1024;
const buf = Buffer.alloc(SIZE);
buf.fill('\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF');
const result = nodeCrypto.createHash('SHA1').update(buf).digest('hex');

module.exports = () => benny.suite(
  'SHA1',

  benny.add('hash-wasm', async () => {
    const hash = await wasmSHA1(buf);
    if (hash !== result) throw new Error('Hash error');
  }),

  benny.add('node-crypto', async () => {
    const hashObj = nodeCrypto.createHash('SHA1');
    hashObj.update(buf);
    if (hashObj.digest('hex') !== result) throw new Error('Hash error');
  }),

  benny.add('node-forge', async () => {
    const md = nodeForge.md.sha1.create();
    const forgeBuffer = nodeForge.util.createBuffer(buf.toString('binary'));
    md.update(forgeBuffer.data);
    const hash = md.digest().toHex();
    if (hash !== result) throw new Error('Hash error');
  }),

  benny.add('npm-sha1', async () => {
    if (npmSHA1(buf) !== result) throw new Error('Hash error');
  }),

  benny.add('crypto-js', async () => {
    const hash = cryptoJsHex.stringify(cryptoJsSHA1(buf.toString('utf8')));
    if (hash !== result) throw new Error('Hash error');
  }),

  benny.cycle(),
  benny.complete(),
);
