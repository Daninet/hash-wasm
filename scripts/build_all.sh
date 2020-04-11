#!/bin/bash

emcc -O3 -s WASM=1 \
  -s MODULARIZE=1 -s STANDALONE_WASM=1 /app/src/md4.c -o /app/wasm/md4.wasm

emcc -O3 -s WASM=1 \
  -s MODULARIZE=1 -s STANDALONE_WASM=1 /app/src/md5.c -o /app/wasm/md5.wasm

emcc -O3 -s WASM=1 \
  -s MODULARIZE=1 -s STANDALONE_WASM=1 /app/src/crc32.c -o /app/wasm/crc32.wasm

emcc -O3 -s WASM=1 \
  -s MODULARIZE=1 -s STANDALONE_WASM=1 /app/src/sha1.c -o /app/wasm/sha1.wasm
