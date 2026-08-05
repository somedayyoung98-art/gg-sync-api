import { defineConfig } from '@somedayyoung/api-sync';

export default defineConfig({
  services: {
    main: {
      input: { path: './fixtures/openapi.json' },
      output: {
        dir: './src/api/generated-all',
        models: 'split',
        format: 'auto',
        keepSpec: false,
      },
      generators: ['typescript', 'sdk', 'react-query', 'msw', 'zod'],
      sdk: { businessApi: true },
      runtime: {
        baseURL: 'https://api.example.test',
        timeout: 15_000,
        validationRate: 1,
      },
    },
  },
});
