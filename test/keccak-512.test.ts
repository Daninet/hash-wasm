import fs from "node:fs";
import { createKeccak, keccak } from "../lib";
import { getVariableLengthChunks } from "./util";
/* global test, expect */

test("simple strings", async () => {
	expect(await keccak("")).toBe(
		"0eab42de4c3ceb9235fc91acffe746b29c29a8c366b7c60e4e67c466f36a4304c00fa9caf9d87976ba469bcbe06713b435f091ef2769fb160cdab33d3670680e",
	);
	expect(await keccak("a")).toBe(
		"9c46dbec5d03f74352cc4a4da354b4e9796887eeb66ac292617692e765dbe400352559b16229f97b27614b51dbfbbb14613f2c10350435a8feaf53f73ba01c7c",
	);
	expect(await keccak("a\x00")).toBe(
		"50470286ea9f645134c527432303a7187a2a1451956148a1228d94b33edbf35ba9146301e43ddb84491469ccf1ca72cec501032df5e16958232a24ba90a93fb0",
	);
	expect(await keccak("abc")).toBe(
		"18587dc2ea106b9a1563e32b3312421ca164c7f1f07bc922a9c83d77cea3a1e5d0c69910739025372dc14ac9642629379540c17e2a65b19d77aa511a9d00bb96",
	);
	expect(await keccak("message digest")).toBe(
		"cccc49fa63822b00004cf6c889b28a035440ffb3ef50e790599935518e2aefb0e2f1839170797f7763a5c43b2dcf02abf579950e36358d6d04dfddc2abac7545",
	);
	expect(await keccak("abcdefghijklmnopqrstuvwxyz")).toBe(
		"e55bdca64dfe33f36ae3153c727833f9947d92958073f4dd02e38a82d8acb282b1ee1330a68252a54c6d3d27306508ca765acd45606caeaf51d6bdc459f551f1",
	);
	expect(
		await keccak(
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
		),
	).toBe(
		"d5fa6b93d54a87bbde52dbb44daf96a3455daef9d60cdb922bc4b72a5bbba97c5bf8c59816fede302fc64e98ce1b864df7be671c968e43d1bae23ad76a3e702d",
	);
	expect(
		await keccak(
			"12345678901234567890123456789012345678901234567890123456789012345678901234567890",
		),
	).toBe(
		"bc08a9a245e99f62753166a3226e874896de0914565bee0f8be29d678e0da66c508cc9948e8ad7be78eaa4edced482253f8ab2e6768c9c8f2a2f0afff083d51c",
	);
});

test("unicode strings", async () => {
	expect(await keccak("😊")).toBe(
		"55d85444f3810b1dbf1def79b9283db45556105707e02ed6d4537f11ab53b2780884e3e7bd432804cd6a2b5ebd83dde8edfee7ca65a236354476ac500ed9f664",
	);
	expect(await keccak("😊a😊")).toBe(
		"be1b04d83ee75eb7d73d17d08624b582dda94cdebf82588eb9a0a342b0e62dea90f3fd605d460603e66084899cb2c56b3decc0cb885727d0a2f419453ef305a1",
	);
	const file = fs.readFileSync("./test/utf8.txt");
	expect(await keccak(file)).toBe(
		"0dda9aa5b010de5de2b242a862c73ee98af433e1e2b0b19fb5fe4b676903d11ccd89ed4c8ddbfddd82e2bc429892be75e10d7dfd0f1a9d3f20d1bdb2e3554e1d",
	);
	expect(await keccak(file.toString())).toBe(
		"0dda9aa5b010de5de2b242a862c73ee98af433e1e2b0b19fb5fe4b676903d11ccd89ed4c8ddbfddd82e2bc429892be75e10d7dfd0f1a9d3f20d1bdb2e3554e1d",
	);
});

test("Node.js buffers", async () => {
	expect(await keccak(Buffer.from([]))).toBe(
		"0eab42de4c3ceb9235fc91acffe746b29c29a8c366b7c60e4e67c466f36a4304c00fa9caf9d87976ba469bcbe06713b435f091ef2769fb160cdab33d3670680e",
	);
	expect(await keccak(Buffer.from(["a".charCodeAt(0)]))).toBe(
		"9c46dbec5d03f74352cc4a4da354b4e9796887eeb66ac292617692e765dbe400352559b16229f97b27614b51dbfbbb14613f2c10350435a8feaf53f73ba01c7c",
	);
	expect(await keccak(Buffer.from([0]))).toBe(
		"40f0a44b4452c44baf401b49411f861caac716ba87be7d6894757f1114fcec44a4d4a9f44bcab569fabc676e761fe9d097dd191d5d9c71d66250b3e867071553",
	);
	expect(await keccak(Buffer.from([0, 1, 0, 0, 2, 0]))).toBe(
		"e378601bfb9a6feaac128b0b83a7a2464233a01fc404ebe0385c8969e1f2e409dc6ab6584aa5cb244dcb71295944831406310798bde10665b1dcb94c6c1bdc33",
	);
});

