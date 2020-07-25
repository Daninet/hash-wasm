## 3.6.0 (July 25, 2020)

* **Breaking change**: Drop support for String() objects (normal string literals are still supported of course)
* Node.js buffers polyfills are not needed anymore

## 3.5.0 (July 19, 2020)

* Added BLAKE2b algorithm
* Fixed a bug, where sha3() and keccak() gave incorrect results when the hash length was changed

## 3.4.1 (June 27, 2020)

* Add PBKDF2 example and benchmark results

## 3.4.0 (June 27, 2020)

* Add PBKDF2 algorithm

## 3.3.0 (June 22, 2020)

* Add RIPEMD-160 algorithm

## 3.2.1 (June 5, 2020)

* Fix buffer.copy() error in browsers

## 3.2.0 (June 5, 2020)

* Added HMAC
* Better examples in readme
* Updated dependencies

## 3.1.2 (May 27, 2020)

* Fixed example code in readme
* Better description and keywords

## 3.1.1 (May 25, 2020)

* ~3x faster when hashing small chunks of data (one WASM function call instead of three)
* Updated benchmark results in readme

## 3.0.1 (May 24, 2020)

* Updated benchmark results in readme
* Use new web-based tool for benchmarking

## 3.0.0 (May 24, 2020)

* Improved performance in smaller input buffers

## 2.6.0 (April 18, 2020)

* Allow concurrent hash calculations with multiple states
* Fix WebAssembly detection
* Cache WebAssembly modules
* Fix crash when starting many parallel hash calculations
* Allocate less memory for WASM modules

## 2.5.1 (April 13, 2020)

* Add React.js demo app

## 2.5.0 (April 13, 2020)

* Add xxhash32 and xxhash64
* Add Keccak
* Bugfixes

## 2.1.0 (April 12, 2020)

* Use faster SHA256 and SHA512 implementations
* Allocate less memory in WASM modules
* Clean up C source codes

## 2.0.0 (April 11, 2020)

* Initial release
