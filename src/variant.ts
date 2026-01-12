import { BaseSerializer, Serializer } from './_base';
import { varuint } from './varuint';

type BaseTypeMap = Record<number, Serializer>;

type Base<T extends BaseTypeMap, K extends keyof T = keyof T> = K extends unknown
  ? K extends number
    ? T[K] extends BaseSerializer<infer R, unknown, unknown>
      ? [K, R]
      : never
    : never
  : never;

type Input<T extends BaseTypeMap, K extends keyof T = keyof T> = K extends unknown
  ? K extends number
    ? T[K] extends BaseSerializer<unknown, infer R, unknown>
      ? [K, R]
      : never
    : never
  : never;

type Output<T extends BaseTypeMap, K extends keyof T = keyof T> = K extends unknown
  ? K extends number
    ? T[K] extends BaseSerializer<unknown, unknown, infer R>
      ? [K, R]
      : never
    : never
  : never;

export class VariantSerializer<T extends BaseTypeMap> extends BaseSerializer<Base<T>, Input<T> | Base<T>, Output<T>> {
  constructor(public readonly types: T) {
    super();
  }

  public genOp(input: Input<T> | Base<T>): BaseSerializer.Op {
    const serializer = (this.types as BaseTypeMap)[input[0]];
    if (!serializer) throw new Error(`variant: unknown type ${input[0]}`);
    const typeOp = varuint.genOp(input[0]);
    const innerOp = serializer.genOp(input[1]);
    return {
      length: typeOp.length + innerOp.length,
      fn: (buffer, offset) => {
        typeOp.fn(buffer, offset);
        innerOp.fn(buffer, offset + typeOp.length);
      },
    };
  }

  public read(buffer: Buffer, offset: number): { res: Base<T>; cursor: number } {
    const { res: typeId, cursor: typeCursor } = varuint.read(buffer, offset);
    const serializer = (this.types as BaseTypeMap)[Number(typeId)];
    if (!serializer) throw new Error(`variant: unknown type ${typeId}`);
    const { res: value, cursor } = serializer.read(buffer, typeCursor);
    return { res: [Number(typeId), value] as Base<T>, cursor };
  }

  public toJSON(input: Input<T> | Base<T>): Output<T> {
    const serializer = (this.types as BaseTypeMap)[input[0]];
    if (!serializer) throw new Error(`variant: unknown type ${input[0]}`);
    return [input[0], serializer.toJSON(input[1])] as Output<T>;
  }

  public fromJSON(output: Output<T>): Base<T> {
    const serializer = (this.types as BaseTypeMap)[output[0]];
    if (!serializer) throw new Error(`variant: unknown type ${output[0]}`);
    return [output[0], serializer.fromJSON(output[1])] as Base<T>;
  }
}

export const variant = <T extends BaseTypeMap>(types: T): VariantSerializer<T> => new VariantSerializer<T>(types);
