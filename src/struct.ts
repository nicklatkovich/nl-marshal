import ISerializer, { InputOf, OutputOf, JSONOutputOf } from "./ISerializer";

type SerializersMap = { [key: string]: ISerializer };

type TInput<T extends SerializersMap> = { [key in keyof T]: InputOf<T[key]> };
type TOutput<T extends SerializersMap> = { [key in keyof T]: OutputOf<T[key]> };
type TJSONOutput<T extends SerializersMap> = { [key in keyof T]: JSONOutputOf<T[key]> };

export class StructSerializer<T extends SerializersMap> extends ISerializer<TInput<T>, TOutput<T>, TJSONOutput<T>> {
	public readonly serializers: Readonly<T>;
	public get keys(): (keyof T)[] { return Object.keys(this.serializers); }
	constructor(serializers: T) {
		super();
		this.serializers = (Object.keys(serializers) as (keyof T)[]).reduce((acc, key) => {
			acc[key] = serializers[key];
			return acc;
		}, {} as Partial<T>) as Readonly<T>;
	}

	toJSON(value: TInput<T>): TJSONOutput<T> {
		return this.keys.reduce((acc, key) => {
			acc[key] = this.serializers[key].toJSON(value[key]);
			return acc;
		}, {} as Partial<TJSONOutput<T>>) as TJSONOutput<T>
	}

	fromJSON(value: TJSONOutput<T>): TOutput<T> {
		return this.keys.reduce((acc, key) => {
			acc[key] = this.serializers[key].fromJSON(value[key]);
			return acc;
		}, {} as Partial<TOutput<T>>) as TOutput<T>;
	}

	toBuffer(value: TInput<T>): Buffer {
		return Buffer.concat(this.keys.map((key) => this.serializers[key].toBuffer(value[key])));
	}

	readFromBuffer(buffer: Buffer, offset: number = 0): { res: TOutput<T>, newOffset: number } {
		const result: Partial<TOutput<T>> = {};
		for (const key of this.keys) {
			const { res: value, newOffset: nextOffset } = this.serializers[key].readFromBuffer(buffer, offset);
			result[key] = value;
			offset = nextOffset;
		}
		return { res: result as TOutput<T>, newOffset: offset };
	}
}

export default function struct<T extends SerializersMap>(serializers: T) { return new StructSerializer(serializers); }
