import { Router } from 'express';
import { z } from 'zod';

import { readSnapshot, writeSnapshot } from '../services/segmentsStore';

const segmentSchema = z.object({
  id: z.string().min(1),
  teamId: z.enum(['A', 'B', 'C', 'D', 'E']),
  legNo: z.number().int().min(1).max(6),
  type: z.enum(['bus', 'taxi', 'privateLift', 'train', 'boat', 'walk', 'break', 'overnight', 'waiting', 'job']),
  fromCity: z.string().min(1),
  toCity: z.string().min(1),
  depTime: z.string().datetime(),
  arrTime: z.string().datetime(),
  cost: z.number().optional(),
  currency: z.string().optional(),
  notes: z.string().optional(),
  orderIdx: z.number().int().min(0),
});

const saveSchema = z.object({
  segments: z.array(segmentSchema),
  updatedAt: z.string().datetime(),
  baseUpdatedAt: z.string().datetime().optional().nullable(),
  force: z.boolean().optional(),
});

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const snapshot = await readSnapshot();
    if (!snapshot) {
      return res.status(404).json({ message: 'No snapshot stored yet.' });
    }
    return res.json(snapshot);
  } catch (error) {
    return next(error);
  }
});

router.put('/', async (req, res, next) => {
  const parsed = saveSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid snapshot payload.',
      issues: parsed.error.issues,
    });
  }

  try {
    const incoming = parsed.data;
    const current = await readSnapshot();

    if (!incoming.force && incoming.baseUpdatedAt && current && current.updatedAt !== incoming.baseUpdatedAt) {
      return res.status(409).json({
        ok: false as const,
        conflict: current,
      });
    }

    const savedAt = new Date().toISOString();
    const saved = await writeSnapshot(incoming.segments, savedAt);

    return res.json({
      ok: true as const,
      snapshot: saved,
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
