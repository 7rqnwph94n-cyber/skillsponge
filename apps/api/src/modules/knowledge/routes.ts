import { FastifyInstance } from 'fastify';
import { z } from 'zod';

const createKnowledgeSchema = z.object({
  type: z.enum([
    'JOB_STORY',
    'PROCEDURE',
    'FIELD_NOTE',
    'FAILURE_PATTERN',
    'DECISION_RATIONALE',
    'LESSON_LEARNED',
    'EXPERT_INTERVIEW',
    'SHADOWING_RECORD'
  ]),
  title: z.string().min(3),
  summary: z.string().optional(),
  body: z.string().optional(),
  taskCode: z.string().optional(),
  symptomCode: z.string().optional(),
  assetCode: z.string().optional(),
  source: z.enum(['DIRECT_EXPERIENCE', 'INTERVIEW', 'HISTORICAL_JOB', 'IMPORTED_DOC'])
});

export function registerKnowledgeRoutes(app: FastifyInstance) {
  app.post('/v1/knowledge-items', async (request, reply) => {
    const parsed = createKnowledgeSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid payload', detail: parsed.error.flatten() });
    }

    return reply.status(201).send({
      id: 'stub_knowledge_item_id',
      status: 'DRAFT',
      version: 1,
      ...parsed.data
    });
  });

  app.get('/v1/knowledge-items/:id', async (request) => {
    const params = request.params as { id: string };
    return {
      id: params.id,
      type: 'PROCEDURE',
      title: 'Hydraulic pump cavitation triage',
      status: 'APPROVED',
      confidence: 'HIGH'
    };
  });
}
