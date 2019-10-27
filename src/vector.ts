import ISerializer, { BaseOf, InputOf, JSONOf } from "./ISerializer";
import varuint from "./varuint";

type Base<T extends ISerializer> = BaseOf<T>[];
type Input<T extends ISerializer> = InputOf<T>[];
type JSON<T extends ISerializer> = JSONOf<T>[];

export class VectorSerializer<T extends ISerializer> extends ISerializer<Base<T>, Input<T>, JSON<T>> {
	constructor(public readonly serializer: T) { super(); }
	toJSON(value: Input<T>): JSON<T> { return value.map((element) => this.serializer.toJSON(element)); }
	fromJSON(value: JSON<T>): Base<T> { return value.map((element) => this.serializer.fromJSON(element)); }
	toBuffer(value: Input<T>): Buffer {
		return Buffer.concat([
			varuint.toBuffer(value.length),
			...value.map((element) => this.serializer.toBuffer(element)),
		]);
	}
	readFromBuffer(buffer: Buffer, offset: number = 0): { res: Base<T>, newOffset: number } {
		const { res: length, newOffset: from } = varuint.readFromBuffer(buffer, offset);
		let it = from;
		if (length.gt(Number.MAX_SAFE_INTEGER)) throw new Error('unprocessable vector length');
		const res = new Array(length.toNumber()).fill(null).map(() => {
			const { res: element, newOffset } = this.serializer.readFromBuffer(buffer, it);
			it = newOffset;
			return element;
		});
		return { res, newOffset: it };
	}
}

export default function vector<T extends ISerializer>(serializer: T): VectorSerializer<T> {
	return new VectorSerializer(serializer);
}
