# nip07-awaiter

**nip07-awaiter** provides a few utilities to detect initialization of [NIP-07](https://github.com/nostr-protocol/nips/blob/master/07.md) interface (`window.nostr`).

## Installation

```
npm install nip07-awaiter
```

or

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/nip07-awaiter@latest/dist/index.mjs">
```

## Usage

### `waitNostr()`

Return a promise. It is to be resolved as `window.nostr` when it is installed or as soon as possible thereafter.
If `window.nostr` is not installed after waiting the given time, it is to be resolved as `undefined`.

```js
import { waitNostr } from "nip07-awaiter";

// It will be resolved as `window.nostr` or `undefined` within 1 sec.
const nostrOrUndefined = await waitNostr(1000);
```

If needed, you can pass a [AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal). When aborted `waitNostr()` rejects and return the reason.

```js
const controller = new AbortController();
const { signal } = controller;

waitNostr(10 * 1000, { signal });
```

### `getNostr()`

`getNostr()` return synchronously NIP-07 interface if exists.

```js
import { getNostr } from "nip07-awaiter";

const pubkey = await getNostr()?.getPublicKey();
```

### `isNostr()`

`isNostr()` is a type gurad function. Return true if the given value is a NIP-07 extension.

```js
import { isNostr } from "nip07-awaiter";

if (isNostr(window.nostr)) {
  console.log(await window.nostr.getPublicKey());
}
```
