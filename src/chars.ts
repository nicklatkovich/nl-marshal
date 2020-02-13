import ISerializer from "./ISerializer";
import varuint from "./varuint";

export class CharsSerializer extends ISerializer<string, string, string> {
	toJSON(value: string): string { return value; }
	fromJSON(value: string): string { return value; }
	toBuffer(value: string): Buffer {
		const bytes = Buffer.from(value);
		return Buffer.concat([varuint.toBuffer(bytes.length), bytes]);
	}
	readFromBuffer(buffer: Buffer, offset: number = 0): { res: string, newOffset: number } {
		const { res: lengthBN, newOffset: contentOffset } = varuint.readFromBuffer(buffer, offset);
		const length = lengthBN.toNumber();
		const newOffset = contentOffset + length;
		return { res: buffer.slice(contentOffset, newOffset).toString(), newOffset };
	}
}

const chars = new CharsSerializer();
export default chars;
