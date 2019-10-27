type RawJSON = null | string | number | boolean | { [key: string]: RawJSON } | RawJSONArray;
interface RawJSONArray extends Array<RawJSON> {}

export default abstract class ISerializer<Base = any, Input extends Base | any = Base, JSON extends RawJSON = any> {
	abstract toJSON(value: Input): JSON;
	abstract fromJSON(value: JSON): Base;
	abstract toBuffer(value: Input): Buffer;
	abstract readFromBuffer(buffer: Buffer, offset?: number): { res: Base, newOffset: number };
	stringify(value: Input): string { return JSON.stringify(this.toJSON(value)); }
	parse(value: string | Buffer): Base {
		if (Buffer.isBuffer(value)) value = value.toString();
		return this.fromJSON(JSON.parse(value));
	}
	fromBuffer(buffer: Buffer): Base {
		const { res, newOffset } = this.readFromBuffer(buffer);
		if (newOffset !== buffer.length) throw new Error("excess info in the end of buffer");
		return res;
	}
}

export type BaseOf<Serializer> = Serializer extends ISerializer<infer T, any, any> ? T : never;
export type InputOf<Serializer> = Serializer extends ISerializer<any, infer T, any> ? T : never;
export type JSONOf<Serializer> = Serializer extends ISerializer<any, any, infer T> ? T : never;
