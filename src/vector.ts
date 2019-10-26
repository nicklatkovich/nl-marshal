import ISerializer, { InputOf, OutputOf, JSONOutputOf } from "./ISerializer";
import varuint from "./varuint";

type TInput<T> = InputOf<T>[];
type TOutput<T> = OutputOf<T>[];
type TJSONOutput<T> = JSONOutputOf<T>[];

export class VectorSerializer<T extends ISerializer> extends ISerializer<TInput<T>, TOutput<T>, TJSONOutput<T>> {
	constructor(public readonly serializer: T) { super(); }
	toJSON(value: TInput<T>): TJSONOutput<T> { return value.map((element) => this.serializer.toJSON(element)); }
	fromJSON(value: TJSONOutput<T>): TOutput<T> { return value.map((element) => this.serializer.fromJSON(element)); }

	toBuffer(value: TInput<T>): Buffer {
		return Buffer.concat([
			varuint.toBuffer(value.length),
			...value.map((element) => this.serializer.toBuffer(element)),
		]);
	}

	readFromBuffer(buffer: Buffer, offset: number = 0): { res: TOutput<T>, newOffset: number } {
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
