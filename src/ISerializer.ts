export default abstract class ISerializer<TInput = any, TOutput = TInput, TJSONOutput = TOutput> {
	abstract toJSON(value: TInput): TJSONOutput;
	abstract fromJSON(value: TJSONOutput): TOutput;
	abstract toBuffer(value: TInput): Buffer;
	abstract readFromBuffer(buffer: Buffer, offset?: number): { res: TOutput, newOffset: number };

	stringify(value: TInput) { return JSON.stringify(this.toJSON(value)); }
	parse(value: string | Buffer): TOutput {
		if (Buffer.isBuffer(value)) value = value.toString();
		return this.fromJSON(JSON.parse(value));
	}

	fromBuffer(buffer: Buffer): TOutput {
		const { res, newOffset } = this.readFromBuffer(buffer);
		if (newOffset !== buffer.length) throw new Error('excess info in the end of buffer');
		return res;
	}
}

export type InputOf<TSerializer> = TSerializer extends ISerializer<infer T, any, any> ? T : never;
export type OutputOf<TSerializer> = TSerializer extends ISerializer<any, infer T, any> ? T : never;
export type JSONOutputOf<TSerializer> = TSerializer extends ISerializer<any, any, infer T> ? T : never;
