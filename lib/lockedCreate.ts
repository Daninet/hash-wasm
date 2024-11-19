import type Mutex from "./mutex";
import { WASMInterface, type IWASMInterface } from "./WASMInterface";

export default async function lockedCreate(
	mutex: Mutex,
	binary: any,
	hashLength: number,
): Promise<IWASMInterface> {
	const unlock = await mutex.lock();
	const wasm = await WASMInterface(binary, hashLength);
	unlock();
	return wasm;
}
