import fs from "node:fs";
import { createMD5, md5 } from "../lib";
import { getVariableLengthChunks } from "./util";
/* global test, expect */

test("simple strings", async () => {
	expect(await md5("")).toBe("d41d8cd98f00b204e9800998ecf8427e");
	expect(await md5("a")).toBe("0cc175b9c0f1b6a831c399e269772661");
	expect(await md5("a\x00")).toBe("4144e195f46de78a3623da7364d04f11");
	expect(await md5("abc")).toBe("900150983cd24fb0d6963f7d28e17f72");
	expect(await md5("message digest")).toBe("f96b697d7cb7938d525a2f31aaf161d0");
	expect(await md5("abcdefghijklmnopqrstuvwxyz")).toBe(
		"c3fcd3d76192e4007dfb496cca67e13b",
	);
	expect(
		await md5("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"),
	).toBe("d174ab98d277d9f5a5611c2c9f419d9f");
	expect(
		await md5(
			"12345678901234567890123456789012345678901234567890123456789012345678901234567890",
		),
	).toBe("57edf4a22be3c955ac49da2e2107b67a");
});

test("unicode strings", async () => {
	expect(await md5("😊")).toBe("5deda34cd95f304948d2bc1b4a62c11e");
	expect(await md5("😊a😊")).toBe("c7f73db036e1509bc9eb0daa04881195");
	const file = fs.readFileSync("./test/utf8.txt");
	expect(await md5(file)).toBe("24dcee50e16fe589d9c6a20e43d76ec8");
	expect(await md5(file.toString())).toBe("24dcee50e16fe589d9c6a20e43d76ec8");
});

test("Node.js buffers", async () => {
	expect(await md5(Buffer.from([]))).toBe("d41d8cd98f00b204e9800998ecf8427e");
	expect(await md5(Buffer.from(["a".charCodeAt(0)]))).toBe(
		"0cc175b9c0f1b6a831c399e269772661",
	);
	expect(await md5(Buffer.from([0]))).toBe("93b885adfe0da089cdf634904fd59f71");
	expect(await md5(Buffer.from([0, 1, 0, 0, 2, 0]))).toBe(
		"8dd6f66d8ae62c8c777d9b62fe7ae1af",
	);
});

test("typed arrays", async () => {
	const arr = [0, 1, 2, 3, 4, 5, 255, 254];
	expect(await md5(Buffer.from(arr))).toBe("f29787c936b2acf6bca41764fc0376ec");
	const uint8 = new Uint8Array(arr);
	expect(await md5(uint8)).toBe("f29787c936b2acf6bca41764fc0376ec");
	expect(await md5(new Uint16Array(uint8.buffer))).toBe(
		"f29787c936b2acf6bca41764fc0376ec",
	);
	expect(await md5(new Uint32Array(uint8.buffer))).toBe(
		"f29787c936b2acf6bca41764fc0376ec",
	);
});

test("long strings", async () => {
	const SIZE = 5 * 1024 * 1024;
	const chunk = "012345678\x09";
	const str = new Array(Math.floor(SIZE / chunk.length)).fill(chunk).join("");
	expect(await md5(str)).toBe("8bcd28f120e3d90da1cb831bca925ca7");
});

test("long buffers", async () => {
	const SIZE = 5 * 1024 * 1024;
	const buf = Buffer.alloc(SIZE);
	buf.fill("\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF");
	expect(await md5(buf)).toBe("f195aef51a25af5d29ca871eb3780c06");
});

test("chunked", async () => {
	const hash = await createMD5();
	expect(hash.digest()).toBe("d41d8cd98f00b204e9800998ecf8427e");
	hash.init();
	hash.update("a");
	hash.update(new Uint8Array([0]));
	hash.update("bc");
	hash.update(new Uint8Array([255, 254]));
	expect(hash.digest()).toBe("cb8bd330c93f032f1efcf189023eab77");

	hash.init();
	for (let i = 0; i < 1000; i++) {
		hash.update(new Uint8Array([i & 0xff]));
	}
	hash.update(Buffer.alloc(1000).fill(0xdf));
	expect(hash.digest()).toBe("63a7c37748d0c5afcf75c3560c2382de");
});

test("chunked increasing length", async () => {
	const hash = await createMD5();
	const test = async (maxLen: number) => {
		const chunks = getVariableLengthChunks(maxLen);
		const flatchunks = chunks.reduce((acc, val) => acc.concat(val), []);
		const hashRef = await md5(new Uint8Array(flatchunks));
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
	const [hashA, hashB] = await Promise.all([md5("a"), md5("abc")]);
	expect(hashA).toBe("0cc175b9c0f1b6a831c399e269772661");
	expect(hashB).toBe("900150983cd24fb0d6963f7d28e17f72");
});

test("interlaced create", async () => {
	const hashA = await createMD5();
	hashA.update("a");
	const hashB = await createMD5();
	hashB.update("abc");
	expect(hashA.digest()).toBe("0cc175b9c0f1b6a831c399e269772661");
	expect(hashB.digest()).toBe("900150983cd24fb0d6963f7d28e17f72");
});

test("Invalid inputs throw", async () => {
	const invalidInputs = [0, 1, Number(1), {}, [], null, undefined];
	const hash = await createMD5();

	for (const input of invalidInputs) {
		await expect(md5(input as any)).rejects.toThrow();
		expect(() => hash.update(input as any)).toThrow();
	}
});
