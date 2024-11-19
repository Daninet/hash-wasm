import { blake3, createBLAKE3 } from "../lib";
/* global test, expect */

const KEY = Buffer.alloc(32);
for (let i = 0; i < 32; i++) {
	KEY[i] = i;
}
const KEY_ZERO = Buffer.alloc(32);

test("simple keys", async () => {
	expect(await blake3("", 256, KEY)).toBe(
		"73492b19995d71cdb1e9d74decc09809eb732f1b00bc95c27cb15f9dd4d6478f",
	);
	expect(await blake3("", 256, KEY_ZERO)).toBe(
		"a7f91ced0533c12cd59706f2dc38c2a8c39c007ae89ab6492698778c8684c483",
	);
	expect(await blake3("a", 256, KEY)).toBe(
		"538b8f2a2b1a04a5d427e97de10674bb33364a790dc6452700a72cdcd695299d",
	);
	expect(await blake3("abc", 256, KEY)).toBe(
		"6da54495d8152f2bcba87bd7282df70901cdb66b4448ed5f4c7bd2852b8b5532",
	);

	const hash = await createBLAKE3(256, KEY);
	hash.update("a");
	expect(hash.digest()).toBe(
		"538b8f2a2b1a04a5d427e97de10674bb33364a790dc6452700a72cdcd695299d",
	);
});

test("unicode keys", async () => {
	expect(await blake3("a", 128, "01234567890123456789012345678912")).toBe(
		"d67ca39b701518f364e498ba58767017",
	);
	expect(await blake3("😊a😊", 128, "01234567890123456789012345678912")).toBe(
		"5ab945d5dc0fea9e51f19c859ef2c5ec",
	);
	expect(await blake3("a", 256, "01234567890123456789012345678912")).toBe(
		"d67ca39b701518f364e498ba58767017bc76802077ec51ec59c816ee4eac035f",
	);
	expect(await blake3("😊a😊", 256, "01234567890123456789012345678912")).toBe(
		"5ab945d5dc0fea9e51f19c859ef2c5ec51f18e0463fe18486a27be63fc800d33",
	);
});

test("Node.js buffers", async () => {
	const key = Buffer.alloc(32);
	key.fill(0x61);
	expect(await blake3("a", 256, key)).toBe(
		"bc131823d32e505633c1707a18caf789f4a2f39cc86f339d2f7b19e92a14bcf3",
	);
});

test("typed arrays", async () => {
	const key = Buffer.alloc(32);
	key.fill(0x61);
	const uint8 = new Uint8Array(key);
	expect(await blake3("a", 256, uint8)).toBe(
		"bc131823d32e505633c1707a18caf789f4a2f39cc86f339d2f7b19e92a14bcf3",
	);
	expect(await blake3("a", 256, new Uint16Array(uint8.buffer))).toBe(
		"bc131823d32e505633c1707a18caf789f4a2f39cc86f339d2f7b19e92a14bcf3",
	);
	expect(await blake3("a", 256, new Uint32Array(uint8.buffer))).toBe(
		"bc131823d32e505633c1707a18caf789f4a2f39cc86f339d2f7b19e92a14bcf3",
	);
});

test("long syntax", async () => {
	const hash = await createBLAKE3(256, KEY);
	hash.update("a");
	expect(hash.digest()).toBe(
		"538b8f2a2b1a04a5d427e97de10674bb33364a790dc6452700a72cdcd695299d",
	);
	hash.init();
	expect(hash.digest()).toBe(
		"73492b19995d71cdb1e9d74decc09809eb732f1b00bc95c27cb15f9dd4d6478f",
	);
	hash.init();
	hash.update("a");
	hash.update("b");
	hash.update("c");
	expect(hash.digest()).toBe(
		"6da54495d8152f2bcba87bd7282df70901cdb66b4448ed5f4c7bd2852b8b5532",
	);
});

test("Invalid keys throw", async () => {
	const invalidKeys = [0, 1, Number(1), {}, []];

	for (const key of invalidKeys) {
		await expect(() => blake3("a", 256, key as any)).toThrow();
		await expect(() => createBLAKE3(256, key as any)).toThrow();
	}
});

test("Key size mismatch", async () => {
	const invalidKeys = [
		Buffer.alloc(0),
		Buffer.alloc(16),
		Buffer.alloc(31),
		Buffer.alloc(33),
		Buffer.alloc(64),
	];

	for (const key of invalidKeys) {
		await expect(() => blake3("a", 256, key as any)).rejects.toThrow();
		await expect(() => createBLAKE3(256, key as any)).rejects.toThrow();
	}
});

test("small digest size", async () => {
	expect(await blake3("abc", 8, KEY)).toBe("6d");
	expect(await blake3("abc", 16, KEY)).toBe("6da5");
	expect(await blake3("abc", 24, KEY)).toBe("6da544");
	expect(await blake3("", 32, KEY)).toBe("73492b19");
});
