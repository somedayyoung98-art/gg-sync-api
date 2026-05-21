# 发布到 GitHub 与 npm

仓库地址：<https://github.com/somedayyoung98-art/gg-sync-api>

## 1. 把本地代码推到 GitHub

远程目前只有 `LICENSE`，本地在分支 `001-api-sync-infra`，需要合并后推到 `main`。

```powershell
cd d:\Project\gg-sync-api

git remote add origin https://github.com/somedayyoung98-art/gg-sync-api.git
# 若已添加过 origin，用：git remote set-url origin https://github.com/somedayyoung98-art/gg-sync-api.git

git fetch origin
git checkout -b main
git pull origin main --allow-unrelated-histories
# 若有冲突，保留双方文件后：
git add -A
git commit -m "chore: merge remote LICENSE with local monorepo"

git push -u origin main
```

若你确认远程只有 LICENSE、不需要保留远程历史，也可（会覆盖远程）：

```powershell
git branch -M main
git push -u origin main --force
```

推送后在 GitHub 上应能看到 `packages/`、`examples/`、`README.md` 等完整目录。

## 2. 发布到 npm

### 包名与 scope

当前包名为 `@gg-sync/*`。发布前在本地检查是否已被占用：

```bash
npm view @gg-sync/api-sync
```

- 若 **404**：可尝试在 npm 创建组织 `@gg-sync` 后发布。
- 若 **已有包 / 403**：需把 monorepo 内所有 `@gg-sync` 改成你有权限的 scope，例如 `@somedayyoung98-art/api-sync`（与 GitHub 用户名一致更易记）。

消费者安装（scope 未改时）：

```bash
pnpm add -D @gg-sync/api-sync
```

### 首次发布步骤

```powershell
cd d:\Project\gg-sync-api
pnpm install
pnpm test
pnpm build

npm login
npm whoami

pnpm changeset
# 选 bump 类型，第一次建议 minor 或 major → 1.0.0

pnpm version-packages
git add -A
git commit -m "chore: version packages for v1.0.0"
git push origin main

pnpm release
```

### 验证

```bash
npm view @gg-sync/api-sync
mkdir test-install && cd test-install
pnpm init
pnpm add -D @gg-sync/api-sync
npx sync-api --help
```

### GitHub Release（可选）

```bash
git tag v1.0.0
git push origin v1.0.0
```

在 GitHub → Releases → Create release，选择 tag `v1.0.0`。

## 3. npm 自动化（可选）

在 GitHub 仓库 Settings → Secrets → Actions 添加 `NPM_TOKEN`（npm Access Token，Publish 权限），再配置 workflow 在 tag 推送时执行 `pnpm release`。

详见 `specs/001-api-sync-infra/docs/release.md`。
