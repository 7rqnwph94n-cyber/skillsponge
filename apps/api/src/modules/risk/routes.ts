import { FastifyInstance } from 'fastify';

export function registerRiskRoutes(app: FastifyInstance) {
  app.get('/v1/risk/knowledge-gaps', async () => {
    return {
      generatedAt: new Date().toISOString(),
      hotspots: [
        { assetCode: 'CNC-12', taskCode: 'T_ALIGN_SPINDLE', riskScore: 82, expertsNearRetirement: 2 },
        { assetCode: 'CMP-07', taskCode: 'T_HOT_START_DIAG', riskScore: 76, expertsNearRetirement: 1 }
      ]
    };
  });
}
