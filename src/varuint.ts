import { BaseSerializer } from './_base';

type Input = bigint | number | string;
type Output = number | string;

function _toBase(input: Input): bigint {
  if (typeof input === 'number' && !Number.isSafeInteger(input)) throw new Error('Input is not a safe integer');
  input = BigInt(input);
  if (input < 0) throw new Error('Input is negative');
  return input;
}

export class VarUIntSerializer extends BaseSerializer<bigint, Input, Output> {
  public genOp(input: Input): BaseSerializer.Op {
    input = _toBase(input);
    const length = this.calculateLength(input);
    return {
      length,
      fn: (buffer, offset) => {
        let lb = offset + length - 1;
        let value = input;
        {
          const mod = Number(value & 0x7fn);
          value >>= 7n;
          const byte = mod + 128;
          buffer[lb] = byte;
          lb -= 1;
        }
        while (value > 0) {
          const mod = Number(value & 0x7fn);
          value >>= 7n;
          const byte = mod;
          buffer[lb] = byte;
          lb -= 1;
        }
      },
    };
  }

  public read(buffer: Buffer, offset: number): { res: bigint; cursor: number } {
    let res = 0n;
    while (true) {
      if (offset >= buffer.length) throw new Error(`overflow varuint`);
      const byte = buffer[offset];
      offset += 1;
      const mod = byte & 0x7f;
      res = (res << 7n) + BigInt(mod);
      if (byte >= 128) return { res, cursor: offset };
    }
  }

  public toJSON(input: Input): Output {
    input = _toBase(input);
    return input > Number.MAX_SAFE_INTEGER ? input.toString(10) : Number(input);
  }

  public fromJSON(input: Input): bigint {
    return _toBase(input);
  }

  private calculateLength(input: bigint): number {
    let length = 0;
    do {
      length += 1;
      input >>= 7n;
    } while (input > 0);
    return length;
  }
}

export const varuint = new VarUIntSerializer();
