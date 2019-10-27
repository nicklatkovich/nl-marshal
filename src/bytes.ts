import { ok } from "assert";
import BigNumber from "bignumber.js";
import * as bs58 from "bs58";
import ISerializer from "./ISerializer";
import varuint from "./varuint";

export enum Encoding {
	UTF_8 = "utf-8",
	BASE_58 = "base58",
}

type Input = Buffer | string;

export class BytesSerializer extends ISerializer<Buffer, Input, string> {
	public readonly encoding: Encoding;
	public readonly length?: number;
	constructor(opts: { encoding?: Encoding, length?: number } = {}) {
		super();
		this.encoding = opts.encoding === undefined ? Encoding.UTF_8 : opts.encoding;
		if (opts.length !== undefined) {
			ok(opts.length >= 0);
			ok(Number.isInteger(opts.length));
			ok(opts.length <= Number.MAX_SAFE_INTEGER);
		}
		this.length = opts.length;
	}
	public toJSON(value: Input): string {
		if (typeof value === "string") value = this.decode(value);
		if (this.length !== undefined) ok(value.length === this.length);
		return this.encode(value);
	}
	public fromJSON(value: string): Buffer {
		const result = this.decode(value);
		if (this.length !== undefined) ok(result.length === this.length);
		return result;
	}
	public toBuffer(value: Input): Buffer {
		if (typeof value === "string") value = this.decode(value);
		if (this.length === undefined) return Buffer.concat([varuint.toBuffer(value.length), value]);
		ok(value.length === this.length);
		return value;
	}
	public readFromBuffer(buffer: Buffer, offset: number = 0): { res: Buffer; newOffset: number; } {
		const { res: lengthBN, newOffset: from } = this.length === undefined ? varuint.readFromBuffer(buffer, offset) :
			{ res: new BigNumber(this.length), newOffset: offset };
		ok(lengthBN.lte(Number.MAX_SAFE_INTEGER));
		const length = lengthBN.toNumber();
		ok(buffer.length >= from + length);
		const newOffset = from + length;
		return { res: buffer.slice(from, newOffset), newOffset };
	}
	public decode(str: string): Buffer {
		switch (this.encoding) {
			case Encoding.UTF_8: return Buffer.from(str, "utf-8");
			case Encoding.BASE_58: return bs58.decode(str);
			default: throw new Error(`decoding ${this.encoding} is not implemented`);
		}
	}
	public encode(buffer: Buffer): string {
		switch (this.encoding) {
			case Encoding.UTF_8: return buffer.toString();
			case Encoding.BASE_58: return bs58.encode(buffer);
			default: throw new Error(`encoding ${this.encoding} is not implemented`);
		}
	}
}

export default function bytes(opts?: { encoding?: Encoding, length?: number }): BytesSerializer {
	return new BytesSerializer(opts);
}
