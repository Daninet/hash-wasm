import wasmJson from "../wasm/crc32.wasm.json";
import {
	type IHasher,
	type IWASMInterface,
	WASMInterface,
} from "./WASMInterface";
import lockedCreate from "./lockedCreate";
import Mutex from "./mutex";
import type { IDataType } from "./util";

const mutex = new Mutex();
let wasmCache: IWASMInterface = null;

/**
 * Calculates CRC-32C hash
 * @param data Input data (string, Buffer or TypedArray)
 * @returns Computed hash as a hexadecimal string
 */
export function crc32c(data: IDataType): Promise<string> {
	if (wasmCache === null) {
		return lockedCreate(mutex, wasmJson, 4).then((wasm) => {
			wasmCache = wasm;
			return wasmCache.calculate(data, 0x82f63b78);
		});
	}

	try {
		const hash = wasmCache.calculate(data, 0x82f63b78);
		return Promise.resolve(hash);
	} catch (err) {
		return Promise.reject(err);
	}
}

/**
 * Creates a new CRC-32C hash instance
 */
export function createCRC32C(): Promise<IHasher> {
	return WASMInterface(wasmJson, 4).then((wasm) => {
		wasm.init(0x82f63b78);
		const obj: IHasher = {
			init: () => {
				wasm.init(0x82f63b78);
				return obj;
			},
			update: (data) => {
				wasm.update(data);
				return obj;
			},
			// biome-ignore lint/suspicious/noExplicitAny: Conflict with IHasher type
			digest: (outputType) => wasm.digest(outputType) as any,
			save: () => wasm.save(),
			load: (data) => {
				wasm.load(data);
				return obj;
			},
			blockSize: 4,
			digestSize: 4,
		};
		return obj;
	});
}
