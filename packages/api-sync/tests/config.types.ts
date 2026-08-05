import { defineConfig } from '../src/index';

defineConfig({
  services: {
    main: {
      input: { path: './openapi.json' },
      output: {
        dir: './generated',
        models: { file: 'type.ts' },
      },
    },
  },
});

defineConfig({
  services: {
    // @ts-expect-error output is required.
    main: {
      input: { path: './openapi.json' },
    },
  },
});

defineConfig({
  services: {
    // @ts-expect-error input is required.
    main: {
      output: { dir: './generated' },
    },
  },
});
