import { ok } from "assert";
import ISerializer, { BaseOf, JSONOf, InputOf } from "./ISerializer";
import varuint from "./varuint";

type Base<T extends ISerializer> = Set<BaseOf<T>>;
type Input<T extends ISerializer> = Set<InputOf<T> | BaseOf<T>> | (InputOf<T> | BaseOf<T>)[];
type JSON<T extends ISerializer> = JSONOf<T>[];

export class SetSerializer<T extends ISerializer> extends ISerializer<Base<T>, Input<T>, JSON<T>> {
	constructor(public readonly serializer: T) { super(); }
	public toJSON(value: Input<T>): JSON<T> {
		if (value instanceof Set) value = [...value];
		this.checkForDuplicates(value);
		return value.map((e) => this.serializer.toJSON(e));
	}
	public fromJSON(value: JSON<T>): Base<T> {
		const preres: BaseOf<T>[] = value.map((e) => this.serializer.fromJSON(e));
		this.checkForDuplicates(preres);
		return new Set(preres);
	}
	public toBuffer(value: Input<T>): Buffer {
		if (value instanceof Set) value = [...value];
		return Buffer.concat([varuint.toBuffer(value.length), ...value.map((e) => this.serializer.toBuffer(e))]);
	}
	public readFromBuffer(buffer: Buffer, offset: number = 0): { res: Base<T>; newOffset: number; } {
		const { res: lengthBN, newOffset: from } = varuint.readFromBuffer(buffer, offset);
		ok(lengthBN.lte(Number.MAX_SAFE_INTEGER), "set size overflow");
		const length = lengthBN.toNumber();
		let it = from;
		const res: Base<T> = new Set();
		for (let i = 0; i < length; i += 1) {
			const { res: e, newOffset } = this.serializer.readFromBuffer(buffer, it);
			it = newOffset;
			res.add(e);
		}
		return { res, newOffset: it };
	}
	public checkForDuplicates(value: (InputOf<T> | BaseOf<T>)[]): void {
		const serializedElements = value.map((element) => ({
			element,
			serializedHex: this.serializer.toBuffer(element).toString("hex"),
		}));
		const serializedHexes = new Set(serializedElements.map((e) => e.serializedHex));
		const hasDuplicates = serializedElements.length !== serializedHexes.size;
		if (hasDuplicates) throw new Error("set has duplicates");
	}
}

export default function set<T extends ISerializer>(serializer: T): SetSerializer<T> {
	return new SetSerializer(serializer);
}
