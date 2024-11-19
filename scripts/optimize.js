const fs = require("node:fs");
const binaryen = require("binaryen");

console.log("binaryen optimize start");

const mod = binaryen.readBinary(fs.readFileSync("./wasm/bcrypt.wasm"));
mod.optimize();

const wasmData = mod.emitBinary();
fs.writeFileSync("./wasm/bcrypt.wasm", wasmData);

console.log("binaryen optimize done");
