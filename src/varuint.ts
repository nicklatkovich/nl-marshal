import { BaseSerializer } from './_base';

type Input = bigint | number | string;
type Output = number | string;

function _toBase(input: Input): bigint {
  if (typeof input !== 'bigint') input = BigInt(input);
  if (input < 0) throw new Error('Input is negative');
  return input;
}

const _7bitsPower = 2 ** 7;

export class VarUIntSerializer extends BaseSerializer<bigint, Input, Output> {
  public appendToBytes(bytes: number[], input: Input): number[] {
    input = _toBase(input);
    let isLastByte = true;
    const result: number[] = [];
    do {
      const mod = Number(input % BigInt(_7bitsPower));
      input /= BigInt(_7bitsPower);
      const byte = isLastByte ? mod + _7bitsPower : mod;
      isLastByte = false;
      result.push(byte);
    } while (input >= 1);
    bytes.push(...result.reverse());
    return bytes;
  }

  public read(buffer: Buffer, offset: number): { res: bigint; cursor: number } {
    let res = 0n;
    while (true) {
      if (offset >= buffer.length) throw new Error(`overflow varuint`);
      const byte = buffer[offset];
      offset += 1;
      const mod = byte % _7bitsPower;
      res = res * BigInt(_7bitsPower) + BigInt(mod);
      if (byte >= _7bitsPower) return { res, cursor: offset };
    }
  }

  public toJSON(input: Input): Output {
    input = _toBase(input);
    return input > Number.MAX_SAFE_INTEGER ? input.toString(10) : Number(input);
  }

  public fromJSON(input: Input): bigint {
    return _toBase(input);
  }
}

export const varuint = new VarUIntSerializer();
