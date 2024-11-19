import { blake2s, createBLAKE2s } from "../lib";
/* global test, expect */

test("simple keys", async () => {
	expect(await blake2s("", 256, "")).toBe(
		"69217a3079908094e11121d042354a7c1f55b6482ca1a51e1b250dfd1ed0eef9",
	);
	expect(await blake2s("", 256, "this is the password")).toBe(
		"39bc6c308f16fdc2cba393f0a50b63182fd60af27df426b5810aa847a8f08654",
	);
	expect(await blake2s("", 256, "this is the password123")).toBe(
		"4f9ed939a9581ae3cca3b853475b40614b77d63c8149d0e2740adb15a65ea8a3",
	);
	expect(await blake2s("a", 256, "this is the password")).toBe(
		"1f0c1c3b738785fc10fcc5923c8db5e7a055d148c217117c538f228444d771b1",
	);
	expect(await blake2s("abc", 256, "this is the password")).toBe(
		"78c88dbc7a1bb3e8916a4ed8c6414dfe93080fcb7d6a51f0f9349c6bbe691228",
	);

	const hash = await createBLAKE2s(256, "this is the password");
	hash.update("a");
	expect(hash.digest()).toBe(
		"1f0c1c3b738785fc10fcc5923c8db5e7a055d148c217117c538f228444d771b1",
	);
});

test("unicode keys", async () => {
	expect(await blake2s("a", 128, "😊")).toBe(
		"6ff855c10085ac5f0079816a24129ce3",
	);
	expect(await blake2s("😊a😊", 128, "😊a😊")).toBe(
		"3802680002ebd909710d426144751b89",
	);
	expect(await blake2s("a", 256, "😊")).toBe(
		"31de2ca01f34bbd658c860a872ed18aaebf060487699251f7a6b3cf1c848a0b9",
	);
	expect(await blake2s("😊a😊", 256, "😊a😊")).toBe(
		"e0725514192fdd314e45938880050210e043121dd0f40c776402be41dea298c7",
	);
});

test("Node.js buffers", async () => {
	expect(await blake2s("a", 256, Buffer.from([]))).toBe(
		"4a0d129873403037c2cd9b9048203687f6233fb6738956e0349bd4320fec3e90",
	);
	expect(await blake2s("a", 256, Buffer.from(["a".charCodeAt(0)]))).toBe(
		"54b9a8e6f5e77ea2f0311c9779a573fc29bcb87c1d1d7baabf1db1759276af28",
	);
	const key = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3, 4, 5, 6, 7]);
	expect(await blake2s("a", 256, key)).toBe(
		"4e3fff325a9a7e2d485a7eb7caa51e503053e7b3d1a66acb2b01b30fb4141ccc",
	);
});

test("typed arrays", async () => {
	const key = Buffer.from([
		0, 1, 2, 3, 4, 255, 254, 7, 0, 1, 254, 3, 4, 255, 0, 7,
	]);
	expect(await blake2s("a", 256, Buffer.from(key))).toBe(
		"374b348674927f04919c6b4db23e3f1a85066298cea171dec91584f6474ddeff",
	);
	const uint8 = new Uint8Array(key);
	expect(await blake2s("a", 256, uint8)).toBe(
		"374b348674927f04919c6b4db23e3f1a85066298cea171dec91584f6474ddeff",
	);
	expect(await blake2s("a", 256, new Uint16Array(uint8.buffer))).toBe(
		"374b348674927f04919c6b4db23e3f1a85066298cea171dec91584f6474ddeff",
	);
	expect(await blake2s("a", 256, new Uint32Array(uint8.buffer))).toBe(
		"374b348674927f04919c6b4db23e3f1a85066298cea171dec91584f6474ddeff",
	);
});

test("long syntax", async () => {
	const hash = await createBLAKE2s(256, "this is the password");
	hash.update("a");
	expect(hash.digest()).toBe(
		"1f0c1c3b738785fc10fcc5923c8db5e7a055d148c217117c538f228444d771b1",
	);
	hash.init();
	expect(hash.digest()).toBe(
		"39bc6c308f16fdc2cba393f0a50b63182fd60af27df426b5810aa847a8f08654",
	);
	hash.init();
	hash.update("a");
	hash.update("b");
	hash.update("c");
	expect(hash.digest()).toBe(
		"78c88dbc7a1bb3e8916a4ed8c6414dfe93080fcb7d6a51f0f9349c6bbe691228",
	);
});

test("Invalid keys throw", async () => {
	const invalidKeys = [0, 1, Number(1), {}, []];

	for (const key of invalidKeys) {
		await expect(() => blake2s("a", 256, key as any)).toThrow();
		await expect(() => createBLAKE2s(256, key as any)).toThrow();
	}
});

test("Too long keys reject", async () => {
	const invalidKeys = [
		new Array(33).fill("x").join(""),
		Buffer.alloc(33),
		new Uint8Array(33),
		new Uint32Array(17),
		new Array(17).fill("😊").join(""),
	];

	for (const key of invalidKeys) {
		await expect(() => blake2s("a", 256, key as any)).rejects.toThrow();
		await expect(() => createBLAKE2s(256, key as any)).rejects.toThrow();
	}
});

test("small digest size", async () => {
	expect(await blake2s("abc", 8, "123")).toBe("a0");
	expect(await blake2s("abc", 16, "1")).toBe("ae47");
	expect(await blake2s("abc", 24, "123")).toBe("de6c36");
	expect(await blake2s("", 32, "123")).toBe("5073461e");
});
