import fs from "node:fs";
import { createSHA384, sha384 } from "../lib";
import { getVariableLengthChunks } from "./util";
/* global test, expect */

test("simple strings", async () => {
	expect(await sha384("")).toBe(
		"38b060a751ac96384cd9327eb1b1e36a21fdb71114be07434c0cc7bf63f6e1da274edebfe76f65fbd51ad2f14898b95b",
	);
	expect(await sha384("a")).toBe(
		"54a59b9f22b0b80880d8427e548b7c23abd873486e1f035dce9cd697e85175033caa88e6d57bc35efae0b5afd3145f31",
	);
	expect(await sha384("a\x00")).toBe(
		"defb4711c812122ba180a2ece74cfcd86dd959451cd3bc2afb672fa8a815ccc2bee6ccc03816016570d340ec992b0f0c",
	);
	expect(await sha384("abc")).toBe(
		"cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7",
	);
	expect(await sha384("message digest")).toBe(
		"473ed35167ec1f5d8e550368a3db39be54639f828868e9454c239fc8b52e3c61dbd0d8b4de1390c256dcbb5d5fd99cd5",
	);
	expect(await sha384("abcdefghijklmnopqrstuvwxyz")).toBe(
		"feb67349df3db6f5924815d6c3dc133f091809213731fe5c7b5f4999e463479ff2877f5f2936fa63bb43784b12f3ebb4",
	);
	expect(
		await sha384(
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
		),
	).toBe(
		"1761336e3f7cbfe51deb137f026f89e01a448e3b1fafa64039c1464ee8732f11a5341a6f41e0c202294736ed64db1a84",
	);
	expect(
		await sha384(
			"12345678901234567890123456789012345678901234567890123456789012345678901234567890",
		),
	).toBe(
		"b12932b0627d1c060942f5447764155655bd4da0c9afa6dd9b9ef53129af1b8fb0195996d2de9ca0df9d821ffee67026",
	);
});

test("unicode strings", async () => {
	expect(await sha384("😊")).toBe(
		"7debb7fe0fced857ab4b080c5a9beffc222fe03dac2ccb4c50e2b1f2220c0ee1b0cf83c59307eaf638159f2dd246a9a7",
	);
	expect(await sha384("😊a😊")).toBe(
		"36fd9dd066b141a7b9a470f7939217531f78796cad8ad99d657f2f2a59d38a4e4ad2f4fbdf1d4ae559d999a66b9ce1e5",
	);
	const file = fs.readFileSync("./test/utf8.txt");
	expect(await sha384(file)).toBe(
		"fa23500da928ccf682a20edfe18917dfbb41ba1871d3a52b3684889567cf869d4e14f44e1d03d7d5b6c472fe43a19042",
	);
	expect(await sha384(file.toString())).toBe(
		"fa23500da928ccf682a20edfe18917dfbb41ba1871d3a52b3684889567cf869d4e14f44e1d03d7d5b6c472fe43a19042",
	);
});

test("Node.js buffers", async () => {
	expect(await sha384(Buffer.from([]))).toBe(
		"38b060a751ac96384cd9327eb1b1e36a21fdb71114be07434c0cc7bf63f6e1da274edebfe76f65fbd51ad2f14898b95b",
	);
	expect(await sha384(Buffer.from(["a".charCodeAt(0)]))).toBe(
		"54a59b9f22b0b80880d8427e548b7c23abd873486e1f035dce9cd697e85175033caa88e6d57bc35efae0b5afd3145f31",
	);
	expect(await sha384(Buffer.from([0]))).toBe(
		"bec021b4f368e3069134e012c2b4307083d3a9bdd206e24e5f0d86e13d6636655933ec2b413465966817a9c208a11717",
	);
	expect(await sha384(Buffer.from([0, 1, 0, 0, 2, 0]))).toBe(
		"d6d00252e23fb5b72df9b70ac699cc989c4d0594a6361ad7886e494d398519274c6b6e308e4a2a01bd1f2b78c1a99333",
	);
});

