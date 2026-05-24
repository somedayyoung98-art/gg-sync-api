import Router from '@koa/router';
import type { User } from '../schemas/user.js';
import { GetUserParamsSchema } from '../schemas/user.js';

export const usersRouter = new Router();

usersRouter.get('/users/:id', (ctx) => {
  const params = GetUserParamsSchema.parse(ctx.params);
  const body: User = {
    id: params.id,
    firstName: 'Jane',
    lastName: 'Doe',
    avatarUrl: null,
  };
  ctx.body = body;
});
