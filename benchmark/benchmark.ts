const benchmarkMD4 = require('./benchmark_md4');
const benchmarkMD5 = require('./benchmark_md5');
const benchmarkCRC32 = require('./benchmark_crc32');
const benchmarkSHA1 = require('./benchmark_sha1');
const benchmarkSHA256 = require('./benchmark_sha256');
const benchmarkSHA512 = require('./benchmark_sha512');
const benchmarkSHA3 = require('./benchmark_sha3');

const main = async () => {
  await benchmarkMD4();
  await benchmarkMD5();
  await benchmarkCRC32();
  await benchmarkSHA1();
  await benchmarkSHA256();
  await benchmarkSHA512();
  await benchmarkSHA3();
}

main()
