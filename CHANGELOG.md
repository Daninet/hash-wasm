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
