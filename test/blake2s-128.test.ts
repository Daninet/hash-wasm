import fs from "node:fs";
import { blake2s, createBLAKE2s } from "../lib";
import { getVariableLengthChunks } from "./util";
/* global test, expect */

test("simple strings", async () => {
	expect(await blake2s("", 128)).toBe("64550d6ffe2c0a01a14aba1eade0200c");
	expect(await blake2s("a", 128)).toBe("854b9e9ba49bfd9457d4c3bf96e42523");
	expect(await blake2s("a\x00", 128)).toBe("eeba73053b247274c536072c4b46d8ce");
	expect(await blake2s("abc", 128)).toBe("aa4938119b1dc7b87cbad0ffd200d0ae");
	expect(await blake2s("message digest", 128)).toBe(
		"a120dbd782f5e524252ba9e77e69301b",
	);
	expect(await blake2s("abcdefghijklmnopqrstuvwxyz", 128)).toBe(
		"6b5da6a19a600add9fada4c0b95bf6c9",
	);
	expect(
		await blake2s(
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
			128,
		),
	).toBe("ae8812ea7e3507014d764e3d1f57387e");
	expect(
		await blake2s(
			"12345678901234567890123456789012345678901234567890123456789012345678901234567890",
			128,
		),
	).toBe("d0b88b4a58efa805a1f7642865edd050");
});

test("unicode strings", async () => {
	expect(await blake2s("😊", 128)).toBe("e019bd2d04270ca2357a5c0047ad8a46");
	expect(await blake2s("😊a😊", 128)).toBe("90557312f688a5d9e463c5ef4a86ef1f");
	const file = fs.readFileSync("./test/utf8.txt");
	expect(await blake2s(file, 128)).toBe("2c5f7941cd083e25fa0b6e0eab371f40");
	expect(await blake2s(file.toString(), 128)).toBe(
		"2c5f7941cd083e25fa0b6e0eab371f40",
	);
});

test("Node.js buffers", async () => {
	expect(await blake2s(Buffer.from([]), 128)).toBe(
		"64550d6ffe2c0a01a14aba1eade0200c",
	);
	expect(await blake2s(Buffer.from(["a".charCodeAt(0)]), 128)).toBe(
		"854b9e9ba49bfd9457d4c3bf96e42523",
	);
	expect(await blake2s(Buffer.from([0]), 128)).toBe(
		"9f31f3ec588c6064a8e1f9051aeab90a",
	);
	expect(await blake2s(Buffer.from([0, 1, 0, 0, 2, 0]), 128)).toBe(
		"7c357b1444b9b7f89c7cd4e72ff10c36",
	);
});

test("typed arrays", async () => {
	const arr = [0, 1, 2, 3, 4, 5, 255, 254];
	expect(await blake2s(Buffer.from(arr), 128)).toBe(
		"2c64964b70aad235398456062b3984fb",
	);
	const uint8 = new Uint8Array(arr);
	expect(await blake2s(uint8, 128)).toBe("2c64964b70aad235398456062b3984fb");
	expect(await blake2s(new Uint16Array(uint8.buffer), 128)).toBe(
		"2c64964b70aad235398456062b3984fb",
	);
	expect(await blake2s(new Uint32Array(uint8.buffer), 128)).toBe(
		"2c64964b70aad235398456062b3984fb",
	);
});

test("long strings", async () => {
	const SIZE = 5 * 1024 * 1024;
	const chunk = "012345678\x09";
	const str = new Array(Math.floor(SIZE / chunk.length)).fill(chunk).join("");
	expect(await blake2s(str, 128)).toBe("c072ca2a3b3031c02ff82f15598849c7");
});

test("long buffers", async () => {
	const SIZE = 5 * 1024 * 1024;
	const buf = Buffer.alloc(SIZE);
	buf.fill("\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF");
	expect(await blake2s(buf, 128)).toBe("6088971a9c00f0b2861a2bce1d5da4c1");
});

test("chunked", async () => {
	const hash = await createBLAKE2s(128);
	expect(hash.digest()).toBe("64550d6ffe2c0a01a14aba1eade0200c");
	hash.init();
	hash.update("a");
	hash.update(new Uint8Array([0]));
	hash.update("bc");
	hash.update(new Uint8Array([255, 254]));
	expect(hash.digest()).toBe("4776ba03571cc119d15418f216233a4f");

	hash.init();
	for (let i = 0; i < 1000; i++) {
		hash.update(new Uint8Array([i & 0xff]));
	}
	hash.update(Buffer.alloc(1000).fill(0xdf));
	expect(hash.digest()).toBe("aca313375b9de5bb799054ffbad14a16");
});

test("chunked increasing length", async () => {
	const hash = await createBLAKE2s(128);
	const test = async (maxLen: number) => {
		const chunks = getVariableLengthChunks(maxLen);
		const flatchunks = chunks.reduce((acc, val) => acc.concat(val), []);
		const hashRef = await blake2s(new Uint8Array(flatchunks), 128);
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
	const [hashA, hashB] = await Promise.all([
		blake2s("a", 128),
		blake2s("abc", 128),
	]);
	expect(hashA).toBe("854b9e9ba49bfd9457d4c3bf96e42523");
	expect(hashB).toBe("aa4938119b1dc7b87cbad0ffd200d0ae");
});

test("interlaced create", async () => {
	const hashA = await createBLAKE2s(128);
	hashA.update("a");
	const hashB = await createBLAKE2s(128);
	hashB.update("abc");
	expect(hashA.digest()).toBe("854b9e9ba49bfd9457d4c3bf96e42523");
	expect(hashB.digest()).toBe("aa4938119b1dc7b87cbad0ffd200d0ae");
});

test("Invalid inputs throw", async () => {
	const invalidInputs = [0, 1, Number(1), {}, [], null, undefined];
	const hash = await createBLAKE2s(128);

	for (const input of invalidInputs) {
		await expect(blake2s(input as any, 128)).rejects.toThrow();
		expect(() => hash.update(input as any)).toThrow();
	}
});
