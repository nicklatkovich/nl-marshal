import { InputOf, OutputOf } from "./_base";
import { BigUIntSerializer } from "./big_uint";

type Input = InputOf<BigUIntSerializer>;
type Output = OutputOf<BigUIntSerializer>;

export class BigIntSerializer extends BigUIntSerializer {
  public readonly maxSignedValue: bigint;
  public readonly minSignedValue: bigint;

  constructor(bytesCount: number) {
    super(bytesCount);
    this.minSignedValue = -(2n ** BigInt(bytesCount - 1));
    this.maxSignedValue = -this.minSignedValue - 1n;
  }

  public appendToBytes(bytes: number[], input: Input): number[] {
    return super.appendToBytes(bytes, this._toTwosComplement(input));
  }

  public read(buffer: Buffer, offset: number): { res: bigint; cursor: number; } {
    const { res: twosComplement, cursor } = super.read(buffer, offset);
    return { res: this._fromTwosComplement(twosComplement), cursor };
  }

  public toJSON(input: Input): Output {
    if (input > Number.MAX_SAFE_INTEGER) return input.toString(10);
    return Number(input);
  }

  public fromJSON(output: Output): bigint {
    return this._toSignedBase(output);
  }

  private _fromTwosComplement(base: bigint): bigint {
    if (base >= 2n ** BigInt(this.bytesCount)) throw new Error("Base overflow");
    return base <= this.maxSignedValue ? base : base - 2n ** BigInt(this.bytesCount - 1);
  }

  private _toTwosComplement(input: Input): bigint {
    input = this._toSignedBase(input);
    return input >= 0 ? input : 2n ** BigInt(this.bytesCount - 1) + input;
  }

  private _toSignedBase(input: Input): bigint {
    if (typeof input !== "bigint") input = BigInt(input);
    if (input > this.maxSignedValue || input < this.minSignedValue) throw new Error("Input overflow");
    return input;
  }
}

export const big_int_t = (bytesCount: number): BigIntSerializer => new BigIntSerializer(bytesCount);
