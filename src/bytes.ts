import bs58 from 'bs58';
import { BaseSerializer } from './_base';
import { varuint } from './varuint';

export enum BytesEncoding {
  UTF8 = 'utf8',
  HEX = 'hex',
  BASE64 = 'base64',
  BASE58 = 'base58',
}

type Base = Buffer;
type Input = Buffer | Uint8Array | string;
type Output = string;

export class BytesSerializer extends BaseSerializer<Base, Input, Output> {
  constructor(public readonly encoding: BytesEncoding) {
    super();
  }

  public genOp(input: Input): BaseSerializer.Op {
    const buffer = this._toBase(input);
    const sizeOp = varuint.genOp(buffer.length);
    return {
      length: sizeOp.length + buffer.length,
      fn: (outBuffer, offset) => {
        sizeOp.fn(outBuffer, offset);
        buffer.copy(outBuffer, offset + sizeOp.length);
      },
    };
  }

  public read(buffer: Buffer, offset: number): { res: Base; cursor: number } {
    const { res: size, cursor: newCursor } = varuint.read(buffer, offset);
    return this.readWithSize(buffer, newCursor, Number(size));
  }

  public toJSON(input: Input): Output {
    const buffer = this._toBase(input);
    return this.encode(buffer);
  }

  public fromJSON(output: Output): Base {
    return this.decode(output);
  }

  protected readWithSize(buffer: Buffer, offset: number, size: number): { res: Base; cursor: number } {
    const slice = buffer.subarray(offset, offset + size);
    if (slice.length !== size) throw new Error(`bytes: invalid size, expected ${size}, got ${slice.length}`);
    return { res: slice, cursor: offset + size };
  }

  protected _toBase(input: Input): Base {
    if (Buffer.isBuffer(input)) return input;
    if (input instanceof Uint8Array) return Buffer.from(input);
    return this.decode(input);
  }

  protected decode(input: string): Buffer {
    switch (this.encoding) {
      case BytesEncoding.UTF8:
      case BytesEncoding.BASE64:
        return Buffer.from(input, this.encoding);
      case BytesEncoding.HEX:
        if (!/^0x([0-9a-fA-F]{2})*$/.test(input)) throw new Error(`bytes: invalid hex string ${input}`);
        return Buffer.from(input.slice(2), 'hex');
      case BytesEncoding.BASE58:
        return Buffer.from(bs58.decode(input));
      default:
        throw new Error(`bytes: unknown encoding ${this.encoding}`);
    }
  }

  protected encode(buffer: Buffer): string {
    switch (this.encoding) {
      case BytesEncoding.UTF8:
      case BytesEncoding.BASE64:
        return buffer.toString(this.encoding);
      case BytesEncoding.HEX:
        return `0x${buffer.toString('hex')}`;
      case BytesEncoding.BASE58:
        return bs58.encode(buffer);
      default:
        throw new Error(`bytes: unknown encoding ${this.encoding}`);
    }
  }
}

export class FixedBytesSerializer extends BytesSerializer {
  constructor(
    public readonly size: number,
    encoding: BytesEncoding = BytesEncoding.HEX,
  ) {
    if (size <= 0 || !Number.isSafeInteger(size)) throw new Error('FixedBytesSerializer: invalid size');
    super(encoding);
  }

  public override genOp(input: Input): BaseSerializer.Op {
    const buffer = this._toBase(input);
    if (buffer.length !== this.size)
      throw new Error(`bytes: invalid size, expected ${this.size}, got ${buffer.length}`);
    return {
      length: this.size,
      fn: (outBuffer, offset) => {
        buffer.copy(outBuffer, offset);
      },
    };
  }

  public override read(buffer: Buffer, offset: number): { res: Base; cursor: number } {
    return this.readWithSize(buffer, offset, this.size);
  }

  public override toJSON(input: Input): Output {
    const buffer = this._toBase(input);
    if (buffer.length !== this.size)
      throw new Error(`bytes: invalid size, expected ${this.size}, got ${buffer.length}`);
    return this.encode(buffer);
  }

  public override fromJSON(output: Output): Base {
    const buffer = this.decode(output);
    if (buffer.length !== this.size)
      throw new Error(`bytes: invalid size, expected ${this.size}, got ${buffer.length}`);
    return buffer;
  }
}

export const bytes = (encoding: BytesEncoding | { size: number; encoding: BytesEncoding } = BytesEncoding.HEX) =>
  typeof encoding === 'object'
    ? new FixedBytesSerializer(encoding.size, encoding.encoding)
    : new BytesSerializer(encoding);

const utf8 = bytes(BytesEncoding.UTF8);

export class StringSerializer extends BaseSerializer<string, string, string> {
  public genOp(input: string): BaseSerializer.Op {
    return utf8.genOp(input);
  }

  public read(buffer: Buffer, offset: number): { res: string; cursor: number } {
    const { res, cursor } = utf8.read(buffer, offset);
    return { res: res.toString('utf8'), cursor };
  }

  public toJSON(input: string): string {
    return input;
  }

  public fromJSON(output: string): string {
    return output;
  }
}

export const string = new StringSerializer();
