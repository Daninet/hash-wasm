import fs from "node:fs";
import { createWhirlpool, whirlpool } from "../lib";
import { getVariableLengthChunks } from "./util";
/* global test, expect */

test("simple strings", async () => {
	expect(await whirlpool("")).toBe(
		"19fa61d75522a4669b44e39c1d2e1726c530232130d407f89afee0964997f7a73e83be698b288febcf88e3e03c4f0757ea8964e59b63d93708b138cc42a66eb3",
	);
	expect(await whirlpool("a")).toBe(
		"8aca2602792aec6f11a67206531fb7d7f0dff59413145e6973c45001d0087b42d11bc645413aeff63a42391a39145a591a92200d560195e53b478584fdae231a",
	);
	expect(await whirlpool("a\x00")).toBe(
		"3f3a6a6d213b7d669e90f1309ff1dad4a6c8d0b0568109aa35934a6586dcc5d1758b5ce644313310a1cf979c19c380b96af62bdc82bd03bafd94f65d51d43188",
	);
	expect(await whirlpool("abc")).toBe(
		"4e2448a4c6f486bb16b6562c73b4020bf3043e3a731bce721ae1b303d97e6d4c7181eebdb6c57e277d0e34957114cbd6c797fc9d95d8b582d225292076d4eef5",
	);
	expect(await whirlpool("message digest")).toBe(
		"378c84a4126e2dc6e56dcc7458377aac838d00032230f53ce1f5700c0ffb4d3b8421557659ef55c106b4b52ac5a4aaa692ed920052838f3362e86dbd37a8903e",
	);
	expect(await whirlpool("abcdefghijklmnopqrstuvwxyz")).toBe(
		"f1d754662636ffe92c82ebb9212a484a8d38631ead4238f5442ee13b8054e41b08bf2a9251c30b6a0b8aae86177ab4a6f68f673e7207865d5d9819a3dba4eb3b",
	);
	expect(
		await whirlpool(
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
		),
	).toBe(
		"dc37e008cf9ee69bf11f00ed9aba26901dd7c28cdec066cc6af42e40f82f3a1e08eba26629129d8fb7cb57211b9281a65517cc879d7b962142c65f5a7af01467",
	);
	expect(
		await whirlpool(
			"12345678901234567890123456789012345678901234567890123456789012345678901234567890",
		),
	).toBe(
		"466ef18babb0154d25b9d38a6414f5c08784372bccb204d6549c4afadb6014294d5bd8df2a6c44e538cd047b2681a51a2c60481e88c5a20b2c2a80cf3a9a083b",
	);
});

test("unicode strings", async () => {
	expect(await whirlpool("😊")).toBe(
		"fef3332812f73427401432f6b28d80a907a4e1c7db17b97a2c4e5fe231faa5074428bbfdf1282ab130c029ab32f7f5910942f8d9081f8036beb96c370a9addc0",
	);
	expect(await whirlpool("😊a😊")).toBe(
		"0b1b7d23b35b1b84b74efdb2a5d63e950dcf4751a54cbb87b073fe07904c66f63f1b484040e0092698e407aa8ff0c5b298b2fb45363cdc6b4a7bd82e5408b8d0",
	);
	const file = fs.readFileSync("./test/utf8.txt");
	expect(await whirlpool(file)).toBe(
		"25db730e9c101016d21fbf3abe0253365339c4a5d334235b65eb903350483c38f19fa4d5954916d433598a90b48dfa34ada9dada331aa902aed74fc38eea081a",
	);
	expect(await whirlpool(file.toString())).toBe(
		"25db730e9c101016d21fbf3abe0253365339c4a5d334235b65eb903350483c38f19fa4d5954916d433598a90b48dfa34ada9dada331aa902aed74fc38eea081a",
	);
});

test("Node.js buffers", async () => {
	expect(await whirlpool(Buffer.from([]))).toBe(
		"19fa61d75522a4669b44e39c1d2e1726c530232130d407f89afee0964997f7a73e83be698b288febcf88e3e03c4f0757ea8964e59b63d93708b138cc42a66eb3",
	);
	expect(await whirlpool(Buffer.from(["a".charCodeAt(0)]))).toBe(
		"8aca2602792aec6f11a67206531fb7d7f0dff59413145e6973c45001d0087b42d11bc645413aeff63a42391a39145a591a92200d560195e53b478584fdae231a",
	);
	expect(await whirlpool(Buffer.from([0]))).toBe(
		"4d9444c212955963d425a410176fccfb74161e6839692b4c11fde2ed6eb559efe0560c39a7b61d5a8bcabd6817a3135af80f342a4942ccaae745abddfb6afed0",
	);
	expect(await whirlpool(Buffer.from([0, 1, 0, 0, 2, 0]))).toBe(
		"c4bac8c91b66ed033fe693fbf9bf01269bae6a666fcb9e9e7040596863e0fcdb2893e78e371e95b9d287f72c905e1569029be33db18921f6e1858cf14e5740f2",
	);
});

