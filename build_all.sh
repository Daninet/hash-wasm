#!/bin/bash

emcc -O3 -s WASM=1 \
  -s MODULARIZE=1 -s STANDALONE_WASM=1 /app/src/md4.c -o /app/dist/md4.wasm

emcc -O3 -s WASM=1 \
  -s MODULARIZE=1 -s STANDALONE_WASM=1 /app/src/md5.c -o /app/dist/md5.wasm

emcc -O3 -s WASM=1 \
  -s MODULARIZE=1 -s STANDALONE_WASM=1 /app/src/crc32.c -o /app/dist/crc32.wasm