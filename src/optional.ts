import bool from "./bool";
import ISerializer, { BaseOf, InputOf, JSONOf } from "./ISerializer";

type Base<T> = BaseOf<T> | null;
type Input<T> = InputOf<T> | null | undefined;
type JSON<T> = JSONOf<T> | null;

export class OptionalSerializer<T extends ISerializer> extends ISerializer<Base<T>, Input<T>, JSON<T>> {
	constructor(public readonly serializer: T) { super(); }
	toJSON(value: Input<T>): JSON<T> {
		if (value === null || value === undefined) return null;
		return this.serializer.toJSON(value);
	}
	fromJSON(value: JSON<T>): Base<T> {
		if (value === null) return null;
		return this.serializer.fromJSON(value);
	}
	toBuffer(value: Input<T>): Buffer {
		const missing = value === null || value === undefined;
		const preres = bool.toBuffer(!missing);
		if (missing) return preres;
		return Buffer.concat([preres, this.serializer.toBuffer(value)]);
	}
	readFromBuffer(buffer: Buffer, offset: number = 0): { res: Base<T>, newOffset: number } {
		const { res: provided, newOffset: from } = bool.readFromBuffer(buffer, offset);
		if (!provided) return { res: null, newOffset: from };
		return this.serializer.readFromBuffer(buffer, from);
	}
}

export default function optional<T extends ISerializer>(serializer: T): OptionalSerializer<T> {
	return new OptionalSerializer(serializer);
}
