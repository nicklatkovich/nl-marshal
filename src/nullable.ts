// import { BaseSerializer } from './_base';

// type Base<T extends BaseSerializer<any, any, any>> = T extends BaseSerializer<infer R, any, any> ? R | null : never;

// type Input<T extends BaseSerializer<any, any, any>> = T extends BaseSerializer<any, infer R, any>
//   ? R | null | undefined
//   : never;

// type Output<T extends BaseSerializer<any, any, any>> = T extends BaseSerializer<any, any, infer R> ? R | null : never;

// export class NullableSerializer<T extends BaseSerializer<any, any, any>> extends BaseSerializer<
//   Base<T>,
//   Input<T>,
//   Output<T>
// > {
//   public appendToBytes(bytes: number[], input: Input): number[] {}
//   public read(buffer: Buffer, offset: number): { res: Base; cursor: number } {}
//   public toJSON(input: Input): Output {}
//   public fromJSON(output: Output): Base {}
// }
