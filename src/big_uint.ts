import { BaseSerializer } from "./_base";

type Input = bigint | number | string;
type Output = number | string;

export class BigUIntSerializer extends BaseSerializer<bigint, Input, Output> {
  public readonly maxValue: bigint;

  constructor(public readonly bytesCount: number) {
    super();
    if (!Number.isSafeInteger(bytesCount)) throw new Error("Bytes count is not integer");
    if (bytesCount <= 0) throw new Error("Bytes count is not positive");
    this.maxValue = 2n ** BigInt(bytesCount) - 1n;
  }

  public appendToBytes(bytes: number[], input: Input): number[] {
    input = this._toBase(input);
    const serialized = new Array<number>(this.bytesCount).fill(0);
    let byteIndex = this.bytesCount - 1;
    while (input > 0) {
      serialized[byteIndex] = Number(input % 256n);
      input /= 256n;
      byteIndex--;
    }
    bytes.push(...serialized);
    return bytes;
  }

  public read(buffer: Buffer, offset: number): { res: bigint; cursor: number; } {
    if (buffer.length - offset < this.bytesCount) throw new Error("Unexpected end of buffer");
    let result = 0n;
    const newOffset = offset + this.bytesCount;
    for (let cursor = offset; cursor < newOffset; cursor++) {
      result = result * 256n + BigInt(buffer[cursor]);
    }
    return { res: result, cursor: newOffset };
  }

  public toJSON(input: Input): Output {
    input = this._toBase(input);
    if (input > Number.MAX_SAFE_INTEGER) return input.toString(10);
    return Number(input);
  }

  public fromJSON(output: Output): bigint {
    return this._toBase(output);
  }

  private _toBase(input: Input): bigint {
    if (typeof input !== "bigint") input = BigInt(input);
    if (input < 0) throw new Error("Input is negative");
    if (input > this.maxValue) throw new Error("Input overflow");
    return input;
  }
}

export const big_uint_t = (bytesCount: number): BigUIntSerializer => new BigUIntSerializer(bytesCount);
