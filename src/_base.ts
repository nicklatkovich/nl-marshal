export declare namespace BaseSerializer {
  export type Op = { length: number; fn: (buffer: Buffer, offset: number) => void };
}

export abstract class BaseSerializer<Base, Input, Output> {
  public abstract genOp(input: Input): BaseSerializer.Op;
  public abstract read(buffer: Buffer, offset: number): { res: Base; cursor: number };
  public abstract toJSON(input: Input): Output;
  public abstract fromJSON(output: Output): Base;

  public serialize(input: Input, safeAlloc = false): Buffer {
    const { length, fn } = this.genOp(input);
    const buffer = safeAlloc ? Buffer.alloc(length) : Buffer.allocUnsafe(length);
    fn(buffer, 0);
    return buffer;
  }

  public parse(buffer: Buffer): Base {
    const { res, cursor } = this.read(buffer, 0);
    if (cursor !== buffer.length) throw new Error('End of buffer expected');
    return res;
  }
}

export type Serializer = BaseSerializer<unknown, unknown, unknown>;
export type BaseOf<T> = T extends BaseSerializer<infer K, unknown, unknown> ? K : never;
export type InputOf<T> = T extends BaseSerializer<unknown, infer K, unknown> ? K : never;
export type OutputOf<T> = T extends BaseSerializer<unknown, unknown, infer K> ? K : never;
