import fs from "node:fs";
import { createSHA256, sha256 } from "../lib";
import { getVariableLengthChunks } from "./util";
/* global test, expect */

test("simple strings", async () => {
	expect(await sha256("")).toBe(
		"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
	);
	expect(await sha256("a")).toBe(
		"ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
	);
	expect(await sha256("a\x00")).toBe(
		"ffe9aaeaa2a2d5048174df0b80599ef0197ec024c4b051bc9860cff58ef7f9f3",
	);
	expect(await sha256("abc")).toBe(
		"ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
	);
	expect(await sha256("message digest")).toBe(
		"f7846f55cf23e14eebeab5b4e1550cad5b509e3348fbc4efa3a1413d393cb650",
	);
	expect(await sha256("abcdefghijklmnopqrstuvwxyz")).toBe(
		"71c480df93d6ae2f1efad1447c66c9525e316218cf51fc8d9ed832f2daf18b73",
	);
	expect(
		await sha256(
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
		),
	).toBe("db4bfcbd4da0cd85a60c3c37d3fbd8805c77f15fc6b1fdfe614ee0a7c8fdb4c0");
	expect(
		await sha256(
			"12345678901234567890123456789012345678901234567890123456789012345678901234567890",
		),
	).toBe("f371bc4a311f2b009eef952dd83ca80e2b60026c8e935592d0f9c308453c813e");
});

test("unicode strings", async () => {
	expect(await sha256("😊")).toBe(
		"08081c499cdeab015ad5c888c4aac3e8a4ba2333be9862f69482732bd817411d",
	);
	expect(await sha256("😊a😊")).toBe(
		"7ddb1f8cac86ca33c82201137ce05e9f7bb450580b867a9e23711e611c5f51c0",
	);
	const file = fs.readFileSync("./test/utf8.txt");
	expect(await sha256(file)).toBe(
		"15e4625539fcbb610a2574117dadc74e758c70ee058dd21c84e122037f74f3a3",
	);
	expect(await sha256(file.toString())).toBe(
		"15e4625539fcbb610a2574117dadc74e758c70ee058dd21c84e122037f74f3a3",
	);
});

test("Node.js buffers", async () => {
	expect(await sha256(Buffer.from([]))).toBe(
		"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
	);
	expect(await sha256(Buffer.from(["a".charCodeAt(0)]))).toBe(
		"ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
	);
	expect(await sha256(Buffer.from([0]))).toBe(
		"6e340b9cffb37a989ca544e6bb780a2c78901d3fb33738768511a30617afa01d",
	);
	expect(await sha256(Buffer.from([0, 1, 0, 0, 2, 0]))).toBe(
		"aa3580174ed8b78a2cc5ef4dfbf332cafccd2f965a2deba13e70335b1f73a50c",
	);
});

test("typed arrays", async () => {
	const arr = [0, 1, 2, 3, 4, 5, 255, 254];
	expect(await sha256(Buffer.from(arr))).toBe(
		"dea719768dd564a983eb20d5a3272d737e4930f7b3e84a7d6d529a44421edbd2",
	);
	const uint8 = new Uint8Array(arr);
	expect(await sha256(uint8)).toBe(
		"dea719768dd564a983eb20d5a3272d737e4930f7b3e84a7d6d529a44421edbd2",
	);
	expect(await sha256(new Uint16Array(uint8.buffer))).toBe(
		"dea719768dd564a983eb20d5a3272d737e4930f7b3e84a7d6d529a44421edbd2",
	);
	expect(await sha256(new Uint32Array(uint8.buffer))).toBe(
		"dea719768dd564a983eb20d5a3272d737e4930f7b3e84a7d6d529a44421edbd2",
	);
});

test("long strings", async () => {
	const SIZE = 5 * 1024 * 1024;
	const chunk = "012345678\x09";
	const str = new Array(Math.floor(SIZE / chunk.length)).fill(chunk).join("");
	expect(await sha256(str)).toBe(
		"94475468d740ad2b5795f5daebed8f5e45333b7b95bf5449a5a1bd42e3cb13fe",
	);
});

test("long buffers", async () => {
	const SIZE = 5 * 1024 * 1024;
	const buf = Buffer.alloc(SIZE);
	buf.fill("\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF");
	expect(await sha256(buf)).toBe(
		"58d45217f7307541ae6d450d03cd0eb11979bdcd9d535584f1299c99139c1479",
	);
});

test("chunked", async () => {
	const hash = await createSHA256();
	expect(hash.digest()).toBe(
		"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
	);
	hash.init();
	hash.update("a");
	hash.update(new Uint8Array([0]));
	hash.update("bc");
	hash.update(new Uint8Array([255, 254]));
	expect(hash.digest()).toBe(
		"2bd2a9ab533c878c5a65f856fe5edec0a39a3a69b49f8b894801d131c5689549",
	);

	hash.init();
	for (let i = 0; i < 1000; i++) {
		hash.update(new Uint8Array([i & 0xff]));
	}
	hash.update(Buffer.alloc(1000).fill(0xdf));
	expect(hash.digest()).toBe(
		"e72a898bdef5fb3dc47a483834ec8f60fced4fd07efc03b98a7fa70388919101",
	);
});

test("chunked increasing length", async () => {
	const hash = await createSHA256();
	const test = async (maxLen: number) => {
		const chunks = getVariableLengthChunks(maxLen);
		const flatchunks = chunks.reduce((acc, val) => acc.concat(val), []);
		const hashRef = await sha256(new Uint8Array(flatchunks));
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
	const [hashA, hashB] = await Promise.all([sha256("a"), sha256("abc")]);
	expect(hashA).toBe(
		"ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
	);
	expect(hashB).toBe(
		"ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
	);
});

test("interlaced create", async () => {
	const hashA = await createSHA256();
	hashA.update("a");
	const hashB = await createSHA256();
	hashB.update("abc");
	expect(hashA.digest()).toBe(
		"ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
	);
	expect(hashB.digest()).toBe(
		"ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
	);
});

test("Invalid inputs throw", async () => {
	const invalidInputs = [0, 1, Number(1), {}, [], null, undefined];
	const hash = await createSHA256();

	for (const input of invalidInputs) {
		await expect(sha256(input as any)).rejects.toThrow();
		expect(() => hash.update(input as any)).toThrow();
	}
});
