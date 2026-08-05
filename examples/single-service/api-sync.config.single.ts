import { defineConfig } from '@somedayyoung/api-sync';

export default defineConfig({
  services: {
    main: {
      input: { path: './fixtures/openapi.json' },
      output: {
        dir: './src/api/generated-single',
        models: 'single',
        format: 'prettier',
        keepSpec: true,
      },
      generators: ['typescript', 'sdk'],
      compliance: { strict: false },
    },
  },
});
