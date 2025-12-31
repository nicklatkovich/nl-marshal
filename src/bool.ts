import { BaseSerializer } from './_base';

type Base = boolean;
type Input = boolean;
type Output = boolean;

export class BoolSerializer extends BaseSerializer<Base, Input, Output> {
  public genOp(input: Input): BaseSerializer.Op {
    return { length: 1, fn: (buffer, offset) => (buffer[offset] = input ? 1 : 0) };
  }

  public read(buffer: Buffer, offset: number): { res: Base; cursor: number } {
    const byte = buffer[offset];
    if (byte === 0) return { res: false, cursor: offset + 1 };
    if (byte === 1) return { res: true, cursor: offset + 1 };
    throw new Error(`Invalid boolean value: ${byte}`);
  }

  public toJSON(input: Input): Output {
    return input;
  }

  public fromJSON(output: Output): Base {
    return output;
  }
}

export const bool = new BoolSerializer();
