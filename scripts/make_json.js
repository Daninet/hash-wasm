const fs = require('fs');
const path = require('path');

const dir = path.resolve(__dirname, '..', 'wasm');
const files = fs.readdirSync(dir).filter((file) => file.endsWith('.wasm'));

files.forEach((file) => {
  const data = fs.readFileSync(path.join(dir, file));
  const base64Data = data.toString('base64');
  const parsedName = path.parse(file);
  const json = JSON.stringify({ name: parsedName.name, data: base64Data });
  fs.writeFileSync(path.join(dir, `${file}.json`), json);
});
