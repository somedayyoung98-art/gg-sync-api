# gg-sync-api

Schema-driven **frontend API sync** platform — pull OpenAPI, diff against baseline, generate types/SDK, optional React Query / MSW / Zod plugins.

Consumers install a single package: **`@gg-sync/api-sync`**. This repository is the platform monorepo (pnpm workspaces).

**Repository:** [github.com/somedayyoung98-art/gg-sync-api](https://github.com/somedayyoung98-art/gg-sync-api)

## Features

- **One command** — `sync-api run` runs pull → cache → diff → generate → format
- **Contract governance** — breaking changes fail CI with `--strict` / `API_SYNC_STRICT=1`
- **Multi-backend** — multiple namespaces with isolated output dirs and baselines
- **Three-layer layout** — `generated/` / `runtime/` / `domain/` via `sync-api scaffold`
- **Optional plugins** — React Query hooks, MSW mocks, Zod schemas (peer-checked via `doctor`)

## Monorepo layout

```text
packages/
  api-sync/           # Umbrella npm entry (sync-api CLI)
  core/               # Pipeline: pull, diff, cache, runner
  cli/                # Commands: run, diff, doctor, scaffold
  generator-orval/    # Orval codegen bridge
  runtime/            # createApiClient, customFetch, validation pass-through
  plugin-react-query/
  plugin-msw/
  plugin-zod/
examples/
  single-service/     # Minimal e2e consumer fixture
  multi-service/      # Multi-namespace demo
specs/001-api-sync-infra/
  spec.md, plan.md, quickstart.md, docs/release.md
```

## Quick start (consumers)

See **[packages/api-sync/README.md](./packages/api-sync/README.md)** for install, config, CLI, plugins, and CI — including **multiple backends** (`input.url` per service, separate `output.dir`, types under `models/` per namespace).

```bash
pnpm add -D @gg-sync/api-sync
```

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

```bash
pnpm sync-api scaffold
pnpm sync-api run
```

## Development (this repo)

**Requirements:** Node.js ≥ 20, pnpm 9+

```bash
pnpm install
pnpm build
pnpm test              # all package tests + e2e
pnpm test:e2e          # examples/single-service only

# Run CLI against fixtures
cd examples/single-service && pnpm sync-api
cd examples/multi-service && pnpm sync-api

# From root (uses workspace @gg-sync/api-sync)
pnpm sync-api --config ./examples/single-service/api-sync.config.ts
```

| Script | Description |
|--------|-------------|
| `pnpm build` | Build all workspace packages |
| `pnpm test` | Recursive package tests + e2e |
| `pnpm test:workspace` | Vitest workspace (all projects) |
| `pnpm changeset` | Create a changeset |
| `pnpm version-packages` | Apply versions from changesets |
| `pnpm release` | Build and publish `@gg-sync/*` to npm |

## CI

[`.github/workflows/contract-check.yml`](./.github/workflows/contract-check.yml) runs build, tests, and `sync-api run --strict` on the single-service fixture.

## Documentation

| Doc | Audience |
|-----|----------|
| [packages/api-sync/README.md](./packages/api-sync/README.md) | npm consumers |
| [specs/001-api-sync-infra/quickstart.md](./specs/001-api-sync-infra/quickstart.md) | Step-by-step onboarding |
| [specs/001-api-sync-infra/docs/release.md](./specs/001-api-sync-infra/docs/release.md) | v1.0.0 publish checklist |
| [specs/001-api-sync-infra/plan.md](./specs/001-api-sync-infra/plan.md) | Architecture & phases |

## License

ISC
