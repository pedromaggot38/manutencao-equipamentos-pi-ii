import * as dashboardController from '../controllers/dashboardController.js';
import { protect } from '../middlewares/auth.js';

export default async function dashboardRoutes(fastify, options) {
  fastify.addHook('preHandler', protect);

  fastify.get('/summary', dashboardController.getDashboardSummary);
}
