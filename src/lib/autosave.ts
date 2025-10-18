export type AutosaveStatus = 'idle' | 'scheduled' | 'saving' | 'error';

export interface AutosaveQueueOptions<T> {
  delay?: number;
  onFlush: (value: T) => Promise<void>;
  onStatusChange?: (status: AutosaveStatus, error?: unknown) => void;
}

export interface AutosaveQueue<T> {
  schedule: (value: T) => void;
  flushNow: () => Promise<void>;
  cancel: () => void;
}

export function createAutosaveQueue<T>({
  delay = 300,
  onFlush,
  onStatusChange,
}: AutosaveQueueOptions<T>): AutosaveQueue<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: T | null = null;
  let inflight: Promise<void> | null = null;
  let lastError: unknown = null;

  const notify = (status: AutosaveStatus, error?: unknown) => {
    if (status === 'error') {
      lastError = error;
    } else {
      lastError = null;
    }
    onStatusChange?.(status, error);
  };

  const flush = async () => {
    if (!pending || inflight) {
      return inflight ?? Promise.resolve();
    }

    const value = pending;
    pending = null;
    timer = null;

    notify('saving');
    inflight = onFlush(value)
      .then(() => {
        notify('idle');
      })
      .catch((error) => {
        notify('error', error);
        throw error;
      })
      .finally(() => {
        inflight = null;
        if (pending) {
          void flush();
        }
      });

    return inflight;
  };

  const schedule = (value: T) => {
    pending = value;
    if (timer) {
      clearTimeout(timer);
    }
    notify('scheduled', lastError);
    timer = setTimeout(() => {
      void flush();
    }, delay);
  };

  const flushNow = async () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (pending) {
      await flush();
    } else if (inflight) {
      await inflight;
    }
  };

  const cancel = () => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = null;
    pending = null;
  };

  return {
    schedule,
    flushNow,
    cancel,
  };
}
