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

### Events

Four custom events are available on `window` object:

- `beforenostrload`: Fire before `window.nostr` is initialized. Cancellable.
- `nostrloaded`: Fire after `window.nostr` is initialized.
- `beforenostrupdate`: Fire before `window.nostr` is updated for the second or subsequent. Cancellable.
- `nostrupdated`: Fire after `window.nostr` is updated for the second or subsequent.

```js
window.addEventListener("beforenostrload", (ev) => {
  console.log(ev.detail.nostr /* NIP-07 interface to be installed */);
  console.log(window.nostr === undefined /* => true */);

  // You can cancel the installation.
  ev.preventDefault();
});

window.addEventListener("nostrloaded", (ev) => {
  console.log(ev.detail.nostr /* NIP-07 interface installed */);
  console.log(ev.detail.nostr === window.nostr /* => true */);
});
```

### Promise

`readyNostr` is a promise that resolves to NIP-07 interface.

```js
import { readyNostr } from "nip07-awaiter";

const nostr = await readyNostr;
```

If you want to set a timeout, you can use `waitNostr` instead.

```js
import { waitNostr } from "nip07-awaiter";

const nostrOrUndefined = await waitNostr(1000);
```

### Synchronous interface

`getNostr` return synchronously NIP-07 interface if exists.
