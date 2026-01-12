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
import { int32_t, bool, vector, struct } from 'nl-marshal';

// Define a struct serializer
const userSerializer = struct({
  id: int32_t,
  active: bool,
  scores: vector(int32_t),
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
- **[int8_t, int16_t, int32_t, int64_t](#integer-examples)**: Signed integers
- **[uint8_t, uint16_t, uint32_t, uint64_t](#integer-examples)**: Unsigned integers
- **[big_int, big_uint](#bigint-example)**: Arbitrary-size integers
- **[varuint](#varuint-example)**: Variable-length unsigned integer
- **[bytes](#bytes-example)**: Buffer, Uint8Array, or string (with encoding)
- **[date](#date-example)**: JavaScript Date objects
- **[set](#set-example)**: Set collections
- **[vector](#vector-example)**: Arrays of any serializer
- **[struct](#struct-example)**: Object with named fields
- **[variant](#variant-example)**: Tagged union types

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
import { int32_t, uint16_t } from 'nl-marshal';
const buf1 = int32_t.serialize(-123); // <Buffer ff ff ff 85>
const val1 = int32_t.parse(buf1); // -123n
const buf2 = uint16_t.serialize(500); // <Buffer 01 f4>
const val2 = uint16_t.parse(buf2); // 500n
```

### BigInt Example
You can create big integer serializers with a specified byte size.

```typescript
import { big_int_t } from 'nl-marshal';
const buf = big_int_t(8).serialize(1234567890123456789n);
const val = big_int_t(8).parse(buf);
```

### VarUInt Example
```typescript
import { varuint } from 'nl-marshal';
const buf = varuint.serialize(300);
const val = varuint.parse(buf); // 300n
```

### Bytes Example
```typescript
import { bytes } from 'nl-marshal';
const buf = bytes.serialize('hello');
const str = bytes.parse(buf).toString(); // 'hello'
```

### Date Example
```typescript
import { date } from 'nl-marshal';
const now = new Date();
const buf = date.serialize(now);
const parsed = date.parse(buf); // Date object
```

### Set Example
```typescript
import { set, int32_t } from 'nl-marshal';
const setSer = set(int32_t);
const buf = setSer.serialize(new Set([1, 2, 3]));
const parsed = setSer.parse(buf); // Set {1, 2, 3}
```

### Vector Example
```typescript
import { vector, bool } from 'nl-marshal';
const vecSer = vector(bool);
const buf = vecSer.serialize([true, false, true]);
const arr = vecSer.parse(buf); // [true, false, true]
```

### Struct Example
```typescript
import { struct, int32_t, bool } from 'nl-marshal';
const userSer = struct({ id: int32_t, active: bool });
const buf = userSer.serialize({ id: 1, active: false });
const obj = userSer.parse(buf); // { id: 1, active: false }
```

### Variant Example
```typescript
import { variant, int32_t, bool } from 'nl-marshal';
const varSer = variant({ 0: int32_t, 1: bool });
const buf = varSer.serialize([1, true]);
const val = varSer.parse(buf); // [1, true]
```

### Creating Custom Serializers

TODO: Add example of creating custom serializers using the base serializer.

## License

MIT
