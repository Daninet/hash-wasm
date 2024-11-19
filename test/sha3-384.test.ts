import fs from "node:fs";
import { createSHA3, sha3 } from "../lib";
import { getVariableLengthChunks } from "./util";
/* global test, expect */

test("simple strings", async () => {
	expect(await sha3("", 384)).toBe(
		"0c63a75b845e4f7d01107d852e4c2485c51a50aaaa94fc61995e71bbee983a2ac3713831264adb47fb6bd1e058d5f004",
	);
	expect(await sha3("a", 384)).toBe(
		"1815f774f320491b48569efec794d249eeb59aae46d22bf77dafe25c5edc28d7ea44f93ee1234aa88f61c91912a4ccd9",
	);
	expect(await sha3("a\x00", 384)).toBe(
		"03f38a5f45cd7742b1529999f875d9896d73030cad2a037b5ba56271cd140c6c4f5997a033e890ecbcf72ce7d5cab512",
	);
	expect(await sha3("abc", 384)).toBe(
		"ec01498288516fc926459f58e2c6ad8df9b473cb0fc08c2596da7cf0e49be4b298d88cea927ac7f539f1edf228376d25",
	);
	expect(await sha3("message digest", 384)).toBe(
		"d9519709f44af73e2c8e291109a979de3d61dc02bf69def7fbffdfffe662751513f19ad57e17d4b93ba1e484fc1980d5",
	);
	expect(await sha3("abcdefghijklmnopqrstuvwxyz", 384)).toBe(
		"fed399d2217aaf4c717ad0c5102c15589e1c990cc2b9a5029056a7f7485888d6ab65db2370077a5cadb53fc9280d278f",
	);
	expect(
		await sha3(
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
			384,
		),
	).toBe(
		"d5b972302f5080d0830e0de7b6b2cf383665a008f4c4f386a61112652c742d20cb45aa51bd4f542fc733e2719e999291",
	);
	expect(
		await sha3(
			"12345678901234567890123456789012345678901234567890123456789012345678901234567890",
			384,
		),
	).toBe(
		"3c213a17f514638acb3bf17f109f3e24c16f9f14f085b52a2f2b81adc0db83df1a58db2ce013191b8ba72d8fae7e2a5e",
	);
});

test("unicode strings", async () => {
	expect(await sha3("😊", 384)).toBe(
		"1def2f465e2a807e4d1751bd67a031fe0ef43c8c04b62bef6e8e44c16ea4090f780793dedd24b0a28baac5e1466392b2",
	);
	expect(await sha3("😊a😊", 384)).toBe(
		"4aebb1400530fdef891f75aa5c07428a9d54a07e4beff13b1f8b88d8dc2b9d11777edbced2ff4b7a1b0ccae58ce3430f",
	);
	const file = fs.readFileSync("./test/utf8.txt");
	expect(await sha3(file, 384)).toBe(
		"862c92a4da9ac7bd897d386c58ed9e8e87c5706e23bf0719ff9f29682e495e8a3536ffcd0b8b8578fff4d4f743268765",
	);
	expect(await sha3(file.toString(), 384)).toBe(
		"862c92a4da9ac7bd897d386c58ed9e8e87c5706e23bf0719ff9f29682e495e8a3536ffcd0b8b8578fff4d4f743268765",
	);
});

test("Node.js buffers", async () => {
	expect(await sha3(Buffer.from([]), 384)).toBe(
		"0c63a75b845e4f7d01107d852e4c2485c51a50aaaa94fc61995e71bbee983a2ac3713831264adb47fb6bd1e058d5f004",
	);
	expect(await sha3(Buffer.from(["a".charCodeAt(0)]), 384)).toBe(
		"1815f774f320491b48569efec794d249eeb59aae46d22bf77dafe25c5edc28d7ea44f93ee1234aa88f61c91912a4ccd9",
	);
	expect(await sha3(Buffer.from([0]), 384)).toBe(
		"127677f8b66725bbcb7c3eae9698351ca41e0eb6d66c784bd28dcdb3b5fb12d0c8e840342db03ad1ae180b92e3504933",
	);
	expect(await sha3(Buffer.from([0, 1, 0, 0, 2, 0]), 384)).toBe(
		"95afd0fd98050c58177b4bb0914bed63d81e3db424289787bfba9aaa871ede566d5f9db54d316baf9edefdc4c3753521",
	);
});

