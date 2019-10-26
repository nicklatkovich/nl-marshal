import ISerializer from "./ISerializer";

export class EmptySerializer extends ISerializer<undefined, undefined, null> {
	toJSON(_: undefined): null { return null; }
	fromJSON(_: null): undefined { return undefined; }
	toBuffer(_: undefined): Buffer { return Buffer.from([]); }
	readFromBuffer(_: Buffer, offset: number = 0): { res: undefined, newOffset: number } {
		return { res: undefined, newOffset: offset };
	}
}

const empty = new EmptySerializer();
export default empty;
