import fs from "node:fs";
import { createRIPEMD160, ripemd160 } from "../lib";
import { getVariableLengthChunks } from "./util";
/* global test, expect */

test("simple strings", async () => {
	expect(await ripemd160("")).toBe("9c1185a5c5e9fc54612808977ee8f548b2258d31");
	expect(await ripemd160("a")).toBe("0bdc9d2d256b3ee9daae347be6f4dc835a467ffe");
	expect(await ripemd160("a\x00")).toBe(
		"3213d398bb951aa09625539093524fa528848bd0",
	);
	expect(await ripemd160("abc")).toBe(
		"8eb208f7e05d987a9b044a8e98c6b087f15a0bfc",
	);
	expect(await ripemd160("message digest")).toBe(
		"5d0689ef49d2fae572b881b123a85ffa21595f36",
	);
	expect(await ripemd160("abcdefghijklmnopqrstuvwxyz")).toBe(
		"f71c27109c692c1b56bbdceb5b9d2865b3708dbc",
	);
	expect(
		await ripemd160(
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
		),
	).toBe("b0e20b6e3116640286ed3a87a5713079b21f5189");
	expect(
		await ripemd160(
			"12345678901234567890123456789012345678901234567890123456789012345678901234567890",
		),
	).toBe("9b752e45573d4b39f4dbd3323cab82bf63326bfb");
});

test("unicode strings", async () => {
	expect(await ripemd160("😊")).toBe(
		"2527e5519a42891531856a0ca959402cd6b335c1",
	);
	expect(await ripemd160("😊a😊")).toBe(
		"11debd04fd7fb2a81b0065994fac4e030c023a34",
	);
	const file = fs.readFileSync("./test/utf8.txt");
	expect(await ripemd160(file)).toBe(
		"d6d1dda80b44f7cd6424c8af9a4224c480b06013",
	);
	expect(await ripemd160(file.toString())).toBe(
		"d6d1dda80b44f7cd6424c8af9a4224c480b06013",
	);
});

test("Node.js buffers", async () => {
	expect(await ripemd160(Buffer.from([]))).toBe(
		"9c1185a5c5e9fc54612808977ee8f548b2258d31",
	);
	expect(await ripemd160(Buffer.from(["a".charCodeAt(0)]))).toBe(
		"0bdc9d2d256b3ee9daae347be6f4dc835a467ffe",
	);
	expect(await ripemd160(Buffer.from([0]))).toBe(
		"c81b94933420221a7ac004a90242d8b1d3e5070d",
	);
	expect(await ripemd160(Buffer.from([0, 1, 0, 0, 2, 0]))).toBe(
		"502c8fdabcdf8e11d4a32a0fb67d5b71c9a3acf1",
	);
});

test("typed arrays", async () => {
	const arr = [0, 1, 2, 3, 4, 5, 255, 254];
	expect(await ripemd160(Buffer.from(arr))).toBe(
		"4f058de8c4a6315224ebf855e6ebc19bcdab12ba",
	);
	const uint8 = new Uint8Array(arr);
	expect(await ripemd160(uint8)).toBe(
		"4f058de8c4a6315224ebf855e6ebc19bcdab12ba",
	);
	expect(await ripemd160(new Uint16Array(uint8.buffer))).toBe(
		"4f058de8c4a6315224ebf855e6ebc19bcdab12ba",
	);
	expect(await ripemd160(new Uint32Array(uint8.buffer))).toBe(
		"4f058de8c4a6315224ebf855e6ebc19bcdab12ba",
	);
});

test("long strings", async () => {
	const SIZE = 5 * 1024 * 1024;
	const chunk = "012345678\x09";
	const str = new Array(Math.floor(SIZE / chunk.length)).fill(chunk).join("");
	expect(await ripemd160(str)).toBe("a9697dca54c98d6c33eb9bbd310c0aff9fee74a1");
});

test("long buffers", async () => {
	const SIZE = 5 * 1024 * 1024;
	const buf = Buffer.alloc(SIZE);
	buf.fill("\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF");
	expect(await ripemd160(buf)).toBe("5a78d021a2bde7933ae0e0f236105ee72e38199c");
});

test("chunked", async () => {
	const hash = await createRIPEMD160();
	expect(hash.digest()).toBe("9c1185a5c5e9fc54612808977ee8f548b2258d31");
	hash.init();
	hash.update("a");
	hash.update(new Uint8Array([0]));
	hash.update("bc");
	hash.update(new Uint8Array([255, 254]));
	expect(hash.digest()).toBe("f39cee3567f8e52d2ecb0e79b19f23c64d7b57f2");

	hash.init();
	for (let i = 0; i < 1000; i++) {
		hash.update(new Uint8Array([i & 0xff]));
	}
	hash.update(Buffer.alloc(1000).fill(0xdf));
	expect(hash.digest()).toBe("0c3f2d7884f90ee147afabc89fed293a3928ff7d");
});

test("chunked increasing length", async () => {
	const hash = await createRIPEMD160();
	const test = async (maxLen: number) => {
		const chunks = getVariableLengthChunks(maxLen);
		const flatchunks = chunks.reduce((acc, val) => acc.concat(val), []);
		const hashRef = await ripemd160(new Uint8Array(flatchunks));
		hash.init();
		for (const chunk of chunks) {
			hash.update(new Uint8Array(chunk));
		}
		expect(hash.digest("hex")).toBe(hashRef);
	};
	const maxLens = [1, 3, 27, 50, 57, 64, 91, 127, 256, 300];
	await Promise.all(maxLens.map((length) => test(length)));
});

test("interlaced shorthand", async () => {
	const [hashA, hashB] = await Promise.all([ripemd160("a"), ripemd160("abc")]);
	expect(hashA).toBe("0bdc9d2d256b3ee9daae347be6f4dc835a467ffe");
	expect(hashB).toBe("8eb208f7e05d987a9b044a8e98c6b087f15a0bfc");
});

test("interlaced create", async () => {
	const hashA = await createRIPEMD160();
	hashA.update("a");
	const hashB = await createRIPEMD160();
	hashB.update("abc");
	expect(hashA.digest()).toBe("0bdc9d2d256b3ee9daae347be6f4dc835a467ffe");
	expect(hashB.digest()).toBe("8eb208f7e05d987a9b044a8e98c6b087f15a0bfc");
});

test("Invalid inputs throw", async () => {
	const invalidInputs = [0, 1, Number(1), {}, [], null, undefined];
	const hash = await createRIPEMD160();

	for (const input of invalidInputs) {
		await expect(ripemd160(input as any)).rejects.toThrow();
		expect(() => hash.update(input as any)).toThrow();
	}
});
