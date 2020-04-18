# hash-wasm

[![codecov](https://codecov.io/gh/Daninet/hash-wasm/branch/master/graph/badge.svg)](https://codecov.io/gh/Daninet/hash-wasm)

Hash-WASM is a fast and portable hash function library.

It's using WebAssembly to calculate the hash faster than other JavaScript-based implementations.


Supported hash functions
=======

- MD4, MD5
- CRC32
- SHA-1
- SHA-2: SHA-224, SHA-256, SHA-384, SHA-512
- SHA-3: SHA3-224, SHA3-256, SHA3-384, SHA3-512
- Keccak: Keccak-224, Keccak-256, Keccak-384, Keccak-512
- xxHash: xxHash32, xxHash64


Features
=======

- A lot faster than JS implementations (see [benchmarks](#benchmark) below)
- Compiled from highly optimized algorithms written in C
- Supports all modern browsers and Node.js
- Optimized for large files
- Supports UTF-8 strings and typed arrays
- Supports chunked input streams
- WASM modules are bundled as base64 strings (no problems with linking)
- Supports tree shaking (it only bundles the hash algorithms you need)
- It's lightweight. Only ~75kb including all algorithms (or less with tree shaking)
- Includes TypeScript type definitions
- It also works in Web Workers
- Supports concurrent hash calculations with multiple states
- Easy to use Promise-based async API


Install
=======
```
npm i hash-wasm
```


Examples
=======

### React.js demo app

[Hash calculator](https://3w4be.csb.app/) - [React.js source code](https://codesandbox.io/s/hash-wasm-3w4be?file=/src/App.tsx)

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
**hash-wasm**            | **128** | **512 MB/s**
node-forge (npm library) | 23      | 92 MB/s
jsSHA (npm library)      | 13      | 52 MB/s
crypto-js (npm library)  | 6       | 24 MB/s
sha1 (npm library)       | 2       | 8 MB/s

#

SHA256                    | ops/s  | throughput
--------------------------|--------|-------------
node.js crypto module     | 120    | 480 MB/s
**hash-wasm**             | **56** | **224 MB/s**
sha256-wasm (npm library) | 27     | 108 MB/s
node-forge (npm library)  | 17     | 68 MB/s
jsSHA (npm library)       | 10     | 40 MB/s
crypto-js (npm library)   | 6      | 24 MB/s

#

SHA512                   | ops/s   | throughput
-------------------------|---------|-----------
node.js crypto module    | 171     | 684 MB/s
**hash-wasm**            | **79**  | **316 MB/s**
node-forge (npm library) | 11      | 44 MB/s
jsSHA (npm library)      | 2       | 8 MB/s
crypto-js (npm library)  | 1       | 4 MB/s

#

SHA3-512                 | ops/s   | throughput
-------------------------|---------|-----------
node.js crypto module    | 61      | 244 MB/s
**hash-wasm**            | **40**  | **160 MB/s**
sha3 (npm library)       | 2       | 8 MB/s
jsSHA (npm library)      | 0       | < 4 MB/s

#

XXHash64                  | ops/s     | throughput
--------------------------|-----------|---------------
xxhash (node.js binding)  | 3 852     | 15 408 MB/s
**hash-wasm**             | **1 354** | **5 416 MB/s**
xxhash-wasm (npm library) | 59        | 236 MB/s
xxhashjs (npm library)    | 3         | 12 MB/s

*\* Benchmarks can be started with the `npm run benchmark` command. These measurements were made using `Node.js v12.16.2` by hashing a fixed input buffer (size = 4MB).*

API
=====

```javascript
// simple usage
import {
  md4, md5,
  crc32,
  sha1,
  sha224, sha256, sha384, sha512,
  sha3,
  keccak,
  xxhash32, xxhash64,
} from 'hash-wasm';

// all functions return hash in hex format
md4(data: string | typedArray | Buffer): Promise<string>
md5(data: string | typedArray | Buffer): Promise<string>
crc32(data: string | typedArray | Buffer): Promise<string>
sha1(data: string | typedArray | Buffer): Promise<string>
sha224(data: string | typedArray | Buffer): Promise<string>
sha256(data: string | typedArray | Buffer): Promise<string>
sha384(data: string | typedArray | Buffer): Promise<string>
sha512(data: string | typedArray | Buffer): Promise<string>
sha3(data: string | typedArray | Buffer, bits: 224 | 256 | 384 | 512): Promise<string> // default is 512 bits
keccak(data: string | typedArray | Buffer, bits: 224 | 256 | 384 | 512): Promise<string> // default is 512 bits
xxhash32(data: string | typedArray | Buffer, seed: number): Promise<string>
xxhash64(data: string | typedArray | Buffer, seedLow: number, seedHigh: number): Promise<string>

// usage with chunked data
import {
  createMD4, createMD5,
  createCRC32,
  createSHA1,
  createSHA224, createSHA256, createSHA384, createSHA512,
  createSHA3,
  createKeccak,
  createXXHash32, createXXHash64,
} from 'hash-wasm';

createMD4(): Promise<IHasher>
createMD5(): Promise<IHasher>
createCRC32(): Promise<IHasher>
createSHA1(): Promise<IHasher>
createSHA224(): Promise<IHasher>
createSHA256(): Promise<IHasher>
createSHA384(): Promise<IHasher>
createSHA512(): Promise<IHasher>
createSHA3(bits: 224 | 256 | 384 | 512): Promise<IHasher> // default is 512 bits
createKeccak(bits: 224 | 256 | 384 | 512): Promise<IHasher> // default is 512 bits
createXXHash32(seed: number): Promise<IHasher>
createXXHash64(seedLow: number, seedHigh: number): Promise<IHasher>

interface IHasher {
  init: () => void;
  update: (data: string | ArrayBuffer | Uint8Array | Uint16Array | Uint32Array | Buffer) => void;
  digest: () => string; // returns hash in hex format
}
```
