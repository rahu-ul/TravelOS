import { z } from 'zod';

// Invalid values fall back to defaults so old links keep working.
export const listStoriesQuery = z.object({
  page: z.coerce.number().int().min(1).max(1000).catch(1),
  limit: z.coerce.number().int().min(1).max(24).catch(9),
  tag: z.string().trim().toLowerCase().max(40).optional().catch(undefined),
});
