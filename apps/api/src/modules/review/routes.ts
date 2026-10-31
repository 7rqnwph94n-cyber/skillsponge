import { FastifyInstance } from 'fastify';
import { z } from 'zod';

const decisionSchema = z.object({
  decision: z.enum(['APPROVE', 'REQUEST_CHANGES', 'ARCHIVE']),
  comments: z.string().optional()
});

export function registerReviewRoutes(app: FastifyInstance) {
  app.post('/v1/knowledge-items/:id/review-decisions', async (request, reply) => {
    const parsed = decisionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid decision payload' });
    }

    return reply.status(201).send({
      knowledgeItemId: (request.params as { id: string }).id,
      ...parsed.data,
      resultingStatus: parsed.data.decision === 'APPROVE' ? 'APPROVED' : 'UNDER_REVIEW'
    });
  });
}
