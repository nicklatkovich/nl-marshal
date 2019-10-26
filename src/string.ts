import ISerializer from "./ISerializer";
import varuint from "./varuint";

export class StringSerializer extends ISerializer<string> {
	toJSON(value: string): string { return value; }
	fromJSON(value: string): string { return value; }
	toBuffer(value: string): Buffer { return Buffer.concat([varuint.toBuffer(value.length), Buffer.from(value)]); }
	readFromBuffer(buffer: Buffer, offset: number = 0): { res: string, newOffset: number } {
		const { res: lengthBN, newOffset: contentOffset } = varuint.readFromBuffer(buffer, offset);
		const length = lengthBN.toNumber();
		const newOffset = contentOffset + length;
		return { res: buffer.slice(contentOffset, newOffset).toString(), newOffset };
	}
}

const string = new StringSerializer();
export default string;
