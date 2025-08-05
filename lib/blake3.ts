import wasmJson from "../wasm/blake3.wasm.json";
import {
	type IHasher,
	type IWASMInterface,
	WASMInterface,
} from "./WASMInterface";
import lockedCreate from "./lockedCreate";
import Mutex from "./mutex";
import { type IDataType, getUInt8Buffer } from "./util";

const mutex = new Mutex();
let wasmCache: IWASMInterface = null;

function validateBits(bits: number) {
	if (!Number.isInteger(bits) || bits < 8 || bits % 8 !== 0) {
		return new Error("Invalid variant! Valid values: 8, 16, ...");
	}
	return null;
}

/**
 * Calculates BLAKE3 hash
 * @param data Input data (string, Buffer or TypedArray)
 * @param bits Number of output bits, which has to be a number
 *             divisible by 8. Defaults to 256.
 * @param key Optional key (string, Buffer or TypedArray). Length should be 32 bytes.
 * @returns Computed hash as a hexadecimal string
 */
export function blake3(
	data: IDataType,
	bits = 256,
	key: IDataType = null,
): Promise<string> {
	if (validateBits(bits)) {
		return Promise.reject(validateBits(bits));
	}

	let keyBuffer = null;
	let initParam = 0; // key is empty by default
	if (key !== null) {
		keyBuffer = getUInt8Buffer(key);
		if (keyBuffer.length !== 32) {
			return Promise.reject(new Error("Key length must be exactly 32 bytes"));
		}
		initParam = 32;
	}

	const hashLength = bits / 8;
	const digestParam = hashLength;

	if (wasmCache === null || wasmCache.hashLength !== hashLength) {
		return lockedCreate(mutex, wasmJson, hashLength).then((wasm) => {
			wasmCache = wasm;
			if (initParam === 32) {
				wasmCache.writeMemory(keyBuffer);
			}
			return wasmCache.calculate(data, initParam, digestParam);
		});
	}

	try {
		if (initParam === 32) {
			wasmCache.writeMemory(keyBuffer);
		}
		const hash = wasmCache.calculate(data, initParam, digestParam);
		return Promise.resolve(hash);
	} catch (err) {
		return Promise.reject(err);
	}
}

/**
 * Derives new keys from the key material (NOT password!) using BLAKE3. For passwords use Argon2.
 * @param context Context string of any length.
 *                Should be hardcoded, globally unique, and application-specific.
 *                Example: `"[application] [commit timestamp] [purpose]"`
 * @param key Key material (not a password) of any length. (string, Buffer or TypedArray).
 * @param bits Number of output bits, which has to be a number
 *             divisible by 8. Defaults to 256.
 * @param outputType Type of the output ("hex" | "binary"): HEX string or binary. Default is HEX.
 * @returns Computed a derived key as a hexadecimal string
 */
export function deriveKeyBLAKE3(
	context: string,
	key: IDataType,
	bits = 256,
	outputType: "hex" | "binary" = "hex",
): Promise<Uint8Array | string> {
	if (validateBits(bits)) {
		return Promise.reject(validateBits(bits));
	}
	const hashLength = bits / 8;
	const digestParam = hashLength;

	const contextBuffer = getUInt8Buffer(context);

	if (wasmCache === null || wasmCache.hashLength !== hashLength) {
		return lockedCreate(mutex, wasmJson, hashLength).then((wasm) => {
			wasmCache = wasm;
			wasmCache.writeMemory(contextBuffer);
			return wasmCache.derive(context, key, outputType, digestParam);
		});
	}

	try {
		wasmCache.writeMemory(contextBuffer);
		const hash = wasmCache.derive(context, key, outputType, digestParam);
		return Promise.resolve(hash);
	} catch (err) {
		return Promise.reject(err);
	}
}

/**
 * Creates a new BLAKE3 hash instance
 * @param bits Number of output bits, which has to be a number
 *             divisible by 8. Defaults to 256.
 * @param key Optional key (string, Buffer or TypedArray). Length should be 32 bytes.
 */
export function createBLAKE3(
	bits = 256,
	key: IDataType = null,
): Promise<IHasher> {
	if (validateBits(bits)) {
		return Promise.reject(validateBits(bits));
	}

	let keyBuffer = null;
	let initParam = 0; // key is empty by default
	if (key !== null) {
		keyBuffer = getUInt8Buffer(key);
		if (keyBuffer.length !== 32) {
			return Promise.reject(new Error("Key length must be exactly 32 bytes"));
		}
		initParam = 32;
	}

	const outputSize = bits / 8;
	const digestParam = outputSize;

	return WASMInterface(wasmJson, outputSize).then((wasm) => {
		if (initParam === 32) {
			wasm.writeMemory(keyBuffer);
		}
		wasm.init(initParam);

		const obj: IHasher = {
			init:
				initParam === 32
					? () => {
							wasm.writeMemory(keyBuffer);
							wasm.init(initParam);
							return obj;
						}
					: () => {
							wasm.init(initParam);
							return obj;
						},
			update: (data) => {
				wasm.update(data);
				return obj;
			},
			// biome-ignore lint/suspicious/noExplicitAny: Conflict with IHasher type
			digest: (outputType) => wasm.digest(outputType, digestParam) as any,
			save: () => wasm.save(),
			load: (data) => {
				wasm.load(data);
				return obj;
			},
			blockSize: 64,
			digestSize: outputSize,
		};
		return obj;
	});
}
