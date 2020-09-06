import { getDigestHex, getUInt8Buffer, IDataType } from './util';
import { WASMInterface } from './WASMInterface';
import wasmJson from '../wasm/bcrypt.wasm.json';

export interface BcryptOptions {
  password: IDataType;
  salt: IDataType;
  costFactor: number;
  version: '2a',
  outputType?: 'hex' | 'binary' | 'encoded';
}

async function bcryptInternal(options: BcryptOptions): Promise<string | Uint8Array> {
  const { costFactor, password, salt } = options;

  const bcryptInterface = await WASMInterface(wasmJson, 0);
  bcryptInterface.writeMemory(getUInt8Buffer(salt), 0);
  const passwordBuffer = getUInt8Buffer(password);
  bcryptInterface.writeMemory(passwordBuffer, 16);
  bcryptInterface.getExports().bcrypt(passwordBuffer.length, costFactor);

  const outputData = bcryptInterface
    .getMemory()
    .subarray(0, 60);

  // console.log(Buffer.from(outputData).toString());

  if (options.outputType === 'encoded') {
    return Buffer.from(outputData).toString();
  }

  if (options.outputType === 'hex') {
    const digestChars = new Uint8Array(24 * 2);
    return getDigestHex(digestChars, outputData, 24);
  }

  // return binary format
  return outputData;
}

const validateOptions = (options: BcryptOptions) => {
  if (!options || typeof options !== 'object') {
    throw new Error('Invalid options parameter. It requires an object.');
  }

  if (options.version === undefined) {
    throw new Error('Version number has to be specified');
  }

  if (options.version !== '2a') {
    throw new Error('Only $2a$ version is supported');
  }

  if (!Number.isInteger(options.costFactor) || options.costFactor < 4 || options.costFactor > 31) {
    throw new Error('Cost factor should be a number between 4 and 31');
  }

  options.password = getUInt8Buffer(options.password);
  if (options.password.length < 1) {
    throw new Error('Password should be at least 1 byte long');
  }

  if (options.password.length > 72) {
    throw new Error('Password should be at most 72 bytes long');
  }

  options.salt = getUInt8Buffer(options.salt);
  if (options.salt.length !== 16) {
    throw new Error('Salt should be 16 bytes long');
  }

  if (options.outputType === undefined) {
    options.outputType = 'hex';
  }

  if (!['hex', 'binary', 'encoded'].includes(options.outputType)) {
    throw new Error(`Insupported output type ${options.outputType}. Valid values: ['hex', 'binary', 'encoded']`);
  }
};

interface IBcryptOptionsBinary {
  outputType: 'binary';
}

type BcryptReturnType<T> =
  T extends IBcryptOptionsBinary ? Uint8Array :
  string;

export async function bcrypt<T extends BcryptOptions>(options: T): Promise<BcryptReturnType<T>> {
  validateOptions(options);

  return bcryptInternal(options) as any;
}
