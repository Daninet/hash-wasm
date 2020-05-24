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
  await benchmarkMD4(32, 1000);
  await benchmarkMD4(4 * 1024 * 1024, 1);

  await benchmarkMD5(64, 1000);
  await benchmarkMD5(4 * 1024 * 1024, 1);

  await benchmarkCRC32(64, 1000);
  await benchmarkCRC32(4 * 1024 * 1024, 1);

  await benchmarkSHA1(64, 100);
  await benchmarkSHA1(4 * 1024 * 1024, 1);

  await benchmarkSHA256(64, 100);
  await benchmarkSHA256(4 * 1024 * 1024, 1);

  await benchmarkSHA512(64, 100);
  await benchmarkSHA512(4 * 1024 * 1024, 1);

  await benchmarkSHA3(64, 100);
  await benchmarkSHA3(4 * 1024 * 1024, 1);

  await benchmarkXXHash64(64, 100);
  await benchmarkXXHash64(4 * 1024 * 1024, 1);

  await benchmarkStress();
};

main();
