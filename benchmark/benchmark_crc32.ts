import benny from 'benny';
import { crc32 } from 'crc';
import { crc32 as wasmCRC32 } from '../dist/index.umd';
import interpretResults from './interpret';

function toHex(number) {
  const buf = Buffer.alloc(4);
  buf.writeUInt32BE(number);
  return buf.toString('hex');
}

export default (size: number, divisor: number) => {
  const buf = Buffer.alloc(size);
  buf.fill('\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF');
  const result = toHex(crc32(buf));

  return benny.suite(
    'CRC32',

    benny.add('hash-wasm', async () => {
      for (let i = 0; i < divisor; i++) {
        const hash = await wasmCRC32(buf);
        if (hash !== result) throw new Error('Hash error');
      }
    }),

    benny.add('npm-crc', async () => {
      for (let i = 0; i < divisor; i++) {
        if (toHex(crc32(buf)) !== result) throw new Error('Hash error');
      }
    }),

    benny.cycle(),
    benny.complete((summary) => {
      interpretResults(summary, size, divisor);
    }),
  );
};
