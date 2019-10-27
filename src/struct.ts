import ISerializer, { InputOf, BaseOf, JSONOf } from "./ISerializer";

type SerializersMap = { [key: string]: ISerializer };

type Base<T extends SerializersMap> = { [key in keyof T]: BaseOf<T[key]> };
type Input<T extends SerializersMap> = { [key in keyof T]: InputOf<T[key]> };
type JSON<T extends SerializersMap> = { [key in keyof T]: JSONOf<T[key]> };

export class StructSerializer<T extends SerializersMap> extends ISerializer<Base<T>, Input<T>, JSON<T>> {
	public readonly serializers: Readonly<T>;
	public get keys(): (keyof T)[] { return Object.keys(this.serializers); }
	constructor(serializers: T) {
		super();
		this.serializers = (Object.keys(serializers) as (keyof T)[]).reduce((acc, key) => {
			acc[key] = serializers[key];
			return acc;
		}, {} as Partial<T>) as Readonly<T>;
	}
	toJSON(value: Input<T>): JSON<T> {
		return this.keys.reduce<Partial<JSON<T>>>((acc, key) => {
			acc[key] = this.serializers[key].toJSON(value[key]);
			return acc;
		}, {}) as JSON<T>
	}
	fromJSON(value: JSON<T>): Base<T> {
		return this.keys.reduce<Partial<Base<T>>>((acc, key) => {
			acc[key] = this.serializers[key].fromJSON(value[key]);
			return acc;
		}, {}) as Base<T>;
	}
	toBuffer(value: Input<T>): Buffer {
		return Buffer.concat(this.keys.map((key) => this.serializers[key].toBuffer(value[key])));
	}
	readFromBuffer(buffer: Buffer, offset: number = 0): { res: Base<T>, newOffset: number } {
		const result: Partial<Base<T>> = {};
		for (const key of this.keys) {
			const { res: value, newOffset: nextOffset } = this.serializers[key].readFromBuffer(buffer, offset);
			result[key] = value;
			offset = nextOffset;
		}
		return { res: result as Base<T>, newOffset: offset };
	}
}

export default function struct<T extends SerializersMap>(serializers: T) { return new StructSerializer(serializers); }

export function extended<Extended extends SerializersMap, T extends SerializersMap>(
	extended: StructSerializer<Extended>,
	serializers: T,
): StructSerializer<Extended & T> { return struct({ ...extended.serializers, ...serializers }); }
