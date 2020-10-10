const webpack = require('webpack');
const fs = require('fs');
const path = require('path');
const CompressionPlugin = require('compression-webpack-plugin');

const oldFiles = fs.readdirSync(path.resolve(__dirname, 'dist'))
  .map((p) => path.resolve(__dirname, 'dist', p));

oldFiles.forEach((p) => fs.unlinkSync(p));

const files = fs.readdirSync(__dirname)
  .filter((p) => p.endsWith('.js') && p !== 'webpack.js')
  .map((p) => p.slice(0, -3));

function getConfig(algorithm) {
  return {
    mode: 'production',
    entry: path.resolve(__dirname, `./${algorithm}.js`),
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: `${algorithm}.bundle.js`,
    },
    plugins: [new CompressionPlugin()],
  };
}

const promise = new Promise((resolve) => {
  webpack(files.map((f) => getConfig(f)), (err, stats) => {
    process.stdout.write(`${stats.toString()}\\n`);
    resolve();
  });
});

async function run() {
  await promise;

  const newFiles = fs.readdirSync(path.resolve(__dirname, 'dist'))
    .map((p) => path.resolve(__dirname, 'dist', p));

  console.log('');

  const table = newFiles.map((f) => [
    path.basename(f), (fs.statSync(f).size / 1024).toFixed(2),
  ]);

  console.table(table);
}

run();
