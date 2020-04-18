import benchmarkMD4 from './benchmark_md4';
import benchmarkMD5 from './benchmark_md5';
import benchmarkCRC32 from './benchmark_crc32';
import benchmarkSHA1 from './benchmark_sha1';
import benchmarkSHA256 from './benchmark_sha256';
import benchmarkSHA512 from './benchmark_sha512';
import benchmarkSHA3 from './benchmark_sha3';
import benchmarkXXHash64 from './benchmark_xxhash64';
import benchmarkStress from './benchmark_stress';

const main = async () => {
  await benchmarkMD4();
  await benchmarkMD5();
  await benchmarkCRC32();
  await benchmarkSHA1();
  await benchmarkSHA256();
  await benchmarkSHA512();
  await benchmarkSHA3();
  await benchmarkXXHash64();
  await benchmarkStress();
};

main();
