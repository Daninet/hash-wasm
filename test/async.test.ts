/* eslint-disable no-console */
/* global test, expect */
import {
  md4, md5, sha1, sha256, sha384, sha3, xxhash32, xxhash64,
} from '../lib';

function getMemoryUsage() {
  const usage = process.memoryUsage().heapUsed;
  // eslint-disable-next-line no-bitwise
  const i = ~~(Math.log2(usage) / 10);
  // eslint-disable-next-line no-restricted-properties,prefer-template
  return (usage / Math.pow(1024, i)).toFixed(2) + ('KMGTPEZY'[i - 1] || '') + 'B';
}

test('Async cycle multiple algorithms', async () => {
  console.log('Before', getMemoryUsage());

  const promises = [];
  for (let i = 0; i < 1000; i++) {
    promises.push(md4('a'));
    promises.push(md5('a'));
    promises.push(sha1('a'));
    promises.push(sha256('a'));
    promises.push(sha384('a'));
    promises.push(sha3('a', 224));
    promises.push(xxhash32('a', 0x6789ABCD));
    promises.push(xxhash64('a'));
  }

  const res = await Promise.all(promises);
  for (let i = 0; i < 1000 * 8; i += 8) {
    expect(res[i + 0]).toBe('bde52cb31de33e46245e05fbdbd6fb24');
    expect(res[i + 1]).toBe('0cc175b9c0f1b6a831c399e269772661');
    expect(res[i + 2]).toBe('86f7e437faa5a7fce15d1ddcb9eaeaea377667b8');
    expect(res[i + 3]).toBe('ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb');
    expect(res[i + 4]).toBe('54a59b9f22b0b80880d8427e548b7c23abd873486e1f035dce9cd697e85175033caa88e6d57bc35efae0b5afd3145f31');
    expect(res[i + 5]).toBe('9e86ff69557ca95f405f081269685b38e3a819b309ee942f482b6a8b');
    expect(res[i + 6]).toBe('88488ff7');
    expect(res[i + 7]).toBe('d24ec4f1a98c6e5b');
  }

  console.log('After', getMemoryUsage());
});
