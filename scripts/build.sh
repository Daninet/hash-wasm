#!/bin/bash

set -e

mkdir -p dist
mkdir -p wasm

npm run lint

if [[ "$(docker images -q clang:hash-wasm 2> /dev/null)" == "" ]]; then
  docker build -f scripts/Dockerfile -t clang:hash-wasm .
fi

# copy to docker volume
docker rm hash-wasm-temp || true
docker volume rm hash-wasm-volume || true
docker container create --name hash-wasm-temp -v hash-wasm-volume:/app busybox
docker cp . hash-wasm-temp:/app

docker run \
  --rm \
  -v hash-wasm-volume:/app \
  -u $(id -u):$(id -g) \
  clang:hash-wasm \
  make -f /app/scripts/Makefile-clang --silent --always-make --output-sync=target -j8 all

# copy output back
docker cp hash-wasm-temp:/app/wasm/ .
docker rm hash-wasm-temp
docker volume rm hash-wasm-volume

# node scripts/optimize
node scripts/make_json
node --max-old-space-size=4096 ./node_modules/rollup/dist/bin/rollup -c
npx tsc ./lib/index --outDir ./dist --downlevelIteration --emitDeclarationOnly --declaration --resolveJsonModule --allowSyntheticDefaultImports

#-s ASSERTIONS=1 \
