export abstract class BaseSerializer<Base extends Input, Input, Output> {
  abstract appendToBytes(bytes: number[], input: Input): number[];
  abstract read(buffer: Buffer, offset: number): { res: Base; cursor: number };
  abstract toJSON(input: Input): Output;
  abstract fromJSON(output: Output): Base;

  serialize(input: Input): Buffer {
    return Buffer.from(this.appendToBytes([], input));
  }

  parse(buffer: Buffer): Base {
    const { res, cursor } = this.read(buffer, 0);
    if (cursor !== Buffer.length) throw new Error("End of buffer expected");
    return res;
  }
}

export type Serializer = BaseSerializer<any, any, any>;
export type BaseOf<T> = T extends BaseSerializer<infer K, any, any> ? K : never;
export type InputOf<T> = T extends BaseSerializer<any, infer K, any> ? K : never;
export type OutputOf<T> = T extends BaseSerializer<any, any, infer K> ? K : never;
