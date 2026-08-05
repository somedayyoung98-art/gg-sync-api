# 发布到 GitHub 与 npm

仓库：<https://github.com/somedayyoung98-art/gg-sync-api>

## 发布前检查

```powershell
pnpm install --frozen-lockfile
pnpm build
pnpm test
git status --short
```

确认源码、测试、构建产物和消费者 tarball 回归全部通过。仓库文件中不得包含 npm token；认证信息只保存在用户级 npm 配置或 CI secret 中。

## 推送 GitHub

```powershell
git push origin main
```

## 发布 npm

所有公开包使用 `@somedayyoung` scope，并由 Changesets fixed group 保持同一版本。

1. 登录 npm 官方源并确认身份：

```powershell
npm login --registry=https://registry.npmjs.org
npm whoami --registry=https://registry.npmjs.org
```

2. 为功能变更创建 changeset，并应用版本：

```powershell
pnpm changeset
pnpm version-packages
```

3. 提交版本文件和 changelog，推送 `main`，然后发布：

```powershell
git add -A
git commit -m "chore: release packages"
git push origin main
pnpm release
```

`pnpm release` 会先构建全部包，再由 Changesets 发布 fixed group 中的包。需要 OTP 时，按 npm 的交互提示输入，不要把 token 或 OTP 写入仓库。

## 发布后验证

```powershell
npm view @somedayyoung/api-sync version --registry=https://registry.npmjs.org
npx --yes @somedayyoung/api-sync --help
```

常见错误：

- `401 Unauthorized`：重新执行 `npm login`。
- `403`：检查 scope 发布权限、2FA 或 npm provenance 策略。
- 版本已存在：创建 changeset 并发布新的版本，不能覆盖 npm 上已有版本。
