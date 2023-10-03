import type { Nip07 } from "nostr-typedef";

let current: unknown = undefined;
const beforenostrload = "beforenostrload";
const nostrloaded = "nostrloaded";
const beforenostrupdate = "beforenostrupdate";
const nostrupdated = "nostrupdated";

let resolveNostr: (nostr: Nip07.Nostr) => void = () => {};
export const readyNostr = new Promise<Nip07.Nostr>((resolve) => {
  resolveNostr = resolve;
});

Object.defineProperty(window, "nostr", {
  configurable: false,
  get: () => current,
  set: (nostr) => {
    const [beforeEvent, afterEvent] = current
      ? [beforenostrupdate, nostrupdated]
      : [beforenostrload, nostrloaded];

    const goOn = window.dispatchEvent(
      new CustomEvent(beforeEvent, {
        cancelable: true,
        detail: { nostr },
      })
    );

    if (goOn) {
      current = nostr;

      window.dispatchEvent(
        new CustomEvent(afterEvent, {
          cancelable: false,
          detail: { nostr },
        })
      );
      if (afterEvent === nostrloaded) {
        resolveNostr(nostr);
      }
    }
  },
});

declare global {
  interface WindowEventMap {
    [beforenostrload]: CustomEvent<{ nostr: Nip07.Nostr }>;
    [nostrloaded]: CustomEvent<{ nostr: Nip07.Nostr }>;
    [beforenostrupdate]: CustomEvent<{ nostr: Nip07.Nostr }>;
    [nostrupdated]: CustomEvent<{ nostr: Nip07.Nostr }>;
  }
}
