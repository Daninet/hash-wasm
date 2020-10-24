#!/bin/bash

# -msimd128 -msign-ext -mmutable-globals -mmultivalue -mbulk-memory -mtail-call -munimplemented-simd128
# -g -fdebug-prefix-map=/app/src=/C:/Projects/hash-wasm/src

emcc -O3 -s WASM=1 \
  -flto -s INITIAL_MEMORY=256KB -s MAXIMUM_MEMORY=2GB -s ALLOW_MEMORY_GROWTH=1 -s TOTAL_STACK=128KB -s MODULARIZE=1 -s STANDALONE_WASM=1 /app/src/argon2.c -o /app/wasm/argon2.wasm

emcc -O3 -s WASM=1 \
  -flto -s INITIAL_MEMORY=256KB -s MAXIMUM_MEMORY=2GB -s ALLOW_MEMORY_GROWTH=1 -s TOTAL_STACK=128KB -s MODULARIZE=1 -s STANDALONE_WASM=1 /app/src/scrypt.c -o /app/wasm/scrypt.wasm

emcc -O3 -s WASM=1 \
  -fno-strict-aliasing -flto -s TOTAL_MEMORY=1024KB -s TOTAL_STACK=512KB -s MODULARIZE=1 -s STANDALONE_WASM=1 /app/src/bcrypt.c -o /app/wasm/bcrypt.wasm

emcc -O3 -s WASM=1 \
  -flto -s INITIAL_MEMORY=256KB -s TOTAL_STACK=128KB -s MODULARIZE=1 -s STANDALONE_WASM=1 /app/src/blake2b.c -o /app/wasm/blake2b.wasm

emcc -O3 -s WASM=1 \
  -flto -s INITIAL_MEMORY=256KB -s TOTAL_STACK=128KB -s MODULARIZE=1 -s STANDALONE_WASM=1 /app/src/blake2s.c -o /app/wasm/blake2s.wasm

emcc -O3 -s WASM=1 \
  -flto -s INITIAL_MEMORY=256KB -s TOTAL_STACK=128KB -s MODULARIZE=1 -s STANDALONE_WASM=1 /app/src/ripemd160.c -o /app/wasm/ripemd160.wasm

emcc -O3 -s WASM=1 \
  -flto -s INITIAL_MEMORY=256KB -s TOTAL_STACK=128KB -s MODULARIZE=1 -s STANDALONE_WASM=1 /app/src/md4.c -o /app/wasm/md4.wasm

emcc -O3 -s WASM=1 \
  -flto -s INITIAL_MEMORY=256KB -s TOTAL_STACK=128KB -s MODULARIZE=1 -s STANDALONE_WASM=1 /app/src/md5.c -o /app/wasm/md5.wasm

emcc -O3 -s WASM=1 \
  -flto -s INITIAL_MEMORY=256KB -s TOTAL_STACK=128KB -s MODULARIZE=1 -s STANDALONE_WASM=1 /app/src/crc32.c -o /app/wasm/crc32.wasm

emcc -O3 -s WASM=1 \
  -flto -s INITIAL_MEMORY=256KB -s TOTAL_STACK=128KB -s MODULARIZE=1 -s STANDALONE_WASM=1 /app/src/sha1.c -o /app/wasm/sha1.wasm

emcc -O3 -s WASM=1 \
  -flto -s INITIAL_MEMORY=256KB -s TOTAL_STACK=128KB -s MODULARIZE=1 -s STANDALONE_WASM=1 /app/src/sha256.c -o /app/wasm/sha256.wasm

emcc -O3 -s WASM=1 \
  -flto -s INITIAL_MEMORY=256KB -s TOTAL_STACK=128KB -s MODULARIZE=1 -s STANDALONE_WASM=1 /app/src/sha512.c -o /app/wasm/sha512.wasm

emcc -O3 -s WASM=1 \
  -flto -s INITIAL_MEMORY=256KB -s TOTAL_STACK=128KB -s MODULARIZE=1 -s STANDALONE_WASM=1 /app/src/sha3.c -o /app/wasm/sha3.wasm

emcc -O3 -s WASM=1 \
  -flto -s INITIAL_MEMORY=256KB -s TOTAL_STACK=128KB -s MODULARIZE=1 -s STANDALONE_WASM=1 /app/src/xxhash32.c -o /app/wasm/xxhash32.wasm

emcc -O3 -s WASM=1 \
  -flto -s INITIAL_MEMORY=256KB -s TOTAL_STACK=128KB -s MODULARIZE=1 -s STANDALONE_WASM=1 /app/src/xxhash64.c -o /app/wasm/xxhash64.wasm

emcc -O3 -s WASM=1 \
  -flto -s INITIAL_MEMORY=256KB -s TOTAL_STACK=128KB -s MODULARIZE=1 -s STANDALONE_WASM=1 /app/src/whirlpool.c -o /app/wasm/whirlpool.wasm
