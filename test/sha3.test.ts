import { createSHA3, sha3 } from "../lib";
/* global test, expect */

test("invalid parameters", async () => {
	await expect(sha3("", -1 as any)).rejects.toThrow();
	await expect(sha3("", "a" as any)).rejects.toThrow();
	await expect(sha3("", 223 as any)).rejects.toThrow();
	await expect(sha3("", 0 as any)).rejects.toThrow();
	await expect(sha3("", null as any)).rejects.toThrow();

	await expect(createSHA3(-1 as any)).rejects.toThrow();
	await expect(createSHA3("a" as any)).rejects.toThrow();
	await expect(createSHA3(223 as any)).rejects.toThrow();
	await expect(createSHA3(0 as any)).rejects.toThrow();
	await expect(createSHA3(null as any)).rejects.toThrow();
});

test("default value for create constructor", async () => {
	const hash = await sha3("a", 512);
	const hasher = await createSHA3();
	hasher.init();
	hasher.update("a");
	expect(hasher.digest()).toBe(hash);
});

test("it invalidates the cache when changing parameters", async () => {
	expect(await sha3("a", 224)).toBe(
		"9e86ff69557ca95f405f081269685b38e3a819b309ee942f482b6a8b",
	);
	expect(await sha3("a", 256)).toBe(
		"80084bf2fba02475726feb2cab2d8215eab14bc6bdd8bfb2c8151257032ecd8b",
	);
	expect(await sha3("a", 384)).toBe(
		"1815f774f320491b48569efec794d249eeb59aae46d22bf77dafe25c5edc28d7ea44f93ee1234aa88f61c91912a4ccd9",
	);
	expect(await sha3("a")).toBe(
		"697f2d856172cb8309d6b8b97dac4de344b549d4dee61edfb4962d8698b7fa803f4f93ff24393586e28b5b957ac3d1d369420ce53332712f997bd336d09ab02a",
	);

	let hash = await createSHA3(224);
	hash.update("a");
	expect(hash.digest()).toBe(
		"9e86ff69557ca95f405f081269685b38e3a819b309ee942f482b6a8b",
	);

	hash = await createSHA3(256);
	hash.update("a");
	expect(hash.digest()).toBe(
		"80084bf2fba02475726feb2cab2d8215eab14bc6bdd8bfb2c8151257032ecd8b",
	);

	hash = await createSHA3(384);
	hash.update("a");
	expect(hash.digest()).toBe(
		"1815f774f320491b48569efec794d249eeb59aae46d22bf77dafe25c5edc28d7ea44f93ee1234aa88f61c91912a4ccd9",
	);

	hash = await createSHA3();
	hash.update("a");
	expect(hash.digest()).toBe(
		"697f2d856172cb8309d6b8b97dac4de344b549d4dee61edfb4962d8698b7fa803f4f93ff24393586e28b5b957ac3d1d369420ce53332712f997bd336d09ab02a",
	);
});
