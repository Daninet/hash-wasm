import fs from "node:fs";
import { createSM3, sm3 } from "../lib";
import { getVariableLengthChunks } from "./util";
/* global test, expect */

test("simple strings", async () => {
	expect(await sm3("")).toBe(
		"1ab21d8355cfa17f8e61194831e81a8f22bec8c728fefb747ed035eb5082aa2b",
	);
	expect(await sm3("a")).toBe(
		"623476ac18f65a2909e43c7fec61b49c7e764a91a18ccb82f1917a29c86c5e88",
	);
	expect(await sm3("a\x00")).toBe(
		"f4ccf00ef22555dd42706fd542022232a726a16062134c3c0ffe8fc7fa6cfe83",
	);
	expect(await sm3("abc")).toBe(
		"66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0",
	);
	expect(await sm3("message digest")).toBe(
		"c522a942e89bd80d97dd666e7a5531b36188c9817149e9b258dfe51ece98ed77",
	);
	expect(await sm3("abcdefghijklmnopqrstuvwxyz")).toBe(
		"b80fe97a4da24afc277564f66a359ef440462ad28dcc6d63adb24d5c20a61595",
	);
	expect(
		await sm3("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"),
	).toBe("2971d10c8842b70c979e55063480c50bacffd90e98e2e60d2512ab8abfdfcec5");
	expect(
		await sm3(
			"12345678901234567890123456789012345678901234567890123456789012345678901234567890",
		),
	).toBe("ad81805321f3e69d251235bf886a564844873b56dd7dde400f055b7dde39307a");
});

test("unicode strings", async () => {
	expect(await sm3("😊")).toBe(
		"21c19bf56c5fb8afa288e1bfff9d03c3f23f06c5e3fd0bd0a046fa31e83e8471",
	);
	expect(await sm3("😊a😊")).toBe(
		"ab817eccd2f002fffc6cc6d8cbf8edce82c3bb442cd821b7c427ddd535ee18f9",
	);
	const file = fs.readFileSync("./test/utf8.txt");
	expect(await sm3(file)).toBe(
		"998efa8431d8ea444f1959247c05ef41856a4be91f383650db81a83939c579b6",
	);
	expect(await sm3(file.toString())).toBe(
		"998efa8431d8ea444f1959247c05ef41856a4be91f383650db81a83939c579b6",
	);
});

test("Node.js buffers", async () => {
	expect(await sm3(Buffer.from([]))).toBe(
		"1ab21d8355cfa17f8e61194831e81a8f22bec8c728fefb747ed035eb5082aa2b",
	);
	expect(await sm3(Buffer.from(["a".charCodeAt(0)]))).toBe(
		"623476ac18f65a2909e43c7fec61b49c7e764a91a18ccb82f1917a29c86c5e88",
	);
	expect(await sm3(Buffer.from([0]))).toBe(
		"2daef60e7a0b8f5e024c81cd2ab3109f2b4f155cf83adeb2ae5532f74a157fdf",
	);
	expect(await sm3(Buffer.from([0, 1, 0, 0, 2, 0]))).toBe(
		"217ab192e745696dce43de77595a72744b530066e27c7fc01cf1bc9c103cc846",
	);
});

test("typed arrays", async () => {
	const arr = [0, 1, 2, 3, 4, 5, 255, 254];
	expect(await sm3(Buffer.from(arr))).toBe(
		"cb55c0ad85fd99ddebaea5ddadd7a1f6ed3feacc6370a95e9576f67cdfa54df6",
	);
	const uint8 = new Uint8Array(arr);
	expect(await sm3(uint8)).toBe(
		"cb55c0ad85fd99ddebaea5ddadd7a1f6ed3feacc6370a95e9576f67cdfa54df6",
	);
	expect(await sm3(new Uint16Array(uint8.buffer))).toBe(
		"cb55c0ad85fd99ddebaea5ddadd7a1f6ed3feacc6370a95e9576f67cdfa54df6",
	);
	expect(await sm3(new Uint32Array(uint8.buffer))).toBe(
		"cb55c0ad85fd99ddebaea5ddadd7a1f6ed3feacc6370a95e9576f67cdfa54df6",
	);
});

test("long strings", async () => {
	const SIZE = 5 * 1024 * 1024;
	const chunk = "012345678\x09";
	const str = new Array(Math.floor(SIZE / chunk.length)).fill(chunk).join("");
	expect(await sm3(str)).toBe(
		"4b5c71238633f17a2bf3afaa1c883debd728fef548dd721a80648ff19d5dcbed",
	);
});

test("long buffers", async () => {
	const SIZE = 5 * 1024 * 1024;
	const buf = Buffer.alloc(SIZE);
	buf.fill("\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF");
	expect(await sm3(buf)).toBe(
		"c780ed761171a868d7d84ddef6e0b64db54df8020fbb66ec02aa17c75048365e",
	);
});

test("chunked", async () => {
	const hash = await createSM3();
	expect(hash.digest()).toBe(
		"1ab21d8355cfa17f8e61194831e81a8f22bec8c728fefb747ed035eb5082aa2b",
	);
	hash.init();
	hash.update("a");
	hash.update(new Uint8Array([0]));
	hash.update("bc");
	hash.update(new Uint8Array([255, 254]));
	expect(hash.digest()).toBe(
		"2c34d42af49d1e1ea009c9ef1988f89ac2053fe875e20403f9226229ba4631a2",
	);

	hash.init();
	for (let i = 0; i < 1000; i++) {
		hash.update(new Uint8Array([i & 0xff]));
	}
	hash.update(Buffer.alloc(1000).fill(0xdf));
	expect(hash.digest()).toBe(
		"cf94e2f2eb03ea862a4b71b77aaf4659b1c9e4afb21af35b70763c9a05c03bab",
	);
});

test("chunked increasing length", async () => {
	const hash = await createSM3();
	const test = async (maxLen: number) => {
		const chunks = getVariableLengthChunks(maxLen);
		const flatchunks = chunks.reduce((acc, val) => acc.concat(val), []);
		const hashRef = await sm3(new Uint8Array(flatchunks));
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
	const [hashA, hashB] = await Promise.all([sm3("a"), sm3("abc")]);
	expect(hashA).toBe(
		"623476ac18f65a2909e43c7fec61b49c7e764a91a18ccb82f1917a29c86c5e88",
	);
	expect(hashB).toBe(
		"66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0",
	);
});

test("interlaced create", async () => {
	const hashA = await createSM3();
	hashA.update("a");
	const hashB = await createSM3();
	hashB.update("abc");
	expect(hashA.digest()).toBe(
		"623476ac18f65a2909e43c7fec61b49c7e764a91a18ccb82f1917a29c86c5e88",
	);
	expect(hashB.digest()).toBe(
		"66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0",
	);
});

test("Invalid inputs throw", async () => {
	const invalidInputs = [0, 1, Number(1), {}, [], null, undefined];
	const hash = await createSM3();

	for (const input of invalidInputs) {
		await expect(sm3(input as any)).rejects.toThrow();
		expect(() => hash.update(input as any)).toThrow();
	}
});
