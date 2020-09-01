import BigNumber from "bignumber.js";
import ISerializer from "./ISerializer";

type Input = BigNumber | number | string;
type JSON = number | string;

export class VarUIntSerializer extends ISerializer<BigNumber, Input, JSON> {
	private static validateBN(value: BigNumber) {
		if (!(value instanceof BigNumber)) throw new Error('invalid value type');
		if (!value.isFinite()) throw new Error("value is not finite");
		if (!value.isInteger()) throw new Error('value is not a integer');
		if (value.lt(0)) throw new Error('value is negative');
	}
	toJSON(value: Input): JSON {
		if (typeof value === 'number') {
			if (Math.abs(value) > Number.MAX_SAFE_INTEGER) throw new Error('loss of accuracy');
			value = new BigNumber(value);
		} else if (typeof value === 'string') value = new BigNumber(value);
		VarUIntSerializer.validateBN(value);
		return value.gt(Number.MAX_SAFE_INTEGER) ? value.toString(10) : value.toNumber();
	}
	fromJSON(value: JSON): BigNumber {
		const result = new BigNumber(value);
		VarUIntSerializer.validateBN(result);
		return result;
	}
	toBuffer(value: Input): Buffer {
		let bn = typeof value === 'string' || typeof value === 'number' ? new BigNumber(value) : value;
		VarUIntSerializer.validateBN(bn);
		let resHex = '';
		let lastByte = true;
		do {
			const mod = bn.mod(2 ** 7);
			bn = bn.idiv(2 ** 7);
			const byte = lastByte ? mod.plus(2 ** 7) : mod;
			lastByte = false;
			resHex = byte.toString(16).padStart(2, '0') + resHex;
		} while (bn.gte(1));
		return Buffer.from(resHex, 'hex');
	}
	readFromBuffer(buffer: Buffer, offset: number = 0): { res: BigNumber, newOffset: number } {
		let res = new BigNumber(0);
		while (true) {
			if (offset >= buffer.length) throw new Error(`overflow ${buffer.toString('hex')} ${offset}`);
			const byte = buffer[offset];
			offset += 1;
			const mod = byte % 2 ** 7;
			res = res.times(2 ** 7).plus(mod);
			if (byte >= 2 ** 7) return { res, newOffset: offset };
		}
	}
}

const varuint = new VarUIntSerializer();
export default varuint;
