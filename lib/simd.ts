let cached: boolean | null = null;

export function isWasmSimdSupported(): boolean {
	if (cached !== null) {
		return cached;
	}

	if (typeof WebAssembly === "undefined") {
		cached = false;
		return cached;
	}

	try {
		cached = WebAssembly.validate(
			new Uint8Array([
				0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10,
				1, 8, 0, 65, 0, 253, 15, 253, 98, 11,
			]),
		);
	} catch {
		cached = false;
	}

	return cached;
}
