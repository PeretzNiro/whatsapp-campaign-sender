import { Router } from 'express';
import type { Request, Response } from 'express';
import { db, countryLimits } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export const countryLimitsRouter = Router();

const CountryLimitSchema = z.object({
  countryCode: z.string().regex(/^\+\d{1,4}$/),
  countryName: z.string().optional(),
  maxPerSecond: z.number().int().min(1).max(200).default(50),
  maxConcurrency: z.number().int().min(1).max(50).default(10),
  enabled: z.boolean().default(true),
});

// GET /api/country-limits - List all country limits
countryLimitsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const limits = await db.select().from(countryLimits);
    res.json(limits);
  } catch (error: any) {
    req.log.error({ error }, 'Failed to fetch country limits');
    res.status(500).json({ error: 'Failed to fetch country limits' });
  }
});

// GET /api/country-limits/:code - Get single country limit
countryLimitsRouter.get('/:code', async (req: Request, res: Response) => {
  try {
    const code = decodeURIComponent(req.params.code);
    const [limit] = await db.select()
      .from(countryLimits)
      .where(eq(countryLimits.countryCode, code));

    if (!limit) {
      return res.status(404).json({ error: 'Country limit not found' });
    }

    res.json(limit);
  } catch (error: any) {
    req.log.error({ error }, 'Failed to fetch country limit');
    res.status(500).json({ error: 'Failed to fetch country limit' });
  }
});

// POST /api/country-limits - Create new country limit
countryLimitsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const validated = CountryLimitSchema.parse(req.body);

    const [newLimit] = await db.insert(countryLimits)
      .values(validated)
      .returning();

    res.status(201).json(newLimit);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid country limit data', details: error.errors });
    }
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Country limit already exists for this code' });
    }
    req.log.error({ error }, 'Failed to create country limit');
    res.status(500).json({ error: 'Failed to create country limit' });
  }
});

// PUT /api/country-limits/:code - Update country limit
countryLimitsRouter.put('/:code', async (req: Request, res: Response) => {
  try {
    const code = decodeURIComponent(req.params.code);
    const validated = CountryLimitSchema.partial().parse(req.body);

    const [updatedLimit] = await db.update(countryLimits)
      .set({ ...validated, updatedAt: new Date() })
      .where(eq(countryLimits.countryCode, code))
      .returning();

    if (!updatedLimit) {
      return res.status(404).json({ error: 'Country limit not found' });
    }

    res.json(updatedLimit);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid country limit data', details: error.errors });
    }
    req.log.error({ error }, 'Failed to update country limit');
    res.status(500).json({ error: 'Failed to update country limit' });
  }
});

// DELETE /api/country-limits/:code - Delete country limit
countryLimitsRouter.delete('/:code', async (req: Request, res: Response) => {
  try {
    const code = decodeURIComponent(req.params.code);

    const [deletedLimit] = await db.delete(countryLimits)
      .where(eq(countryLimits.countryCode, code))
      .returning();

    if (!deletedLimit) {
      return res.status(404).json({ error: 'Country limit not found' });
    }

    res.json({ message: 'Country limit deleted successfully', limit: deletedLimit });
  } catch (error: any) {
    req.log.error({ error }, 'Failed to delete country limit');
    res.status(500).json({ error: 'Failed to delete country limit' });
  }
});
