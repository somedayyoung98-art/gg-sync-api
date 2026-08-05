import { defineConfig } from '@somedayyoung/api-sync';

export default defineConfig({
  compliance: { strict: true },
  runtime: {
    baseURL: 'https://api.example.test',
    timeout: 10_000,
    validationRate: 1,
  },
  services: {
    local: {
      input: { path: './fixtures/openapi.json' },
      output: { dir: './src/api/generated-multi/local' },
      generators: ['typescript'],
      compliance: { strict: false },
      runtime: { validationRate: 0 },
    },
    inherited: {
      input: { path: './fixtures/openapi.json' },
      output: {
        dir: './src/api/generated-multi/inherited',
        models: 'single',
      },
      generators: ['typescript', 'sdk'],
    },
  },
});
