import { InputOf, OutputOf } from './_base';
import { BigUIntSerializer } from './big_uint';

type Input = InputOf<BigUIntSerializer>;
type Output = OutputOf<BigUIntSerializer>;

export class BigIntSerializer extends BigUIntSerializer {
  public readonly maxSignedValue: bigint;
  public readonly minSignedValue: bigint;
  public override get maxValue(): bigint {
    return this.maxSignedValue;
  }

  private readonly base: bigint;

  constructor(bytesCount: number) {
    super(bytesCount);
    this.base = 2n ** BigInt(bytesCount * 8 - 1);
    this.minSignedValue = -this.base;
    this.maxSignedValue = this.base - 1n;
  }

  public appendToBytes(bytes: number[], input: Input): number[] {
    return super.appendToBytes(bytes, this._toTwosComplement(input));
  }

  public read(buffer: Buffer, offset: number): { res: bigint; cursor: number } {
    const { res: twosComplement, cursor } = super.read(buffer, offset);
    return { res: this._fromTwosComplement(twosComplement), cursor };
  }

  public toJSON(input: Input): Output {
    input = this._toSignedBase(input);
    if (input > Number.MAX_SAFE_INTEGER || input < Number.MIN_SAFE_INTEGER) return input.toString(10);
    return Number(input);
  }

  public fromJSON(output: Output): bigint {
    return this._toSignedBase(output);
  }

  private _fromTwosComplement(base: bigint): bigint {
    if (base >= 2n ** BigInt(this.bytesCount * 8)) throw new Error('Base overflow');
    return base <= this.maxSignedValue ? base : base - this.base;
  }

  private _toTwosComplement(input: Input): bigint {
    input = this._toSignedBase(input);
    return input >= 0 ? input : this.base + input;
  }

  private _toSignedBase(input: Input): bigint {
    if (typeof input !== 'bigint') input = BigInt(input);
    if (input > this.maxSignedValue || input < this.minSignedValue) throw new Error('Input overflow');
    return input;
  }
}

export const big_int_t = (bytesCount: number): BigIntSerializer => new BigIntSerializer(bytesCount);
