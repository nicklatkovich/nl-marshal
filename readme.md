# NL-Marshal

Simple NodeJS utility to serialize or deserialize JS objects to Buffer or JSON.

## Serializers
### Boolean
Serialized buffer is `0x01` if serialized value is `true` and `0x00` otherwise.
```ts
import { bool } from "nl-marshal";
console.log(bool.toJSON(true)); // true
console.log(bool.fromJSON(false)); // false
const buffer = bool.toBuffer(true);
console.log(buffer); // 0x01
console.log(bool.toBuffer(false)); // 0x00
console.log(bool.fromBuffer(buffer)); // true
```

### Empty
Serialized buffer is always empty. In JSON representation `null` will be used.
```ts
import { empty } from "nl-marshal";
console.log(empty.toJSON(undefined)); // null
console.log(empty.toJSON(null)); // null
console.log(empty.fromJSON(null)); // null
console.log(empty.toBuffer(undefined)); // <Buffer >
console.log(empty.toBuffer(null)); // <Buffer >
console.log(empty.fromBuffer(Buffer.from([]))); // null
```

### Optional
Used to serialize optional values. Serialized buffer contains bool-byte at the start to show, value provided or not.
In JSON representation returns `null` if no value provided.
```ts
import { optional, bool } from "nl-marshal";
const serializer = optional(bool);
console.log(serializer.toJSON(true)); // true
console.log(serializer.toJSON(undefined)); // null
console.log(serializer.toJSON(null)); // null
console.log(serializer.fromJSON(false)); // false
console.log(serializer.fromJSON(null)); // null
console.log(serializer.toBuffer(true)); // <Buffer 01 01>
console.log(serializer.toBuffer(undefined)); // <Buffer 00>
console.log(serializer.fromBuffer(Buffer.from('0100', 'hex'))); // false
console.log(serializer.fromBuffer(Buffer.from([0]))); // null
```

### String
Serialized buffer contains length of string as [`varuint`](#varuint) and utf-8 string.
```ts
import { string } from "nl-marshal";
console.log(string.toJSON('qwe')); // "qwe"
console.log(string.fromJSON('qwe')); // "qwe"
console.log(string.toBuffer('qwe')); // <Buffer 83 71 77 65>
console.log(string.fromBuffer(Buffer.from('83717765', 'hex'))); // "qwe"
```

### Struct
```ts
import { struct, bool, string } from "nl-marshal";
const serializer = struct({ b: bool, s: string });
console.log(serializer.toJSON({ b: true, s: 'qwe' }));
// { b: true, s: "qwe" }
console.log(serializer.fromJSON({ s: 'qwe', b: true }));
// { b: true, s: "qwe" }
console.log(serializer.toBuffer({ s: 'qwe', b: true }));
// <Buffer 01 83 71 77 65>
console.log(serializer.fromBuffer(Buffer.from('0183717765', 'hex')));
// { b: true, s: "qwe" }
```

### Varuint
Serializer for unsigned integers of unknown size. Serialized value can be `string`, `number` or `BigNumber`.
```ts
import { varuint, BigNumber } from "nl-marshal";
console.log(varuint.toJSON(new BigNumber(123))); // "123"
console.log(varuint.toJSON(123)); // "123"
console.log(varuint.toJSON('123')); // "123"
console.log(varuint.fromJSON('123')); // <BigNumber 123>
console.log(varuint.toBuffer(123)); // <Buffer fb>
console.log(varuint.fromBuffer(Buffer.from('fb', 'hex'))); // <BigNumber 123>
```

### Vector
Serializer for vector of static type. Serialized buffer starts with length of value as [`varuint`](#varuint)
```ts
import { vector, varuint, BigNumber } from "nl-marshal";
const serializer = vector(varuint);
console.log(serializer.toJSON([123, '234', new BigNumber(345)]));
// ["123", "234", "345"]
console.log(serializer.fromJSON(['123', '234', '345']));
// [<BigNumber 123>, <BigNumber 234>, <BigNumber 345>]
console.log(serializer.toBuffer([123, '234', new BigNumber(345)]));
// <Buffer 83 fb 01 ea 02 d9>
console.log(serializer.fromBuffer(Buffer.from('83fb01ea02d9', 'hex')));
// [<BigNumber 123>, <BigNumber 234>, <BigNumber 345>]
```
