# @gg-sync/api-sync

**Schema-driven API sync for frontend projects** — one npm install, full pipeline.

Fetch the latest OpenAPI contract, compare it to a cached baseline, regenerate TypeScript types and an SDK, and optionally emit React Query hooks, MSW mocks, or Zod schemas. Breaking API changes can fail your CI before bad code ships.

**Source:** [github.com/somedayyoung98-art/gg-sync-api](https://github.com/somedayyoung98-art/gg-sync-api) (monorepo package `packages/api-sync`)

## Install

```bash
pnpm add -D @gg-sync/api-sync
# or: npm i -D @gg-sync/api-sync
```

> Package is published to npm when maintainers run `pnpm release`. Until then, clone the [monorepo](https://github.com/somedayyoung98-art/gg-sync-api) and use `pnpm link` or workspace for local development.

Add a script to `package.json`:

```json
{
  "scripts": {
    "sync-api": "sync-api"
  }
}
```

## Quick start

### 1. Configure

Create `api-sync.config.ts` at the project root:

```typescript
export default {
  services: {
    main: {
      input: {
        url: process.env.OPENAPI_URL ?? 'http://localhost:3000/openapi.json',
      },
      output: { dir: './src/api/generated' },
      generators: ['typescript', 'sdk'],
      compliance: { strict: !!process.env.CI },
    },
  },
};
```

Use `input.path` for a local OpenAPI JSON file instead of `input.url`.

### 2. Scaffold the three-layer layout

```bash
pnpm sync-api scaffold
```

```text
src/api/
  generated/     # sync-api output — do not edit by hand
  runtime/
    client.ts    # createApiClient + customFetch for generated SDK
  domain/        # hand-written facades — UI imports from here only
```

### 3. Run sync

```bash
pnpm sync-api          # default: run
pnpm sync-api run      # explicit
```

**Pipeline:** pull schema → diff vs baseline → generate → format → update cache.

First run creates `.api-sync-cache/<namespace>/latest-schema.json` (baseline). Later runs report contract changes.

### 4. Use from the domain layer

```typescript
// src/api/domain/users.ts
import { getUserById } from '../generated/sdk';
import { client } from '../runtime/client';

export async function fetchUser(id: string) {
  return getUserById(id, { client });
}
```

**Import rule:** UI and features import from `domain/` only — never from `generated/` directly.

## CLI commands

| Command | Description |
|---------|-------------|
| `sync-api` / `sync-api run` | Full pipeline (default) |
| `sync-api diff` | Pull + diff only (no generate) |
| `sync-api doctor` | Validate config, peers, output dirs |
| `sync-api scaffold` | Create `src/api` layout |

### Shared options

| Option | Description |
|--------|-------------|
| `--config <path>` | Config file (default: `./api-sync.config.ts`) |
| `--strict` | Exit `1` on breaking changes; skip cache update for failed namespaces |
| `--cwd <dir>` | Working directory |
| `--namespace <id>` | Run one service namespace only |

### Environment variables

| Variable | Effect |
|----------|--------|
| `API_SYNC_STRICT=1` | Same as `--strict` |
| `OPENAPI_URL` | Typical CI override for `input.url` |

## Multi-service (namespaces)

One frontend repo, multiple backends — each namespace has its own input, output directory, and cache.

```typescript
export default {
  services: {
    user: {
      input: { url: 'https://user.internal/openapi.json' },
      output: { dir: './src/api/user/generated' },
      generators: ['typescript', 'sdk'],
    },
    billing: {
      input: { path: './contracts/billing.openapi.json' },
      output: { dir: './src/api/billing/generated' },
      generators: ['typescript', 'sdk'],
    },
  },
};
```

```bash
sync-api run                      # all namespaces
sync-api run --namespace billing  # one namespace
sync-api diff --strict            # CI preview without generate
```

| Concern | Per namespace |
|---------|----------------|
| Generated code | Unique `output.dir` |
| Baseline cache | `.api-sync-cache/<namespace>/` |
| Strict gate | Aggregated exit code `1` if any namespace fails |

### Multiple backends from URLs (same as local files)

Backend teams usually expose an OpenAPI URL. Use `input.url` per service — behavior is the same as `input.path`; only the **pull** step differs (HTTP download vs reading a file).

```typescript
export default {
  services: {
    user: {
      input: { url: process.env.USER_OPENAPI_URL! },
      output: { dir: './src/api/user/generated' },
      generators: ['typescript', 'sdk'],
    },
    orders: {
      input: { url: process.env.ORDERS_OPENAPI_URL! },
      output: { dir: './src/api/orders/generated' },
      generators: ['typescript', 'sdk'],
    },
  },
};
```

| `input` | When to use |
|---------|-------------|
| `url` | Backend gives a live OpenAPI JSON/YAML URL (dev/CI must reach it) |
| `path` | Contract checked into the repo or downloaded in a prior CI step |

Each service must use **exactly one** of `url` or `path`. You can mix both across services (e.g. `user` from URL, `billing` from a local file).

### Frontend workflow: one backend → one type bundle

Typical layout after `sync-api run`:

```text
src/api/
  user/generated/models/       # types for User service
    index.ts                   # barrel — import from here
    user.ts
  billing/generated/models/    # types for Billing service (isolated)
    index.ts
    invoice.ts
```

Import types per backend (do not cross-import between services):

```typescript
import type { User } from '@/api/user/generated/models';
import type { Invoice } from '@/api/billing/generated/models';
```

Enable `generators: ['typescript']` if you only need types; add `'sdk'` when you also want request helpers in `sdk.ts`.

### Configuring output location

Set **`output.dir`** per namespace (relative to project root or absolute). That directory receives generated artifacts for that backend only.

| You configure | You get (under `output.dir`) |
|---------------|------------------------------|
| `output.dir` | Root for that service’s codegen |
| `generators: ['typescript']` | `models/` (+ `models/index.ts`) |
| `generators: ['sdk']` | `sdk.ts` (with `typescript`, same run) |

**Not supported in v1:** renaming output files (e.g. a single `user-api.types.ts`). Types are emitted as `models/*.ts` with a barrel `models/index.ts`. Use `models` or `models/index` as the stable entry per backend.

## Contract governance

- **First run** — baseline is created; no breaking failure.
- **Later runs** — `openapi-diff` + Contract Diff Matrix classify changes.
- **Strict mode** — breaking changes exit `1` and do not update the baseline for failed namespaces.

```yaml
# .github/workflows/contract-check.yml (excerpt)
- run: pnpm sync-api run --strict
  env:
    OPENAPI_URL: ${{ secrets.OPENAPI_URL }}
    API_SYNC_STRICT: '1'
```

## Optional generators

Enable plugins in `generators`, install peers, then run `sync-api doctor` before sync.

| Generator | Output | Peer dependency |
|-----------|--------|-----------------|
| `typescript` | `models/` | — |
| `sdk` | `sdk.ts` | — |
| `react-query` | `hooks.ts` | `@tanstack/react-query` |
| `msw` | `sdk.msw.ts` | `msw` |
| `zod` | validation schemas | `zod` |

```typescript
generators: ['typescript', 'sdk', 'react-query'],
```

```bash
pnpm add @tanstack/react-query
pnpm sync-api doctor
pnpm sync-api run
```

Plugins ship as optional dependencies of this umbrella package; you only add the **peer** libraries your generators need.

## Runtime client & validation

After scaffold, `src/api/runtime/client.ts` re-exports from `@gg-sync/runtime`:

```typescript
export { createApiClient, customFetch } from '@gg-sync/runtime';
```

When `client.ts` exists, the SDK generator wires Orval’s `customFetch` mutator for shared HTTP + optional response validation (log-only pass-through on mismatch — responses are never dropped).

Configure sampling via client options (`validationRate` 0–1). See `@gg-sync/runtime` for `createApiClient` options.

## Configuration reference

```typescript
export default {
  services: {
    '<namespace>': {
      input: { url: string } | { path: string },
      output: { dir: string },
      generators: ('typescript' | 'sdk' | 'react-query' | 'msw' | 'zod')[],
      compliance?: { strict?: boolean },
    },
  },
};
```

## Troubleshooting

### Orval: “mutator file doesn't have customFetch”

Run `sync-api scaffold` so `src/api/runtime/client.ts` exists and exports `customFetch`:

```typescript
export { createApiClient, customFetch } from '@gg-sync/runtime';
```

If you do not use the runtime mutator, remove or rename `client.ts` so generation skips the mutator path.

### `doctor` fails on optional plugins

Install the peer listed in the error, e.g. `pnpm add @tanstack/react-query` for `react-query`.

### Strict CI fails on first deploy

Ensure `.api-sync-cache/` is committed or seed the baseline in a non-strict run before enabling `--strict` in CI.

## What you install vs what runs

| Package | Role |
|---------|------|
| `@gg-sync/api-sync` | **You install this** — `sync-api` binary |
| `@gg-sync/core` | Pipeline (transitive) |
| `@gg-sync/cli` | CLI implementation (transitive) |
| `@gg-sync/generator-orval` | Orval bridge (transitive) |
| `@gg-sync/runtime` | HTTP client + validation (transitive) |
| `@gg-sync/plugin-*` | Optional generators (optional deps) |

Do not install internal `@gg-sync/*` packages directly unless you are extending the platform.

## Examples (platform repo)

```bash
git clone https://github.com/somedayyoung98-art/gg-sync-api.git
cd gg-sync-api
pnpm install && pnpm build

cd examples/single-service && pnpm sync-api
cd examples/multi-service && pnpm sync-api
```

## For maintainers

Published to [npmjs.com](https://www.npmjs.com) under the `@gg-sync` scope. All packages share one semver via Changesets **fixed** group.

```bash
pnpm changeset
pnpm version-packages
pnpm release
```

Release checklist: [docs/publish-to-github-and-npm.md](https://github.com/somedayyoung98-art/gg-sync-api/blob/main/docs/publish-to-github-and-npm.md)

## License

[MIT](https://github.com/somedayyoung98-art/gg-sync-api/blob/main/LICENSE)
