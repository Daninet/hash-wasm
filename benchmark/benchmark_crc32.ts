export {}

const benny = require('benny');
const { crc32 } = require('crc');
const wasmCRC32 = require('../src/crc32').default;

const SIZE = 8 * 1024 * 1024;
const buf = Buffer.alloc(SIZE);
buf.fill('\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF');
const result = crc32(buf).toString(16);

module.exports = () => benny.suite(
  'CRC32',

  benny.add('hash-wasm', async () => {
    const hash = await wasmCRC32(buf);
    if (hash !== result) throw new Error('Hash error');
  }),

  benny.add('node-crc', async () => {
    if (crc32(buf).toString(16) !== result) throw new Error('Hash error');
  }),

  benny.cycle(),
  benny.complete(),
);
