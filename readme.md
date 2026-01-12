# NL-Marshal

Simple Node.js utility to serialize or deserialize JS objects to Buffer or JSON.

## Features

- Serialize and deserialize JavaScript objects to/from Buffer or JSON
- Supports various data types: integers, big integers, booleans, bytes, dates, sets, structs, variants, vectors, and more
- Customizable and composable serializers
- Useful for binary protocols, storage, and network communication

## Installation

```bash
npm install nl-marshal
```

or using yarn:

```bash
yarn add nl-marshal
```

## Usage Example

```typescript
import { int32, bool, vector, struct } from 'nl-marshal';

// Define a struct serializer
const userSerializer = struct({
  id: int32,
  active: bool,
  scores: vector(int32),
});

const user = { id: 42, active: true, scores: [10, 20, 30] };

// Serialize to Buffer
const buffer = userSerializer.serialize(user);

// Deserialize from Buffer
const parsed = userSerializer.parse(buffer);
```

## API Overview

### Built-in Serializers

- **[bool](#bool-example)**: Boolean values
- **[intX, uintX](#integer-examples)**: Signed and unsigned integers of various sizes
- **[big_int_t, big_uint_t](#bigint-example)**: Arbitrary-size integers
- **[varuint](#varuint-example)**: Variable-length unsigned integer
- **[bytes](#bytes-example)**: Buffer, Uint8Array, or string (with encoding)
- **[date](#date-example)**: JavaScript Date objects
- **[sorted_set](#sorted-set-example)**: Set collections
- **[vector](#vector-example)**: Arrays of any serializer
- **[struct](#struct-example)**: Object with named fields
- **[variant](#variant-example)**: Tagged union types
- **[nullable](#nullable-example)**: Nullable values
- **[empty](#empty-example)**: Always serializes to empty buffer and parses to null

### Creating Custom Serializers
- Extend the `BaseSerializer` class to create custom serializers
- Implement `genOp` and `read` methods for custom serialization logic

See [Creating Custom Serializers (Example)](#creating-custom-serializers-example) section for details.

---

## Serializer Examples

### Bool Example

```typescript
import { bool } from 'nl-marshal';
const buffer = bool.serialize(true); // <Buffer 01>
const value = bool.parse(buffer); // true
```

### Integer Examples

```typescript
import { int32, uint64 } from 'nl-marshal';
const buf1 = int32.serialize(-123); // <Buffer ff ff ff 85>
const val1 = int32.parse(buf1); // -123
const buf2 = uint64.serialize(500); // <Buffer 00 00 00 00 00 00 01 f4>
const val2 = uint64.parse(buf2); // 500
```

There are serializers for various integer sizes:

- int8/uint8 to int48/uint48 in steps of 8 bits - returns number values
- int_t(X)/uint_t(X) - where X is any number of **BYTES** (not bits) in range of `[1-6]` -
  aliased to int8/uint8 to int48/uint48 respectively
- safe_int/safe_uint - for integers in range of JavaScript safe integers (7 bytes) - returns number values
- int64/uint64, int256/uint256 - returns BigInt values
- big_int_t(X)/big_uint_t(X) - where X is any number of **BYTES** (not bits) - returns BigInt values
- varuint - variable-length unsigned integer - returns BigInt values

### BigInt Example

You can create big integer serializers with a specified byte size.

```typescript
import { big_int_t } from 'nl-marshal';
const buf = big_int_t(8).serialize(1234567890123456789n);
// <Buffer 11 22 10 f4 7d e9 81 15>
const val = big_int_t(8).parse(buf); // 1234567890123456789n
```

### VarUInt Example

```typescript
import { varuint } from 'nl-marshal';
const buf = varuint.serialize(300); // <Buffer 02 ac>
const val = varuint.parse(buf); // 300n
```

### Bytes Example

```typescript
import { bytes, BytesEncoding, string } from 'nl-marshal';
const eth_address = bytes({ encoding: BytesEncoding.HEX, size: 20 });
const input_addr = '0x1234567890abcdef1234567890abcdef12345678';
const buf1 = eth_address.serialize(input_addr);
// <Buffer 12 34 56 78 90 ab cd ef 12 34 56 78 90 ab cd ef 12 34 56 78>
const addr = eth_address.toJSON(eth_address.parse(buf1));
// '0x1234567890abcdef1234567890abcdef12345678'
const buf2 = string.serialize('hello'); // <Buffer 85 68 65 6c 6c 6f>
// note that string automatically converts result to utf8 string
// and there is no need to do string.toJSON like in other bytes serializers
const str = string.parse(buf2); // 'hello'
```

If no length is specified, the serializer will use a varuint prefix to denote the length of the byte array.

Encoding is used when parsing inputs. Parse returns `Buffer` no matter the encoding specified.
Use `toJSON` method to convert to string with the specified encoding.
Note that `string` serializer is a special case of `bytes` serializer that always returns UTF-8 strings
and there is no need to use `toJSON` method.

### Date Example

```typescript
import { date } from 'nl-marshal';
const input = new Date('2025-01-02T15:04:05Z');
const buf = date.serialize(input); // <Buffer 00 01 94 27 8b 8e 88>
const parsed = date.parse(buf); // 2025-01-02T15:04:05.000Z (Date object)
```

Date is using safe_int serializer internally, representing milliseconds since Unix epoch.

### Sorted Set Example

```typescript
import { sorted_set, int32 } from 'nl-marshal';
const setSer = sorted_set(int32);
const buf = setSer.serialize(new Set([1, 2, 3]));
// <Buffer 83 00 00 00 01 00 00 00 02 00 00 00 03>
const parsed = setSer.parse(buf); // Set(3) { 1, 2, 3 }
```

Note that sets are serialized in sorted order.
Sorting and uniqueness is done by serializing each element and comparing the resulting buffers.
Because of that, this serializer may take longer time for large sets or complex element types.
If order and uniqueness is not important, consider using `vector` serializer instead.

### Vector Example

```typescript
import { vector, bool } from 'nl-marshal';
const vecSer = vector(bool);
const buf = vecSer.serialize([true, false, true]); // <Buffer 83 01 00 01>
const arr = vecSer.parse(buf); // [true, false, true]
```

Vector serializer prefixes the serialized array with its length as a `varuint` serializer.

### Struct Example

```typescript
import { struct, int32, bool } from 'nl-marshal';
const userSer = struct({ id: int32, active: bool });
const buf = userSer.serialize({ id: 1, active: false });
// <Buffer 00 00 00 01 00>
const obj = userSer.parse(buf); // { id: 1, active: false }
```

### Variant Example

```typescript
import { variant, int32, bool } from 'nl-marshal';
const varSer = variant({ 0: int32, 1: bool });
const buf0 = varSer.serialize([0, 42]); // <Buffer 80 00 00 00 2a>
const val0 = varSer.parse(buf0); // [0, 42]
const buf1 = varSer.serialize([1, true]); // <Buffer 81 01>
const val1 = varSer.parse(buf1); // [1, true]
```

There is also `empty` serializer, that always serializes to an empty buffer and parses to `null`.
It is useless on its own, but can be used with `variant` serializer to replace using of `nullable` serializer.

```typescript
import { bool, variant, empty, int8, nullable } from 'nl-marshal';
// using nullable:
const ser1 = nullable(variant({ 1: int8, 2: bool }));
const buf11 = ser1.serialize(null); // <Buffer 00>
const val11 = ser1.parse(buf11); // null
const buf12 = ser1.serialize([1, 100]); // <Buffer 01 81 64>
const val12 = ser1.parse(buf12); // [1, 100]
// using variant with empty:
const ser2 = variant({ 0: empty, 1: int8, 2: bool });
const buf21 = ser2.serialize([0, null]); // <Buffer 80>
const val21 = ser2.parse(buf21); // [0, null]
// note that variant with empty to not returns null, but [0, null]
const buf22 = ser2.serialize([1, 100]); // <Buffer 81 64>
// but it doesn't uses extra byte for null case
const val22 = ser2.parse(buf22); // [1, 100]
```

### Nullable Example

```typescript
import { nullable, int32 } from 'nl-marshal';
const ser = nullable(int32);
const buf1 = ser.serialize(null); // <Buffer 00>
const val1 = ser.parse(buf1); // null
const buf2 = ser.serialize(123); // <Buffer 01 00 00 00 7b>
const val2 = ser.parse(buf2); // 123
```

This serializer also can be used inside other serializers, for example:

```typescript
import { struct, nullable, int32, string } from 'nl-marshal';
const userSer = struct({
  id: int32,
  first_name: string,
  last_name: nullable(string),
});
const buf = userSer.serialize({ id: 1, first_name: 'John', last_name: null });
// <Buffer 00 00 00 01 84 4a 6f 68 6e 00>
const user = userSer.parse(buf);
// { id: 1, first_name: 'John', last_name: null }
```

### Empty Example

```typescript
import { empty } from 'nl-marshal';
const buf = empty.serialize(null); // <Buffer >
const val = empty.parse(buf); // null
```

See [`variant` example](#variant-example) for use case example.

### Creating Custom Serializers (Example)

You can create custom serializers by extending the `BaseSerializer` class.
The easiest way is to use existing serializers in new serializer:

```typescript
import { BaseSerializer, bytes, BytesEncoding, variant } from 'nl-marshal';

const ethAddress = bytes({ size: 20, encoding: BytesEncoding.HEX });
const solAddress = bytes({ size: 32, encoding: BytesEncoding.BASE58 });
enum AddressType { ETH = 0, SOLANA = 1 }
const serializer = variant({
  [AddressType.ETH]: ethAddress,
  [AddressType.SOLANA]: solAddress,
});

class EthOrSolAddress extends BaseSerializer<string, string, string> {
  genOp(input: string): BaseSerializer.Op {
    if (input.startsWith('0x')) return serializer.genOp([AddressType.ETH, input]);
    else return serializer.genOp([AddressType.SOLANA, input]);
  }

  read(buffer: Buffer, offset: number): { res: string; cursor: number } {
    const { res, cursor } = serializer.read(buffer, offset);
    const addressSerializer = serializer.types[res[0]];
    return { res: addressSerializer.toJSON(res[1]), cursor };
  }

  toJSON(input: string): string { return input; }
  fromJSON(output: string): string { return output; }
}

const ser = new EthOrSolAddress();
const buf1 = ser.serialize('0x1234567890abcdef1234567890abcdef12345678');
// <Buffer 80 12 34 56 78 90 ab cd ef 12 34 56 78 90 ab cd ef 12 34 56 78>
const addr1 = ser.parse(buf1); // '0x1234567890abcdef1234567890abcdef12345678'
const buf2 = ser.serialize('1thX6LZfHDZZKUs92febYZhYRcXddmzfzF2NvTkPNE');
// <Buffer 81 00 01 02 03 04 05 06 07 08 09 0a 0b 0c 0d 0e 0f 10 11 12 13 ...>
const addr2 = ser.parse(buf2); // '1thX6LZfHDZZKUs92febYZhYRcXddmzfzF2NvTkPNE'
```

You can also implement your own serialization logic from scratch by implementing `genOp` and `read` methods.
`genOp` should return an object with `length` and `fn` properties.
`length` is the size of the serialized data in bytes.
`fn` is a function that takes a Buffer and an offset, and writes the serialized data.
Note that `fn` should write all bytes, since `serialize` uses unsafe buffer allocation.
Example:

```typescript
import assert from "assert";
import { BaseSerializer } from "nl-marshal";

class BoolVectorSerializer extends BaseSerializer<
  boolean[],
  boolean[],
  boolean[]
> {
  readonly bytesSize: number;

  constructor(readonly size: number) {
    super();
    this.bytesSize = Math.ceil(size / 8);
  }

  genOp(input: boolean[]): BaseSerializer.Op {
    assert.strictEqual(input.length, this.size);
    return {
      length: this.bytesSize,
      fn: (buffer: Buffer, offset: number) => {
        for (let i = 0; i < this.size; i++) {
          const byteIndex = Math.floor(i / 8);
          const bytePos = offset + byteIndex;
          // initialize byte (since unsafe allocation is used)
          if (i % 8 === 0) buffer[bytePos] = 0;
          const bitIndex = i % 8;
          if (input[i]) buffer[bytePos] |= 1 << bitIndex;
        }
      }
    }
  }

  read(buffer: Buffer, offset: number): { res: boolean[]; cursor: number } {
    const res: boolean[] = new Array(this.size);
    for (let i = 0; i < this.size; i++) {
      const byteIndex = Math.floor(i / 8);
      const bytePos = offset + byteIndex;
      const bitIndex = i % 8;
      res[i] = (buffer[bytePos] & (1 << bitIndex)) !== 0;
    }
    return { res, cursor: offset + this.bytesSize };
  }

  toJSON(input: boolean[]): boolean[] { return input; }
  fromJSON(output: boolean[]): boolean[] { return output; }
}

const ser = new BoolVectorSerializer(7);
const data = [true, false, true, true, false, false, false];
const buf = ser.serialize(data); // <Buffer 0d>
const res = ser.parse(buf); // [true, false, true, true, false, false, false]
```

## License

MIT
