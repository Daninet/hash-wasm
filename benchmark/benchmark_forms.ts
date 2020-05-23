import nodeCrypto from 'crypto';
import { md5, createMD5 } from '../dist/index.umd';

const divisor = 10000;
const buf = Buffer.alloc(16);
buf.fill('\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF');
const result = nodeCrypto.createHash('MD5').update(buf).digest('hex');
let hasher = null;

async function doMD5() {
  console.time('md5');
  for (let i = 0; i < divisor; i++) {
    const hash = await md5(buf);
    // if (hash !== result) throw new Error('Hash error');
  }
  console.timeEnd('md5');
}

async function doCreateMD5() {
  console.time('createMD5');
  hasher = await createMD5();

  for (let i = 0; i < divisor; i++) {
    hasher.init();
    hasher.update(buf);
    const hash = hasher.digest();
    // if (hash !== result) throw new Error('Hash error');
  }
  console.timeEnd('createMD5');
}

const main = async () => {
  await doCreateMD5();
  await doMD5();
  await doCreateMD5();
  await doMD5();
  await doCreateMD5();
  await doMD5();
  await doCreateMD5();
  await doMD5();
  await doCreateMD5();
  await doMD5();
};

main();
