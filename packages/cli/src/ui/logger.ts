import ora, { type Ora } from 'ora';
import pc from 'picocolors';

/** Show ora spinner only when an operation exceeds this threshold (SC-UX). */
export const SPINNER_DELAY_MS = 3000;

export interface DelayedSpinner {
  succeed(text?: string): void;
  fail(text?: string): void;
  stop(): void;
  update(text: string): void;
}

export function createDelayedSpinner(text: string): DelayedSpinner {
  let oraSpinner: Ora | undefined;
  const timer = setTimeout(() => {
    oraSpinner = ora(text).start();
  }, SPINNER_DELAY_MS);

  const clearTimer = (): void => {
    clearTimeout(timer);
  };

  return {
    succeed(msg?: string) {
      clearTimer();
      if (oraSpinner) {
        oraSpinner.succeed(msg ?? text);
      } else if (msg) {
        console.log(pc.green(msg));
      }
    },
    fail(msg?: string) {
      clearTimer();
      if (oraSpinner) {
        oraSpinner.fail(msg ?? text);
      } else if (msg) {
        console.error(pc.red(msg));
      }
    },
    stop() {
      clearTimer();
      oraSpinner?.stop();
    },
    update(newText: string) {
      if (oraSpinner) {
        oraSpinner.text = newText;
      }
    },
  };
}

/** Immediate spinner for short deterministic steps (config load). */
export function createSpinner(text: string): Ora {
  return ora(text).start();
}

export const log = {
  ok: (message: string) => console.log(pc.green(message)),
  fail: (message: string) => console.error(pc.red(message)),
  info: (message: string) => console.log(message),
  dim: (message: string) => console.log(pc.dim(message)),
  bold: (message: string) => pc.bold(message),
  cyan: (message: string) => pc.cyan(message),
};
