import benny from 'benny';
import nodeCrypto from 'crypto';
import { SHA3 as npmSHA3 } from 'sha3';
import jsSHA from 'jssha';
import { sha3 as wasmSHA3 } from '../dist/index.umd';

const SIZE = 4 * 1024 * 1024;
const buf = Buffer.alloc(SIZE);
buf.fill('\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF');
const result = nodeCrypto.createHash('SHA3-512').update(buf).digest('hex');

module.exports = () => benny.suite(
  'SHA3-512',

  benny.add('hash-wasm', async () => {
    const hash = await wasmSHA3(buf);
    if (hash !== result) throw new Error('Hash error');
  }),

  benny.add('node-crypto', async () => {
    const hashObj = nodeCrypto.createHash('SHA3-512');
    hashObj.update(buf);
    if (hashObj.digest('hex') !== result) throw new Error('Hash error');
  }),

  benny.add('npm-sha3', async () => {
    const hasher = new npmSHA3(512);
    hasher.update(buf);
    const hash = hasher.digest('hex');
    if (hash !== result) throw new Error('Hash error');
  }),

  benny.add('jsSHA', async () => {
    const hasher = new jsSHA('SHA3-512', 'UINT8ARRAY' as any, { encoding: 'UTF8' });
    hasher.update(buf);
    const hash = hasher.getHash('HEX');
    if (hash !== result) throw new Error('Hash error');
  }),

  benny.cycle(),
  benny.complete(),
);
