# Changesets

We use [Changesets](https://github.com/changesets/changesets) to version and publish `@gg-sync/*` packages.

1. Run `pnpm changeset` and describe your change.
2. Merge the changeset markdown file.
3. Run `pnpm version-packages` (or let CI run `changeset version` on release).
4. Run `pnpm release` to build and publish to npmjs.

All `@gg-sync/*` packages share one semver via the `fixed` group in `config.json`.
