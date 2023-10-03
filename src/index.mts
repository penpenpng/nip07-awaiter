import type { Nip07 } from "nostr-typedef";

let current: Nip07.Nostr | undefined = undefined;
const beforenostrload = "beforenostrload";
const nostrloaded = "nostrloaded";
const beforenostrupdate = "beforenostrupdate";
const nostrupdated = "nostrupdated";

let resolveNostr: (nostr: Nip07.Nostr) => void | undefined;
export const readyNostr = new Promise<Nip07.Nostr>((resolve) => {
  if ("nostr" in window) {
    current = window.nostr as Nip07.Nostr;
    resolve(current);
  } else {
    resolveNostr = resolve;
  }
});

export const waitNostr = (
  timeoutMs: number
): Promise<Nip07.Nostr | undefined> =>
  Promise.race([
    new Promise<undefined>((resolve) => {
      setTimeout(() => {
        resolve(undefined);
      }, timeoutMs);
    }),
    readyNostr,
  ]);

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
        resolveNostr?.(nostr);
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
