import { FastifyInstance } from 'fastify';

export function registerSearchRoutes(app: FastifyInstance) {
  app.get('/v1/search', async (request) => {
    const query = request.query as {
      q?: string;
      assetCode?: string;
      taskCode?: string;
      symptomCode?: string;
      approvedOnly?: 'true' | 'false';
    };

    return {
      q: query.q ?? '',
      results: [
        {
          id: 'ki_approved_method_1',
          type: 'PROCEDURE',
          title: 'Approved method: compressor hot-start no-pressure',
          status: 'APPROVED',
          assetCode: query.assetCode ?? 'CMP-07'
        }
      ]
    };
  });
}
