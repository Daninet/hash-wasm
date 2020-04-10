export {}

const benny = require('benny');
const nodeCrypto = require('crypto');
const npmMD5 = require('md5');
const nodeForge = require('node-forge');
const wasmMD5 = require('../src/md5').default;

const SIZE = 8 * 1024 * 1024;
const buf = Buffer.alloc(SIZE);
buf.fill('\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF');
const result = nodeCrypto.createHash('MD5').update(buf).digest('hex');

module.exports = () => benny.suite(
  'MD5',

  benny.add('hash-wasm', async () => {
    const hash = await wasmMD5(buf);
    if (hash !== result) throw new Error('Hash error');
  }),

  benny.add('node-crypto', async () => {
    const hashObj = nodeCrypto.createHash('MD5');
    hashObj.update(buf);
    if (hashObj.digest('hex') !== result) throw new Error('Hash error');
  }),

  benny.add('npm-md5', async () => {
    const hash = npmMD5(buf);
    if (hash !== result) throw new Error('Hash error');
  }),

  benny.add('node-forge', async () => {
    const md = nodeForge.md.md5.create();
    const forgeBuffer = nodeForge.util.createBuffer(buf.toString('binary'));
    md.update(forgeBuffer.data);
    const hash = md.digest().toHex();
    if (hash !== result) throw new Error('Hash error');
  }),

  benny.cycle(),
  benny.complete(),
);
