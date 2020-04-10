export {}

const benny = require('benny');
const nodeCrypto = require('crypto');
const jsMD4 = require('js-md4');
const wasmMD4 = require('../src/md4').default;

const SIZE = 8 * 1024 * 1024;
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
