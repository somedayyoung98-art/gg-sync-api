# @somedayyoung/api-sync

从 OpenAPI 生成可靠的 TypeScript 类型和 Fetch SDK。一次安装即可获得契约拉取、差异检查、代码生成、格式化和缓存基线能力。

## 安装

```bash
pnpm add -D @somedayyoung/api-sync
```

```json
{
  "scripts": {
    "sync-api": "sync-api run"
  }
}
```

## 配置

在项目根目录创建 `api-sync.config.ts`：

```typescript
import { defineConfig } from "@somedayyoung/api-sync";

const openapiURL = process.env.OPENAPI_URL;
if (!openapiURL) throw new Error("OPENAPI_URL is required");

export default defineConfig({
  services: {
    main: {
      input: { url: openapiURL },
      output: {
        dir: "./src/api/generated",
        models: "split",
        format: "auto",
      },
      generators: ["typescript", "sdk"],
      compliance: { strict: false },
      runtime: { baseURL: "https://api.example.com" },
    },
  },
});
```

也可以使用本地契约：

```typescript
input: {
  path: "./openapi.json";
}
```

本地文件中的相对外部 `$ref` 会从 OpenAPI 文件所在目录解析；合法的递归 `$ref` 会保留并生成递归 TypeScript 类型。

## 运行

```bash
pnpm sync-api
pnpm sync-api -- --namespace main
pnpm sync-api -- --strict
pnpm exec sync-api diff
```

主链路固定为：

```text
load config -> pull and validate OpenAPI -> diff baseline -> generate -> format -> update cache
```

`output.dir` 由生成器管理，每次生成都会重建。SDK 方法直接返回响应体的业务类型，HTTP 非成功状态会抛出错误。

## 产物配置

```typescript
output: {
  dir: './src/api/generated',
  models: 'split' | 'single' | { file: 'type.ts' },
  format: 'auto' | 'prettier' | false,
  keepSpec: false,
}
```

- `split`：每个 schema 一个文件，默认值。
- `single`：统一写入 `models.ts`。
- `{ file: 'type.ts' }`：写入指定的相对路径；文件必须位于 `output.dir` 内。
- `auto`：优先使用消费者项目安装的 Prettier，否则使用包内置 Prettier。
- `prettier`：与 `auto` 相同，保留兼容性。
- `false`：跳过格式化。

## 可选生成器

```typescript
generators: ["typescript", "sdk", "react-query", "msw", "zod"];
```

| 配置          | 产物         | 消费项目依赖             |
| ------------- | ------------ | ------------------------ |
| `typescript`  | 类型文件     | 无                       |
| `sdk`         | `sdk.ts`     | 无                       |
| `react-query` | `hooks.ts`   | `@tanstack/react-query`  |
| `msw`         | MSW handlers | `msw`、`@faker-js/faker` |
| `zod`         | `zod.ts`     | `zod`                    |

这些生成能力已经内置，不需要单独安装 plugin 包。

## 多服务

每个 namespace 拥有独立输入、输出和缓存：

```typescript
export default defineConfig({
  services: {
    users: {
      input: { url: "https://users.example.com/openapi.json" },
      output: { dir: "./src/api/users/generated" },
    },
    billing: {
      input: { path: "./contracts/billing.json" },
      output: {
        dir: "./src/api/billing/generated",
        models: { file: "types.ts" },
      },
    },
  },
});
```

## 缓存和严格模式

第一次成功运行会创建 `.api-sync-cache/<namespace>/latest-schema.json`。后续运行使用该文件作为 diff 基线；成功生成后更新基线。

`--strict` 或 `API_SYNC_STRICT=1` 遇到破坏性变更时返回退出码 `1`，不会更新失败 namespace 的基线。缓存不会自动定时销毁；删除缓存等于重新建立基线。

## 脚手架

```bash
pnpm exec sync-api scaffold
```

它创建：

```text
src/api/
  generated/
  runtime/client.ts
  domain/index.ts
```

生成 SDK 会识别 `src/api/runtime/client.ts` 中本地声明的 `customFetch`。UI 和业务模块应通过 `domain/` 暴露稳定边界。

## 配置校验

配置加载时会执行运行时校验。缺少 `services`、`input`、`output.dir`，同时配置 `input.path` 与 `input.url`，使用未知生成器或非法输出路径都会立即报错。

完整命令：

```text
sync-api [run] [--config path] [--cwd dir] [--namespace id] [--strict]
sync-api diff [--config path] [--cwd dir] [--namespace id] [--strict]
sync-api scaffold [--cwd dir] [--api-dir path] [--force]
```

源码：<https://github.com/somedayyoung98-art/gg-sync-api>

## License

MIT
