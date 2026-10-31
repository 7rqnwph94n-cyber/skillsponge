import Fastify from 'fastify';
import { registerKnowledgeRoutes } from './modules/knowledge/routes';
import { registerSearchRoutes } from './modules/search/routes';
import { registerReviewRoutes } from './modules/review/routes';
import { registerRiskRoutes } from './modules/risk/routes';

const app = Fastify({ logger: true });

app.get('/health', async () => ({ status: 'ok' }));

registerKnowledgeRoutes(app);
registerSearchRoutes(app);
registerReviewRoutes(app);
registerRiskRoutes(app);

app.listen({ port: 3001, host: '0.0.0.0' }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
