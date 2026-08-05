import Router from '@koa/router';
import {
  CreateProductSchema,
  DeleteProductParamsSchema,
  type Product,
} from '../schemas/product';

export const productsRouter = new Router();

productsRouter.post('/products', (ctx) => {
  const input = CreateProductSchema.parse(ctx.request.body);
  const body: Product = {
    id: `p_${Date.now()}`,
    name: input.name,
    sku: input.sku,
    priceCents: input.priceCents,
    inStock: input.inStock ?? true,
    createdAt: new Date().toISOString(),
  };
  ctx.status = 201;
  ctx.body = body;
});

productsRouter.delete('/products/:id', (ctx) => {
  DeleteProductParamsSchema.parse(ctx.params);
  ctx.status = 204;
});
