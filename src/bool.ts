import { BaseSerializer } from './_base';

type Base = boolean;
type Input = boolean;
type Output = boolean;

export class BoolSerializer extends BaseSerializer<Base, Input, Output> {
  public appendToBytes(bytes: number[], input: Input): number[] {
    bytes.push(input ? 1 : 0);
    return bytes;
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
