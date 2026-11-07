const fs = require("node:fs");

async function main() {
  const { default: binaryen } = await import("binaryen");

  console.log("binaryen optimize start");

  const mod = binaryen.readBinary(fs.readFileSync("./wasm/bcrypt.wasm"));
  mod.optimize();

  const wasmData = mod.emitBinary();
  fs.writeFileSync("./wasm/bcrypt.wasm", wasmData);
  mod.dispose();

  console.log("binaryen optimize done");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
