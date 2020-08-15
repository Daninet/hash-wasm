# hash-wasm

[![npm package](https://img.shields.io/npm/v/hash-wasm.svg)](http://npmjs.org/package/hash-wasm)
[![Bundle size](https://badgen.net/bundlephobia/minzip/hash-wasm)](https://bundlephobia.com/result?p=hash-wasm)
[![codecov](https://codecov.io/gh/Daninet/hash-wasm/branch/master/graph/badge.svg)](https://codecov.io/gh/Daninet/hash-wasm)
[![Dependencies Status](https://david-dm.org/Daninet/hash-wasm/status.svg)](https://david-dm.org/Daninet/hash-wasm)
[![Build status](https://github.com/Daninet/hash-wasm/workflows/Build%20&%20publish/badge.svg?branch=master)](https://github.com/Daninet/hash-wasm/actions)

Hash-WASM is a ⚡lightning fast⚡ and portable hash function library.
It is using hand-tuned WebAssembly binaries to calculate the hash faster than other libraries.

Supported algorithms
=======

- Argon2: Argon2d, Argon2i, Argon2id (v1.3)
- BLAKE2b
- CRC32
- HMAC (with all hash algorithms)
- MD4, MD5
- PBKDF2 (with all hash algorithms)
- RIPEMD-160
- SHA-1
- SHA-2: SHA-224, SHA-256, SHA-384, SHA-512
- SHA-3: SHA3-224, SHA3-256, SHA3-384, SHA3-512
- Keccak: Keccak-224, Keccak-256, Keccak-384, Keccak-512
- xxHash: xxHash32, xxHash64

Features
=======

- A lot faster than other JS / WASM implementations (see [benchmarks](#benchmark) below)
- Compiled from heavily optimized algorithms written in C
- Supports all modern browsers and Node.js
- Supports large data streams
- Supports UTF-8 strings and typed arrays
- Supports chunked input streams
- Works without Webpack or other bundlers
- WASM modules are bundled as base64 strings (no problems with linking)
- Supports tree shaking (it only bundles the hash algorithms you need)
- It's lightweight. Including a single algorithm increases the bundle size with only 10-20KB
- Includes TypeScript type definitions
- Works in Web Workers
- Zero dependencies
- Supports concurrent hash calculations with multiple states
- [Unit tests](https://github.com/Daninet/hash-wasm/tree/master/test) for all algorithms
- 100% open source & transparent [build process](https://github.com/Daninet/hash-wasm/actions)
- Easy to use, Promise-based API


Installation
=======
```
npm i hash-wasm
```

or it can be inserted directly into HTML (via [jsDelivr](https://www.jsdelivr.com/package/npm/hash-wasm))

```html
<script src="https://cdn.jsdelivr.net/npm/hash-wasm"></script>
<!-- defines the global `hashwasm` variable -->
```

Examples
=======

### Demo apps

[Hash calculator](https://3w4be.csb.app/) - [source code](https://codesandbox.io/s/hash-wasm-3w4be?file=/src/App.tsx)

[MD5 file hasher using HTML5 File API](https://stackoverflow.com/a/63287199/6251760)

### Usage with the shorthand form

It is the easiest and the fastest way to calculate hashes. Use it when the input buffer is already in the memory.

```javascript
import { md5, sha1, sha512, sha3 } from 'hash-wasm';

async function run() {
  console.log('MD5:', await md5('demo'));

  const int8Buffer = new Uint8Array([0, 1, 2, 3]);
  console.log('SHA1:', await sha1(int8Buffer));
  console.log('SHA512:', await sha512(int8Buffer));

  const int32Buffer = new Uint32Array([1056, 641]);
  console.log('SHA3-256:', await sha3(int32Buffer, 256));
}

run();
```

*\* See [API reference](#api)*

### Advanced usage with streaming input

createXXXX() functions create new WASM instances with separate states, which can be used to calculate multiple hashes paralelly. They are slower compared to shorthand functions like md5(), which reuse the same WASM instance and state to do multiple calculations. For this reason, the shorthand form is always preferred when the data is already in the memory.

For the best performance, avoid calling createXXXX() functions in loops. When calculating multiple hashes sequentially, the init() function can be used to reset the internal state between runs. It is faster than creating new instances with createXXXX().

```javascript
import { createSHA1 } from 'hash-wasm';

async function run() {
  const sha1 = await createSHA1();
  sha1.init();

  while (hasMoreData()) {
    const chunk = readChunk();
    sha1.update(chunk);
  }

  const hash = sha1.digest();
  console.log('SHA1:', hash);
}

run();
```

*\* See [API reference](#api)*

### Calculating HMAC

All supported hash functions can be used to calculate HMAC. For the best performance, avoid calling createXXXX() in loops (see `Advanced usage with streaming input` section above)

```javascript
import { createHMAC, createSHA3 } from 'hash-wasm';

async function run() {
  const hashFunc = createSHA3(224); // SHA3-224
  const hmac = await createHMAC(hashFunc, 'key');

  const fruits = ['apple', 'raspberry', 'watermelon'];
  console.log('Input:', fruits);

  const codes = fruits.map(data => {
    hmac.init();
    hmac.update(data);
    return hmac.digest();
  });

  console.log('HMAC:', codes);
}

run();
```

*\* See [API reference](#api)*

### Calculating PBKDF2

All supported hash functions can be used to calculate PBKDF2. For the best performance, avoid calling createXXXX() in loops (see `Advanced usage with streaming input` section above)

```javascript
import { pbkdf2, createSHA1 } from 'hash-wasm';

async function run() {
  const iterations = 1000;
  const keyLen = 32;
  const key = await pbkdf2('password', 'salt', iterations, keyLen, createSHA1());

  console.log('Derived key:', key);
}

run();
```

*\* See [API reference](#api)*

Browser support
=====

<br/>

Chrome | Safari | Firefox | Edge | IE            | Node.js
-------|--------|---------|------|---------------|--------
57+    | 11+    | 53+     | 16+  | Not supported | 8+

<br/>

Benchmark
=====

You can make your own measurements here: [link](https://csb-9b6mf.daninet.now.sh/)

The source code for the benchmark can be found [here](https://codesandbox.io/s/hash-wasm-benchmark-9b6mf)

Two scenarios were measured:
- throughput with the short form (input size = 32 bytes)
- throughput with the short form (input size = 1MB)

Results:

MD5                            | throughput (32 bytes) | throughput (1MB)
-------------------------------|-----------------------|-----------------
**hash-wasm 3.7.0**            | **29.65 MB/s**        | **611.04 MB/s**
md5-wasm 0.9.1 (npm library)   | 14.50 MB/s            | 76.66 MB/s
spark-md5 0.9.1 (npm library)  | 9.46 MB/s             | 19.17 MB/s
md5 2.2.1 (npm library)        | 7.45 MB/s             | 11.96 MB/s
node-forge 0.9.1 (npm library) | 5.50 MB/s             | 11.78 MB/s

#

SHA1                           | throughput (32 bytes) | throughput (1MB)
-------------------------------|-----------------------|-----------------
**hash-wasm 3.7.0**            | **25.64 MB/s**        | **642.54 MB/s**
jsSHA 3.1.0 (npm library)      | 5.45 MB/s             | 46.98 MB/s
crypto-js 4.0.0 (npm library)  | 6.81 MB/s             | 18.56 MB/s
sha1 1.1.1 (npm library)       | 6.65 MB/s             | 13.37 MB/s
node-forge 0.9.1 (npm library) | 6.38 MB/s             | 12.29 MB/s

#

SHA256                          | throughput (32 bytes) | throughput (1MB)
--------------------------------|-----------------------|-----------------
**hash-wasm 3.7.0**             | **21.63 MB/s**        | **259.93 MB/s**
sha256-wasm 2.0.3 (npm library) | 5.59 MB/s             | 166.07 MB/s
jsSHA 3.1.0 (npm library)       | 4.71 MB/s             | 36.44 MB/s
crypto-js 4.0.0 (npm library)   | 5.90 MB/s             | 18.13 MB/s
node-forge 0.9.1 (npm library)  | 3.74 MB/s             | 11.37 MB/s

#

SHA3-512                  | throughput (32 bytes) | throughput (1MB)
--------------------------|-----------------------|-----------------
**hash-wasm 3.7.0**       | **16.56 MB/s**        | **179.05 MB/s**
sha3 2.1.3 (npm library)  | 1.38 MB/s             | 6.61 MB/s
jsSHA 3.1.0 (npm library) | 0.86 MB/s             | 2.06 MB/s

#

XXHash64                        | throughput (32 bytes) | throughput (1MB)
--------------------------------|-----------------------|------------------
**hash-wasm 3.7.0**             | **27.10 MB/s**        | **11715.15 MB/s**
xxhash-wasm 0.4.0 (npm library) | 0.09 MB/s             | 56.39 MB/s
xxhashjs 0.2.2 (npm library)    | 0.36 MB/s             | 18.12 MB/s

#

PBKDF2-SHA512 - 1000 iterations   | operations per second (16 bytes)
----------------------------------|----------------------
**hash-wasm 3.7.0**               | **208 ops**         
pbkdf2 3.1.1 (npm library)        | 56 ops              
crypto-js 4.0.0 (npm library)     | 7 ops              

#

Argon2id (m=512, t=8, p=1)          | operations per second (16 bytes)
------------------------------------|----------------------
**hash-wasm 3.7.0**                 | **243 ops**          
argon2-wasm 0.9.0 (npm library)     | 103 ops              
argon2-wasm-pro 1.1.0 (npm library) | 102 ops              

\* These measurements were made with `Chrome v84` on a Kaby Lake desktop CPU.

API
=====

```ts
type IDataType = string | Buffer | Uint8Array | Uint16Array | Uint32Array;

// all functions return hash in hex format
blake2b(data: IDataType, bits?: number, key?: IDataType): Promise<string> // default is 512 bits
crc32(data: IDataType): Promise<string>
keccak(data: IDataType, bits?: 224 | 256 | 384 | 512): Promise<string> // default is 512 bits
md4(data: IDataType): Promise<string>
md5(data: IDataType): Promise<string>
ripemd160(data: IDataType): Promise<string>
sha1(data: IDataType): Promise<string>
sha224(data: IDataType): Promise<string>
sha256(data: IDataType): Promise<string>
sha3(data: IDataType, bits?: 224 | 256 | 384 | 512): Promise<string> // default is 512 bits
sha384(data: IDataType): Promise<string>
sha512(data: IDataType): Promise<string>
xxhash32(data: IDataType, seed?: number): Promise<string>
xxhash64(data: IDataType, seedLow?: number, seedHigh?: number): Promise<string>

interface IHasher {
  init: () => IHasher;
  update: (data: IDataType) => IHasher;
  digest: (outputType: 'hex' | 'binary') => string | Uint8Array; // by default returns hex string
  blockSize: number; // in bytes
  digestSize: number; // in bytes
}

createBLAKE2b(bits?: number, key?: IDataType): Promise<IHasher> // default is 512 bits
createCRC32(): Promise<IHasher>
createKeccak(bits?: 224 | 256 | 384 | 512): Promise<IHasher> // default is 512 bits
createMD4(): Promise<IHasher>
createMD5(): Promise<IHasher>
createRIPEMD160(): Promise<IHasher>
createSHA1(): Promise<IHasher>
createSHA224(): Promise<IHasher>
createSHA256(): Promise<IHasher>
createSHA3(bits?: 224 | 256 | 384 | 512): Promise<IHasher> // default is 512 bits
createSHA384(): Promise<IHasher>
createSHA512(): Promise<IHasher>
createXXHash32(seed: number): Promise<IHasher>
createXXHash64(seedLow: number, seedHigh: number): Promise<IHasher>

createHMAC(hashFunc: Promise<IHasher>, key: IDataType): Promise<IHasher>

pbkdf2(
  password: IDataType, // password (or message) to be hashed
  salt: IDataType, // salt
  iterations: number, // number of iterations to perform
  hashLength: number, // output size in bytes
  hashFunc: Promise<IHasher> // the return value of a function like createSHA1()
  outputType: 'hex' | 'binary', // by default returns hex string
): Promise<string | Uint8Array>

argon2({
  password: IDataType, // password (or message) to be hashed
  salt: IDataType, // salt
  iterations: number, // number of iterations to perform
  parallelism: number, // degree of parallelism
  memorySize: number, // amount of memory to be used in kibibytes (1024 bytes)
  hashLength: number, // output size in bytes
  hashType: 'i' | 'd' | 'id', // argon2 variant selection
  outputType: 'hex' | 'binary' | 'encoded', // by default returns hex string
}): Promise<string | Uint8Array>

```

Future plans
=====

- Write a polyfill which keeps bundle sizes low and enables running binaries containing newer WASM instructions
- Use WebAssembly Bulk Memory Operations
- Use WebAssembly SIMD instructions (expecting a 10-20% performance increase)
- Enable multithreading where it's possible (like at Argon2)
- Add more algorithms
