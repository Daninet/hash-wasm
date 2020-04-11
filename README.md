# hash-wasm

Hash-WASM is a fast, portable hash function library.
It's using WebAssembly to calculate the hash faster than other JavaScript-based implementations.


Supported hash functions
=======

- MD4, MD5
- CRC32
- SHA-1
- SHA-2: SHA-224, SHA-256, SHA-384, SHA-512
- SHA-3: SHA3-224, SHA3-256, SHA3-384, SHA3-512


Features
=======

- A lot faster than JS implementations (see [benchmarks](#benchmark) below)
- Supports all modern browsers and Node.js
- Optimized for large files
- Supports chunked input streams
- WASM modules are bundled as base64 strings (no problems with linking)
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
**hash-wasm**            | **128** | **512 MB/s**
node-forge (npm library) | 23      | 92 MB/s
jsSHA (npm library)      | 13      | 52 MB/s
crypto-js (npm library)  | 6       | 24 MB/s
sha1 (npm library)       | 2       | 8 MB/s

#

SHA256                   | ops/s   | throughput
-------------------------|---------|-----------
node.js crypto module    | 120     | 480 MB/s
**hash-wasm**            | **41**  | **164 MB/s**
node-forge (npm library) | 17      | 68 MB/s
jsSHA (npm library)      | 10      | 40 MB/s
crypto-js (npm library)  | 6       | 24 MB/s

#

SHA512                   | ops/s   | throughput
-------------------------|---------|-----------
node.js crypto module    | 171     | 684 MB/s
**hash-wasm**            | **18**  | **72 MB/s**
node-forge (npm library) | 10      | 40 MB/s
jsSHA (npm library)      | 2       | 8 MB/s
crypto-js (npm library)  | 1       | 4 MB/s

#

SHA3-512                 | ops/s   | throughput
-------------------------|---------|-----------
node.js crypto module    | 61      | 244 MB/s
**hash-wasm**            | **40**  | **160 MB/s**
sha3 (npm library)       | 2       | 8 MB/s
jsSHA (npm library)      | 0       | < 4 MB/s


API
=====

```javascript
// simple usage
import { md4, md5, crc32, sha1, sha224, sha256, sha384, sha512, sha3 } from 'hash-wasm';

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


// usage with chunked data
import {
  createMD4, createMD5,
  createCRC32,
  createSHA1,
  createSHA224, createSHA256, createSHA384, createSHA512,
  createSHA3,
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

interface IHasher {
  init: () => void;
  update: (data: string | ArrayBuffer | Uint8Array | Uint16Array | Uint32Array | Buffer) => void;
  digest: () => string; // returns hash in hex format
}
```