test("typed arrays", async () => {
	const arr = [0, 1, 2, 3, 4, 5, 255, 254];
	expect(await keccak(Buffer.from(arr))).toBe(
		"f5076813402bd6c0e6392cc603f610b630d4851de18e508370a8e6a56eaee12cc5af9b272b42013fc1d11b7870dae755ae81aeb304bebecb82f1a69b323bb4ad",
	);
	const uint8 = new Uint8Array(arr);
	expect(await keccak(uint8)).toBe(
		"f5076813402bd6c0e6392cc603f610b630d4851de18e508370a8e6a56eaee12cc5af9b272b42013fc1d11b7870dae755ae81aeb304bebecb82f1a69b323bb4ad",
	);
	expect(await keccak(new Uint16Array(uint8.buffer))).toBe(
		"f5076813402bd6c0e6392cc603f610b630d4851de18e508370a8e6a56eaee12cc5af9b272b42013fc1d11b7870dae755ae81aeb304bebecb82f1a69b323bb4ad",
	);
	expect(await keccak(new Uint32Array(uint8.buffer))).toBe(
		"f5076813402bd6c0e6392cc603f610b630d4851de18e508370a8e6a56eaee12cc5af9b272b42013fc1d11b7870dae755ae81aeb304bebecb82f1a69b323bb4ad",
	);
});

test("long strings", async () => {
	const SIZE = 5 * 1024 * 1024;
	const chunk = "012345678\x09";
	const str = new Array(Math.floor(SIZE / chunk.length)).fill(chunk).join("");
	expect(await keccak(str)).toBe(
		"39b475b638d623cdbb32b1dac7523027a4ff18e45fbe553c5501380e3c6b3ad47416b54fb9f3ddd063e9e17ee27b9debe5ba2b754880a57133442a984c0b7cd7",
	);
});

test("long buffers", async () => {
	const SIZE = 5 * 1024 * 1024;
	const buf = Buffer.alloc(SIZE);
	buf.fill("\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF");
	expect(await keccak(buf)).toBe(
		"7e9ee5244865c5101d1fc2bba5b67aa099eb2abf234b84bdc89011360c3f7cc7f241a362911f54296b24e70b9427131cb21ad7ded4c44d873c323eda3ad0b06a",
	);
});

test("chunked", async () => {
	const hash = await createKeccak(512);
	expect(hash.digest()).toBe(
		"0eab42de4c3ceb9235fc91acffe746b29c29a8c366b7c60e4e67c466f36a4304c00fa9caf9d87976ba469bcbe06713b435f091ef2769fb160cdab33d3670680e",
	);
	hash.init();
	hash.update("a");
	hash.update(new Uint8Array([0]));
	hash.update("bc");
	hash.update(new Uint8Array([255, 254]));
	expect(hash.digest()).toBe(
		"c3e2d7159f8aba84f18e1a331ee7bf60e51997ebb44e800aa5fdb937784b5ab87765a348fc6cee37f53a2b111459247b2664d2ea7da1b133f9f713c9d5784275",
	);

	hash.init();
	for (let i = 0; i < 1000; i++) {
		hash.update(new Uint8Array([i & 0xff]));
	}
	hash.update(Buffer.alloc(1000).fill(0xdf));
	expect(hash.digest()).toBe(
		"02b4dc3d5ce5b3164dcca9127c6f6ec4fb2889fb058b876fc33dbf63f47404fa82147d724975a7d4ed749cbcb337f0cf14e93443a9f8aa6c91dad616eeec594c",
	);
});

test("chunked increasing length", async () => {
	const hash = await createKeccak(512);
	const test = async (maxLen: number) => {
		const chunks = getVariableLengthChunks(maxLen);
		const flatchunks = chunks.reduce((acc, val) => acc.concat(val), []);
		const hashRef = await keccak(new Uint8Array(flatchunks), 512);
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
		keccak("a", 512),
		keccak("abc", 512),
	]);
	expect(hashA).toBe(
		"9c46dbec5d03f74352cc4a4da354b4e9796887eeb66ac292617692e765dbe400352559b16229f97b27614b51dbfbbb14613f2c10350435a8feaf53f73ba01c7c",
	);
	expect(hashB).toBe(
		"18587dc2ea106b9a1563e32b3312421ca164c7f1f07bc922a9c83d77cea3a1e5d0c69910739025372dc14ac9642629379540c17e2a65b19d77aa511a9d00bb96",
	);
});

test("interlaced create", async () => {
	const hashA = await createKeccak(512);
	hashA.update("a");
	const hashB = await createKeccak(512);
	hashB.update("abc");
	expect(hashA.digest()).toBe(
		"9c46dbec5d03f74352cc4a4da354b4e9796887eeb66ac292617692e765dbe400352559b16229f97b27614b51dbfbbb14613f2c10350435a8feaf53f73ba01c7c",
	);
	expect(hashB.digest()).toBe(
		"18587dc2ea106b9a1563e32b3312421ca164c7f1f07bc922a9c83d77cea3a1e5d0c69910739025372dc14ac9642629379540c17e2a65b19d77aa511a9d00bb96",
	);
});

test("Invalid inputs throw", async () => {
	const invalidInputs = [0, 1, Number(1), {}, [], null, undefined];
	const hash = await createKeccak(512);

	for (const input of invalidInputs) {
		await expect(keccak(input as any, 512)).rejects.toThrow();
		expect(() => hash.update(input as any)).toThrow();
	}
});
