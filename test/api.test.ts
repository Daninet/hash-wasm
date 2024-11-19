/* global test, expect */
import * as api from "../lib";
import type { IHasher } from "../lib/WASMInterface";

async function createAllFunctions(includeHMAC): Promise<IHasher[]> {
	const keys = Object.keys(api).filter(
		(key) => key.startsWith("create") && (includeHMAC || key !== "createHMAC"),
	);

	return Promise.all(
		keys.map((key) => {
			switch (key) {
				case "createHMAC":
					return api[key](api.createMD5(), "x");
				default:
					return api[key]();
			}
		}),
	);
}

test("IHasherApi", async () => {
	const functions: IHasher[] = await createAllFunctions(true);
	expect(functions.length).toBe(23);

	for (const fn of functions) {
		expect(fn.blockSize).toBeGreaterThan(0);
		expect(fn.digestSize).toBeGreaterThan(0);

		const startValueHex = fn.digest();
		expect(typeof startValueHex).toBe("string");
		fn.init();
		expect(fn.digest()).toBe(startValueHex);
		fn.init();
		expect(fn.digest("hex")).toBe(startValueHex);

		fn.init();
		const startValueBinary = fn.digest("binary");
		expect(ArrayBuffer.isView(startValueBinary)).toBe(true);
		expect(startValueBinary.BYTES_PER_ELEMENT).toBe(1);
		expect(startValueBinary.length).toBe(startValueHex.length / 2);
		fn.init();
		expect(fn.digest("binary")).toStrictEqual(startValueBinary);

		const arr = new Array(2000).fill(0xff).map((i) => i % 256);
		const buf = Buffer.from(arr);
		fn.init();
		fn.update(buf);
		const hash = fn.digest();

		let chain = fn.init();
		for (let i = 0; i < 2000; i++) {
			chain = chain.update(new Uint8Array([arr[i]]));
		}
		expect(chain.digest()).toBe(hash);

		expect(() => fn.digest()).toThrow();
		expect(() => fn.update("a")).toThrow();
	}
});

test("saveAndLoad", async () => {
	const aHash: string[] = (await createAllFunctions(false)).map((fn) => {
		fn.init();
		fn.update("a");
		return fn.digest();
	});
	const abcHash: string[] = (await createAllFunctions(false)).map((fn) => {
		fn.init();
		fn.update("abc");
		return fn.digest();
	});

	const functions: IHasher[] = await createAllFunctions(false);

	expect(functions.length).toBe(22);

	functions.forEach((fn, index) => {
		fn.init();
		fn.load(fn.save());
		fn.update("a");
		const saved = fn.save();
		fn.update("bc");
		expect(fn.digest()).toBe(abcHash[index]);
		fn.load(saved);
		expect(fn.digest()).toBe(aHash[index]);
		fn.load(saved);
		fn.update("bc");
		expect(fn.digest()).toBe(abcHash[index]);
		// save() shoudn't work after digest() is called
		expect(() => fn.save()).toThrow();
	});
});

test("saveAndLoad - load as init", async () => {
	// Verify that load() can be used instead of a call to init() and still give the same results
	// This checks that e.g. crc32's init_lut() gets called even if we don't call init() ourselves
	const helloWorldHashes = (await createAllFunctions(false)).map((fn) => {
		fn.init();
		fn.update("Hello world");
		return fn.digest();
	});
	expect(helloWorldHashes.length).toBe(22);
	const savedHasherStates = (await createAllFunctions(false)).map((fn) => {
		fn.update("Hello ");
		return fn.save();
	});
	(await createAllFunctions(false)).forEach((fn, index) => {
		fn.load(savedHasherStates[index]).update("world");
		expect(fn.digest()).toBe(helloWorldHashes[index]);
	});
});

test("saveAndLoad - invalid parameters", async () => {
	const functions: IHasher[] = await createAllFunctions(false);

	// Detect changes in the function hash:
	for (const fn of functions) {
		fn.init();
		expect(() => fn.load(0 as any)).toThrow();
		expect(() => fn.load({} as any)).toThrow();
		expect(() => fn.load("1234" as any)).toThrow();
		expect(() => fn.load([] as any)).toThrow();
		expect(() => fn.load(null as any)).toThrow();
		expect(() => fn.load(undefined as any)).toThrow();
		expect(() => fn.load(new ArrayBuffer(8) as any)).toThrow();
		expect(() => fn.load(new Uint8ClampedArray(8) as any)).toThrow();
		expect(() => fn.load(new Uint16Array(8) as any)).toThrow();
		expect(() => fn.load(new Int8Array(8) as any)).toThrow();
	}
});

test("saveAndLoad - incompatible states", async () => {
	const functions: IHasher[] = await createAllFunctions(false);

	// Detect changes in the function hash:
	for (const fn of functions) {
		fn.init();
		const state = fn.save();
		// Check that every byte is verified:
		for (let i = 0; i < 4; i++) {
			state[i] = 255 - state[i];
			expect(() => fn.load(state)).toThrow();
			state[i] = 255 - state[i];
		}
	}

	// Detect incompatible lengths:
	for (const fn of functions) {
		fn.init();
		let state = fn.save();
		state = state.subarray(0, state.length - 1);
		expect(() => fn.load(state)).toThrow();
	}
});
