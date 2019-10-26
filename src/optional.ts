import bool from "./bool";
import ISerializer, { InputOf, OutputOf, JSONOutputOf } from "./ISerializer";

type TInput<T> = InputOf<T> | null | undefined;
type TOutput<T> = OutputOf<T> | null;
type TJSONOutput<T> = JSONOutputOf<T> | null;

export class OptionalSerializer<T extends ISerializer> extends ISerializer<TInput<T>, TOutput<T>, TJSONOutput<T>> {
	constructor(public readonly serializer: T) { super(); }

	toJSON(value: TInput<T>): TJSONOutput<T> {
		if (value === null || value === undefined) return null;
		return this.serializer.toJSON(value);
	}

	fromJSON(value: TJSONOutput<T>): TOutput<T> {
		if (value === null) return null;
		return this.serializer.toJSON(value);
	}

	toBuffer(value: TInput<T>): Buffer {
		const missing = value === null || value === undefined;
		const preres = bool.toBuffer(!missing);
		if (missing) return preres;
		return Buffer.concat([preres, this.serializer.toBuffer(value)]);
	}

	readFromBuffer(buffer: Buffer, offset: number = 0): { res: TOutput<T>, newOffset: number } {
		const { res: provided, newOffset: from } = bool.readFromBuffer(buffer, offset);
		if (!provided) return { res: null, newOffset: from };
		return this.serializer.readFromBuffer(buffer, from);
	}

}

export default function optional<T extends ISerializer>(serializer: T): OptionalSerializer<T> {
	return new OptionalSerializer(serializer);
}
