import { bcrypt, bcryptVerify } from '..';

const hash = bcrypt({
  password: 'a', // password
  salt: '1234567890123456', // salt (16 bytes long - usually containing random bytes)
  costFactor: 8, // number of iterations to perform (4 - 31)
  outputType: 'encoded', // by default returns encoded string
});

console.log(bcryptVerify({
  password: 'a',
  hash,
}));
