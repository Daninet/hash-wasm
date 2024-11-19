import {
	WASMInterface,
	type IWASMInterface,
	type IHasher,
} from "./WASMInterface";
import Mutex from "./mutex";
import wasmJson from "../wasm/xxhash128.wasm.json";
import lockedCreate from "./lockedCreate";
import type { IDataType } from "./util";

const mutex = new Mutex();
let wasmCache: IWASMInterface = null;
const seedBuffer = new ArrayBuffer(8);

function validateSeed(seed: number) {
	if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) {
		return new Error(
			"Seed must be given as two valid 32-bit long unsigned integers (lo + high).",
		);
	}
	return null;
}

function writeSeed(arr: ArrayBuffer, low: number, high: number) {
	// write in little-endian format
	const buffer = new DataView(arr);
	buffer.setUint32(0, low, true);
	buffer.setUint32(4, high, true);
}

/**
 * Calculates xxHash128 hash
 * @param data Input data (string, Buffer or TypedArray)
 * @param seedLow Lower 32 bits of the number used to
 *  initialize the internal state of the algorithm (defaults to 0)
 * @param seedHigh Higher 32 bits of the number used to
 *  initialize the internal state of the algorithm (defaults to 0)
 * @returns Computed hash as a hexadecimal string
 */
export function xxhash128(
	data: IDataType,
	seedLow = 0,
	seedHigh = 0,
): Promise<string> {
	if (validateSeed(seedLow)) {
		return Promise.reject(validateSeed(seedLow));
	}

	if (validateSeed(seedHigh)) {
		return Promise.reject(validateSeed(seedHigh));
	}

	if (wasmCache === null) {
		return lockedCreate(mutex, wasmJson, 16).then((wasm) => {
			wasmCache = wasm;
			writeSeed(seedBuffer, seedLow, seedHigh);
			wasmCache.writeMemory(new Uint8Array(seedBuffer));
			return wasmCache.calculate(data);
		});
	}

	try {
		writeSeed(seedBuffer, seedLow, seedHigh);
		wasmCache.writeMemory(new Uint8Array(seedBuffer));
		const hash = wasmCache.calculate(data);
		return Promise.resolve(hash);
	} catch (err) {
		return Promise.reject(err);
	}
}

/**
 * Creates a new xxHash128 hash instance
 * @param seedLow Lower 32 bits of the number used to
 *  initialize the internal state of the algorithm (defaults to 0)
 * @param seedHigh Higher 32 bits of the number used to
 *  initialize the internal state of the algorithm (defaults to 0)
 */
export function createXXHash128(seedLow = 0, seedHigh = 0): Promise<IHasher> {
	if (validateSeed(seedLow)) {
		return Promise.reject(validateSeed(seedLow));
	}

	if (validateSeed(seedHigh)) {
		return Promise.reject(validateSeed(seedHigh));
	}

	return WASMInterface(wasmJson, 16).then((wasm) => {
		const instanceBuffer = new ArrayBuffer(8);
		writeSeed(instanceBuffer, seedLow, seedHigh);
		wasm.writeMemory(new Uint8Array(instanceBuffer));
		wasm.init();
		const obj: IHasher = {
			init: () => {
				wasm.writeMemory(new Uint8Array(instanceBuffer));
				wasm.init();
				return obj;
			},
			update: (data) => {
				wasm.update(data);
				return obj;
			},
			digest: (outputType) => wasm.digest(outputType) as any,
			save: () => wasm.save(),
			load: (data) => {
				wasm.load(data);
				return obj;
			},
			blockSize: 512,
			digestSize: 16,
		};
		return obj;
	});
}
