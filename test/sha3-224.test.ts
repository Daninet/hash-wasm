import fs from "node:fs";
import { createSHA3, sha3 } from "../lib";
import { getVariableLengthChunks } from "./util";
/* global test, expect */

test("simple strings", async () => {
	expect(await sha3("", 224)).toBe(
		"6b4e03423667dbb73b6e15454f0eb1abd4597f9a1b078e3f5b5a6bc7",
	);
	expect(await sha3("a", 224)).toBe(
		"9e86ff69557ca95f405f081269685b38e3a819b309ee942f482b6a8b",
	);
	expect(await sha3("a\x00", 224)).toBe(
		"853ee21e10638dd5d5a30ad979d7c0d1b91145fec39c8197637ce9d8",
	);
	expect(await sha3("abc", 224)).toBe(
		"e642824c3f8cf24ad09234ee7d3c766fc9a3a5168d0c94ad73b46fdf",
	);
	expect(await sha3("message digest", 224)).toBe(
		"18768bb4c48eb7fc88e5ddb17efcf2964abd7798a39d86a4b4a1e4c8",
	);
	expect(await sha3("abcdefghijklmnopqrstuvwxyz", 224)).toBe(
		"5cdeca81e123f87cad96b9cba999f16f6d41549608d4e0f4681b8239",
	);
	expect(
		await sha3(
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
			224,
		),
	).toBe("a67c289b8250a6f437a20137985d605589a8c163d45261b15419556e");
	expect(
		await sha3(
			"12345678901234567890123456789012345678901234567890123456789012345678901234567890",
			224,
		),
	).toBe("0526898e185869f91b3e2a76dd72a15dc6940a67c8164a044cd25cc8");
});

test("unicode strings", async () => {
	expect(await sha3("😊", 224)).toBe(
		"1f1d1b20ecb4a62dc10775b5976cf2f91260c57fe31fe11f14bba1b1",
	);
	expect(await sha3("😊a😊", 224)).toBe(
		"63fe012a056b1be5f2c2837375d78e80ba358262794da75deab856d4",
	);
	const file = fs.readFileSync("./test/utf8.txt");
	expect(await sha3(file, 224)).toBe(
		"fdaeac29d719c60460560e58525df2c99b8da561c568397d8094311c",
	);
	expect(await sha3(file.toString(), 224)).toBe(
		"fdaeac29d719c60460560e58525df2c99b8da561c568397d8094311c",
	);
});

test("Node.js buffers", async () => {
	expect(await sha3(Buffer.from([]), 224)).toBe(
		"6b4e03423667dbb73b6e15454f0eb1abd4597f9a1b078e3f5b5a6bc7",
	);
	expect(await sha3(Buffer.from(["a".charCodeAt(0)]), 224)).toBe(
		"9e86ff69557ca95f405f081269685b38e3a819b309ee942f482b6a8b",
	);
	expect(await sha3(Buffer.from([0]), 224)).toBe(
		"bdd5167212d2dc69665f5a8875ab87f23d5ce7849132f56371a19096",
	);
	expect(await sha3(Buffer.from([0, 1, 0, 0, 2, 0]), 224)).toBe(
		"577b5771f5bb163857cf5ad0b3b56af2033994a9bc987cc29d6335d0",
	);
});

test("typed arrays", async () => {
	const arr = [0, 1, 2, 3, 4, 5, 255, 254];
	expect(await sha3(Buffer.from(arr), 224)).toBe(
		"5e4891097faa893c6fb6ab4bd4a2fac13a1c71fe9031c07ce5041c98",
	);
	const uint8 = new Uint8Array(arr);
	expect(await sha3(uint8, 224)).toBe(
		"5e4891097faa893c6fb6ab4bd4a2fac13a1c71fe9031c07ce5041c98",
	);
	expect(await sha3(new Uint16Array(uint8.buffer), 224)).toBe(
		"5e4891097faa893c6fb6ab4bd4a2fac13a1c71fe9031c07ce5041c98",
	);
	expect(await sha3(new Uint32Array(uint8.buffer), 224)).toBe(
		"5e4891097faa893c6fb6ab4bd4a2fac13a1c71fe9031c07ce5041c98",
	);
});

test("long strings", async () => {
	const SIZE = 5 * 1024 * 1024;
	const chunk = "012345678\x09";
	const str = new Array(Math.floor(SIZE / chunk.length)).fill(chunk).join("");
	expect(await sha3(str, 224)).toBe(
		"25808cbbf18b3a579ac1fdcfa72cc06a7c9cf84854a6876a8db58a5c",
	);
});

test("long buffers", async () => {
	const SIZE = 5 * 1024 * 1024;
	const buf = Buffer.alloc(SIZE);
	buf.fill("\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF");
	expect(await sha3(buf, 224)).toBe(
		"7feec941280e634553f242f3ec6c92ff3c174c141b6a4578232bdb48",
	);
});

test("chunked", async () => {
	const hash = await createSHA3(224);
	expect(hash.digest()).toBe(
		"6b4e03423667dbb73b6e15454f0eb1abd4597f9a1b078e3f5b5a6bc7",
	);
	hash.init();
	hash.update("a");
	hash.update(new Uint8Array([0]));
	hash.update("bc");
	hash.update(new Uint8Array([255, 254]));
	expect(hash.digest()).toBe(
		"3f6e0bcf4c994e915de2f056769f705ee9e65e5c8be9651b85505eea",
	);

	hash.init();
	for (let i = 0; i < 1000; i++) {
		hash.update(new Uint8Array([i & 0xff]));
	}
	hash.update(Buffer.alloc(1000).fill(0xdf));
	expect(hash.digest()).toBe(
		"455e9a11b30acd6bfbd65e80bbad92f52fe65e7931da7342b9b7ac00",
	);
});

test("chunked increasing length", async () => {
	const hash = await createSHA3(224);
	const test = async (maxLen: number) => {
		const chunks = getVariableLengthChunks(maxLen);
		const flatchunks = chunks.reduce((acc, val) => acc.concat(val), []);
		const hashRef = await sha3(new Uint8Array(flatchunks), 224);
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
	const [hashA, hashB] = await Promise.all([sha3("a", 224), sha3("abc", 224)]);
	expect(hashA).toBe(
		"9e86ff69557ca95f405f081269685b38e3a819b309ee942f482b6a8b",
	);
	expect(hashB).toBe(
		"e642824c3f8cf24ad09234ee7d3c766fc9a3a5168d0c94ad73b46fdf",
	);
});

test("interlaced create", async () => {
	const hashA = await createSHA3(224);
	hashA.update("a");
	const hashB = await createSHA3(224);
	hashB.update("abc");
	expect(hashA.digest()).toBe(
		"9e86ff69557ca95f405f081269685b38e3a819b309ee942f482b6a8b",
	);
	expect(hashB.digest()).toBe(
		"e642824c3f8cf24ad09234ee7d3c766fc9a3a5168d0c94ad73b46fdf",
	);
});

test("Invalid inputs throw", async () => {
	const invalidInputs = [0, 1, Number(1), {}, [], null, undefined];
	const hash = await createSHA3(224);

	for (const input of invalidInputs) {
		await expect(sha3(input as any, 224)).rejects.toThrow();
		expect(() => hash.update(input as any)).toThrow();
	}
});
