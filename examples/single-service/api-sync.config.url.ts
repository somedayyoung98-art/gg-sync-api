import './env';
import { defineConfig } from '@somedayyoung/api-sync';
import { requireEnv } from './env';

export default defineConfig({
  services: {
    main: {
      input: { url: requireEnv('OPENAPI_URL') },
      output: {
        dir: './src/api/generated-url',
        models: 'split',
        format: 'auto',
        keepSpec: false,
      },
      generators: ['typescript', 'sdk'],
      sdk: { businessApi: true },
      compliance: { strict: false },
      runtime: { baseURL: requireEnv('API_BASE_URL') },
    },
  },
});
