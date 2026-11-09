import {
	type IArgon2Hasher,
	argon2Verify,
	argon2d,
	argon2i,
	argon2id,
	createArgon2,
} from "../lib";
/* global test, expect */

const variants = [
	["argon2i", argon2i],
	["argon2d", argon2d],
	["argon2id", argon2id],
] as const;

const salt = Buffer.from("000102030405060708090a0b0c0d0e0f", "hex");
const base = {
	password: "password",
	salt,
	parallelism: 1,
	iterations: 1,
	memorySize: 8,
	hashLength: 16,
};

let hasher: IArgon2Hasher;
beforeAll(async () => {
	hasher = await createArgon2();
});

test("Binary output matches the async functions", async () => {
	for (const [name, asyncFn] of variants) {
		for (const parallelism of [1, 2, 3]) {
			for (const iterations of [1, 2]) {
				for (const memorySize of [24, 64, 1024]) {
					for (const hashLength of [
						4, 16, 32, 33, 64, 65, 71, 96, 1024, 1025, 65536,
					]) {
						const options = {
							...base,
							parallelism,
							iterations,
							memorySize,
							hashLength,
							outputType: "binary" as const,
						};
						expect(
							Buffer.compare(
								hasher[name]({ ...options }),
								await asyncFn({ ...options }),
							),
						).toBe(0);
					}
				}
			}
		}
	}
}, 120000);

test("Hex and encoded output match the async functions", async () => {
	for (const [name, asyncFn] of variants) {
		for (const outputType of ["hex", "encoded"] as const) {
			const options = { ...base, secret: "secret", outputType };
			expect(hasher[name]({ ...options })).toBe(await asyncFn({ ...options }));
		}
	}
});

test("Known vectors", () => {
	expect(
		hasher.argon2id({
			...base,
			password: "",
			outputType: "hex",
		}),
	).toBe("35858230a16f87fed2b29838c1fe2df6");
	expect(
		hasher.argon2id({
			...base,
			password: new Uint8Array(0),
			hashLength: 32,
			outputType: "hex",
		}),
	).toBe("31ed41e2d73f27fdfe4eb4bec651341e58ba43477051c6fe4adad735d82ee08a");
	expect(
		hasher.argon2id({
			...base,
			salt: "somesalt123",
			iterations: 2,
			memorySize: 250000,
			outputType: "hex",
		}),
	).toBe("e4a286c82d343ab9d8f77af35c6aaf0b");
}, 30000);

test("Repeated and alternating calls on one hasher", async () => {
	const own = await createArgon2();
	const a = { ...base, outputType: "hex" as const };
	const b = {
		...base,
		iterations: 3,
		memorySize: 64,
		outputType: "hex" as const,
	};
	const expectedA = await argon2id({ ...a });
	const expectedB = await argon2d({ ...b });

	for (let i = 0; i < 3; i++) {
		expect(own.argon2id({ ...a })).toBe(expectedA);
		expect(own.argon2d({ ...b })).toBe(expectedB);
	}
});

test("Working memory growing and shrinking on one hasher", async () => {
	const own = await createArgon2();
	const sizes = [16, 8192, 8, 65536, 16];
	for (const memorySize of sizes) {
		const options = { ...base, memorySize, outputType: "hex" as const };
		expect(own.argon2id({ ...options })).toBe(await argon2id({ ...options }));
	}
}, 30000);

test("A hasher stays usable after invalid options and failed growth", async () => {
	const own = await createArgon2();
	const valid = { ...base, outputType: "hex" as const };
	const expected = await argon2id({ ...valid });

	const invalid: unknown[] = [
		undefined,
		"",
		[],
		{ ...valid, password: undefined },
		{ ...valid, salt: undefined },
		{ ...valid, salt: "short" },
		{ ...valid, iterations: 0 },
		{ ...valid, parallelism: 0 },
		{ ...valid, hashLength: 3 },
		{ ...valid, memorySize: 7 },
		{ ...valid, outputType: "x" },
		// above the module's 2 GiB maximum memory
		{ ...valid, memorySize: 3_000_000 },
	];
	for (const options of invalid) {
		expect(() => own.argon2id(options as typeof valid)).toThrow();
		expect(own.argon2id({ ...valid })).toBe(expected);
	}
}, 30000);

test("argon2Verify", async () => {
	const options = { ...base, outputType: "encoded" as const };
	for (const [name, asyncFn] of variants) {
		const encoded = await asyncFn({ ...options });
		expect(hasher.argon2Verify({ password: "password", hash: encoded })).toBe(
			true,
		);
		expect(hasher.argon2Verify({ password: "wrong", hash: encoded })).toBe(
			false,
		);
		const sync = hasher[name]({ ...options });
		expect(await argon2Verify({ password: "password", hash: sync })).toBe(true);
	}
	expect(() => hasher.argon2Verify({ password: "x", hash: "bad" })).toThrow();
});

test("Hashers are independent of each other and of async calls", async () => {
	const [one, two] = await Promise.all([createArgon2(), createArgon2()]);
	const options = { ...base, memorySize: 64, outputType: "hex" as const };
	const expected = await argon2id({ ...options });

	const inFlight = Promise.all([
		argon2id({ ...options }),
		argon2id({ ...options }),
	]);
	expect(one.argon2id({ ...options })).toBe(expected);
	expect(two.argon2id({ ...options })).toBe(expected);
	expect(await inFlight).toEqual([expected, expected]);
});

test("Binary output is a standalone copy", () => {
	const options = { ...base, outputType: "binary" as const };
	const first = hasher.argon2id({ ...options });
	const copy = first.slice();
	expect(first.buffer.byteLength).toBe(first.length);

	first.fill(0);
	expect(hasher.argon2id({ ...options })).toEqual(copy);
});

test("An options object can be reused", () => {
	const options = { ...base, password: "", outputType: "hex" as const };
	expect(hasher.argon2id(options)).toBe("35858230a16f87fed2b29838c1fe2df6");
	expect(hasher.argon2id(options)).toBe("35858230a16f87fed2b29838c1fe2df6");
});
