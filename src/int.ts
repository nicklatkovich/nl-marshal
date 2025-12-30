import { BaseOf, InputOf, OutputOf } from './_base';
import { UIntSerializer } from './uint';

type Base = BaseOf<UIntSerializer>;
type Input = InputOf<UIntSerializer>;
type Output = OutputOf<UIntSerializer>;

export class IntSerializer extends UIntSerializer {
  public readonly maxSignedValue: number;
  public readonly minSignedValue: number;
  public override get maxValue(): number {
    return this.maxSignedValue;
  }

  private readonly base: number;
  private readonly maxTwosComplement: number;

  constructor(bytesCount: number) {
    super(bytesCount);
    this.base = 2 ** (bytesCount * 8 - 1);
    this.maxTwosComplement = 2 ** (bytesCount * 8) - 1;
    this.minSignedValue = -this.base;
    this.maxSignedValue = this.base - 1;
  }

  public override appendToBytes(bytes: number[], input: Input): number[] {
    return super._appendToBytes(bytes, this._toTwosComplement(input));
  }

  public override read(buffer: Buffer, offset: number): { res: Base; cursor: number } {
    const { res: twosComplement, cursor } = super.read(buffer, offset);
    return { res: this._fromTwosComplement(twosComplement), cursor };
  }

  public override toJSON(input: Input): Output {
    return this._toSignedBase(input);
  }

  public override fromJSON(output: Output): Base {
    return this._toSignedBase(output);
  }

  private _fromTwosComplement(twosComplement: number): number {
    return twosComplement <= this.maxSignedValue ? twosComplement : twosComplement - this.maxTwosComplement - 1;
  }

  private _toTwosComplement(input: Input): number {
    input = this._toSignedBase(input);
    return input >= 0 ? input : this.maxTwosComplement + input + 1;
  }

  private _toSignedBase(input: Input): number {
    input = Number(input);
    if (!Number.isSafeInteger(input)) throw new Error('Input is not a safe integer');
    if (input > this.maxSignedValue || input < this.minSignedValue) throw new Error('Input overflow');
    return input;
  }
}

export const int_t = (bytesCount: number): IntSerializer => new IntSerializer(bytesCount);
export const int8 = int_t(1);
export const int16 = int_t(2);
export const int24 = int_t(3);
export const int32 = int_t(4);
export const int40 = int_t(5);
export const int48 = int_t(6);
