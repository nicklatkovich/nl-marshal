import { BaseOf, BaseSerializer, InputOf, OutputOf, Serializer } from './_base';
import { vector, VectorSerializer } from './vector';

type Base<T extends Serializer> = Set<BaseOf<T>>;
type Input<T extends Serializer> = Set<InputOf<T>> | InputOf<T>[];
type Output<T extends Serializer> = OutputOf<T>[];

export class SortedSetSerializer<T extends Serializer> extends BaseSerializer<Base<T>, Input<T>, Output<T>> {
  public readonly vector: VectorSerializer<T>;

  constructor(public readonly type: T) {
    super();
    this.vector = vector(type);
  }

  public genOp(input: Input<T>): BaseSerializer.Op {
    const list = this.toList(input);
    return this.vector.genOp(list.map((e) => e.element));
  }

  public read(buffer: Buffer, offset: number): { res: Base<T>; cursor: number } {
    const { res, cursor } = this.vector.read(buffer, offset);
    this.validateBaseList(res);
    return { res: new Set(res), cursor };
  }

  public toJSON(input: Input<T>): Output<T> {
    return this.toList(input).map((e) => this.type.toJSON(e.element) as OutputOf<T>);
  }

  public fromJSON(output: Output<T>): Base<T> {
    const list = this.vector.fromJSON(output);
    this.validateBaseList(list);
    return new Set(list);
  }

  private toList(input: Input<T>): { element: InputOf<T>; serialized: Buffer }[] {
    const list = Array.isArray(input) ? input : [...input];
    const sorted = list.map((e) => ({ element: e, serialized: this.type.serialize(e) }));
    sorted.sort((a, b) => a.serialized.compare(b.serialized));
    for (let i = 0, nextI = 1; nextI < sorted.length; i = nextI++) {
      const a = sorted[i].serialized;
      const b = sorted[nextI].serialized;
      if (a < b || a > b) continue;
      throw new Error('set: items duplicate');
    }
    return sorted;
  }

  private validateBaseList(base: BaseOf<T>[]): void {
    const serialized = base.map((e) => this.type.serialize(e));
    for (let i = 0, nextI = 1; nextI < serialized.length; i = nextI++) {
      if (serialized[i] < serialized[nextI]) continue;
      throw new Error(serialized[i] > serialized[nextI] ? 'set: not sorted' : 'set: items duplicate');
    }
  }
}

export const sorted_set = <T extends Serializer>(type: T): SortedSetSerializer<T> => new SortedSetSerializer(type);
