import benny from 'benny';
import nodeCrypto from 'crypto';
import jsMD4 from 'js-md4';
import { md4 as wasmMD4 } from '../dist/index.umd';

const SIZE = 4 * 1024 * 1024;
const buf = Buffer.alloc(SIZE);
buf.fill('\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF');
const result = nodeCrypto.createHash('MD4').update(buf).digest('hex');

module.exports = () => benny.suite(
  'MD4',

  benny.add('hash-wasm', async () => {
    const hash = await wasmMD4(buf);
    if (hash !== result) throw new Error('Hash error');
  }),

  benny.add('node-crypto', async () => {
    const hashObj = nodeCrypto.createHash('MD4');
    hashObj.update(buf);
    if (hashObj.digest('hex') !== result) throw new Error('Hash error');
  }),

  benny.add('js-md4', async () => {
    const hashObj = jsMD4.create();
    hashObj.update(buf);
    if (hashObj.hex() !== result) throw new Error('Hash error');
  }),

  benny.cycle(),
  benny.complete(),
);
