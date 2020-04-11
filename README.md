# hash-wasm

Hash-WASM is a fast, portable hash function library.
It's using WebAssembly to calculate the hash faster than other JavaScript-based implementations.

Features
=======

- Supported hash functions: MD4, MD5, CRC32, SHA1, SHA256, SHA512 (more to come)
- A lot faster than JS implementations (see benchmarks)
- Supports all modern browsers and Node.js
- Optimized for large files
- Supports chunked input streams
- WASM is bundled as base64 strings, so it can be easily deployed
- Supports tree shaking (it only bundles the hash algorithms you need)
- Includes TypeScript type definitions
- Easy to use Promise-based async API

Install
=======
```
npm i hash-wasm
```

Examples
=======

### Basic usage

```javascript
import { md5 } from 'hash-wasm';

async function run(str) {
  console.log('MD5: ', await md5(str));
}

run();
```

### Chunked input

```javascript
import { createCRC32 } from 'hash-wasm';

async function run(str) {
  const crc32 = await createCRC32();
  crc32.init();
  crc32.update(new Uint8Array([0, 1, 2, 3]));
  crc32.update(new Uint32Array([4920, 8124]));
  crc32.update('abcd');
  const hash = crc32.digest();
  console.log('CRC32: ', hash);
}

run();
```


Browser support
=====

Chrome | Safari | Firefox | Edge | IE
-------|--------|---------|------|--------------
57+    | 11+    | 53+     | 16+  | Not supported

Benchmark
=====

Benchmarks can be started with the `npm run benchmark` command.

MD5                      | ops/s   | throughput
-------------------------|---------|-------------
node.js crypto module    | 213     | 852 MB/s
**hash-wasm**            | **137** | **548 MB/s**
node-forge (npm library) | 20      | 80 MB/s
md5 (npm library)        | 2       | 8 MB/s

#

MD4                      | ops/s   | throughput
-------------------------|---------|-------------
node.js crypto module    | 351     | 1404 MB/s
**hash-wasm**            | **247** | **988 MB/s**
js-md4 (npm library)     | 94      | 376 MB/s

#

CRC32             | ops/s   | throughput
------------------|---------|--------------
**hash-wasm**     | **471** | **1884 MB/s**
crc (npm library) | 131     | 524 MB/s

#

SHA1                     | ops/s   | throughput
-------------------------|---------|-----------
node.js crypto module    | 266     | 1064 MB/s
**hash-wasm**            | **128** | ** 512 MB/s**
node-forge (npm library) | 23      | 92 MB/s
crypto-js (npm library)  | 6       | 24 MB/s
sha1 (npm library)       | 2       | 8 MB/s

#

SHA256                   | ops/s   | throughput
-------------------------|---------|-----------
node.js crypto module    | 120     | 480 MB/s
**hash-wasm**            | **41**  | ** 164 MB/s**
node-forge (npm library) | 17      | 68 MB/s
crypto-js (npm library)  | 6       | 24 MB/s

#

SHA512                   | ops/s   | throughput
-------------------------|---------|-----------
node.js crypto module    | 171     | 684 MB/s
**hash-wasm**            | **18**  | ** 72 MB/s**
node-forge (npm library) | 10      | 40 MB/s
crypto-js (npm library)  | 1       | 4 MB/s

API
=====

```javascript
// simple usage
import { md4, md5, crc32, sha1, sha256, sha512 } from 'hash-wasm';

md4(data: string | typedArray | Buffer): Promise<string> // returns hash in hex format
md5(data: string | typedArray | Buffer): Promise<string> // returns hash in hex format
crc32(data: string | typedArray | Buffer): Promise<string> // returns hash in hex format
sha1(data: string | typedArray | Buffer): Promise<string> // returns hash in hex format
sha256(data: string | typedArray | Buffer): Promise<string> // returns hash in hex format
sha512(data: string | typedArray | Buffer): Promise<string> // returns hash in hex format

// usage with chunked data
import {
  createMD4, createMD5, createCRC32,
  createSHA1, createSHA256, createSHA512,
} from 'hash-wasm';

createMD4(): Promise<IHasher>
createMD5(): Promise<IHasher>
createCRC32(): Promise<IHasher>
createSHA1(): Promise<IHasher>
createSHA256(): Promise<IHasher>
createSHA512(): Promise<IHasher>

interface IHasher {
  init: () => void;
  update: (data: string | ArrayBuffer | Uint8Array | Uint16Array | Uint32Array | Buffer) => void;
  digest: () => string; // returns hash in hex format
}
```
