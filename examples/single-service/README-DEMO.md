# Single-service 配置回归示例

这个目录既是可运行示例，也是 `sync-api` 的消费者级配置测试场。所有配置都通过
`defineConfig` 获得编译期类型检查，并在根目录的 E2E 测试中通过真实 CLI 执行。

## 配置矩阵

| 配置文件 | 覆盖内容 | 输出目录 |
| --- | --- | --- |
| `api-sync.config.ts` | 最小配置与全部默认值 | `src/api/generated` |
| `api-sync.config.single.ts` | `models: 'single'`、`format: 'prettier'`、`keepSpec: true` | `src/api/generated-single` |
| `api-sync.config.custom.ts` | 自定义嵌套 `type.ts`、`format: false`、仅生成类型 | `src/api/generated-custom` |
| `api-sync.config.all.ts` | TypeScript、SDK、React Query、MSW、Zod 和全部 runtime 字段 | `src/api/generated-all` |
| `api-sync.config.multi.ts` | 全局配置继承、服务覆盖、namespace 过滤与缓存隔离 | `src/api/generated-multi` |
| `api-sync.config.url.ts` | 从 HTTP URL 拉取 OpenAPI | `src/api/generated-url` |

`test-configs/` 保存非法配置夹具，用于验证缺失字段、input 冲突、错误 models 文件、
runtime 范围、namespace 格式和未知字段的错误路径。

## 本地 path 模式

```bash
pnpm sync-api
pnpm sync-api:single
pnpm sync-api:custom
pnpm sync-api:all
pnpm sync-api:multi
```

这些命令读取 `fixtures/openapi.json`，不需要启动后端。

## URL 全链路

复制环境变量文件：

```bash
cp .env.example .env
```

启动由 Koa 路由和 Zod schema 生成 OpenAPI 的示例服务：

```bash
pnpm server
```

在另一个终端运行：

```bash
pnpm sync-api:url
```

`OPENAPI_URL` 可以替换为真实的 springdoc、Swagger 或其他 OpenAPI 3.x 地址，
`API_BASE_URL` 是生成 SDK、React Query 和 MSW 请求地址的服务根路径。

## 自动化验证

仓库根目录执行：

```bash
pnpm test:e2e
```

测试会验证：

- 所有默认值和显式配置都能正确解析。
- path 与 URL 两种输入都能生成可靠 TypeScript。
- split、single、自定义文件三种 models 形态。
- auto、prettier、false 三种 formatter 模式。
- SDK、React Query、MSW、Zod 的组合生成。
- `keepSpec`、strict、runtime 继承覆盖、namespace 缓存隔离。
- 非法配置能够报告准确字段路径。
- 所有生成产物和有效配置最终通过 TypeScript 编译。
