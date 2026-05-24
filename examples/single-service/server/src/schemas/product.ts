import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

/** POST /products 请求体 */
export const CreateProductSchema = z
  .object({
    name: z.string().min(1).openapi({ example: 'Wireless Mouse' }),
    sku: z.string().min(1).openapi({ example: 'SKU-10001' }),
    priceCents: z.number().int().nonnegative().openapi({ example: 1999 }),
    inStock: z.boolean().optional().openapi({ example: true }),
  })
  .openapi('CreateProductRequest');

export type CreateProductRequest = z.infer<typeof CreateProductSchema>;

/** POST 成功后的响应体 */
export const ProductSchema = z
  .object({
    id: z.string().openapi({ example: 'p_42' }),
    name: z.string().openapi({ example: 'Wireless Mouse' }),
    sku: z.string().openapi({ example: 'SKU-10001' }),
    priceCents: z.number().int().openapi({ example: 1999 }),
    inStock: z.boolean().openapi({ example: true }),
    createdAt: z.string().datetime().openapi({ example: '2026-05-21T08:00:00.000Z' }),
  })
  .openapi('Product');

export type Product = z.infer<typeof ProductSchema>;
