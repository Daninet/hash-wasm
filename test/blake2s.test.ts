import { blake2s, createBLAKE2s } from "../lib";
/* global test, expect */

test("invalid parameters", async () => {
	await expect(blake2s("", -1 as any)).rejects.toThrow();
	await expect(blake2s("", "a" as any)).rejects.toThrow();
	await expect(blake2s("", 223 as any)).rejects.toThrow();
	await expect(blake2s("", 0 as any)).rejects.toThrow();
	await expect(blake2s("", 127 as any)).rejects.toThrow();
	await expect(blake2s("", 257 as any)).rejects.toThrow();
	await expect(blake2s("", null as any)).rejects.toThrow();
	await expect(blake2s("", 512 as any)).rejects.toThrow();

	await expect(createBLAKE2s(-1 as any)).rejects.toThrow();
	await expect(createBLAKE2s("a" as any)).rejects.toThrow();
	await expect(createBLAKE2s(223 as any)).rejects.toThrow();
	await expect(createBLAKE2s(0 as any)).rejects.toThrow();
	await expect(createBLAKE2s(127 as any)).rejects.toThrow();
	await expect(createBLAKE2s(257 as any)).rejects.toThrow();
	await expect(createBLAKE2s(null as any)).rejects.toThrow();
	await expect(createBLAKE2s(512 as any)).rejects.toThrow();
});

test("default value for create constructor", async () => {
	const hash = await blake2s("a", 256);
	const hasher = await createBLAKE2s();
	hasher.init();
	hasher.update("a");
	expect(hasher.digest()).toBe(hash);
});

test("it invalidates the cache when changing parameters", async () => {
	expect(await blake2s("a", 64)).toBe("3746ba2ac42c6821");
	expect(await blake2s("a", 128)).toBe("854b9e9ba49bfd9457d4c3bf96e42523");
	expect(await blake2s("a")).toBe(
		"4a0d129873403037c2cd9b9048203687f6233fb6738956e0349bd4320fec3e90",
	);

	let hash = await createBLAKE2s(64);
	hash.update("a");
	expect(hash.digest()).toBe("3746ba2ac42c6821");

	hash = await createBLAKE2s(128);
	hash.update("a");
	expect(hash.digest()).toBe("854b9e9ba49bfd9457d4c3bf96e42523");

	hash = await createBLAKE2s();
	hash.update("a");
	expect(hash.digest()).toBe(
		"4a0d129873403037c2cd9b9048203687f6233fb6738956e0349bd4320fec3e90",
	);
});

test("small digest size", async () => {
	expect(await blake2s("abc", 8)).toBe("0d");
	expect(await blake2s("abc", 16)).toBe("d8ce");
	expect(await blake2s("abc", 24)).toBe("9d3283");
	expect(await blake2s("", 32)).toBe("36e9d246");

	let hash = await createBLAKE2s(8);
	hash.update("abc");
	expect(hash.digest()).toBe("0d");

	hash = await createBLAKE2s(16);
	hash.update("abc");
	expect(hash.digest()).toBe("d8ce");

	hash = await createBLAKE2s(24);
	hash.update("abc");
	expect(hash.digest()).toBe("9d3283");

	hash = await createBLAKE2s(32);
	hash.update("");
	expect(hash.digest()).toBe("36e9d246");
});
