import { BaseSerializer } from './_base';

type Base = number;
type Input = number | string | bigint;
type Output = number;

export class UIntSerializer extends BaseSerializer<Base, Input, Output> {
  private readonly _maxValue;
  public get maxValue(): number {
    return this._maxValue;
  }

  constructor(public readonly bytesCount: number) {
    super();
    if (!Number.isSafeInteger(bytesCount)) throw new Error('Bytes count is not integer');
    if (bytesCount <= 0) throw new Error('Bytes count is not positive');
    this._checkBytesCountOverflow(bytesCount);
    this._maxValue = 2 ** (bytesCount * 8) - 1;
  }

  public genOp(input: Input): BaseSerializer.Op {
    input = this._toBase(input);
    return this._genOp(input);
  }

  public read(buffer: Buffer, offset: number): { res: Base; cursor: number } {
    if (buffer.length - offset < this.bytesCount) throw new Error('Unexpected end of buffer');
    let result = 0;
    const newOffset = offset + this.bytesCount;
    for (let cursor = offset; cursor < newOffset; cursor++) {
      result = result * 256 + buffer[cursor];
    }
    return { res: result, cursor: newOffset };
  }

  public toJSON(input: Input): Output {
    return this._toBase(input);
  }

  public fromJSON(output: Output): Base {
    return this._toBase(output);
  }

  protected _checkBytesCountOverflow(bytesCount: number): void {
    if (bytesCount > 6) throw new Error('Bytes count is too large for uint_t. Use big_uint_t or safe_uint_t instead');
  }

  protected _genOp(input: number): BaseSerializer.Op {
    return {
      length: this.bytesCount,
      fn: (buffer, offset) => {
        for (let i = offset + this.bytesCount - 1; i >= offset; i--) {
          buffer[i] = input & 0xff;
          input = Math.floor(input / 256);
        }
      },
    };
  }

  private _toBase(input: Input): Base {
    input = Number(input);
    if (!Number.isSafeInteger(input)) throw new Error('Input is not a safe integer');
    if (input < 0) throw new Error('Input is negative');
    if (input > this._maxValue) throw new Error('Input overflow');
    return input;
  }
}

export const uint_t = (bytesCount: number): UIntSerializer => new UIntSerializer(bytesCount);
export const uint8 = uint_t(1);
export const uint16 = uint_t(2);
export const uint24 = uint_t(3);
export const uint32 = uint_t(4);
export const uint40 = uint_t(5);
export const uint48 = uint_t(6);
