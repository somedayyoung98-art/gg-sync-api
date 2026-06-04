# npm 与 pnpm 双包管理器说明

本仓库**同时支持** npm 与 pnpm，各自使用自己的锁文件，互不覆盖：

| 包管理器 | 锁文件 | 安装 |
|----------|--------|------|
| pnpm | `pnpm-lock.yaml` | `pnpm install` |
| npm | `package-lock.json` | `npm install` |

根目录脚本（`build` / `test` / `sync-api` 等）通过 `scripts/pm.mjs` **自动识别**当前是 npm 还是 pnpm，无需改命令名。

## 切换包管理器时

两种工具的 `node_modules` 布局不同，**切换前请先清理**：

```bash
npm run clean:modules
# 或手动删除根目录 node_modules
```

然后只用其中一种安装：

```bash
pnpm install   # 使用 pnpm-lock.yaml
# 或
npm install    # 使用 package-lock.json
```

不要在同一工作区里交替执行 `pnpm install` 和 `npm install` 而不清理，否则容易出现依赖解析异常。

## 常用命令（两种 PM 相同）

```bash
pnpm run build    # 或 npm run build
pnpm test         # 或 npm test
pnpm run sync-api -- run
npm run sync-api -- run
```

## 配置隔离

- **pnpm 专用**：`pnpm-workspace.yaml`（含 `linkWorkspacePackages`、`autoInstallPeers` 等）
- **npm 专用**：根 `package.json` 的 `workspaces`
- **共享**：`.npmrc` 不要写 `@gg-sync:registry`（会把内部包指到 npmjs，pnpm 会 404；发布用各包 `publishConfig.registry`）

## 内部依赖版本

工作区包之间使用 `^1.0.0`（与包自身 `version` 一致），npm 与 pnpm 都会链接本地 workspace，而不用 `workspace:*`（npm 11 会报 `EUNSUPPORTEDPROTOCOL`）。
