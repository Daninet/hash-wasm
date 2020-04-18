import benny from 'benny';
import { crc32 } from 'crc';
import { crc32 as wasmCRC32 } from '../dist/index.umd';

function toHex(number) {
  const buf = Buffer.alloc(4);
  buf.writeUInt32BE(number);
  return buf.toString('hex');
}

const SIZE = 4 * 1024 * 1024;
const buf = Buffer.alloc(SIZE);
buf.fill('\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF');
const result = toHex(crc32(buf));

export default () => benny.suite(
  'CRC32',

  benny.add('hash-wasm', async () => {
    const hash = await wasmCRC32(buf);
    if (hash !== result) throw new Error('Hash error');
  }),

  benny.add('npm-crc', async () => {
    if (toHex(crc32(buf)) !== result) throw new Error('Hash error');
  }),

  benny.cycle(),
  benny.complete(),
);
