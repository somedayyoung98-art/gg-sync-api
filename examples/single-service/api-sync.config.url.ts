import './env.js';
import { requireEnv } from './env.js';

/**
 * 全链路演示：从服务 URL 拉取 OpenAPI（先 `pnpm server` 或设置 OPENAPI_URL）。
 * @see README-DEMO.md
 */
export default {
  services: {
    main: {
      input: { url: requireEnv('OPENAPI_URL') },
      output: { dir: './src/api/generated' },
      generators: ['typescript', 'sdk'],
      compliance: { strict: false },
    },
  },
};
