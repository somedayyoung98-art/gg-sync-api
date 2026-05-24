import { getOpenApiServerUrl } from '../../../env.js';
import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import type { OpenAPIObject } from 'openapi-types';
import { CreateProductSchema, ProductSchema } from '../schemas/product.js';
import { GetUserParamsSchema, UserSchema } from '../schemas/user.js';

const registry = new OpenAPIRegistry();

registry.register('User', UserSchema);
registry.register('CreateProductRequest', CreateProductSchema);
registry.register('Product', ProductSchema);

registry.registerPath({
  method: 'get',
  path: '/users/{id}',
  operationId: 'getUserById',
  summary: 'Get user by id',
  request: { params: GetUserParamsSchema },
  responses: {
    200: {
      description: 'OK',
      content: {
        'application/json': {
          schema: UserSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/products',
  operationId: 'createProduct',
  summary: 'Create a product',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateProductSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Created',
      content: {
        'application/json': {
          schema: ProductSchema,
        },
      },
    },
  },
});

/** 从服务端 Zod 定义生成 OpenAPI 3.0.3（与真实路由同源） */
export function buildOpenApiDocument(): OpenAPIObject {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: '3.0.3',
    info: {
      title: 'Sample API',
      version: '1.0.0',
      description:
        'Generated at runtime from Koa route + Zod schemas (examples/single-service/server).',
    },
    servers: [{ url: getOpenApiServerUrl(), description: 'Configured via OPENAPI_SERVER_URL or HOST/PORT' }],
  }) as OpenAPIObject;
}
