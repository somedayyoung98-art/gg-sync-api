# gg-sync-api

面向前端的 **Schema 驱动 API 同步** 平台：拉取 OpenAPI → 与基线 diff → 生成 TypeScript 类型与 SDK，可选 React Query / MSW / Zod。

业务项目只需安装 **`@gg-sync/api-sync`**（npm 发布后即可；见下方「在业务项目中使用」）。

**仓库：** [github.com/somedayyoung98-art/gg-sync-api](https://github.com/somedayyoung98-art/gg-sync-api)

## 特性

- **一条命令** — `sync-api run`：pull → cache → diff → generate → format
- **契约治理** — `--strict` / `API_SYNC_STRICT=1` 在 CI 中拦截破坏性变更
- **多后端** — 多个 namespace，各自独立的 `output.dir` 与缓存
- **三层目录** — `generated/` / `runtime/` / `domain/`（`sync-api scaffold`）
- **可选插件** — react-query、msw、zod（`sync-api doctor` 检查 peer）

## 仓库结构

```text
packages/
  api-sync/           # npm 入口，提供 sync-api CLI
  core/               # 流水线：pull、diff、cache、runner
  cli/                # run / diff / doctor / scaffold
  generator-orval/    # Orval 代码生成桥接
  runtime/            # createApiClient、customFetch、校验透传
  plugin-react-query/
  plugin-msw/
  plugin-zod/
examples/
  single-service/     # 单服务示例 + e2e
  multi-service/      # 多 namespace 示例
docs/
  publish-to-github-and-npm.md
.github/workflows/
  contract-check.yml
```

> 设计文档（`specs/`、`.specify/`）仅保留在本地，未推送到 GitHub。

## 在业务项目中使用

完整说明见 **[packages/api-sync/README.md](./packages/api-sync/README.md)**。

### 安装

**npm 已发布后：**

```bash
pnpm add -D @gg-sync/api-sync
```

**尚未发布时：** 在克隆的本仓库里用 workspace 联调，或在子包目录执行 `pnpm link --global` 后在业务项目 `pnpm link @gg-sync/api-sync`。

### 配置（单服务 + 后端 URL）

```typescript
// api-sync.config.ts
export default {
  services: {
    main: {
      input: { url: process.env.OPENAPI_URL! },
      output: { dir: './src/api/generated' },
      generators: ['typescript', 'sdk'],
    },
  },
};
```

### 多后端（每个服务一套类型）

```typescript
export default {
  services: {
    user: {
      input: { url: process.env.USER_OPENAPI_URL! },
      output: { dir: './src/api/user/generated' },
      generators: ['typescript', 'sdk'],
    },
    billing: {
      input: { url: process.env.BILLING_OPENAPI_URL! },
      output: { dir: './src/api/billing/generated' },
      generators: ['typescript', 'sdk'],
    },
  },
};
```

生成结果在各自 `output.dir` 下的 `models/`（类型）与 `sdk.ts`（请求函数）。**`output.dir` 可自定义；单个文件名暂不支持配置。**

```bash
pnpm sync-api scaffold
pnpm sync-api run
```

## 本地开发（贡献者）

**环境：** Node.js ≥ 20，pnpm 9+

```bash
git clone https://github.com/somedayyoung98-art/gg-sync-api.git
cd gg-sync-api
pnpm install
pnpm build
pnpm test
```

| 命令 | 说明 |
|------|------|
| `pnpm build` | 构建所有 packages |
| `pnpm test` | 各包测试 + e2e |
| `pnpm test:e2e` | 仅 `examples/single-service` |
| `pnpm changeset` | 创建变更集 |
| `pnpm version-packages` | 应用版本号 |
| `pnpm release` | 构建并发布到 npm |

**跑示例：**

```bash
cd examples/single-service && pnpm sync-api
cd examples/multi-service && pnpm sync-api
```

## CI

[`.github/workflows/contract-check.yml`](./.github/workflows/contract-check.yml)：安装依赖 → build → test → 在 `examples/single-service` 上执行 `sync-api run --strict`。

## 发布

GitHub 与 npm 发布步骤见 [docs/publish-to-github-and-npm.md](./docs/publish-to-github-and-npm.md)。

## 文档索引

| 文档 | 说明 |
|------|------|
| [packages/api-sync/README.md](./packages/api-sync/README.md) | 消费者：安装、CLI、多后端、插件、排错 |
| [docs/publish-to-github-and-npm.md](./docs/publish-to-github-and-npm.md) | 维护者：推送与 npm 发布 |

## License

[MIT](https://github.com/somedayyoung98-art/gg-sync-api/blob/main/LICENSE)
