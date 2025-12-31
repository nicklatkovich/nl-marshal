import { BaseOf, InputOf, OutputOf } from './_base';
import { BigUIntSerializer } from './big_uint';

type Base = BaseOf<BigUIntSerializer>;
type Input = InputOf<BigUIntSerializer>;
type Output = OutputOf<BigUIntSerializer>;

export class BigIntSerializer extends BigUIntSerializer {
  public readonly maxSignedValue: bigint;
  public readonly minSignedValue: bigint;
  public override get maxValue(): bigint {
    return this.maxSignedValue;
  }

  private readonly base: bigint;
  private readonly maxTwosComplement: bigint;

  constructor(bytesCount: number) {
    super(bytesCount);
    this.base = 1n << BigInt(bytesCount * 8 - 1);
    this.maxTwosComplement = (1n << BigInt(bytesCount * 8)) - 1n;
    this.minSignedValue = -this.base;
    this.maxSignedValue = this.base - 1n;
  }

  public override appendToBytes(bytes: number[], input: Input): number[] {
    return super._appendToBytes(bytes, this._toTwosComplement(input));
  }

  public override read(buffer: Buffer, offset: number): { res: Base; cursor: number } {
    const { res: twosComplement, cursor } = super.read(buffer, offset);
    return { res: this._fromTwosComplement(twosComplement), cursor };
  }

  public override toJSON(input: Input): Output {
    input = this._toSignedBase(input);
    if (input > Number.MAX_SAFE_INTEGER || input < Number.MIN_SAFE_INTEGER) return input.toString(10);
    return Number(input);
  }

  public override fromJSON(output: Output): Base {
    return this._toSignedBase(output);
  }

  private _fromTwosComplement(twosComplement: bigint): bigint {
    return twosComplement <= this.maxSignedValue ? twosComplement : twosComplement - this.maxTwosComplement - 1n;
  }

  private _toTwosComplement(input: Input): bigint {
    input = this._toSignedBase(input);
    return input >= 0 ? input : this.maxTwosComplement + input + 1n;
  }

  private _toSignedBase(input: Input): Base {
    if (typeof input !== 'bigint') input = BigInt(input);
    if (input > this.maxSignedValue || input < this.minSignedValue) throw new Error('Input overflow');
    return input;
  }
}

export const big_int_t = (bytesCount: number): BigIntSerializer => new BigIntSerializer(bytesCount);
export const int64 = big_int_t(8);
export const int256 = big_int_t(32);
