import { defineConfig } from '@somedayyoung/api-sync';

export default defineConfig({
  services: {
    main: {
      input: { path: './fixtures/openapi.json' },
      output: {
        dir: './src/api/generated-custom',
        models: { file: 'contracts/type.ts' },
        format: false,
        keepSpec: false,
      },
      generators: ['typescript'],
    },
  },
});
