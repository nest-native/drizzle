import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { supportTickets } from '../schema';

export const createTicketSchema = createInsertSchema(supportTickets)
  .omit({
    id: true,
    createdAt: true,
  })
  .extend({
    title: z.string().trim().min(3).max(120),
    requesterEmail: z.email(),
    priority: z.enum(['low', 'normal', 'urgent']),
    estimatePoints: z.int().min(1).max(13),
  })
  .strict();

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
