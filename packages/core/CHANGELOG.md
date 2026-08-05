# @somedayyoung/core

## 3.0.3

### Patch Changes

- Generate single-file TypeScript contracts from Orval's model output without exposing OpenAPI document containers such as `paths`, `components`, `operations`, and `webhooks`.

  Generate SDK requests through the bundled `umi-request` runtime. Add the optional `sdk.businessApi` config, which groups tagged operations into business APIs such as `accountGroupApi` while preserving flat methods for untagged operations.

## 3.0.2

## 3.0.1

### Patch Changes

- 603012b: Simplify the OpenAPI-to-TypeScript pipeline, validate configuration at runtime, add consumer-aware formatting and custom model files, preserve recursive schemas, and align generated SDK return types with runtime behavior.

## 3.0.0

### Major Changes

- fix build

## 2.0.0

### Major Changes

- first release

## 1.0.0
