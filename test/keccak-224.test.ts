import fs from "node:fs";
import { createKeccak, keccak } from "../lib";
import { getVariableLengthChunks } from "./util";
/* global test, expect */

test("simple strings", async () => {
	expect(await keccak("", 224)).toBe(
		"f71837502ba8e10837bdd8d365adb85591895602fc552b48b7390abd",
	);
	expect(await keccak("a", 224)).toBe(
		"7cf87d912ee7088d30ec23f8e7100d9319bff090618b439d3fe91308",
	);
	expect(await keccak("a\x00", 224)).toBe(
		"1b914ebf869b542b9d8440e07ca1dfe5da48ebb1c563e928ded523c3",
	);
	expect(await keccak("abc", 224)).toBe(
		"c30411768506ebe1c2871b1ee2e87d38df342317300a9b97a95ec6a8",
	);
	expect(await keccak("message digest", 224)).toBe(
		"b53b2cd638f440fa49916036acdb22245673992fb1b1963b96fb9e93",
	);
	expect(await keccak("abcdefghijklmnopqrstuvwxyz", 224)).toBe(
		"162bab64dc3ba594bd3b43fd8abec4aa03b36c2784cac53a58f9b076",
	);
	expect(
		await keccak(
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
			224,
		),
	).toBe("4fb72d7b6b24bd1f5d4b8ef559fd9188eb66caa01bce34c621a05412");
	expect(
		await keccak(
			"12345678901234567890123456789012345678901234567890123456789012345678901234567890",
			224,
		),
	).toBe("744c1765a53043e186bc30bab07fa379b421cf0bca8224cb83e5d45b");
});

test("unicode strings", async () => {
	expect(await keccak("😊", 224)).toBe(
		"628277f927690213af759bb3e6cd2024eed84309ed0a7d257c1084de",
	);
	expect(await keccak("😊a😊", 224)).toBe(
		"dfac34043895a643f113fc21e138732d0566f32e98c046064820bf58",
	);
	const file = fs.readFileSync("./test/utf8.txt");
	expect(await keccak(file, 224)).toBe(
		"2894459c0625dc97aa3db2de8ad9f67a8a0cea74c0a5208ed8b0664d",
	);
	expect(await keccak(file.toString(), 224)).toBe(
		"2894459c0625dc97aa3db2de8ad9f67a8a0cea74c0a5208ed8b0664d",
	);
});

test("Node.js buffers", async () => {
	expect(await keccak(Buffer.from([]), 224)).toBe(
		"f71837502ba8e10837bdd8d365adb85591895602fc552b48b7390abd",
	);
	expect(await keccak(Buffer.from(["a".charCodeAt(0)]), 224)).toBe(
		"7cf87d912ee7088d30ec23f8e7100d9319bff090618b439d3fe91308",
	);
	expect(await keccak(Buffer.from([0]), 224)).toBe(
		"b7e52d015afb9bb56c19955720964f1a68b1aba96a7a9454472927be",
	);
	expect(await keccak(Buffer.from([0, 1, 0, 0, 2, 0]), 224)).toBe(
		"9de557901837e8bd646979a967629a506a2441778e61b4739446f127",
	);
});

test("typed arrays", async () => {
	const arr = [0, 1, 2, 3, 4, 5, 255, 254];
	expect(await keccak(Buffer.from(arr), 224)).toBe(
		"c542c73ed687f1ef438d6d7cd4f20c8415850a7095ff506776b0cae6",
	);
	const uint8 = new Uint8Array(arr);
	expect(await keccak(uint8, 224)).toBe(
		"c542c73ed687f1ef438d6d7cd4f20c8415850a7095ff506776b0cae6",
	);
	expect(await keccak(new Uint16Array(uint8.buffer), 224)).toBe(
		"c542c73ed687f1ef438d6d7cd4f20c8415850a7095ff506776b0cae6",
	);
	expect(await keccak(new Uint32Array(uint8.buffer), 224)).toBe(
		"c542c73ed687f1ef438d6d7cd4f20c8415850a7095ff506776b0cae6",
	);
});

test("long strings", async () => {
	const SIZE = 5 * 1024 * 1024;
	const chunk = "012345678\x09";
	const str = new Array(Math.floor(SIZE / chunk.length)).fill(chunk).join("");
	expect(await keccak(str, 224)).toBe(
		"47408143f22f56758b0a99a861629bca80dcdc304bd5843c5049e76d",
	);
});

test("long buffers", async () => {
	const SIZE = 5 * 1024 * 1024;
	const buf = Buffer.alloc(SIZE);
	buf.fill("\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF");
	expect(await keccak(buf, 224)).toBe(
		"81eadc502f5e5969929e6b707990d98bd096f1aa084500b5ed6d3fab",
	);
});

test("chunked", async () => {
	const hash = await createKeccak(224);
	expect(hash.digest()).toBe(
		"f71837502ba8e10837bdd8d365adb85591895602fc552b48b7390abd",
	);
	hash.init();
	hash.update("a");
	hash.update(new Uint8Array([0]));
	hash.update("bc");
	hash.update(new Uint8Array([255, 254]));
	expect(hash.digest()).toBe(
		"9aaf1324c58e6b4f0dc4241e18ada1f773a652fbc1cf51b32682debe",
	);

	hash.init();
	for (let i = 0; i < 1000; i++) {
		hash.update(new Uint8Array([i & 0xff]));
	}
	hash.update(Buffer.alloc(1000).fill(0xdf));
	expect(hash.digest()).toBe(
		"8d2f1354ef279fd5bc9c70eba0eeac8f1b5d7dee386df39f5b7aaf7e",
	);
});

test("chunked increasing length", async () => {
	const hash = await createKeccak(224);
	const test = async (maxLen: number) => {
		const chunks = getVariableLengthChunks(maxLen);
		const flatchunks = chunks.reduce((acc, val) => acc.concat(val), []);
		const hashRef = await keccak(new Uint8Array(flatchunks), 224);
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
		keccak("a", 224),
		keccak("abc", 224),
	]);
	expect(hashA).toBe(
		"7cf87d912ee7088d30ec23f8e7100d9319bff090618b439d3fe91308",
	);
	expect(hashB).toBe(
		"c30411768506ebe1c2871b1ee2e87d38df342317300a9b97a95ec6a8",
	);
});

test("interlaced create", async () => {
	const hashA = await createKeccak(224);
	hashA.update("a");
	const hashB = await createKeccak(224);
	hashB.update("abc");
	expect(hashA.digest()).toBe(
		"7cf87d912ee7088d30ec23f8e7100d9319bff090618b439d3fe91308",
	);
	expect(hashB.digest()).toBe(
		"c30411768506ebe1c2871b1ee2e87d38df342317300a9b97a95ec6a8",
	);
});

test("Invalid inputs throw", async () => {
	const invalidInputs = [0, 1, Number(1), {}, [], null, undefined];
	const hash = await createKeccak(224);

	for (const input of invalidInputs) {
		await expect(keccak(input as any, 224)).rejects.toThrow();
		expect(() => hash.update(input as any)).toThrow();
	}
});
