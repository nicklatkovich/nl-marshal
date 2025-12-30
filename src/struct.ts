import { BaseSerializer, BaseOf, InputOf, OutputOf } from './_base';

export type StructDefinition = { [key: string]: BaseSerializer<any, any, any> };

type Base<T extends StructDefinition> = { [key in keyof T]: BaseOf<T[key]> };
type Input<T extends StructDefinition> = { [key in keyof T]: InputOf<T[key]> };
type Output<T extends StructDefinition> = { [key in keyof T]: OutputOf<T[key]> };

export class StructSerializer<T extends StructDefinition> extends BaseSerializer<Base<T>, Input<T>, Output<T>> {
  public readonly difinition: Readonly<T>;
  public get keys(): (keyof T)[] {
    return Object.keys(this.difinition);
  }

  constructor(difinition: T) {
    super();
    this.difinition = { ...difinition };
  }

  public appendToBytes(bytes: number[], input: Input<T>): number[] {
    for (const key of this.keys) {
      this.difinition[key].appendToBytes(bytes, input[key]);
    }
    return bytes;
  }

  public read(buffer: Buffer, offset: number): { res: Base<T>; cursor: number } {
    let cursor = offset;
    const result: Partial<Base<T>> = {};
    for (const key of this.keys) {
      ({ res: result[key], cursor } = this.difinition[key].read(buffer, cursor));
    }
    return { res: result as Base<T>, cursor };
  }

  public toJSON(input: Input<T>): Output<T> {
    let result: Partial<Output<T>> = {};
    for (const key of this.keys) {
      result[key] = this.difinition[key].toJSON(input[key]);
    }
    return result as Output<T>;
  }

  public fromJSON(output: Output<T>): Base<T> {
    let result: Partial<Output<T>> = {};
    for (const key of this.keys) {
      result[key] = this.difinition[key].fromJSON(output[key]);
    }
    return result as Base<T>;
  }
}

export const struct = <T extends StructDefinition>(difinition: T): StructSerializer<T> =>
  new StructSerializer(difinition);
