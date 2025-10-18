import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createAutosaveQueue } from '../../lib/autosave';

describe('autosave queue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('debounces flush calls and keeps the latest payload', async () => {
    const flushed: string[] = [];
    const queue = createAutosaveQueue<string>({
      delay: 300,
      onFlush: async (value) => {
        flushed.push(value);
      },
    });

    queue.schedule('first');
    queue.schedule('second');

    await vi.advanceTimersByTimeAsync(299);
    expect(flushed).toEqual([]);

    await vi.advanceTimersByTimeAsync(1);
    expect(flushed).toEqual(['second']);
  });

  it('waits for an inflight flush before processing the next payload', async () => {
    const order: string[] = [];
    let release: (() => void) | null = null;

    const queue = createAutosaveQueue<string>({
      delay: 100,
      onFlush: async (value) => {
        order.push(`start-${value}`);
        await new Promise<void>((resolve) => {
          release = () => {
            order.push(`end-${value}`);
            resolve();
          };
        });
      },
    });

    queue.schedule('alpha');
    await vi.advanceTimersByTimeAsync(100);
    queue.schedule('beta');
    release?.();
    await vi.runAllTimersAsync();

    expect(order).toEqual(['start-alpha', 'end-alpha', 'start-beta', 'end-beta']);
  });
});
