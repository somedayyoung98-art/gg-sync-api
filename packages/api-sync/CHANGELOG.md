# @somedayyoung/api-sync

## 3.0.3

### Patch Changes

- Generate single-file TypeScript contracts from Orval's model output without exposing OpenAPI document containers such as `paths`, `components`, `operations`, and `webhooks`.

  Generate SDK requests through the bundled `umi-request` runtime. Add the optional `sdk.businessApi` config, which groups tagged operations into business APIs such as `accountGroupApi` while preserving flat methods for untagged operations.

- Updated dependencies
  - @somedayyoung/core@3.0.3
  - @somedayyoung/runtime@3.0.3
  - @somedayyoung/cli@3.0.3

## 3.0.2

### Patch Changes

- Document the complete local OpenAPI workflow for generating `src/api/type.ts` and `src/api/sdk.ts`.
  - @somedayyoung/cli@3.0.2
  - @somedayyoung/core@3.0.2
  - @somedayyoung/runtime@3.0.2

## 3.0.1

### Patch Changes

- 603012b: Simplify the OpenAPI-to-TypeScript pipeline, validate configuration at runtime, add consumer-aware formatting and custom model files, preserve recursive schemas, and align generated SDK return types with runtime behavior.
- Updated dependencies [603012b]
  - @somedayyoung/cli@3.0.1
  - @somedayyoung/core@3.0.1
  - @somedayyoung/runtime@3.0.1

## 3.0.0

### Major Changes

- fix build

### Patch Changes

- Updated dependencies
  - @somedayyoung/cli@3.0.0
  - @somedayyoung/core@3.0.0
  - @somedayyoung/generator-orval@3.0.0
  - @somedayyoung/runtime@3.0.0

## 2.0.0

### Major Changes

- first release

### Patch Changes

- Updated dependencies
  - @somedayyoung/generator-orval@2.0.0
  - @somedayyoung/runtime@2.0.0
  - @somedayyoung/core@2.0.0
  - @somedayyoung/cli@2.0.0

## 1.0.0

### Major Changes

- Initial public release v1.0.0.

### Patch Changes

- @somedayyoung/cli@1.0.0
- @somedayyoung/core@1.0.0
- @somedayyoung/generator-orval@1.0.0
- @somedayyoung/runtime@1.0.0
