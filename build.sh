#!/bin/bash

mkdir -p dist

docker run \
  --rm \
  -v $(pwd):/app \
  -u $(id -u):$(id -g) \
  trzeci/emscripten-upstream \
  sh -c /app/build_all.sh

#-s ASSERTIONS=1 \