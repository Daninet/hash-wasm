import fs from "node:fs";
import { createSHA512, sha512 } from "../lib";
import { getVariableLengthChunks } from "./util";
/* global test, expect */

test("simple strings", async () => {
	expect(await sha512("")).toBe(
		"cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e",
	);
	expect(await sha512("a")).toBe(
		"1f40fc92da241694750979ee6cf582f2d5d7d28e18335de05abc54d0560e0f5302860c652bf08d560252aa5e74210546f369fbbbce8c12cfc7957b2652fe9a75",
	);
	expect(await sha512("a\x00")).toBe(
		"5c2ca3d50f46ece6066c53bd1a490cbe5f72d2738ae9417332e91e5c3f75205c639d71a9a41d67d965fa137dddf439e0ab9443a6ea44915e90d8b5b566d1c076",
	);
	expect(await sha512("abc")).toBe(
		"ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f",
	);
	expect(await sha512("message digest")).toBe(
		"107dbf389d9e9f71a3a95f6c055b9251bc5268c2be16d6c13492ea45b0199f3309e16455ab1e96118e8a905d5597b72038ddb372a89826046de66687bb420e7c",
	);
	expect(await sha512("abcdefghijklmnopqrstuvwxyz")).toBe(
		"4dbff86cc2ca1bae1e16468a05cb9881c97f1753bce3619034898faa1aabe429955a1bf8ec483d7421fe3c1646613a59ed5441fb0f321389f77f48a879c7b1f1",
	);
	expect(
		await sha512(
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
		),
	).toBe(
		"1e07be23c26a86ea37ea810c8ec7809352515a970e9253c26f536cfc7a9996c45c8370583e0a78fa4a90041d71a4ceab7423f19c71b9d5a3e01249f0bebd5894",
	);
	expect(
		await sha512(
			"12345678901234567890123456789012345678901234567890123456789012345678901234567890",
		),
	).toBe(
		"72ec1ef1124a45b047e8b7c75a932195135bb61de24ec0d1914042246e0aec3a2354e093d76f3048b456764346900cb130d2a4fd5dd16abb5e30bcb850dee843",
	);
});

test("unicode strings", async () => {
	expect(await sha512("😊")).toBe(
		"109d0e0bc64f5cff65b2d5c67d107c02fbb04d82e70743abba0fff762a3e5ccb9b7edd29b19f4c707491d2bddbd3feddc58ecc12f21a6360be400c43ecae972b",
	);
	expect(await sha512("😊a😊")).toBe(
		"66f68e3249a901ae8e3fc93f18cb891aabd1bdca556d89b4fbf66747e4d7d496f707ddbd638a742bcc1e3aeb38a8161e5a9cc73b23651ec0865a17532e101feb",
	);
	const file = fs.readFileSync("./test/utf8.txt");
	expect(await sha512(file)).toBe(
		"6b18ca1b014db2b9de312fc8ac86e78be098f4041d93c515a911e728180ca31c47fda20cd7a8a2447842fb23e2c0ef3909aca3e1e9bb93bfb031539bdab55db8",
	);
	expect(await sha512(file.toString())).toBe(
		"6b18ca1b014db2b9de312fc8ac86e78be098f4041d93c515a911e728180ca31c47fda20cd7a8a2447842fb23e2c0ef3909aca3e1e9bb93bfb031539bdab55db8",
	);
});

test("Node.js buffers", async () => {
	expect(await sha512(Buffer.from([]))).toBe(
		"cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e",
	);
	expect(await sha512(Buffer.from(["a".charCodeAt(0)]))).toBe(
		"1f40fc92da241694750979ee6cf582f2d5d7d28e18335de05abc54d0560e0f5302860c652bf08d560252aa5e74210546f369fbbbce8c12cfc7957b2652fe9a75",
	);
	expect(await sha512(Buffer.from([0]))).toBe(
		"b8244d028981d693af7b456af8efa4cad63d282e19ff14942c246e50d9351d22704a802a71c3580b6370de4ceb293c324a8423342557d4e5c38438f0e36910ee",
	);
	expect(await sha512(Buffer.from([0, 1, 0, 0, 2, 0]))).toBe(
		"339dcc7e656dcf732a505d06ee14dc65e9dcf654d03ef7adea78540d8f9d9dc9d1cfb72fcd96c8cd078927e728706b0e08c5de32e7c194c62475139703406cd9",
	);
});

