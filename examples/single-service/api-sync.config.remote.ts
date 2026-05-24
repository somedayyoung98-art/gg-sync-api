import './env.js';
import { requireEnv } from './env.js';

/** 拉取远程 springdoc（Java）：须在 .env 中设置 OPENAPI_URL（如 https://api.example.com/v3/api-docs） */
export default {
  services: {
    main: {
      input: { url: requireEnv('OPENAPI_URL') },
      output: {
        dir: './src/api/generated-remote',
        models: 'single',
      },
      generators: ['typescript', 'sdk'],
      compliance: { strict: false },
    },
  },
};
