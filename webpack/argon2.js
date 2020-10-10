import { argon2id, argon2Verify } from '..';

const hash = argon2id({
  password: 'pass',
  salt: '12345678',
  parallelism: 1,
  iterations: 256,
  memorySize: 512,
  hashLength: 32,
  outputType: 'encoded',
});

console.log(argon2Verify(hash));
