import ISerializer from "./ISerializer";

export class BoolSerializer extends ISerializer<boolean, boolean, boolean> {
	toJSON(value: boolean): boolean { return value; }
	fromJSON(value: boolean): boolean { return value; }
	toBuffer(value: boolean): Buffer { return Buffer.from([value ? 1 : 0]); }
	readFromBuffer(buffer: Buffer, offset: number = 0): { res: boolean, newOffset: number } {
		const byte = buffer[offset];
		if (byte === 0) return { res: false, newOffset: offset + 1 };
		if (byte === 1) return { res: true, newOffset: offset + 1 };
		throw new Error("invalid bool-byte");
	}
}

const bool = new BoolSerializer();
export default bool;
