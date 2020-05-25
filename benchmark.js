const { md5 } = require('./dist/index.umd');

async function calc(data, length) {
  for (let i = 0; i < length; i++) {
    await md5(data);
  }
}

async function run() {
  for (let i = 0; i < 4; i++) {
    console.time('md5 short');
    await calc('abcd', 300000);
    console.timeEnd('md5 short');
  }

  const buf = Buffer.alloc(1024 * 1024, 'abcd');
  for (let i = 0; i < 4; i++) {
    console.time('md5 long');
    await calc(buf, 300);
    console.timeEnd('md5 long');
  }
}

run();