test("typed arrays", async () => {
	const arr = [0, 1, 2, 3, 4, 5, 255, 254];
	expect(await whirlpool(Buffer.from(arr))).toBe(
		"390d872acb33227a9e8910913ca3a337c15ad2fc9c2dcc420a630e96e27576a57932d7072d1ec469538a9fceb829aff24ae7732c1403925d4f7bf5e074d69fcf",
	);
	const uint8 = new Uint8Array(arr);
	expect(await whirlpool(uint8)).toBe(
		"390d872acb33227a9e8910913ca3a337c15ad2fc9c2dcc420a630e96e27576a57932d7072d1ec469538a9fceb829aff24ae7732c1403925d4f7bf5e074d69fcf",
	);
	expect(await whirlpool(new Uint16Array(uint8.buffer))).toBe(
		"390d872acb33227a9e8910913ca3a337c15ad2fc9c2dcc420a630e96e27576a57932d7072d1ec469538a9fceb829aff24ae7732c1403925d4f7bf5e074d69fcf",
	);
	expect(await whirlpool(new Uint32Array(uint8.buffer))).toBe(
		"390d872acb33227a9e8910913ca3a337c15ad2fc9c2dcc420a630e96e27576a57932d7072d1ec469538a9fceb829aff24ae7732c1403925d4f7bf5e074d69fcf",
	);
});

test("long strings", async () => {
	const SIZE = 5 * 1024 * 1024;
	const chunk = "012345678\x09";
	const str = new Array(Math.floor(SIZE / chunk.length)).fill(chunk).join("");
	expect(await whirlpool(str)).toBe(
		"44c26fedc4faf1b9a8bf282cf2b15957484a78f3be5879e8c462a6275bb2473c503fc505615f9966493abfd7452ef177314a6d56c251eb67f974888d3f6e3ddf",
	);
});

test("long buffers", async () => {
	const SIZE = 5 * 1024 * 1024;
	const buf = Buffer.alloc(SIZE);
	buf.fill("\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF");
	expect(await whirlpool(buf)).toBe(
		"e34d07bb6f681e510e763994dbf5f7313c6dc8b746ccae0c65046f0d7a4849f302defbf8d66154ed49353bd22f59fa5b917406e07d9c22a6a60728d5b1e163ac",
	);
});

test("chunked", async () => {
	const hash = await createWhirlpool();
	expect(hash.digest()).toBe(
		"19fa61d75522a4669b44e39c1d2e1726c530232130d407f89afee0964997f7a73e83be698b288febcf88e3e03c4f0757ea8964e59b63d93708b138cc42a66eb3",
	);
	hash.init();
	hash.update("a");
	hash.update(new Uint8Array([0]));
	hash.update("bc");
	hash.update(new Uint8Array([255, 254]));
	expect(hash.digest()).toBe(
		"dc6ee1b640e6052c4182e5f768eb62ae58d4030d1aae2c9e59a02d280c9ffe436fe201bcd6a7f2943a0be74e0a37c5aeb9cb12c33950e5b0d715808f16a8b00b",
	);

	hash.init();
	for (let i = 0; i < 1000; i++) {
		hash.update(new Uint8Array([i & 0xff]));
	}
	hash.update(Buffer.alloc(1000).fill(0xdf));
	expect(hash.digest()).toBe(
		"5950c2014b819639adba5a3fe56168679d16a7c5a5dda57325780b9a2739ee4314a96a31346e64dfe50b15bfcb809015ef4137b58d9bb4f5460032d6248b72b6",
	);
});

test("chunked increasing length", async () => {
	const hash = await createWhirlpool();
	const test = async (maxLen: number) => {
		const chunks = getVariableLengthChunks(maxLen);
		const flatchunks = chunks.reduce((acc, val) => acc.concat(val), []);
		const hashRef = await whirlpool(new Uint8Array(flatchunks));
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
	const [hashA, hashB] = await Promise.all([whirlpool("a"), whirlpool("abc")]);
	expect(hashA).toBe(
		"8aca2602792aec6f11a67206531fb7d7f0dff59413145e6973c45001d0087b42d11bc645413aeff63a42391a39145a591a92200d560195e53b478584fdae231a",
	);
	expect(hashB).toBe(
		"4e2448a4c6f486bb16b6562c73b4020bf3043e3a731bce721ae1b303d97e6d4c7181eebdb6c57e277d0e34957114cbd6c797fc9d95d8b582d225292076d4eef5",
	);
});

test("interlaced create", async () => {
	const hashA = await createWhirlpool();
	hashA.update("a");
	const hashB = await createWhirlpool();
	hashB.update("abc");
	expect(hashA.digest()).toBe(
		"8aca2602792aec6f11a67206531fb7d7f0dff59413145e6973c45001d0087b42d11bc645413aeff63a42391a39145a591a92200d560195e53b478584fdae231a",
	);
	expect(hashB.digest()).toBe(
		"4e2448a4c6f486bb16b6562c73b4020bf3043e3a731bce721ae1b303d97e6d4c7181eebdb6c57e277d0e34957114cbd6c797fc9d95d8b582d225292076d4eef5",
	);
});

test("Invalid inputs throw", async () => {
	const invalidInputs = [0, 1, Number(1), {}, [], null, undefined];
	const hash = await createWhirlpool();

	for (const input of invalidInputs) {
		await expect(whirlpool(input as any)).rejects.toThrow();
		expect(() => hash.update(input as any)).toThrow();
	}
});
