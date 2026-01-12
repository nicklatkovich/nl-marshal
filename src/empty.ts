import { BaseSerializer } from './_base';

export class EmptySerializer extends BaseSerializer<null, null, null> {
  public genOp(_input: null): BaseSerializer.Op {
    return { length: 0, fn: () => {} };
  }

  public read(_buffer: Buffer, offset: number): { res: null; cursor: number } {
    return { res: null, cursor: offset };
  }

  public toJSON(_input: null): null {
    return null;
  }

  public fromJSON(_input: null): null {
    return null;
  }
}

export const empty = new EmptySerializer();
