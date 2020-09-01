import BigNumber from "bignumber.js";
import ISerializer from "./ISerializer";
import varuint from "./varuint";

type Input = BigNumber | number | string;
type JSON = number | string;

export class UFixed extends ISerializer<BigNumber, Input, JSON> {
  public readonly maxSafe: number;
  constructor(public readonly decimalPlaces: number, public readonly round: boolean = true) {
    super();
    if (!Number.isSafeInteger(decimalPlaces) || decimalPlaces < 0 || decimalPlaces > 15) {
      throw new Error("invalid decimal places");
    }
    const decimalBitsCount = Math.ceil(Math.log2(+`1e${decimalPlaces}`));
    const safeIntegerBitsCount = 53 - decimalBitsCount;
    this.maxSafe = 2 ** safeIntegerBitsCount;
  }
  toJSON(value: Input): JSON {
    if (typeof value !== "object") {
      if (typeof value === "number" && value > this.maxSafe) {
        throw new Error("loss of accuracy");
      }
      value = new BigNumber(value);
    }
    this.validateBN(value);
    return value.gt(this.maxSafe) ? value.toFixed(this.decimalPlaces) : value.toNumber();
  }
  fromJSON(value: JSON): BigNumber {
    const result = new BigNumber(value);
    this.validateBN(result);
    return result;
  }
  toBuffer(value: Input): Buffer {
    let bn = typeof value === 'string' || typeof value === 'number' ? new BigNumber(value) : value;
    this.validateBN(bn);
    bn = bn.times(`1e${this.decimalPlaces}`);
    return varuint.toBuffer(bn.decimalPlaces(0));
  }
  readFromBuffer(buffer: Buffer, offset: number = 0): { res: BigNumber, newOffset: number } {
    const { res: uint, newOffset } = varuint.readFromBuffer(buffer, offset);
    const res = uint.div(`1e${this.decimalPlaces}`);
    this.validateBN(res);
    return { res, newOffset };
  }
  private validateBN(value: BigNumber) {
    if (!(value instanceof BigNumber)) throw new Error('invalid value type');
    if (!value.isFinite()) throw new Error("value is not finite");
    if (value.lt(0)) throw new Error('value is negative');
    if (!this.round && value.decimalPlaces() > this.decimalPlaces) throw new Error('too many decimal places');
  }
}

export function ufixed(decimalPlaces: number, round?: boolean) { return new UFixed(decimalPlaces, round); }
export default ufixed;
