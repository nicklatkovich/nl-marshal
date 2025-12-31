import { BaseSerializer } from './_base';
import { safe_int } from './safe_integer';

type Base = Date;
type Input = Date | string | number;
type Output = string;

export class DateSerializer extends BaseSerializer<Base, Input, Output> {
  public genOp(input: Input): BaseSerializer.Op {
    const date = this._toBase(input);
    return safe_int.genOp(date.getTime());
  }

  public read(buffer: Buffer, offset: number): { res: Base; cursor: number } {
    const { res: timestamp, cursor } = safe_int.read(buffer, offset);
    const res = new Date(timestamp);
    if (isNaN(res.getTime())) throw new Error(`date: invalid timestamp ${timestamp}`);
    return { res, cursor };
  }

  public toJSON(input: Input): Output {
    const date = this._toBase(input);
    return date.toISOString();
  }

  public fromJSON(output: Output): Base {
    return this._toBase(output);
  }

  private _toBase(input: Input): Base {
    input = new Date(input);
    if (isNaN(input.getTime())) throw new Error(`date: invalid date ${input}`);
    return input;
  }
}

export const date = new DateSerializer();
