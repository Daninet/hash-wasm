import { scrypt } from '..';

console.log(scrypt({
  password: 'a', // password (or message) to be hashed
  salt: 'b', // salt (usually containing random bytes)
  costFactor: 8, // CPU/memory cost - must be a power of 2 (e.g. 1024)
  blockSize: 8, // block size parameter (8 is commonly used)
  parallelism: 1, // degree of parallelism
  hashLength: 32, // output size in bytes
  outputType: 'hex', // by default returns hex string
}));
