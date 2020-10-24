#!/bin/bash

# -msimd128 -msign-ext -mmutable-globals -mmultivalue -mbulk-memory -mtail-call -munimplemented-simd128
# -g -fdebug-prefix-map=/app/src=/C:/Projects/hash-wasm/src

set -e

CFLAGS="-flto -O3 -nostdlib -fno-builtin --target=wasm32"
LDFLAGS="-Wl,--strip-all -Wl,--initial-memory=262144 -Wl,--max-memory=262144 -Wl,--no-entry -Wl,--allow-undefined -Wl,--compress-relocations -Wl,--export-dynamic"

clang ${CFLAGS} ${LDFLAGS} -o /app/wasm/md4.wasm /app/src/md4.c
clang ${CFLAGS} ${LDFLAGS} -o /app/wasm/md5.wasm /app/src/md5.c
clang ${CFLAGS} ${LDFLAGS} -o /app/wasm/ripemd160.wasm /app/src/ripemd160.c
clang ${CFLAGS} ${LDFLAGS} -o /app/wasm/whirlpool.wasm /app/src/whirlpool.c
