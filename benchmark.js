const crypto = require('crypto');
// const CryptoJS = require('crypto-js');
const { pbkdf2, createSHA1 } = require('./dist/index.umd');

async function calcWASM(password, salt, iterations, keylen, cycles) {
  for (let i = 0; i < cycles; i++) {
    await pbkdf2(password, salt, iterations, keylen, createSHA1());
  }
}

async function calcNode(password, salt, iterations, keylen, cycles) {
  for (let i = 0; i < cycles; i++) {
    crypto.pbkdf2Sync(password, salt, iterations, keylen, 'sha1').toString('hex');
  }
}

// async function calcJS(password, salt, iterations, keylen, cycles) {
//   for (let i = 0; i < cycles; i++) {
//     CryptoJS.PBKDF2(password, salt, { iterations, keySize: keylen });
//   }
// }

async function run() {
  for (let i = 0; i < 4; i++) {
    console.time('wasm pbkdf2 short');
    await calcWASM('pass', 'salt', 4000, 150, 10);
    console.timeEnd('wasm pbkdf2 short');
  }

  for (let i = 0; i < 4; i++) {
    console.time('node pbkdf2 short');
    await calcNode('pass', 'salt', 4000, 150, 10);
    console.timeEnd('node pbkdf2 short');
  }

  // for (let i = 0; i < 4; i++) {
  //   console.time('js pbkdf2 short');
  //   await calcJS('pass', 'salt', 4000, 150, 10);
  //   console.timeEnd('js pbkdf2 short');
  // }
}

run();
