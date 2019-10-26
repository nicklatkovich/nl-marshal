import { ok } from "assert";
import BigNumber from "bignumber.js";

import ISerializer from "./ISerializer";

export type VarUIntInput = number | string | BigNumber;

export class VarUIntSerializer extends ISerializer<VarUIntInput, BigNumber, string> {
	private static validateBN(value: BigNumber) {
		if (!(value instanceof BigNumber)) throw new Error('invalid value type');
		if (!value.isInteger()) throw new Error('value is not a integer');
		if (value.lt(0)) throw new Error('value is negative');
	}

	toJSON(value: VarUIntInput): string {
		if (typeof value === 'number') {
			if (Math.abs(value) > Number.MAX_SAFE_INTEGER) throw new Error('loss of accuracy');
			return value.toString(10);
		}
		if (typeof value === 'string') value = new BigNumber(value);
		VarUIntSerializer.validateBN(value);
		return value.toString(10);
	}

	fromJSON(value: string): BigNumber {
		const result = new BigNumber(value);
		VarUIntSerializer.validateBN(result);
		return result;
	}

	toBuffer(value: VarUIntInput): Buffer {
		let bn = typeof value === 'string' || typeof value === 'number' ? new BigNumber(value) : value;
		ok(bn.isFinite(), 'is not finite');
		ok(!bn.isNegative(), 'is negative');
		ok(bn.isInteger(), 'is not integer');
		let resHex = '';
		let lastByte = true;
		do {
			const mod = bn.mod(2 ** 7);
			bn = bn.idiv(2 ** 7);
			const byte = lastByte ? mod.plus(2 ** 7) : mod;
			lastByte = false;
			resHex = byte.toString(16).padStart(2, '0') + resHex;
		} while (bn.gt(0));
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
