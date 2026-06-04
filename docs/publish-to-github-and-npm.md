# 发布到 GitHub 与 npm

仓库：<https://github.com/somedayyoung98-art/gg-sync-api>

## 一、GitHub（已完成可跳过）

```powershell
git push origin HEAD:main
```

## 二、发布到 npm（@gg-sync/* v1.0.0）

### 前提（必做）

1. **npm 账号**  
   注册：<https://www.npmjs.com/signup>

2. **创建组织 `gg-sync`**（否则发布会 `404 Not Found`）  
   - 打开：<https://www.npmjs.com/org/create>  
   - Organization name 填：**`gg-sync`**（与包名 `@gg-sync/...` 一致）  
   - 选择 **Unlimited public packages**（免费公开包）  
   - 你的 npm 用户必须是该组织的 owner/member  

3. **本机登录官方源**（不要用仅镜像的登录）

   ```powershell
   npm login --registry=https://registry.npmjs.org
   npm whoami --registry=https://registry.npmjs.org
   ```

4. **开启 npm 发布用 2FA（必做，否则会 E403）**  
   - 打开：<https://www.npmjs.com/settings/~account/two-factor-auth-login>  
   - 选择 **Authorization and publishing**（或更高等级）  
   - 用手机 Authenticator 绑定  

   发布时终端会要求输入 6 位 OTP；或在命令前加：

   ```powershell
   $env:NPM_CONFIG_OTP="123456"   # 换成 Authenticator 当前验证码
   pnpm release
   ```

4. **确认未把 publish 指到 npmmirror**  
   若 `npm config get registry` 是 `npmmirror.com`，发布仍会失败。  
   本仓库已在 `.npmrc` 中设置 `@gg-sync:registry=https://registry.npmjs.org/`。

### 本地已准备的版本

- 所有 `@gg-sync/*` 包版本：**1.0.0**（Changesets 已执行 `version-packages`）
- 发布入口包：`@gg-sync/api-sync`

### 发布命令

在项目根目录：

```powershell
cd d:\Project\gg-sync-api
pnpm build
pnpm release
```

等价于 `pnpm build && changeset publish`，会按顺序发布 fixed 组内 8 个包。

### 若 `pnpm release` 仍失败

**404 + `@gg-sync`** → 未创建 npm 组织 `gg-sync`，回到上文第 2 步。

**401 Unauthorized** → 执行 `npm login --registry=https://registry.npmjs.org`。

**403 + Two-factor authentication ... required to publish** → 在 npm 账号开启 **Authorization and publishing** 2FA，发布时输入 OTP（见上文第 4 步）。

**`TypeError: Cannot read properties of undefined (reading 'includes')`** → 多为 Changesets 在解析 npm 错误时的二次崩溃；先看上一条 **403/404** 的真实原因，按 2FA 或创建组织处理后再执行 `pnpm release`。

**只想发入口包（不推荐）**  
消费者依赖链需要 `@gg-sync/core` 等同时存在；应发布全部 8 个包。

### 发布后验证

```powershell
npm view @gg-sync/api-sync version --registry=https://registry.npmjs.org
```

新建空目录测试：

```powershell
mkdir C:\temp\gg-sync-smoke
cd C:\temp\gg-sync-smoke
pnpm init
pnpm add -D @gg-sync/api-sync
npx sync-api --help
```

业务项目安装：

```bash
pnpm add -D @gg-sync/api-sync
```

### 之后发新版本

```powershell
pnpm changeset
pnpm version-packages
git add -A && git commit -m "chore: version packages"
git push origin main
pnpm release
```

### 无法使用 `@gg-sync` 组织时

若组织名已被占用，需要把整个 monorepo 的包名从 `@gg-sync/*` 改成你有权限的 scope（例如 `@你的npm用户名/*`），并更新 `dependencies` 与 `.changeset/config.json` 中的 fixed 列表。

---

发布前请执行：`pnpm test && pnpm build`
