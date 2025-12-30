import { BaseOf, BaseSerializer, InputOf, OutputOf } from './_base';

type Base<T extends BaseSerializer<any, any, any>> = BaseOf<T> | null;
type Input<T extends BaseSerializer<any, any, any>> = InputOf<T> | null | undefined;
type Output<T extends BaseSerializer<any, any, any>> = OutputOf<T> | null;

export class NullableSerializer<T extends BaseSerializer<any, any, any>> extends BaseSerializer<
  Base<T>,
  Input<T>,
  Output<T>
> {
  constructor(public readonly type: T) {
    super();
  }

  public appendToBytes(bytes: number[], input: Input<T>): number[] {
    if (input === null || input === undefined) {
      bytes.push(0);
      return bytes;
    }
    bytes.push(1);
    return this.type.appendToBytes(bytes, input);
  }

  public read(buffer: Buffer, offset: number): { res: Base<T>; cursor: number } {
    const flag = buffer[offset];
    offset += 1;
    if (flag === 0) return { res: null, cursor: offset };
    if (flag === 1) return this.type.read(buffer, offset);
    throw new Error(`Invalid nullable flag value: ${flag}`);
  }

  public toJSON(input: Input<T>): Output<T> {
    return input ?? null;
  }

  public fromJSON(output: Output<T>): Base<T> {
    return output;
  }
}

export const nullable = <T extends BaseSerializer<any, any, any>>(type: T): NullableSerializer<T> =>
  new NullableSerializer(type);
