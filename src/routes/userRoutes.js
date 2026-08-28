import * as userController from '../controllers/userController.js';
import { protect, restrictTo } from '../middlewares/auth.js';
import {
  adminCreateUserSchema,
  updateUserSchema,
} from '../models/userSchema.js';

export default async function userRoutes(fastify, options) {
  fastify.addHook('preHandler', protect);
  fastify.addHook('preHandler', restrictTo('root', 'admin'));

  fastify.get('/', userController.listUsers);

  fastify.post(
    '/',
    {
      schema: { body: adminCreateUserSchema },
    },
    userController.adminCreateUser,
  );

  fastify.get('/:identifier', userController.getUser);

  fastify.patch(
    '/:identifier',
    {
      schema: { body: updateUserSchema },
    },
    userController.update,
  );

  fastify.delete(
    '/:identifier',
    {
      preHandler: [restrictTo('root')],
    },
    userController.deleteUserByAdmin,
  );

  fastify.patch(
    '/:identifier/deactivate',
    userController.deactivateUserByAdmin,
  );
}
