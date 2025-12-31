import { BaseSerializer } from './_base';

type Base = bigint;
type Input = bigint | number | string;
type Output = number | string;

export class BigUIntSerializer extends BaseSerializer<Base, Input, Output> {
  private readonly _maxValue: bigint;
  public get maxValue(): bigint {
    return this._maxValue;
  }

  constructor(public readonly bytesCount: number) {
    super();
    if (!Number.isSafeInteger(bytesCount)) throw new Error('Bytes count is not integer');
    if (bytesCount <= 0) throw new Error('Bytes count is not positive');
    this._maxValue = (1n << BigInt(bytesCount * 8)) - 1n;
  }

  public genOp(input: Input): BaseSerializer.Op {
    input = this._toBase(input);
    return this._genOp(input);
  }

  public read(buffer: Buffer, offset: number): { res: Base; cursor: number } {
    if (buffer.length - offset < this.bytesCount) throw new Error('Unexpected end of buffer');
    let result = 0n;
    const newOffset = offset + this.bytesCount;
    for (let cursor = offset; cursor < newOffset; cursor++) {
      result = (result << 8n) + BigInt(buffer[cursor]);
    }
    return { res: result, cursor: newOffset };
  }

  public toJSON(input: Input): Output {
    input = this._toBase(input);
    if (input > Number.MAX_SAFE_INTEGER) return input.toString(10);
    return Number(input);
  }

  public fromJSON(output: Output): Base {
    return this._toBase(output);
  }

  protected _genOp(input: bigint): BaseSerializer.Op {
    return {
      length: this.bytesCount,
      fn: (buffer, offset) => {
        for (let i = offset + this.bytesCount - 1; i >= offset; i--) {
          buffer[i] = Number(input & 0xffn);
          input >>= 8n;
        }
      },
    };
  }

  private _toBase(input: Input): Base {
    input = BigInt(input);
    if (input < 0) throw new Error('Input is negative');
    if (input > this._maxValue) throw new Error('Input overflow');
    return input;
  }
}

export const big_uint_t = (bytesCount: number): BigUIntSerializer => new BigUIntSerializer(bytesCount);
export const uint64 = big_uint_t(8);
export const uint256 = big_uint_t(32);
