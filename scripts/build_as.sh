npx asc src/md5.as --extension as -O3 --noAssert --converge -b wasm/md5.wasm --noColors
npx asc src/md5.as --extension as -O3 --noAssert --converge -t wasm/md5.wat --noColors
node scripts/make_json
node --max-old-space-size=4096 ./node_modules/rollup/dist/bin/rollup -c
