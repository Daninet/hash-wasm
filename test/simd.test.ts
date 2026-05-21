import fs from "node:fs";
import { WASMInterface } from "../lib/WASMInterface";
import { isWasmSimdSupported } from "../lib/simd";
import wasmJsonSimdBlake3 from "../wasm/blake3-simd.wasm.json";
import wasmJsonPortableBlake3 from "../wasm/blake3.wasm.json";
import wasmJsonSimdSha256 from "../wasm/sha256-simd.wasm.json";
import wasmJsonPortableSha256 from "../wasm/sha256.wasm.json";
/* global test, expect */

test("isWasmSimdSupported returns boolean", () => {
	expect(typeof isWasmSimdSupported()).toBe("boolean");
});

test("SIMD and portable BLAKE3 produce the same hash", async () => {
	const data = "hello world";
	const portable = await WASMInterface(wasmJsonPortableBlake3, 32);
	const simd = await WASMInterface(wasmJsonSimdBlake3, 32);

	expect(portable.calculate(data, 0, 32)).toBe(simd.calculate(data, 0, 32));
});

test("SIMD and portable BLAKE3 produce the same hash for long input", async () => {
	const chunk = "012345678\x09";
	const data = new Array(Math.floor(50000 / chunk.length)).fill(chunk).join("");
	const portable = await WASMInterface(wasmJsonPortableBlake3, 32);
	const simd = await WASMInterface(wasmJsonSimdBlake3, 32);

	expect(portable.calculate(data, 0, 32)).toBe(simd.calculate(data, 0, 32));
});

test("SIMD and portable SHA-256 produce the same hash", async () => {
	const data = "hello world";
	const portable = await WASMInterface(wasmJsonPortableSha256, 32);
	const simd = await WASMInterface(wasmJsonSimdSha256, 32);

	expect(portable.calculate(data, 256)).toBe(simd.calculate(data, 256));
});

test("SIMD and portable SHA-256 produce the same hash for long input", async () => {
	const data = new Uint8Array(50000);
	data.fill(0xab);
	const portable = await WASMInterface(wasmJsonPortableSha256, 32);
	const simd = await WASMInterface(wasmJsonSimdSha256, 32);

	expect(portable.calculate(data, 256)).toBe(simd.calculate(data, 256));
});

test("SIMD and portable SHA-256 produce the same hash for utf8 file", async () => {
	const file = fs.readFileSync("./test/utf8.txt");
	const portable = await WASMInterface(wasmJsonPortableSha256, 32);
	const simd = await WASMInterface(wasmJsonSimdSha256, 32);

	expect(portable.calculate(file, 256)).toBe(simd.calculate(file, 256));
});
