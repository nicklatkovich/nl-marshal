import { IntSerializer } from './int';
import { UIntSerializer } from './uint';

export class SafeUIntSerializer extends UIntSerializer {
  constructor() {
    super(7);
  }

  protected override _checkBytesCountOverflow(_bytesCount: number): void {
    // No overflow check for safe_uint_t
  }
}

export class SafeIntSerializer extends IntSerializer {
  constructor() {
    super(7);
  }

  protected override _checkBytesCountOverflow(_bytesCount: number): void {
    // No overflow check for safe_int_t
  }
}

export const safe_uint = new SafeUIntSerializer();
export const safe_int = new SafeIntSerializer();
