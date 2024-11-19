import fs from "node:fs";
import { blake3, createBLAKE3 } from "../lib";
import { getVariableLengthChunks } from "./util";
/* global test, expect */

test("simple strings", async () => {
	expect(await blake3("", 256)).toBe(
		"af1349b9f5f9a1a6a0404dea36dcc9499bcb25c9adc112b7cc9a93cae41f3262",
	);
	expect(await blake3("a", 256)).toBe(
		"17762fddd969a453925d65717ac3eea21320b66b54342fde15128d6caf21215f",
	);
	expect(await blake3("a\x00", 256)).toBe(
		"7eb5f2760c891ddc18f5a287558fc48767d7a5d5895c51c980a8b7380c26d5a4",
	);
	expect(await blake3("abc", 256)).toBe(
		"6437b3ac38465133ffb63b75273a8db548c558465d79db03fd359c6cd5bd9d85",
	);
	expect(await blake3("message digest", 256)).toBe(
		"7bc2a2eeb95ddbf9b7ecf6adcb76b453091c58dc43955e1d9482b1942f08d19b",
	);
	expect(await blake3("abcdefghijklmnopqrstuvwxyz", 256)).toBe(
		"2468eec8894acfb4e4df3a51ea916ba115d48268287754290aae8e9e6228e85f",
	);
	expect(
		await blake3(
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
			256,
		),
	).toBe("8bee3200baa9f3a1acd279f049f914f110e730555ff15109bd59cdd73895e239");
	expect(
		await blake3(
			"12345678901234567890123456789012345678901234567890123456789012345678901234567890",
			256,
		),
	).toBe("f263acf51621980b9c8de5da4a17d314984e05abe4a21cc83a07fe3e1e366dd1");
});

test("unicode strings", async () => {
	expect(await blake3("😊", 256)).toBe(
		"faa78d58da769fc62a44e89515bf09fe36153d3fe23a61c90ad9c57e6d151782",
	);
	expect(await blake3("😊a😊", 256)).toBe(
		"27e6e7d5a11061ae9db96495fcccc7aacb8813283dc1fa71b9ec77c26b5ea004",
	);
	const file = fs.readFileSync("./test/utf8.txt");
	expect(await blake3(file, 256)).toBe(
		"be4126e031519962430d8bb718118b73864e8ea95fc35369915dbd8596e6c1e3",
	);
	expect(await blake3(file.toString(), 256)).toBe(
		"be4126e031519962430d8bb718118b73864e8ea95fc35369915dbd8596e6c1e3",
	);
});

test("Node.js buffers", async () => {
	expect(await blake3(Buffer.from([]), 256)).toBe(
		"af1349b9f5f9a1a6a0404dea36dcc9499bcb25c9adc112b7cc9a93cae41f3262",
	);
	expect(await blake3(Buffer.from(["a".charCodeAt(0)]), 256)).toBe(
		"17762fddd969a453925d65717ac3eea21320b66b54342fde15128d6caf21215f",
	);
	expect(await blake3(Buffer.from([0]), 256)).toBe(
		"2d3adedff11b61f14c886e35afa036736dcd87a74d27b5c1510225d0f592e213",
	);
	expect(await blake3(Buffer.from([0, 1, 0, 0, 2, 0]), 256)).toBe(
		"cb6f972e4304cf55cb77a48a32874e2eee56c1374d656cbb5aeb4a11dfb8936b",
	);
});

test("typed arrays", async () => {
	const arr = [0, 1, 2, 3, 4, 5, 255, 254];
	expect(await blake3(Buffer.from(arr), 256)).toBe(
		"d9ffe50cd366354882a331be11390ba85d41295749b35de81dd07644c5df990f",
	);
	const uint8 = new Uint8Array(arr);
	expect(await blake3(uint8, 256)).toBe(
		"d9ffe50cd366354882a331be11390ba85d41295749b35de81dd07644c5df990f",
	);
	expect(await blake3(new Uint16Array(uint8.buffer), 256)).toBe(
		"d9ffe50cd366354882a331be11390ba85d41295749b35de81dd07644c5df990f",
	);
	expect(await blake3(new Uint32Array(uint8.buffer), 256)).toBe(
		"d9ffe50cd366354882a331be11390ba85d41295749b35de81dd07644c5df990f",
	);
});

test("long strings", async () => {
	const SIZE = 5 * 1024 * 1024;
	const chunk = "012345678\x09";
	const str = new Array(Math.floor(SIZE / chunk.length)).fill(chunk).join("");
	expect(await blake3(str, 256)).toBe(
		"e7b1327a9b4d113a27fc6598606acfa73093c1164528e71ee070bbe171c6a292",
	);
});

test("long buffers", async () => {
	const SIZE = 5 * 1024 * 1024;
	const buf = Buffer.alloc(SIZE);
	buf.fill("\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF");
	expect(await blake3(buf, 256)).toBe(
		"8a169b52644b8adb93cf4cedd4172313f2d2b487f6b5b2d30f3fdadbd068b888",
	);
});

test("chunked", async () => {
	const hash = await createBLAKE3(256);
	expect(hash.digest()).toBe(
		"af1349b9f5f9a1a6a0404dea36dcc9499bcb25c9adc112b7cc9a93cae41f3262",
	);
	hash.init();
	hash.update("a");
	hash.update(new Uint8Array([0]));
	hash.update("bc");
	hash.update(new Uint8Array([255, 254]));
	expect(hash.digest()).toBe(
		"52cb9fd85a9777e741a60b5b1cfca8d9c71980c4ec8a1b02489db449832138ae",
	);

	hash.init();
	for (let i = 0; i < 1000; i++) {
		hash.update(new Uint8Array([i & 0xff]));
	}
	hash.update(Buffer.alloc(1000).fill(0xdf));
	expect(hash.digest()).toBe(
		"4ce4e75a3083519d2e2e6f9b4fb85fb627b8e4aee71b399939170c18d22d8b47",
	);
});

test("chunked increasing length", async () => {
	const hash = await createBLAKE3(256);
	const test = async (maxLen: number) => {
		const chunks = getVariableLengthChunks(maxLen);
		const flatchunks = chunks.reduce((acc, val) => acc.concat(val), []);
		const hashRef = await blake3(new Uint8Array(flatchunks), 256);
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
		blake3("a", 256),
		blake3("abc", 256),
	]);
	expect(hashA).toBe(
		"17762fddd969a453925d65717ac3eea21320b66b54342fde15128d6caf21215f",
	);
	expect(hashB).toBe(
		"6437b3ac38465133ffb63b75273a8db548c558465d79db03fd359c6cd5bd9d85",
	);
});

test("interlaced create", async () => {
	const hashA = await createBLAKE3(256);
	hashA.update("a");
	const hashB = await createBLAKE3(256);
	hashB.update("abc");
	expect(hashA.digest()).toBe(
		"17762fddd969a453925d65717ac3eea21320b66b54342fde15128d6caf21215f",
	);
	expect(hashB.digest()).toBe(
		"6437b3ac38465133ffb63b75273a8db548c558465d79db03fd359c6cd5bd9d85",
	);
});

test("Invalid inputs throw", async () => {
	const invalidInputs = [0, 1, Number(1), {}, [], null, undefined];
	const hash = await createBLAKE3(256);

	for (const input of invalidInputs) {
		await expect(blake3(input as any, 256)).rejects.toThrow();
		expect(() => hash.update(input as any)).toThrow();
	}
});
