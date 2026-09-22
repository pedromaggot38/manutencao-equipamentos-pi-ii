import authRoutes from './authRoutes.js';
import auxiliaresRoutes from './auxiliaresRoutes.js';
import equipamentoRoutes from './equipamentoRoutes.js';
import manutencaoRoutes from './manutencaoRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import meRoutes from './meRoutes.js';
import userRoutes from './userRoutes.js';

export default async function apiRoutes(fastify, options) {
  fastify.register(authRoutes, { prefix: '/auth' });
  fastify.register(meRoutes, { prefix: '/me' });
  fastify.register(userRoutes, { prefix: '/users' });
  fastify.register(auxiliaresRoutes, { prefix: '/auxiliares' });
  fastify.register(manutencaoRoutes, { prefix: '/manutencoes' });
  fastify.register(equipamentoRoutes, { prefix: '/equipamentos' });
  fastify.register(dashboardRoutes, { prefix: '/dashboard' });
}
