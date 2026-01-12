import { BaseOf, BaseSerializer, InputOf, OutputOf, Serializer } from './_base';

type Base<T extends Serializer> = BaseOf<T> | null;
type Input<T extends Serializer> = BaseOf<T> | InputOf<T> | null | undefined;
type Output<T extends Serializer> = OutputOf<T> | null;

export class NullableSerializer<T extends Serializer> extends BaseSerializer<Base<T>, Input<T>, Output<T>> {
  constructor(public readonly type: T) {
    super();
  }

  public genOp(input: Input<T>): BaseSerializer.Op {
    if (input === null || input === undefined) return { length: 1, fn: (buffer, offset) => (buffer[offset] = 0) };
    const innerOp = this.type.genOp(input);
    return {
      length: 1 + innerOp.length,
      fn: (buffer, offset) => {
        buffer[offset] = 1;
        innerOp.fn(buffer, offset + 1);
      },
    };
  }

  public read(buffer: Buffer, offset: number): { res: Base<T>; cursor: number } {
    const flag = buffer[offset];
    offset += 1;
    if (flag === 0) return { res: null, cursor: offset };
    if (flag === 1) return this.type.read(buffer, offset) as { res: BaseOf<T>; cursor: number };
    throw new Error(`Invalid nullable flag value: ${flag}`);
  }

  public toJSON(input: Input<T>): Output<T> {
    return input === null || input === undefined ? null : (this.type.toJSON(input) as OutputOf<T>);
  }

  public fromJSON(output: Output<T>): Base<T> {
    return output === null ? null : (this.type.fromJSON(output) as BaseOf<T>);
  }
}

export const nullable = <T extends Serializer>(type: T): NullableSerializer<T> => new NullableSerializer(type);
