export default {
  services: {
    user: {
      input: { path: './fixtures/user-openapi.json' },
      output: { dir: './src/api/user/generated' },
      generators: ['typescript', 'sdk'],
    },
    billing: {
      input: { path: './fixtures/billing-openapi.json' },
      output: { dir: './src/api/billing/generated' },
      generators: ['typescript', 'sdk'],
    },
  },
};
