import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

/** 与 Koa 路由返回体一致 — OpenAPI 由此 schema 生成，非手写 fixture */
export const UserSchema = z
  .object({
    id: z.string().openapi({ example: 'u_1' }),
    firstName: z.string().openapi({ example: 'Jane' }),
    lastName: z.string().openapi({ example: 'Doe' }),
    avatarUrl: z.string().nullable().optional().openapi({ example: null }),
  })
  .openapi('User');

export type User = z.infer<typeof UserSchema>;

export const GetUserParamsSchema = z.object({
  id: z.string().openapi({ param: { name: 'id', in: 'path' }, example: 'u_1' }),
});
