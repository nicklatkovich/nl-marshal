import { BaseSerializer, BaseOf, InputOf, OutputOf, Serializer } from './_base';
import { varuint } from './varuint';

type Base<T extends Serializer> = BaseOf<T>[];
type Input<T extends Serializer> = InputOf<T>[];
type Output<T extends Serializer> = OutputOf<T>[];

export class VectorSerializer<T extends Serializer> extends BaseSerializer<Base<T>, Input<T>, Output<T>> {
  constructor(public readonly type: T) {
    super();
  }

  public appendToBytes(bytes: number[], input: Input<T>): number[] {
    bytes = varuint.appendToBytes(bytes, input.length);
    for (const e of input) bytes = this.type.appendToBytes(bytes, e);
    return bytes;
  }

  public read(buffer: Buffer, offset: number): { res: Base<T>; cursor: number } {
    const { res: length, cursor: lengthOffset } = varuint.read(buffer, offset);
    let cursor = lengthOffset;
    const res = new Array(Number(length)).fill(null).map(() => {
      const { res: element, cursor: newCursor } = this.type.read(buffer, cursor);
      cursor = newCursor;
      return element as BaseOf<T>;
    });
    return { res, cursor };
  }

  public toJSON(input: Input<T>): Output<T> {
    return input.map((e) => this.type.toJSON(e) as OutputOf<T>);
  }

  public fromJSON(output: OutputOf<T>[]): BaseOf<T>[] {
    return output.map((e) => this.type.fromJSON(e) as BaseOf<T>);
  }
}

export const vector = <T extends Serializer>(type: T): VectorSerializer<T> => new VectorSerializer(type);
