const benchmarkMD4 = require('./benchmark_md4');
const benchmarkMD5 = require('./benchmark_md5');
const benchmarkCRC32 = require('./benchmark_crc32');

const main = async () => {
  // await benchmarkMD4();
  // await benchmarkMD5();
  await benchmarkCRC32();
}

main()