test("typed arrays", async () => {
	const arr = [0, 1, 2, 3, 4, 5, 255, 254];
	expect(await sha384(Buffer.from(arr))).toBe(
		"5a4b0527bf325d761ab23faa2311d36bbde59c79a9bbd4c76d4499c07b19d55c00adf6a96beabc3c55dc6c7f7cb0923d",
	);
	const uint8 = new Uint8Array(arr);
	expect(await sha384(uint8)).toBe(
		"5a4b0527bf325d761ab23faa2311d36bbde59c79a9bbd4c76d4499c07b19d55c00adf6a96beabc3c55dc6c7f7cb0923d",
	);
	expect(await sha384(new Uint16Array(uint8.buffer))).toBe(
		"5a4b0527bf325d761ab23faa2311d36bbde59c79a9bbd4c76d4499c07b19d55c00adf6a96beabc3c55dc6c7f7cb0923d",
	);
	expect(await sha384(new Uint32Array(uint8.buffer))).toBe(
		"5a4b0527bf325d761ab23faa2311d36bbde59c79a9bbd4c76d4499c07b19d55c00adf6a96beabc3c55dc6c7f7cb0923d",
	);
});

test("long strings", async () => {
	const SIZE = 5 * 1024 * 1024;
	const chunk = "012345678\x09";
	const str = new Array(Math.floor(SIZE / chunk.length)).fill(chunk).join("");
	expect(await sha384(str)).toBe(
		"ed934420a943b737326b65c251d17648845460bcc5152bd85ea182a49ad32ba864a140593c60b6a6f13f91505886529b",
	);
});

test("long buffers", async () => {
	const SIZE = 5 * 1024 * 1024;
	const buf = Buffer.alloc(SIZE);
	buf.fill("\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF");
	expect(await sha384(buf)).toBe(
		"7d374c6d1f6b94c92d29b44c611c9348ada51eee0971be5a4669419da76cbaffe3d8455b6fbe5d95e5ba18bfd07936fc",
	);
});

test("chunked", async () => {
	const hash = await createSHA384();
	expect(hash.digest()).toBe(
		"38b060a751ac96384cd9327eb1b1e36a21fdb71114be07434c0cc7bf63f6e1da274edebfe76f65fbd51ad2f14898b95b",
	);
	hash.init();
	hash.update("a");
	hash.update(new Uint8Array([0]));
	hash.update("bc");
	hash.update(new Uint8Array([255, 254]));
	expect(hash.digest()).toBe(
		"e4cf026ad54fca4eb9f9843bf29b5959742b8604c399e96784d4961ecdbfe114ec1e190b7ebbd9ad69f5869daa400e00",
	);

	hash.init();
	for (let i = 0; i < 1000; i++) {
		hash.update(new Uint8Array([i & 0xff]));
	}
	hash.update(Buffer.alloc(1000).fill(0xdf));
	expect(hash.digest()).toBe(
		"07cee90c913ce9854adcd16ccf9a1d1160de8794568b8b0e6969160375e06c865f1fd98ea25a7382934488fc0c06e1e2",
	);
});

test("chunked increasing length", async () => {
	const hash = await createSHA384();
	const test = async (maxLen: number) => {
		const chunks = getVariableLengthChunks(maxLen);
		const flatchunks = chunks.reduce((acc, val) => acc.concat(val), []);
		const hashRef = await sha384(new Uint8Array(flatchunks));
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
	const [hashA, hashB] = await Promise.all([sha384("a"), sha384("abc")]);
	expect(hashA).toBe(
		"54a59b9f22b0b80880d8427e548b7c23abd873486e1f035dce9cd697e85175033caa88e6d57bc35efae0b5afd3145f31",
	);
	expect(hashB).toBe(
		"cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7",
	);
});

test("interlaced create", async () => {
	const hashA = await createSHA384();
	hashA.update("a");
	const hashB = await createSHA384();
	hashB.update("abc");
	expect(hashA.digest()).toBe(
		"54a59b9f22b0b80880d8427e548b7c23abd873486e1f035dce9cd697e85175033caa88e6d57bc35efae0b5afd3145f31",
	);
	expect(hashB.digest()).toBe(
		"cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7",
	);
});

test("Invalid inputs throw", async () => {
	const invalidInputs = [0, 1, Number(1), {}, [], null, undefined];
	const hash = await createSHA384();

	for (const input of invalidInputs) {
		await expect(sha384(input as any)).rejects.toThrow();
		expect(() => hash.update(input as any)).toThrow();
	}
});
