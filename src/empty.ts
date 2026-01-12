import ISerializer from "./ISerializer";

type Input = null | undefined;

export class EmptySerializer extends ISerializer<null, Input, null> {
	toJSON(_: Input): null { return null; }
	fromJSON(_: null): null { return null; }
	toBuffer(_: Input): Buffer { return Buffer.from([]); }
	readFromBuffer(_: Buffer, offset: number = 0): { res: null, newOffset: number } {
		return { res: null, newOffset: offset };
	}
}

const empty = new EmptySerializer();
export default empty;
