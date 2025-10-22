import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  fetchCloudSegmentsSnapshot,
  saveCloudSegmentsSnapshot,
  type CloudSegmentsSnapshot,
} from '../../features/segments/segments.api';

const createSnapshot = (updatedAt: string, suffix: string): CloudSegmentsSnapshot => ({
  updatedAt,
  segments: [
    {
      id: `seg-${suffix}`,
      teamId: 'A',
      legNo: 1,
      type: 'bus',
      fromCity: 'Lisbon',
      toCity: 'Porto',
      depTime: '2025-10-27T08:00:00Z',
      arrTime: '2025-10-27T11:00:00Z',
      orderIdx: 0,
    },
  ],
});

type FetchMock = ReturnType<typeof vi.fn>;

describe('cloud segments api', () => {
  let originalFetch: typeof fetch | undefined;
  let fetchMock: FetchMock;

  const createResponse = (status: number, body: unknown = {}) => ({
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return body;
    },
    async text() {
      if (typeof body === 'string') {
        return body;
      }
      return JSON.stringify(body);
    },
  });

  beforeAll(() => {
    vi.stubEnv('VITE_BFF_URL', 'http://localhost:4000/api');
    originalFetch = globalThis.fetch;
  });

  afterAll(() => {
    vi.unstubAllEnvs();
    if (originalFetch) {
      globalThis.fetch = originalFetch;
    }
  });

  beforeEach(() => {
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });

  it('returns null when the snapshot has not been created yet', async () => {
    fetchMock.mockResolvedValueOnce(createResponse(404));

    const result = await fetchCloudSegmentsSnapshot();
    expect(result).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith('/api/segments', expect.any(Object));
  });

  it('returns the parsed snapshot on success', async () => {
    const snapshot = createSnapshot('2025-10-27T00:00:00Z', 'a');
    fetchMock.mockResolvedValueOnce(createResponse(200, snapshot));

    const result = await fetchCloudSegmentsSnapshot();
    expect(result).toEqual(snapshot);
  });

  it('sends the snapshot to the backend and returns the saved payload', async () => {
    const snapshot = createSnapshot('2025-10-27T00:00:00Z', 'a');
    fetchMock.mockResolvedValueOnce(createResponse(200, { ok: true, snapshot }));

    const result = await saveCloudSegmentsSnapshot(snapshot, { baseUpdatedAt: 'cursor-1' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.snapshot).toEqual(snapshot);
    }
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/segments',
      expect.objectContaining({
        method: 'PUT',
      }),
    );
  });

  it('returns conflict payloads without throwing', async () => {
    const snapshot = createSnapshot('2025-10-27T01:00:00Z', 'conflict');
    fetchMock.mockResolvedValueOnce(createResponse(409, { ok: false, conflict: snapshot }));

    const result = await saveCloudSegmentsSnapshot(snapshot, { baseUpdatedAt: 'cursor-1' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.conflict).toEqual(snapshot);
    }
  });

  it('throws a descriptive error when the network request fails', async () => {
    fetchMock.mockRejectedValueOnce(new Error('connection refused'));

    await expect(saveCloudSegmentsSnapshot(createSnapshot('2025-10-27T00:00:00Z', 'err'))).rejects.toThrow(
      'Unable to reach the segments service.',
    );
  });
});
