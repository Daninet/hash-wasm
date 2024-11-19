import crypto from "node:crypto";
import {
	createHMAC,
	createMD5,
	createSHA1,
	createSHA3,
	createSHA224,
	createSHA256,
	createSHA384,
	createSHA512,
} from "../lib";

/* global test, expect */

function getNodeHMAC(algorithm, key, data, outputType?: "hex" | "binary") {
	const hmac = crypto.createHmac(algorithm, key);
	hmac.update(data);
	if (outputType === "binary") {
		const buf = hmac.digest();
		return new Uint8Array(buf.buffer, buf.byteOffset, buf.length);
	}
	return hmac.digest("hex");
}

async function getHashWasmHMAC(algorithm, key, data) {
	const hmac = await createHMAC(algorithm, key);
	hmac.update(data);
	return hmac.digest();
}

const md5Hasher = createMD5();
const sha1Hasher = createSHA1();
const sha224Hasher = createSHA224();
const sha256Hasher = createSHA256();
const sha384Hasher = createSHA384();
const sha512Hasher = createSHA512();
const sha3224Hasher = createSHA3(224);
const sha3256Hasher = createSHA3(256);
const sha3384Hasher = createSHA3(384);
const sha3512Hasher = createSHA3(512);

async function HMACTest(key, data) {
	expect(await getHashWasmHMAC(md5Hasher, key, data)).toBe(
		getNodeHMAC("md5", key, data),
	);
	expect(await getHashWasmHMAC(sha1Hasher, key, data)).toBe(
		getNodeHMAC("sha1", key, data),
	);
	expect(await getHashWasmHMAC(sha224Hasher, key, data)).toBe(
		getNodeHMAC("sha224", key, data),
	);
	expect(await getHashWasmHMAC(sha256Hasher, key, data)).toBe(
		getNodeHMAC("sha256", key, data),
	);
	expect(await getHashWasmHMAC(sha384Hasher, key, data)).toBe(
		getNodeHMAC("sha384", key, data),
	);
	expect(await getHashWasmHMAC(sha512Hasher, key, data)).toBe(
		getNodeHMAC("sha512", key, data),
	);
	expect(await getHashWasmHMAC(sha3224Hasher, key, data)).toBe(
		getNodeHMAC("sha3-224", key, data),
	);
	expect(await getHashWasmHMAC(sha3256Hasher, key, data)).toBe(
		getNodeHMAC("sha3-256", key, data),
	);
	expect(await getHashWasmHMAC(sha3384Hasher, key, data)).toBe(
		getNodeHMAC("sha3-384", key, data),
	);
	expect(await getHashWasmHMAC(sha3512Hasher, key, data)).toBe(
		getNodeHMAC("sha3-512", key, data),
	);
}

test("invalid parameters", async () => {
	expect(() => createHMAC("" as any, "x")).toThrow();
	expect(() => createHMAC((() => "") as any, "x")).toThrow();
	const hasher = await createSHA1();
	expect(() => createHMAC(hasher as any, "x")).toThrow();
});

test("save and load should throw", async () => {
	const hmac = await createHMAC(md5Hasher, "key1");
	expect(() => hmac.save()).toThrow();
	expect(() => hmac.load(new Uint8Array([]))).toThrow();
});

test("simple test", async () => {
	await HMACTest("key", "The quick brown fox jumps over the lazy dog");
});

test("can reuse a single hasher", async () => {
	const algo = createMD5();
	let hasher = await createHMAC(algo, "key1");
	hasher.update("abc");
	expect(hasher.digest()).toBe(getNodeHMAC("md5", "key1", "abc"));
	hasher = await createHMAC(algo, "key2");
	hasher.update("xyz");
	expect(hasher.digest()).toBe(getNodeHMAC("md5", "key2", "xyz"));
});

test("no interference between parallel hashes", async () => {
	const hasher1 = await createHMAC(createMD5(), "key1");
	const hasher2 = await createHMAC(createMD5(), "key2");
	hasher1.update("a");
	hasher2.update("x");
	hasher1.update("b");
	hasher2.update("y");
	hasher1.update("c");
	hasher2.update("z");
	expect(hasher1.digest()).toBe(getNodeHMAC("md5", "key1", "abc"));
	expect(hasher2.digest()).toBe(getNodeHMAC("md5", "key2", "xyz"));
});

test("empty key", async () => {
	await HMACTest("", "abc");
	await HMACTest(Buffer.alloc(0), "abc");
	await HMACTest(new Uint8Array(0), "abc");
});

test("empty data", async () => {
	await HMACTest("key", "");
	await HMACTest("key", Buffer.alloc(0));
	await HMACTest("key", new Uint8Array(0));
});

test("empty key & data", async () => {
	await HMACTest("", "");
	await HMACTest(Buffer.alloc(0), Buffer.alloc(0));
	await HMACTest(new Uint8Array(0), new Uint8Array(0));
});

test("works with different key type", async () => {
	const key = "abc";
	await HMACTest(key, "data");
	await HMACTest(String(key), "data");
	const buf = Buffer.from(key);
	await HMACTest(buf, "data");
	await HMACTest(
		new Uint8Array(buf.buffer, buf.byteOffset, buf.length),
		"data",
	);
});

test("works with different key lengths", async () => {
	const tests = [
		0, 1, 2, 63, 64, 65, 127, 128, 129, 254, 255, 256, 257, 500, 1000, 2000,
	];
	for (const klength of tests) {
		const key = new Array(klength).fill("x").join("");
		await HMACTest(key, "data");
	}
});

test("works with different data lengths", async () => {
	const tests = [
		0, 1, 2, 63, 64, 65, 127, 128, 129, 254, 255, 256, 257, 500, 1000, 2000,
	];
	for (const klength of tests) {
		const data = new Array(klength).fill("x").join("");
		await HMACTest("key", data);
	}
});

test("HMAC can be reinitialized with short keys", async () => {
	const algo = createSHA3(512);
	const hasher = await createHMAC(algo, "key1");
	for (let i = 0; i < 100; i++) {
		const data = new Array(i).fill("x").join("");
		hasher.init();
		hasher.update(data);
		expect(hasher.digest()).toBe(getNodeHMAC("sha3-512", "key1", data));
	}
});

test("HMAC can be reinitialized with long key", async () => {
	const algo = createSHA3(512);
	const key = new Array(2000).fill("k").join("");
	const hasher = await createHMAC(algo, key);
	for (let i = 0; i < 100; i++) {
		const data = new Array(i).fill("x").join("");
		hasher.init();
		hasher.update(data);
		expect(hasher.digest()).toBe(getNodeHMAC("sha3-512", key, data));
	}
});

test("test binary output format", async () => {
	const algo = createSHA3(512);
	expect(
		ArrayBuffer.isView((await createHMAC(algo, "key")).digest("binary")),
	).toBe(true);

	expect((await createHMAC(algo, "key")).digest("binary")).toStrictEqual(
		getNodeHMAC("sha3-512", "key", "", "binary"),
	);
});
