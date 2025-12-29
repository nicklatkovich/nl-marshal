export abstract class BaseSerializer<Base extends Input, Input, Output> {
  public abstract appendToBytes(bytes: number[], input: Input): number[];
  public abstract read(buffer: Buffer, offset: number): { res: Base; cursor: number };
  public abstract toJSON(input: Input): Output;
  public abstract fromJSON(output: Output): Base;

  public serialize(input: Input): Buffer {
    return Buffer.from(this.appendToBytes([], input));
  }

  public parse(buffer: Buffer): Base {
    const { res, cursor } = this.read(buffer, 0);
    if (cursor !== buffer.length) throw new Error('End of buffer expected');
    return res;
  }
}

export type Serializer = BaseSerializer<unknown, unknown, unknown>;
export type BaseOf<T> = T extends BaseSerializer<infer K, any, any> ? K : never;
export type InputOf<T> = T extends BaseSerializer<any, infer K, any> ? K : never;
export type OutputOf<T> = T extends BaseSerializer<any, any, infer K> ? K : never;
