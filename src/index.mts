import type { Nip07 } from "nostr-typedef";

declare global {
  // eslint-disable-next-line no-var
  var nostr: Nip07.Nostr | undefined;
}

export type MaybeNip07Extension = Nip07.Nostr | undefined;

export interface AbortableOption {
  signal?: AbortSignal;
}

export const getNostr = () =>
  isNostr(window.nostr) ? window.nostr : undefined;

export async function waitNostr(
  timeoutMs: number,
  options?: AbortableOption
): Promise<MaybeNip07Extension> {
  if (isNostr(window.nostr)) {
    return window.nostr;
  }

  const controller = new AbortController();
  const { signal } = controller;

  const rejectWhenAborted = new Promise<never>((_, reject) => {
    options?.signal?.addEventListener("abort", () => {
      controller.abort(options.signal?.reason);

      try {
        options?.signal?.throwIfAborted();
      } catch (err) {
        reject(err);
        return;
      }

      reject(new Error("aborted unexpectedly"));
    });
  });

  const promises: Promise<MaybeNip07Extension>[] = [
    rejectWhenAborted,
    // This is not the quickest, but a solid method.
    startPolling({ signal }),
  ];

  if (
    typeof timeoutMs === "number" &&
    Number.isFinite(timeoutMs) &&
    timeoutMs > 0
  ) {
    promises.push(timeout({ signal, timeoutMs }));
  }

  // If this method works, this is the quickest way to resolve the promise.
  // But in some case, it doesn't work.
  //   (c.f. https://github.com/penpenpng/nip07-awaiter/issues/1)
  if (canSetupSetterHook()) {
    promises.push(setupSetterHook());
  }

  return Promise.race(promises).then((result) => {
    controller.abort("teardown");

    return result;
  });
}

function startPolling(options: AbortableOption): Promise<MaybeNip07Extension> {
  return new Promise<MaybeNip07Extension>((resolve) => {
    const clearInterval = setHeuristicInterval(() => {
      const nostr = getNostr();

      if (nostr) {
        resolve(nostr);
        clearInterval();
      }
    });

    options.signal?.addEventListener("abort", clearInterval);
  });
}

function timeout(
  params: AbortableOption & { timeoutMs: number }
): Promise<undefined> {
  return new Promise<undefined>((resolve) => {
    const timer = setTimeout(() => {
      resolve(undefined);
    }, params.timeoutMs);

    params.signal?.addEventListener("abort", () => {
      clearTimeout(timer);
    });
  });
}

function canSetupSetterHook(): boolean {
  const descriptor = Object.getOwnPropertyDescriptor(window, "nostr");

  if (!descriptor) {
    return true;
  }

  return descriptor.configurable ?? false;
}

function setupSetterHook(): Promise<MaybeNip07Extension> {
  let current: MaybeNip07Extension = window.nostr;

  return new Promise<MaybeNip07Extension>((resolve) => {
    Object.defineProperty(window, "nostr", {
      configurable: true,
      get: () => current,
      set: (nostr) => {
        if (isNostr(nostr)) {
          resolve(nostr);
        }

        current = nostr;
      },
    });
  });
}

function setHeuristicInterval(callback: () => void) {
  let timeSum = 0;
  let time = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const updateInterval = () => {
    timeSum += time;
    if (timeSum < 1000) {
      time = 10;
    } else if (timeSum < 5000) {
      time = 100;
    } else {
      time = 1000;
    }
  };

  const spawn = () => {
    updateInterval();

    timer = setTimeout(() => {
      callback();
      spawn();
    }, time);
  };

  const teardown = () => {
    clearTimeout(timer);
  };

  spawn();

  return teardown;
}

export function isNostr(value: unknown): value is Nip07.Nostr {
  if (!value) {
    return false;
  }

  const maybeNostr = value as Nip07.Nostr;

  try {
    const hasGetPublicKey =
      "getPublicKey" in maybeNostr &&
      (typeof maybeNostr.getPublicKey === "function" ||
        typeof maybeNostr.getPublicKey === "object");
    const hasSignEvent =
      "signEvent" in maybeNostr &&
      (typeof maybeNostr.signEvent === "function" ||
        typeof maybeNostr.signEvent === "object");

    return hasGetPublicKey && hasSignEvent;
  } catch {
    return false;
  }
}
