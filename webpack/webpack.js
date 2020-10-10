const webpack = require('webpack');
const fs = require('fs');
const path = require('path');
const CompressionPlugin = require('compression-webpack-plugin');

const files =
  fs.readdirSync(__dirname)
    .filter(p => p.endsWith('.js') && p !== 'webpack.js')
    .map(p => p.slice(0, -3));

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

webpack(files.map((f) => getConfig(f)), (err, stats) => {
  process.stdout.write(`${stats.toString()}\\n`);
});

fs.rmdirSync(path.resolve(__dirname, 'dist'));
