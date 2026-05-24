# 全链路手动验证：Koa 后端 → URL 拉取 OpenAPI → 生成 TypeScript

## 环境配置（必做）

```bash
cd examples/single-service
cp .env.example .env
# 编辑 .env，至少设置 OPENAPI_URL
```

| 变量 | 说明 |
|------|------|
| `OPENAPI_HOST` / `OPENAPI_PORT` | 本地 Koa 监听地址（默认 `127.0.0.1:3100`） |
| `OPENAPI_SERVER_URL` | 写入 OpenAPI `servers` 的公开地址（可选） |
| `OPENAPI_URL` | **sync-api 拉取地址**（`/openapi.json` 或 `/v3/api-docs`） |

远程 Java springdoc 只在 `.env` 里写真实地址，**不要写进仓库**。

## 架构

```text
server/ (Koa + Zod) → GET /openapi.json
api-sync.config.url.ts → input.url = $OPENAPI_URL
sync-api run → src/api/generated/
```

## 前置

```bash
# 仓库根目录
pnpm install && pnpm build
```

## 一步一步验证

### 1. 启动 Koa

```bash
pnpm server
```

日志中的 URL 来自 `.env` 中的 `OPENAPI_SERVER_URL` 或 `HOST`/`PORT`。

### 2. 查看 OpenAPI

```bash
curl -s "$OPENAPI_URL" | head -40
```

（PowerShell 先 `$env:OPENAPI_URL = "..."`）

### 3. 导出 fixture（可选）

```bash
pnpm openapi:dump
```

### 4. 拉取并生成类型

```bash
pnpm sync-api:url
```

### 5. 拉取远程 springdoc

在 `.env` 中设置你的 `OPENAPI_URL`，然后：

```bash
pnpm sync-api:remote
```

产物：`src/api/generated-remote/models.ts` + `sdk.ts`（`models: single`）。

### 6. 离线 path 模式

```bash
pnpm sync-api
```

使用 `fixtures/openapi.json`（可由 `openapi:dump` 生成）。

## 自动化

仓库根目录：`pnpm test:e2e`（本地 Koa 使用测试端口，不依赖 `.env`）。
