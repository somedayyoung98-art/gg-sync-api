import '../../env.js';
import http from 'node:http';
import Koa from 'koa';
import { koaBody } from 'koa-body';
import { getOpenApiHost, getOpenApiPort, getOpenApiServerUrl } from '../../env.js';
import { buildOpenApiDocument } from './openapi/document.js';
import { productsRouter } from './routes/products.js';
import { usersRouter } from './routes/users.js';

const PORT = getOpenApiPort();
const HOST = getOpenApiHost();
const SERVER_URL = getOpenApiServerUrl();

const app = new Koa();

app.use(koaBody());
app.use(async (ctx, next) => {
  ctx.set('Access-Control-Allow-Origin', '*');
  await next();
});

app.use(async (ctx, next) => {
  if (ctx.path === '/health') {
    ctx.body = { ok: true };
    return;
  }
  await next();
});

app.use(async (ctx, next) => {
  if (ctx.path === '/openapi.json') {
    ctx.type = 'application/json';
    ctx.body = buildOpenApiDocument();
    return;
  }
  await next();
});

app.use(usersRouter.routes());
app.use(usersRouter.allowedMethods());
app.use(productsRouter.routes());
app.use(productsRouter.allowedMethods());

const server = http.createServer(app.callback());

server.listen(PORT, HOST, () => {
  console.log(`[sample-api] listening on ${SERVER_URL}`);
  console.log(`[sample-api] OpenAPI  → ${SERVER_URL}/openapi.json`);
  console.log(`[sample-api] GET  demo → ${SERVER_URL}/users/u_1`);
  console.log(`[sample-api] POST demo → POST ${SERVER_URL}/products (JSON body: CreateProductRequest)`);
});

export { server, PORT, HOST };