test("typed arrays", async () => {
	const arr = [0, 1, 2, 3, 4, 5, 255, 254];
	expect(await sha3(Buffer.from(arr), 384)).toBe(
		"c68adde936799b76e22a60405b7802cc7b9affd9c06636dd6294f82420d01541646a84f222535b4c9749ea71e301c4d8",
	);
	const uint8 = new Uint8Array(arr);
	expect(await sha3(uint8, 384)).toBe(
		"c68adde936799b76e22a60405b7802cc7b9affd9c06636dd6294f82420d01541646a84f222535b4c9749ea71e301c4d8",
	);
	expect(await sha3(new Uint16Array(uint8.buffer), 384)).toBe(
		"c68adde936799b76e22a60405b7802cc7b9affd9c06636dd6294f82420d01541646a84f222535b4c9749ea71e301c4d8",
	);
	expect(await sha3(new Uint32Array(uint8.buffer), 384)).toBe(
		"c68adde936799b76e22a60405b7802cc7b9affd9c06636dd6294f82420d01541646a84f222535b4c9749ea71e301c4d8",
	);
});

test("long strings", async () => {
	const SIZE = 5 * 1024 * 1024;
	const chunk = "012345678\x09";
	const str = new Array(Math.floor(SIZE / chunk.length)).fill(chunk).join("");
	expect(await sha3(str, 384)).toBe(
		"6a7fcb6d94d64f40d80be9e60651c6c624b6a3da7c84a169774e79799394f9ee794479b2f4684c2ce7b47fa72ef5f1a9",
	);
});

test("long buffers", async () => {
	const SIZE = 5 * 1024 * 1024;
	const buf = Buffer.alloc(SIZE);
	buf.fill("\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF");
	expect(await sha3(buf, 384)).toBe(
		"c06ed93fc6432516c12a6d1563c8c32f7e36d94d30a887866ac23da4869368956235f657950355b1d09cdbd61eaff061",
	);
});

test("chunked", async () => {
	const hash = await createSHA3(384);
	expect(hash.digest()).toBe(
		"0c63a75b845e4f7d01107d852e4c2485c51a50aaaa94fc61995e71bbee983a2ac3713831264adb47fb6bd1e058d5f004",
	);
	hash.init();
	hash.update("a");
	hash.update(new Uint8Array([0]));
	hash.update("bc");
	hash.update(new Uint8Array([255, 254]));
	expect(hash.digest()).toBe(
		"c03ab673d2b2b71e9c0c2058d214f01c917aa395a2692dda987974218f0402670fe2a559a5c09e86e5733329ed22ba6f",
	);

	hash.init();
	for (let i = 0; i < 1000; i++) {
		hash.update(new Uint8Array([i & 0xff]));
	}
	hash.update(Buffer.alloc(1000).fill(0xdf));
	expect(hash.digest()).toBe(
		"b14e2bbae9edc09f503f9bf7e835a4a215567514b9d8e25a1fddba8ca045e2aa69d2ab576435cafedb5bf0a19433c1c6",
	);
});

test("chunked increasing length", async () => {
	const hash = await createSHA3(384);
	const test = async (maxLen: number) => {
		const chunks = getVariableLengthChunks(maxLen);
		const flatchunks = chunks.reduce((acc, val) => acc.concat(val), []);
		const hashRef = await sha3(new Uint8Array(flatchunks), 384);
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
	const [hashA, hashB] = await Promise.all([sha3("a", 384), sha3("abc", 384)]);
	expect(hashA).toBe(
		"1815f774f320491b48569efec794d249eeb59aae46d22bf77dafe25c5edc28d7ea44f93ee1234aa88f61c91912a4ccd9",
	);
	expect(hashB).toBe(
		"ec01498288516fc926459f58e2c6ad8df9b473cb0fc08c2596da7cf0e49be4b298d88cea927ac7f539f1edf228376d25",
	);
});

test("interlaced create", async () => {
	const hashA = await createSHA3(384);
	hashA.update("a");
	const hashB = await createSHA3(384);
	hashB.update("abc");
	expect(hashA.digest()).toBe(
		"1815f774f320491b48569efec794d249eeb59aae46d22bf77dafe25c5edc28d7ea44f93ee1234aa88f61c91912a4ccd9",
	);
	expect(hashB.digest()).toBe(
		"ec01498288516fc926459f58e2c6ad8df9b473cb0fc08c2596da7cf0e49be4b298d88cea927ac7f539f1edf228376d25",
	);
});

test("Invalid inputs throw", async () => {
	const invalidInputs = [0, 1, Number(1), {}, [], null, undefined];
	const hash = await createSHA3(384);

	for (const input of invalidInputs) {
		await expect(sha3(input as any, 384)).rejects.toThrow();
		expect(() => hash.update(input as any)).toThrow();
	}
});
