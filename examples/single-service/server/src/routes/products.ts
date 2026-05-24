import Router from '@koa/router';
import { CreateProductSchema, type Product } from '../schemas/product.js';

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