test("typed arrays", async () => {
	const arr = [0, 1, 2, 3, 4, 5, 255, 254];
	expect(await sha512(Buffer.from(arr))).toBe(
		"b51180778b78c8bd963fd419ffff30f143bc6bcd7d6d33b02f541638636636fbc272e86e8fd5e671140077a0857078465deae43521474d45116e09a4e90e2faa",
	);
	const uint8 = new Uint8Array(arr);
	expect(await sha512(uint8)).toBe(
		"b51180778b78c8bd963fd419ffff30f143bc6bcd7d6d33b02f541638636636fbc272e86e8fd5e671140077a0857078465deae43521474d45116e09a4e90e2faa",
	);
	expect(await sha512(new Uint16Array(uint8.buffer))).toBe(
		"b51180778b78c8bd963fd419ffff30f143bc6bcd7d6d33b02f541638636636fbc272e86e8fd5e671140077a0857078465deae43521474d45116e09a4e90e2faa",
	);
	expect(await sha512(new Uint32Array(uint8.buffer))).toBe(
		"b51180778b78c8bd963fd419ffff30f143bc6bcd7d6d33b02f541638636636fbc272e86e8fd5e671140077a0857078465deae43521474d45116e09a4e90e2faa",
	);
});

test("long strings", async () => {
	const SIZE = 5 * 1024 * 1024;
	const chunk = "012345678\x09";
	const str = new Array(Math.floor(SIZE / chunk.length)).fill(chunk).join("");
	expect(await sha512(str)).toBe(
		"96a6bf1b8316dfd30f21d19411ed58435c9210cc9c75145d2f6ca8702f8c10bd4136abbebfabf9803db0287550b035de76e0f39c07496894bbc8e2921bd90c25",
	);
});

test("long buffers", async () => {
	const SIZE = 5 * 1024 * 1024;
	const buf = Buffer.alloc(SIZE);
	buf.fill("\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF");
	expect(await sha512(buf)).toBe(
		"519239e9f00723d3a4b9dee3f7ff0767455233a9302205978d9d7ced1d7761041fde591d5234ecf0140690daa4f44270808a735fe39fb227ef19e0fdd42f391a",
	);
});

test("chunked", async () => {
	const hash = await createSHA512();
	expect(hash.digest()).toBe(
		"cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e",
	);
	hash.init();
	hash.update("a");
	hash.update(new Uint8Array([0]));
	hash.update("bc");
	hash.update(new Uint8Array([255, 254]));
	expect(hash.digest()).toBe(
		"ba0c2f8b41866b4f225a8fc2b41bdc1cdb60f1f00149115899e2b030b5620b30e5ea70b5fab8eaacb627e08fa147b9f2e6dc72102e7176c7d93ab0301445dd13",
	);

	hash.init();
	for (let i = 0; i < 1000; i++) {
		hash.update(new Uint8Array([i & 0xff]));
	}
	hash.update(Buffer.alloc(1000).fill(0xdf));
	expect(hash.digest()).toBe(
		"82a6cd1d0f68a651ba021238ec9a255b47c2ff4fa5fea405c036b893eb6b8b3d46c1b52ad6ff69dfe60329f7a0fb569af41a72df534cb03bc3ab3b7d986808d4",
	);
});

test("chunked increasing length", async () => {
	const hash = await createSHA512();
	const test = async (maxLen: number) => {
		const chunks = getVariableLengthChunks(maxLen);
		const flatchunks = chunks.reduce((acc, val) => acc.concat(val), []);
		const hashRef = await sha512(new Uint8Array(flatchunks));
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
	const [hashA, hashB] = await Promise.all([sha512("a"), sha512("abc")]);
	expect(hashA).toBe(
		"1f40fc92da241694750979ee6cf582f2d5d7d28e18335de05abc54d0560e0f5302860c652bf08d560252aa5e74210546f369fbbbce8c12cfc7957b2652fe9a75",
	);
	expect(hashB).toBe(
		"ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f",
	);
});

test("interlaced create", async () => {
	const hashA = await createSHA512();
	hashA.update("a");
	const hashB = await createSHA512();
	hashB.update("abc");
	expect(hashA.digest()).toBe(
		"1f40fc92da241694750979ee6cf582f2d5d7d28e18335de05abc54d0560e0f5302860c652bf08d560252aa5e74210546f369fbbbce8c12cfc7957b2652fe9a75",
	);
	expect(hashB.digest()).toBe(
		"ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f",
	);
});

test("Invalid inputs throw", async () => {
	const invalidInputs = [0, 1, Number(1), {}, [], null, undefined];
	const hash = await createSHA512();

	for (const input of invalidInputs) {
		await expect(sha512(input as any)).rejects.toThrow();
		expect(() => hash.update(input as any)).toThrow();
	}
});
